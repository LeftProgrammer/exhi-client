import type { BrowserWindow } from 'electron'
import { logger } from './logger'
import type { Event as DomainEvent } from '@shared/types'
import { ErrorCode } from '@shared/constants'
import type { WsClient } from './ws-client'

/**
 * 渲染进程看门狗。
 *
 * 监控目标：
 *   1) render-process-gone：渲染进程崩溃 → 立即 reload；3 秒后仍不可见再次 reload；
 *      连续失败超过阈值 → 重建窗口
 *   2) unresponsive：渲染进程卡死 30 秒以上 → 强制 reload
 *   3) 崩溃频率熔断：5 分钟窗口内崩超 N 次 → 触发安全模式
 *
 * 安全模式：通过事件 'safe-mode' 通知外部，由调用方决定具体表现（如停止接收指令、
 * 只播 fallback）。本类不直接修改场景，避免与场景调度耦合。
 */

export interface WatchdogOptions {
  /** 窗口对应的逻辑 displayId，仅用于日志 */
  displayId: string
  /** 滑动窗口长度（毫秒），默认 5 分钟 */
  windowMs?: number
  /** 滑动窗口内允许的最大崩溃次数；超过 → 安全模式 */
  maxCrashesPerWindow?: number
  /** 重启次数阈值：连续失败超过这个值 → 重建窗口 */
  rebuildAfter?: number
  /** unresponsive 超过此时长强制 reload，毫秒 */
  unresponsiveTimeoutMs?: number
}

interface WatchdogEventMap {
  /** 窗口需要重建（reload 也救不了） */
  'rebuild-required': () => void
  /** 进入安全模式 */
  'safe-mode': (info: { crashes: number; windowMs: number }) => void
  /** 退出安全模式（一段时间未再崩溃） */
  'safe-mode-cleared': () => void
}

type EvKey = keyof WatchdogEventMap

/**
 * 内部状态机：
 *   normal       ← 正常
 *   recovering   ← reload 中
 *   safe-mode    ← 熔断
 */
type State = 'normal' | 'recovering' | 'safe-mode'

export class Watchdog {
  private listeners = new Map<EvKey, Set<(...args: unknown[]) => void>>()
  private crashTimestamps: number[] = []
  private state: State = 'normal'
  private unresponsiveTimer: NodeJS.Timeout | null = null
  private consecutiveFailures = 0
  private safeModeRecoveryTimer: NodeJS.Timeout | null = null

  private readonly windowMs: number
  private readonly maxCrashes: number
  private readonly rebuildAfter: number
  private readonly unresponsiveTimeoutMs: number

  constructor(
    private win: BrowserWindow,
    private opts: WatchdogOptions,
    private deviceId: string,
    private getWs: () => WsClient | null
  ) {
    this.windowMs = opts.windowMs ?? 5 * 60_000
    this.maxCrashes = opts.maxCrashesPerWindow ?? 3
    this.rebuildAfter = opts.rebuildAfter ?? 2
    this.unresponsiveTimeoutMs = opts.unresponsiveTimeoutMs ?? 30_000

    this.attach()
  }

