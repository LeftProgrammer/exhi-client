import { app } from 'electron'
import { logger } from './logger'
import type { Command, Event as DomainEvent } from '@shared/types'
import { ContentSync, type SyncProgress } from './content-sync'
import type { PackageLoader } from './package-loader'
import type { WsClient } from './ws-client'

/**
 * 项目包更新调度器。
 *
 * 流程：
 *   1. 收到 cmd.package.update {url, version?, applyAt}
 *   2. ContentSync 下载到非激活槽
 *   3. 校验成功 → 上报 evt.packageReady
 *   4. 按 applyAt 决定切换时机：
 *      - "now" → 立即写 pointer + 重启
 *      - "idle" → 凌晨 4 点（默认）写 pointer + 重启
 *      - ISO 时间 → 到时切
 *
 * 重启用 app.relaunch + app.exit。
 */
export class PackageUpdater {
  private pendingApply: { slot: string; version: string; at: Date } | null = null
  private applyTimer: NodeJS.Timeout | null = null

  constructor(
    private loader: PackageLoader,
    private deviceId: string,
    private getWs: () => WsClient | null
  ) {}

  async handle(cmd: Command): Promise<{ ok: boolean; error?: string }> {
    const payload = cmd.payload as {
      url?: string
      version?: string
      applyAt?: 'now' | 'idle' | string
    }
    if (!payload?.url) return { ok: false, error: 'missing url' }

    logger.info(`package.update 启动: url=${payload.url} version=${payload.version ?? '(any)'}`)

    const sync = new ContentSync(this.loader)
    try {
      const { slot, manifest } = await sync.sync({
        url: payload.url,
        expectedVersion: payload.version,
        onProgress: (p) => this.reportProgress(cmd.id, p)
      })

      this.publishEvent({
        type: 'evt.packageReady',
        payload: {
          slot,
          version: manifest.version,
          projectId: manifest.projectId,
          applyAt: payload.applyAt ?? 'idle'
        }
      })

      this.schedule(slot, manifest.version, payload.applyAt ?? 'idle')
      return { ok: true }
    } catch (e) {
      const msg = (e as Error).message
      logger.error(`package.update 失败: ${msg}`)
      this.reportProgress(cmd.id, { phase: 'error', error: msg })
      return { ok: false, error: msg }
    }
  }

  /** 安排切换时机 */
  private schedule(slot: string, version: string, applyAt: string) {
    if (this.applyTimer) {
      clearTimeout(this.applyTimer)
      this.applyTimer = null
    }

    let at: Date
    if (applyAt === 'now') {
      at = new Date()
    } else if (applyAt === 'idle') {
      // 下一个凌晨 4 点
      const t = new Date()
      t.setHours(4, 0, 0, 0)
      if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1)
      at = t
    } else {
      const parsed = new Date(applyAt)
      if (isNaN(parsed.getTime())) {
        logger.warn(`applyAt 解析失败，回退到 idle: ${applyAt}`)
        return this.schedule(slot, version, 'idle')
      }
      at = parsed
    }

    this.pendingApply = { slot, version, at }
    const delayMs = Math.max(0, at.getTime() - Date.now())
    logger.info(
      `切槽计划: ${slot} → 将于 ${at.toLocaleString('zh-CN')} 切换并重启（约 ${Math.round(delayMs / 1000)}s 后）`
    )

    this.applyTimer = setTimeout(() => this.apply(), Math.min(delayMs, 2_147_000_000))
  }

  /** 真正执行切槽：写 pointer + 重启 */
  private apply() {
    if (!this.pendingApply) return
    const { slot, version } = this.pendingApply
    logger.info(`apply: 切换到 ${slot} v${version}，即将重启`)
    try {
      this.loader.writePointer(slot)
      this.publishEvent({
        type: 'evt.packageChanged',
        payload: { slot, version }
      })
    } catch (e) {
      logger.error(`apply 写指针失败: ${(e as Error).message}`)
      this.publishEvent({
        type: 'evt.error',
        payload: { code: 'E_PACKAGE_APPLY', msg: (e as Error).message }
      })
      return
    }
    // 略等一下让事件发出去
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 500)
  }

  /** 取消挂起的切换（暴露给运维） */
  cancelPending(): boolean {
    if (!this.pendingApply) return false
    if (this.applyTimer) clearTimeout(this.applyTimer)
    this.applyTimer = null
    this.pendingApply = null
    logger.info('package.update 切槽计划已取消')
    return true
  }

  // ============ 内部 ============

  private reportProgress(cmdId: string, p: SyncProgress) {
    this.publishEvent({
      type: 'evt.packageProgress',
      payload: { cmdId, ...p } as unknown as Record<string, unknown>
    })
    logger.debug(`package progress: ${p.phase}`, p)
  }

  private publishEvent(partial: { type: string; payload: Record<string, unknown> }) {
    const ws = this.getWs()
    if (!ws) return
    const ev: DomainEvent = {
      id: randomId(),
      ts: Date.now(),
      deviceId: this.deviceId,
      type: partial.type,
      payload: partial.payload
    }
    ws.publish(ev)
  }
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
