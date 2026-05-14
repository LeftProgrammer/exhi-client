import type { Event as DomainEvent } from '@shared/types'
import type { WsClient } from './ws-client'

/**
 * 远程日志上报：
 *   - warn / error：立即上报
 *   - info：批量上报（每 5 秒 flush，或攒到 50 条）
 *   - debug：不上报
 *
 * 设计变更（M8 修复）：
 *   electron-log 的 hook 在 electron-vite dev 模式下会被多个模块实例分别注册（实测重复×3），
 *   且原因似乎在于 electron-log/main 的 ESM/CJS 双导出导致的副本问题。
 *   改为：logger.ts 显式调用本类的 ingest()，绕过 electron-log hook 机制。
 */
export class RemoteLogReporter {
  private buffer: DomainEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor(
    private deviceId: string,
    private getWs: () => WsClient | null,
    private opts: { batchSize?: number; flushIntervalMs?: number } = {}
  ) {}

  start() {
    const flushMs = this.opts.flushIntervalMs ?? 5_000
    setActiveReporter(this)
    this.flushTimer = setInterval(() => this.flush(), flushMs)
  }

  stop() {
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = null
    this.flush()
    setActiveReporter(null)
  }

  /**
   * 由 logger.ts 直接调用上报。
   * level: 'debug' | 'info' | 'warn' | 'error'
   */
  ingest(level: string, scope: string | undefined, args: unknown[]) {
    if (level === 'debug' || level === 'silly' || level === 'verbose') return
    const batchSize = this.opts.batchSize ?? 50
    const ev: DomainEvent = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      deviceId: this.deviceId,
      type: 'evt.log',
      payload: {
        level,
        msg: args.map((d) => (typeof d === 'string' ? d : safeStringify(d))).join(' '),
        scope: scope ?? null
      }
    }
    if (level === 'warn' || level === 'error') {
      this.publish(ev)
    } else {
      this.buffer.push(ev)
      if (this.buffer.length >= batchSize) this.flush()
    }
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

/**
 * 单例引用：logger.ts 通过 getActiveReporter() 拿到当前 reporter 调 ingest。
 * 用 globalThis 跨模块实例（dev 模式下 electron-log 副本问题不会影响 globalThis）。
 */
const ACTIVE_KEY = Symbol.for('exhi-active-remote-log-reporter')
type Holder = { reporter: RemoteLogReporter | null }

function getHolder(): Holder {
  const g = globalThis as unknown as Record<symbol, Holder>
  if (!g[ACTIVE_KEY]) g[ACTIVE_KEY] = { reporter: null }
  return g[ACTIVE_KEY]
}

function setActiveReporter(r: RemoteLogReporter | null) {
  getHolder().reporter = r
}

export function getActiveReporter(): RemoteLogReporter | null {
  return getHolder().reporter
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
