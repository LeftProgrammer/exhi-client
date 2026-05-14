import { createHmac } from 'node:crypto'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import WebSocket, { type RawData } from 'ws'
import {
  WS_HEARTBEAT_INTERVAL_MS,
  WS_HEARTBEAT_TIMEOUT_MS,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  ErrorCode
} from '@shared/constants'
import type { Command, Event as DomainEvent } from '@shared/types'
import { logger } from './logger'
import { stableStringify } from './stable-json'
import type { Settings } from './settings'

export type WsMode = 'online' | 'standalone'

export interface WsClientEvents {
  command: (cmd: Command) => void
  modeChanged: (mode: WsMode) => void
}

export declare interface WsClient {
  on<E extends keyof WsClientEvents>(ev: E, cb: WsClientEvents[E]): this
  off<E extends keyof WsClientEvents>(ev: E, cb: WsClientEvents[E]): this
  emit<E extends keyof WsClientEvents>(ev: E, ...args: Parameters<WsClientEvents[E]>): boolean
}

/**
 * 中控 WebSocket 客户端。
 *
 * 行为约定：
 *  - 配置缺省/连不上 → 进入 standalone 模式（持续后台重连）
 *  - 指数退避：1s 2s 4s 8s 16s 30s 30s ...
 *  - 30s ping，60s 无 pong 主动断开
 *  - 离线期间 publish 的事件入队，连上后批量补报（最多 500 条）
 *  - 收到 cmd 校验签名（开关可控）→ emit('command')
 */
