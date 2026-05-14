import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { logger } from './logger'
import type { Command, Event as DomainEvent } from '@shared/types'
import type { WsClient } from './ws-client'

/**
 * Runtime OTA：基于 electron-updater 的自更新。
 *
 * 服务端期望布局（与 content-server 复用同一进程即可）：
 *   <feed-url>/<channel>/latest.yml         ← electron-updater 频道清单
 *   <feed-url>/<channel>/<setup>.exe        ← NSIS 安装包
 *   <feed-url>/<channel>/<setup>.exe.blockmap  ← 差分块
 *
 * 触发方式：
 *   - 启动时若 autoCheckUpdate=true 自动检查一次
 *   - 中控发 cmd.runtime.update 主动触发
 *
 * applyAt：
 *   - "now"  下载完立刻 quitAndInstall
 *   - "idle" 凌晨 4 点 quitAndInstall（默认）
 *   - ISO 时间字符串
 *
 * 注意：dev 模式 (electron-vite dev) 没有打包后的资源，updater 不会有实际效果。
 * 仅在打包后 EXE 运行时才工作；本类在 dev 下也会注册指令处理，但 check 会日志报错。
 */
export class RuntimeUpdater {
  private pendingApply: { applyAt: string; at: Date } | null = null
  private applyTimer: NodeJS.Timeout | null = null
  private downloaded = false

  constructor(
    private feedUrl: string,
    private channel: string,
    private deviceId: string,
    private getWs: () => WsClient | null
  ) {}

  init() {
    if (!app.isPackaged) {
      logger.warn('[updater] dev 模式：electron-updater 不会真下载，仅响应指令')
    }

    autoUpdater.autoDownload = false // 我们手动控制
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.allowPrerelease = this.channel !== 'stable'
    autoUpdater.channel = this.channel
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: this.normalizeFeed(this.feedUrl, this.channel),
      channel: this.channel
    })
    autoUpdater.logger = {
      info: (m: unknown) => logger.info(`[updater] ${m}`),
      warn: (m: unknown) => logger.warn(`[updater] ${m}`),
      error: (m: unknown) => logger.error(`[updater] ${m}`),
      debug: (m: unknown) => logger.debug(`[updater] ${m}`)
    } as unknown as typeof autoUpdater.logger

    autoUpdater.on('checking-for-update', () => {
      this.publish({ type: 'evt.runtimeUpdate', payload: { phase: 'checking' } })
    })
    autoUpdater.on('update-available', (info) => {
      logger.info(`[updater] 发现新版本 ${info.version}`)
      this.publish({
        type: 'evt.runtimeUpdate',
        payload: { phase: 'available', version: info.version }
      })
    })
    autoUpdater.on('update-not-available', () => {
      this.publish({ type: 'evt.runtimeUpdate', payload: { phase: 'up-to-date' } })
    })
    autoUpdater.on('download-progress', (p) => {
      this.publish({
        type: 'evt.runtimeUpdate',
        payload: {
          phase: 'downloading',
          percent: Number(p.percent.toFixed(1)),
          transferred: p.transferred,
          total: p.total,
          bytesPerSecond: p.bytesPerSecond
        }
      })
    })
    autoUpdater.on('update-downloaded', (info) => {
      logger.info(`[updater] 已下载 ${info.version}，等待安装`)
      this.downloaded = true
      this.publish({
        type: 'evt.runtimeUpdate',
        payload: { phase: 'downloaded', version: info.version }
      })
    })
    autoUpdater.on('error', (err) => {
      logger.warn(`[updater] error: ${err.message}`)
      this.publish({
        type: 'evt.runtimeUpdate',
        payload: { phase: 'error', error: err.message }
      })
    })
  }

  /** 处理 cmd.runtime.update */
  async handle(cmd: Command): Promise<void> {
    const payload = (cmd.payload as
      | { channel?: string; applyAt?: 'now' | 'idle' | string }
      | undefined) ?? {}
    if (payload.channel && payload.channel !== this.channel) {
      this.channel = payload.channel
      autoUpdater.channel = payload.channel
      autoUpdater.allowPrerelease = payload.channel !== 'stable'
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: this.normalizeFeed(this.feedUrl, this.channel),
        channel: this.channel
      })
      logger.info(`[updater] 切换通道: ${this.channel}`)
    }
    const applyAt = payload.applyAt ?? 'idle'

    try {
      const result = await autoUpdater.checkForUpdates()
      if (!result || !result.downloadPromise) {
        logger.info('[updater] 已是最新或无可用更新')
        return
      }
      await result.downloadPromise
      this.scheduleApply(applyAt)
    } catch (e) {
      logger.error('[updater] handle 失败:', e)
    }
  }

  /** 启动时自动检查（不立即安装；按 applyAt=idle 走） */
  async autoCheck() {
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result?.downloadPromise) {
        await result.downloadPromise
        this.scheduleApply('idle')
      }
    } catch (e) {
      logger.warn('[updater] 自动检查失败:', e)
    }
  }

  cancelPending(): boolean {
    if (!this.pendingApply) return false
    if (this.applyTimer) clearTimeout(this.applyTimer)
    this.applyTimer = null
    this.pendingApply = null
    logger.info('[updater] 取消挂起的安装')
    return true
  }

  // ============ 内部 ============

  /** 把 feedUrl 规整成不带通道后缀的根 + 在 setFeedURL 中拼通道 */
  private normalizeFeed(base: string, channel: string): string {
    const root = base.endsWith('/') ? base.slice(0, -1) : base
    return `${root}/${channel}`
  }

  private scheduleApply(applyAt: string) {
    if (!this.downloaded) {
      logger.warn('[updater] 尚未下载完成，无法安排安装')
      return
    }
    if (this.applyTimer) {
      clearTimeout(this.applyTimer)
      this.applyTimer = null
    }
    let at: Date
    if (applyAt === 'now') {
      at = new Date()
    } else if (applyAt === 'idle') {
      const t = new Date()
      t.setHours(4, 0, 0, 0)
      if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1)
      at = t
    } else {
      const parsed = new Date(applyAt)
      if (isNaN(parsed.getTime())) {
        logger.warn(`[updater] applyAt 解析失败，使用 idle: ${applyAt}`)
        return this.scheduleApply('idle')
      }
      at = parsed
    }
    this.pendingApply = { applyAt, at }
    const delayMs = Math.max(0, at.getTime() - Date.now())
    logger.info(
      `[updater] 安装计划: ${at.toLocaleString('zh-CN')}（约 ${Math.round(delayMs / 1000)}s 后）`
    )
    this.publish({
      type: 'evt.runtimeUpdate',
      payload: { phase: 'scheduled', at: at.toISOString() }
    })
    this.applyTimer = setTimeout(() => this.quitAndInstall(), Math.min(delayMs, 2_147_000_000))
  }

  private quitAndInstall() {
    logger.info('[updater] quitAndInstall')
    try {
      autoUpdater.quitAndInstall(true, true) // isSilent, isForceRunAfter
    } catch (e) {
      logger.error('[updater] quitAndInstall 失败:', e)
    }
  }

  private publish(partial: { type: string; payload: Record<string, unknown> }) {
    const ws = this.getWs()
    if (!ws) return
    const ev: DomainEvent = {
      id: `upd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      deviceId: this.deviceId,
      type: partial.type,
      payload: partial.payload
    }
    ws.publish(ev)
  }
}
