import Fastify, { type FastifyInstance } from 'fastify'
import type { EventEmitter } from 'node:events'
import { LOCAL_SERVER_PORT } from '@shared/constants'
import type { Command } from '@shared/types'
import { logger } from './logger'
import type { Settings } from './settings'

/**
 * 本地 HTTP 服务（127.0.0.1:17600）。
 *
 * 提供给：
 *  - 本地代理推送指令（滑轨位置等）：POST /cmd
 *  - 健康检查与运维查询：GET /health
 *
 * 仅监听 127.0.0.1，杜绝外部访问。
 *
 * 鉴权：settings.localToken 配置时强制要求 Authorization: Bearer <token>。
 *   设计原因：同机但多用户场景下别的本地进程也能 127.0.0.1，token 防越权
 *
 * 节流：默认每个 cmd.type 限频 30Hz（保护滑轨高频传感器把场景队列打穿）。
 *   配置 settings.localCmdMaxHz 可调。
 */
export class LocalServer {
  private app: FastifyInstance
  private listening = false
  /** 按 cmd.type 记录上次接收时间，做最小间隔节流 */
  private lastSeenByType = new Map<string, number>()
  /** 总丢弃计数，便于诊断 */
  private droppedTotal = 0

  constructor(
    private bus: EventEmitter,
    private getHealth: () => Record<string, unknown>,
    private settings: Settings
  ) {
    this.app = Fastify({ logger: false })

    this.app.get('/health', async () => ({
      ...this.getHealth(),
      droppedCommands: this.droppedTotal
    }))

    this.app.post<{ Body: Command }>('/cmd', async (req, reply) => {
      // 鉴权
      if (this.settings.localToken) {
        const auth = req.headers.authorization ?? ''
        const expect = `Bearer ${this.settings.localToken}`
        if (auth !== expect) {
          return reply.code(401).send({ ok: false, error: 'unauthorized' })
        }
      }

      const cmd = req.body
      if (!cmd?.type) {
        return reply.code(400).send({ ok: false, error: 'missing type' })
      }

      // 按类型节流：滑轨/触摸高频事件不能淹没场景调度
      const maxHz = this.settings.localCmdMaxHz ?? 30
      const minIntervalMs = Math.max(1, Math.floor(1000 / maxHz))
      const now = Date.now()
      const last = this.lastSeenByType.get(cmd.type) ?? 0
      if (now - last < minIntervalMs) {
        this.droppedTotal++
        return reply.code(429).send({ ok: false, error: 'rate-limited', minIntervalMs })
      }
      this.lastSeenByType.set(cmd.type, now)

      cmd.source = 'local'
      if (!cmd.id) cmd.id = randomId()
      if (!cmd.ts) cmd.ts = Date.now()
      this.bus.emit('command', cmd)
      return { ok: true }
    })
  }

  async start() {
    try {
      await this.app.listen({ port: LOCAL_SERVER_PORT, host: '127.0.0.1' })
      this.listening = true
      logger.info(
        `本地 HTTP 服务监听 127.0.0.1:${LOCAL_SERVER_PORT} (auth=${this.settings.localToken ? '已配' : '未启用'}, maxHz=${this.settings.localCmdMaxHz ?? 30})`
      )
    } catch (e) {
      logger.error('本地 HTTP 服务启动失败:', e)
    }
  }

  async stop() {
    if (!this.listening) return
    await this.app.close()
    this.listening = false
  }
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