  on<K extends EvKey>(ev: K, cb: WatchdogEventMap[K]) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set())
    this.listeners.get(ev)!.add(cb as unknown as (...args: unknown[]) => void)
  }

  get currentState(): State {
    return this.state
  }

  /** 主动通知"窗口已成功 reload"，重置失败计数 */
  noteRecovered() {
    this.consecutiveFailures = 0
    if (this.state === 'recovering') this.state = 'normal'
  }

  /** 主动进入安全模式（外部触发，比如启动校验失败） */
  enterSafeMode(reason: string) {
    if (this.state === 'safe-mode') return
    logger.warn(`[watchdog ${this.opts.displayId}] 进入安全模式: ${reason}`)
    this.state = 'safe-mode'
    this.publishError(ErrorCode.RENDERER_CRASH, `safe-mode: ${reason}`)
    this.emit('safe-mode', { crashes: this.crashTimestamps.length, windowMs: this.windowMs })
  }

  destroy() {
    if (this.unresponsiveTimer) clearTimeout(this.unresponsiveTimer)
    if (this.safeModeRecoveryTimer) clearTimeout(this.safeModeRecoveryTimer)
    this.listeners.clear()
  }

  // ============ 内部 ============

  private attach() {
    const wc = this.win.webContents

    wc.on('render-process-gone', (_e, details) => {
      this.handleCrash(`render-process-gone reason=${details.reason}`)
    })

    wc.on('unresponsive', () => {
      logger.warn(
        `[watchdog ${this.opts.displayId}] 渲染卡死，${this.unresponsiveTimeoutMs}ms 后强制 reload`
      )
      if (this.unresponsiveTimer) clearTimeout(this.unresponsiveTimer)
      this.unresponsiveTimer = setTimeout(() => {
        if (!this.win.isDestroyed()) {
          logger.warn(`[watchdog ${this.opts.displayId}] unresponsive 超时，触发崩溃流程`)
          this.handleCrash('unresponsive timeout')
        }
      }, this.unresponsiveTimeoutMs)
    })

    wc.on('responsive', () => {
      if (this.unresponsiveTimer) {
        clearTimeout(this.unresponsiveTimer)
        this.unresponsiveTimer = null
        logger.info(`[watchdog ${this.opts.displayId}] 渲染恢复响应`)
      }
    })

    wc.on('did-finish-load', () => {
      // reload 成功 → 重置连续失败
      if (this.state === 'recovering') {
        this.noteRecovered()
        logger.info(`[watchdog ${this.opts.displayId}] reload 后渲染层加载完成，已恢复`)
      }
    })
  }

  private handleCrash(reason: string) {
    const now = Date.now()
    this.crashTimestamps.push(now)
    // 滑动窗口清理
    this.crashTimestamps = this.crashTimestamps.filter((t) => now - t <= this.windowMs)
    logger.error(
      `[watchdog ${this.opts.displayId}] 崩溃 #${this.crashTimestamps.length}/${this.maxCrashes} 窗口内 (${reason})`
    )

    this.publishError(
      ErrorCode.RENDERER_CRASH,
      `${reason} (crashes=${this.crashTimestamps.length})`
    )

    // 熔断
    if (this.crashTimestamps.length >= this.maxCrashes) {
      this.enterSafeMode(`crash threshold reached in ${this.windowMs}ms`)
      this.scheduleSafeModeRecovery()
      return
    }

    // 正常 reload 流程
    this.consecutiveFailures++
    if (this.consecutiveFailures > this.rebuildAfter) {
      logger.error(
        `[watchdog ${this.opts.displayId}] 连续失败 ${this.consecutiveFailures} 次，请求重建窗口`
      )
      this.emit('rebuild-required')
      this.consecutiveFailures = 0
      return
    }

    this.state = 'recovering'
    setTimeout(() => {
      if (this.win.isDestroyed()) return
      try {
        this.win.reload()
        logger.info(`[watchdog ${this.opts.displayId}] 已触发 reload`)
      } catch (e) {
        logger.error(`[watchdog ${this.opts.displayId}] reload 失败:`, e)
        this.emit('rebuild-required')
      }
    }, 1000)
  }

  /** 安全模式持续 windowMs 后若未再发生崩溃，自动退出 */
  private scheduleSafeModeRecovery() {
    if (this.safeModeRecoveryTimer) clearTimeout(this.safeModeRecoveryTimer)
    this.safeModeRecoveryTimer = setTimeout(() => {
      const now = Date.now()
      const recent = this.crashTimestamps.filter((t) => now - t <= this.windowMs)
      if (recent.length < this.maxCrashes) {
        logger.info(`[watchdog ${this.opts.displayId}] 安全模式自动解除`)
        this.state = 'normal'
        this.crashTimestamps = []
        this.consecutiveFailures = 0
        this.emit('safe-mode-cleared')
      } else {
        this.scheduleSafeModeRecovery()
      }
    }, this.windowMs)
  }

  private emit<K extends EvKey>(ev: K, ...args: Parameters<WatchdogEventMap[K]>) {
    const set = this.listeners.get(ev)
    if (!set) return
    for (const cb of set) {
      try {
        ;(cb as (...a: unknown[]) => void)(...args)
      } catch (e) {
        logger.warn('[watchdog] listener error:', e)
      }
    }
  }

  private publishError(code: string, msg: string) {
    const ws = this.getWs()
    if (!ws) return
    const ev: DomainEvent = {
      id: `wd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      deviceId: this.deviceId,
      type: 'evt.error',
      payload: { code, msg, displayId: this.opts.displayId }
    }
    ws.publish(ev)
  }
}
