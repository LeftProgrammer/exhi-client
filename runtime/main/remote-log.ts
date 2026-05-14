import log from 'electron-log/main'
import type { LogMessage } from 'electron-log'
import type { Event as DomainEvent } from '@shared/types'
import type { WsClient } from './ws-client'

// 用 Symbol.for 跨模块全局去重，防止 dev HMR 重复注册 hook
const HOOK_FLAG = Symbol.for('exhi-remote-log-hook-registered')

/**
 * 远程日志上报：
 *   - warn / error：立即上报
 *   - info：批量上报（每 5 秒 flush，或攒到 50 条）
 *   - debug：不上报，只本地
 *
 * 离线时 ws.publish 会自动入队，重连后批量补发，不在这里做缓冲。
 */
export class RemoteLogReporter {
  private buffer: DomainEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private hook: ((msg: LogMessage) => LogMessage) | null = null

  constructor(
    private deviceId: string,
    private getWs: () => WsClient | null,
    private opts: { batchSize?: number; flushIntervalMs?: number } = {}
  ) {}

  start() {
    const batchSize = this.opts.batchSize ?? 50
    const flushMs = this.opts.flushIntervalMs ?? 5_000

    const g = globalThis as Record<symbol, unknown>
    if (g[HOOK_FLAG]) {
      // dev HMR 场景：hook 已注册过，先把旧的全清掉再重新注册
      log.hooks.length = 0
    }
    g[HOOK_FLAG] = true

    this.hook = (msg) => {
      if (msg.level === 'silly' || msg.level === 'verbose' || msg.level === 'debug') {
        return msg // 本地写文件，不上报
      }
      const ev: DomainEvent = {
        id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ts: msg.date.getTime(),
        deviceId: this.deviceId,
        type: 'evt.log',
        payload: {
          level: msg.level,
          msg: msg.data.map((d) => (typeof d === 'string' ? d : safeStringify(d))).join(' '),
          scope: msg.scope ?? null
        }
      }
      if (msg.level === 'warn' || msg.level === 'error') {
        this.publish(ev) // 立即
      } else {
        this.buffer.push(ev)
        if (this.buffer.length >= batchSize) this.flush()
      }
      return msg
    }
    log.hooks.push(this.hook)

    this.flushTimer = setInterval(() => this.flush(), flushMs)
  }

  stop() {
    if (this.hook) {
      const idx = log.hooks.indexOf(this.hook)
      if (idx >= 0) log.hooks.splice(idx, 1)
      this.hook = null
    }
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = null
    this.flush()
  }

  private flush() {
    if (this.buffer.length === 0) return
    const batch = this.buffer
    this.buffer = []
    for (const ev of batch) this.publish(ev)
  }

  private publish(ev: DomainEvent) {
    const ws = this.getWs()
    if (!ws) return
    ws.publish(ev)
  }
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
