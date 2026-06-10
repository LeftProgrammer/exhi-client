import { createHmac } from 'node:crypto'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import WebSocket, { type RawData } from 'ws'
import { ErrorCode } from '@shared/constants'
import type { Command, Event as DomainEvent } from '@shared/types'
import { logger } from './logger'
import { stableStringify } from './stable-json'
import { HUB_DEFAULTS, type Settings } from './settings'

export type WsMode = 'online' | 'standalone'

/** UEC 转发服务的应用层心跳字符串（服务端原样回包） */
const UEC_HEARTBEAT = 'heartbeat'

export interface WsClientEvents {
  command: (cmd: Command) => void
  /** 收到中控自定义消息（原样透传，不翻译） */
  hubMessage: (payload: unknown) => void
  modeChanged: (mode: WsMode) => void
}

// EventEmitter 子类的标准类型扩展模式：interface + class 同名合并。
// 社区惯例（io、ws、mqtt 等都这样写）。
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
 *  - 指数退避：3s 6s 12s 24s 30s 30s ...
 *  - 20s ping，20s 无 pong 主动断开
 *  - 离线期间 publish 的事件入队，连上后批量补报
 *  - 收到 cmd 校验签名（开关可控）→ emit('command')
 */
export class WsClient extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectDelay = HUB_DEFAULTS.reconnectBaseMs
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private pongTimer: NodeJS.Timeout | null = null
  private offlineQueue: DomainEvent[] = []
  /** 内存上限：到顶就开始淘汰最旧的 */
  private readonly maxQueue = HUB_DEFAULTS.offlineQueueMax
  /** 文件上限：超过就截断旧部分 */
  private readonly maxFileBytes = HUB_DEFAULTS.offlineQueueMaxBytes
  /** 持久化文件路径，由 init 设置 */
  private queueFile: string
  /** flush 节流定时器 */
  private flushTimer: NodeJS.Timeout | null = null
  private _mode: WsMode = 'standalone'
  private stopped = false
  /** 调试字段：连接成功时间戳 */
  private connectedAt: number | undefined
  /** 调试字段：最后心跳时间戳 */
  private lastHeartbeat: number | undefined
  /** 调试字段：最后收到消息时间戳 */
  private lastMessageIn: number | undefined
  /** 调试字段：最后发送消息时间戳 */
  private lastMessageOut: number | undefined
  /** 最近收到的消息（最多 10 条） */
  private recentIn: { ts: number; payload: unknown }[] = []
  /** 最近发送的消息（最多 10 条） */
  private recentOut: { ts: number; payload: unknown }[] = []

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

  /**
   * 上报事件，离线入队（带文件持久化）。
   * UEC 转发模式下：框架自动事件（metrics/status/错误回执等）不再发向中控，
   * 只保留本地离线队列用于调试日志；应用层需用 sendApp 向中控发自定义消息。
   */
  publish(ev: DomainEvent) {
    if (this.isUec) return
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send(ev)
    } else {
      if (this.offlineQueue.length >= this.maxQueue) this.offlineQueue.shift()
      this.offlineQueue.push(ev)
      this.scheduleFlush()
    }
  }

  /**
   * 应用层主动向中控/指定设备发送自定义消息（仅 UEC 模式有意义）。
   * payload 会被自动 JSON.stringify 并包裹成 { to, msg } 格式。
   * @param to 接收方 ID（默认 hub.json 里的 target）
   */
  sendApp(payload: object, to?: string): boolean {
    if (!this.isUec) {
      logger.warn('WS: sendApp 只在 UEC 模式下有效')
      return false
    }
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WS: sendApp 失败，连接未就绪')
      return false
    }
    try {
      const recipient = to ?? this.settings.hubTarget ?? ''
      const wrapped = JSON.stringify({
        to: recipient,
        msg: JSON.stringify(payload)
      })
      this.ws.send(wrapped)
      this.lastMessageOut = Date.now()
      this.recentOut.push({ ts: Date.now(), payload })
      if (this.recentOut.length > 10) this.recentOut.shift()
      logger.info('WS: sendApp 已发送 →', recipient, payload)
      this.writeDebugStatus()
      return true
    } catch (e) {
      logger.warn('WS: sendApp 发送失败', e)
      return false
    }
  }

  // ============ 内部 ============

  private connect() {
    if (this.stopped) return

    const url = this.buildUrl()
    logger.info('')
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
      logger.info('')
      this.reconnectDelay = HUB_DEFAULTS.reconnectBaseMs
      this.connectedAt = Date.now()
      this.setMode('online')
      this.startHeartbeat()
      this.flushOfflineQueue()
    })

    ws.on('message', (data) => this.onMessage(data))

    ws.on('pong', () => {
      // 收到 pong，重置 pong 超时计时
      this.lastHeartbeat = Date.now()
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

  /** 是否走 UEC 转发中继传输 */
  private get isUec(): boolean {
    return this.settings.hubTransport === 'uec'
  }

  private buildUrl(): string {
    const base = this.settings.hubUrl!
    const sep = base.includes('?') ? '&' : '?'
    // UEC 转发服务：仅需 ?id=<本端信箱>，不带 deviceId/v/pkgV/token
    if (this.isUec) {
      const id = this.settings.hubId || this.deviceId
      return `${base}${sep}id=${encodeURIComponent(id)}`
    }
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
      if (this.isUec) {
        // UEC 转发协议：{ to: 中控信箱, msg: 负载字符串 }
        const wrapped = JSON.stringify({
          to: this.settings.hubTarget ?? '',
          msg: JSON.stringify(payload)
        })
        this.ws!.send(wrapped)
      } else {
        this.ws!.send(JSON.stringify(payload))
      }
    } catch (e) {
      logger.warn('WS: 发送失败', e)
    }
  }

  private onMessage(data: RawData) {
    const text = data.toString()
    // 过滤空消息和心跳回包
    if (!text || text.trim() === '') return
    if (this.isUec && text === UEC_HEARTBEAT) {
      this.resetPongTimer()
      return
    }

    // UEC 模式：收到的不是 Command 而是自定义 msg → 双路分发
    if (this.isUec) {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        logger.warn('WS: UEC 收到无法解析的消息', e)
        return
      }
      // ① 原样透传渲染层（项目自由解析）
      this.lastMessageIn = Date.now()
      this.recentIn.push({ ts: Date.now(), payload: parsed })
      if (this.recentIn.length > 10) this.recentIn.shift()
      logger.info('')
      logger.info('WS: 收到服务端消息', parsed)
      logger.info('')
      this.writeDebugStatus()
      this.emit('hubMessage', parsed)
      // ② 若包含 cmd.type → 同时走框架 Command 路由（控制类指令）
      if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).type === 'string') {
        const p = parsed as { type: string; [key: string]: unknown }
        const cmd: Command = {
          id: (p.id as string) ?? randomId(),
          ts: (p.ts as number) ?? Date.now(),
          type: p.type,
          payload: p.payload as Record<string, unknown> | undefined,
          sig: p.sig as string | undefined,
          source: 'hub'
        }
        if (this.settings.enableSign && !this.verifySig(cmd)) {
          logger.warn(`WS: 指令签名失败 (${cmd.type})`)
          return
        }
        this.emit('command', cmd)
      }
      return
    }

    // Native 模式：收到的就是框架 Command
    let cmd: Command
    try {
      cmd = JSON.parse(text) as Command
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
    this.writeDebugStatus({ mode, ts: Date.now() })
  }

  /** 写入调试状态文件，供 dev-helper 实时查看 */
  private writeDebugStatus(extra?: Record<string, unknown>) {
    try {
      const file = path.join(app.getPath('userData'), 'ws-debug.json')
      const status = {
        mode: this._mode,
        url: this.settings.hubUrl,
        transport: this.settings.hubTransport,
        id: this.settings.hubId || this.deviceId,
        target: this.settings.hubTarget,
        connectedAt: this._mode === 'online' ? (this.connectedAt || Date.now()) : undefined,
        disconnectedAt: this._mode === 'standalone' ? Date.now() : undefined,
        lastHeartbeat: this.lastHeartbeat,
        lastMessageIn: this.lastMessageIn,
        lastMessageOut: this.lastMessageOut,
        queueLength: this.offlineQueue.length,
        recentIn: this.recentIn,
        recentOut: this.recentOut,
        ...extra
      }
      fs.writeFileSync(file, JSON.stringify(status, null, 2))
    } catch {
      /* 调试文件写入失败不影响主逻辑 */
    }
  }

  // ---- 心跳 ----

  private startHeartbeat() {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // UEC 用应用层字符串心跳；原生用 WS ping 帧
          if (this.isUec) {
            this.ws.send(UEC_HEARTBEAT)
            logger.info('WS: 发送 heartbeat')
          } else {
            this.ws.ping()
          }
        } catch {
          /* noop */
        }
        if (!this.pongTimer) this.resetPongTimer()
      }
    }, HUB_DEFAULTS.heartbeatIntervalMs)
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
    }, HUB_DEFAULTS.heartbeatTimeoutMs)
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
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, HUB_DEFAULTS.reconnectMaxMs)
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
    // UEC 模式下离线队列存的是原生格式，服务端不认识，直接清空不补报
    if (this.isUec) {
      logger.info(`WS: UEC 模式跳过 ${this.offlineQueue.length} 条离线事件`)
      this.offlineQueue = []
      try { if (fs.existsSync(this.queueFile)) fs.unlinkSync(this.queueFile) } catch { /* noop */ }
      return
    }
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
