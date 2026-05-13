import Fastify, { type FastifyInstance } from 'fastify'
import type { EventEmitter } from 'node:events'
import { LOCAL_SERVER_PORT } from '@shared/constants'
import type { Command } from '@shared/types'
import { logger } from './logger'

/**
 * 本地 HTTP 服务（127.0.0.1:17600）。
 *
 * 提供给：
 *  - 本地代理推送指令（滑轨位置等）：POST /cmd
 *  - exhibitBridge 兜底通道（M3 接入）
 *  - 健康检查与运维查询：GET /health
 *
 * 仅监听 127.0.0.1，杜绝外部访问。
 */
export class LocalServer {
  private app: FastifyInstance
  private listening = false

  constructor(
    private bus: EventEmitter,
    private getHealth: () => Record<string, unknown>
  ) {
    this.app = Fastify({ logger: false })

    this.app.get('/health', async () => this.getHealth())

    this.app.post<{ Body: Command }>('/cmd', async (req, reply) => {
      const cmd = req.body
      if (!cmd?.type) {
        return reply.code(400).send({ ok: false, error: 'missing type' })
      }
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
      logger.info(`本地 HTTP 服务监听 127.0.0.1:${LOCAL_SERVER_PORT}`)
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