export class WsClient extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectDelay = WS_RECONNECT_BASE_MS
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private pongTimer: NodeJS.Timeout | null = null
  private offlineQueue: DomainEvent[] = []
  /** 内存上限：到顶就开始淘汰最旧的 */
  private readonly maxQueue = 2000
  /** 文件上限：超过就截断旧部分 */
  private readonly maxFileBytes = 10 * 1024 * 1024 // 10MB
  /** 持久化文件路径，由 init 设置 */
  private queueFile: string
  /** flush 节流定时器 */
  private flushTimer: NodeJS.Timeout | null = null
  private _mode: WsMode = 'standalone'
  private stopped = false

  constructor(
    private settings: Settings,
    private deviceId: string,
    private projectVersion: string
  ) {
    super()
    this.queueFile = path.join(app.getPath('userData'), 'offline-queue.ndjson')
    this.loadQueueFromDisk()
  }

  get mode(): WsMode {
    return this._mode
  }

  start() {
    if (this.settings.hubDisabled) {
      logger.info('WS: 未配置 hubUrl，跳过连接（纯 Standalone）')
      return
    }
    this.connect()
  }

  stop() {
    this.stopped = true
    this.clearTimers()
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    // 退出前最后一次刷盘，确保未送出的事件不丢
    if (this.offlineQueue.length > 0) this.persistQueue()
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        /* noop */
      }
      this.ws = null
    }
  }

  /** 上报事件，离线入队（带文件持久化） */
  publish(ev: DomainEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send(ev)
    } else {
      if (this.offlineQueue.length >= this.maxQueue) this.offlineQueue.shift()
      this.offlineQueue.push(ev)
      this.scheduleFlush()
    }
  }

  // ============ 内部 ============

  private connect() {
    if (this.stopped) return

    const url = this.buildUrl()
    logger.info(`WS: 连接 ${url}`)
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch (e) {
      logger.error('WS: 创建实例失败', e)
      this.scheduleReconnect()
      return
    }
    this.ws = ws

    ws.on('open', () => {
      logger.info('WS: 已连接')
      this.reconnectDelay = WS_RECONNECT_BASE_MS
      this.setMode('online')
      this.startHeartbeat()
      this.flushOfflineQueue()
    })

    ws.on('message', (data) => this.onMessage(data))

    ws.on('pong', () => {
      // 收到 pong，重置 pong 超时计时
      this.resetPongTimer()
    })

    ws.on('close', () => {
      logger.warn('WS: 连接关闭')
      this.setMode('standalone')
      this.clearTimers()
      this.ws = null
      this.scheduleReconnect()
    })

    ws.on('error', (err) => {
      logger.warn('WS: 错误', err.message)
      // close 事件会随之触发，不重复处理
    })
  }

  private buildUrl(): string {
    const base = this.settings.hubUrl!
    const sep = base.includes('?') ? '&' : '?'
    const params = new URLSearchParams({
      deviceId: this.deviceId,
      v: app.getVersion(),
      pkgV: this.projectVersion
    })
    if (this.settings.hubToken) params.set('token', this.settings.hubToken)
    return `${base}${sep}${params.toString()}`
  }

  private send(payload: object) {
    try {
      this.ws!.send(JSON.stringify(payload))
    } catch (e) {
      logger.warn('WS: 发送失败', e)
    }
  }

  private onMessage(data: RawData) {
    let cmd: Command
    try {
      cmd = JSON.parse(data.toString()) as Command
    } catch (e) {
      logger.warn('WS: 收到无法解析的消息', e)
      return
    }
    if (!cmd.type) return

    // 签名校验（按 enableSign 开关）
    if (this.settings.enableSign) {
      if (!this.verifySig(cmd)) {
        logger.warn(`WS: 指令签名失败 (${cmd.type})`)
        this.publish(this.errorEvent(ErrorCode.SIG, `签名校验失败: ${cmd.type}`, cmd.id))
        return
      }
    }

    cmd.source = 'hub'
    this.emit('command', cmd)
  }

  private verifySig(cmd: Command): boolean {
    if (!this.settings.hubSecret || !cmd.sig) return false
    const { sig, ...rest } = cmd
    // 用 stable stringify：两端字段顺序无关，杜绝顺序差异导致签名 100% 不过
    const expected = createHmac('sha256', this.settings.hubSecret)
      .update(stableStringify(rest))
      .digest('base64')
    return expected === sig
  }

  private errorEvent(code: string, msg: string, cmdId?: string): DomainEvent {
    return {
      id: randomId(),
      ts: Date.now(),
      deviceId: this.deviceId,
      type: 'evt.error',
      payload: { code, msg, cmdId }
    }
  }

  private setMode(mode: WsMode) {
    if (this._mode === mode) return
    this._mode = mode
    this.emit('modeChanged', mode)
  }

  // ---- 心跳 ----

  private startHeartbeat() {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.ping()
        } catch {
          /* noop */
        }
        if (!this.pongTimer) this.resetPongTimer()
      }
    }, WS_HEARTBEAT_INTERVAL_MS)
  }

  private resetPongTimer() {
    if (this.pongTimer) clearTimeout(this.pongTimer)
    this.pongTimer = setTimeout(() => {
      logger.warn('WS: 心跳超时，强制重连')
      try {
        this.ws?.terminate()
      } catch {
        /* noop */
      }
    }, WS_HEARTBEAT_TIMEOUT_MS)
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.pongTimer) clearTimeout(this.pongTimer)
    this.heartbeatTimer = null
    this.pongTimer = null
  }

  // ---- 重连 ----

  private scheduleReconnect() {
    if (this.stopped) return
    if (this.reconnectTimer) return
    const delay = this.reconnectDelay
    logger.info(`WS: ${delay}ms 后重连`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, WS_RECONNECT_MAX_MS)
      this.connect()
    }, delay)
  }

  private clearTimers() {
    this.clearHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // ---- 离线队列 ----

  private flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return
    logger.info(`WS: 补报离线事件 ${this.offlineQueue.length} 条`)
    for (const ev of this.offlineQueue) this.send(ev)
    this.offlineQueue = []
    // 全部补完，清空磁盘文件
    try {
      if (fs.existsSync(this.queueFile)) fs.unlinkSync(this.queueFile)
    } catch (e) {
      logger.warn('WS: 清理离线队列文件失败', e)
    }
  }

  // ---- 持久化 ----

  /** 启动时把磁盘上的队列读回来（断电/重启后不丢日志） */
  private loadQueueFromDisk() {
    try {
      if (!fs.existsSync(this.queueFile)) return
      const raw = fs.readFileSync(this.queueFile, 'utf-8')
      const lines = raw.split('\n').filter((l) => l.trim())
      let loaded = 0
      for (const line of lines) {
        try {
          const ev = JSON.parse(line) as DomainEvent
          this.offlineQueue.push(ev)
          loaded++
          if (this.offlineQueue.length >= this.maxQueue) {
            this.offlineQueue.shift()
          }
        } catch {
          /* 单行解析失败跳过 */
        }
      }
      if (loaded > 0) logger.info(`WS: 从磁盘恢复 ${loaded} 条离线事件`)
    } catch (e) {
      logger.warn('WS: 读取离线队列文件失败', e)
    }
  }

  /** 节流刷盘：500ms 内的多次 publish 合并成一次 IO */
  private scheduleFlush() {
    if (this.flushTimer) return
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.persistQueue()
    }, 500)
  }

  /** 把当前 offlineQueue 全量写入文件（NDJSON 格式，每行一条） */
  private persistQueue() {
    try {
      // 简单策略：超过 maxFileBytes 直接丢前一半
      let lines = this.offlineQueue.map((e) => JSON.stringify(e))
      let content = lines.join('\n') + '\n'
      if (content.length > this.maxFileBytes) {
        const half = Math.floor(lines.length / 2)
        lines = lines.slice(half)
        content = lines.join('\n') + '\n'
      }
      fs.writeFileSync(this.queueFile, content, 'utf-8')
    } catch (e) {
      logger.warn('WS: 持久化离线队列失败', e)
    }
  }
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
