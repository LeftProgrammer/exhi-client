import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'

/**
 * 心跳文件：主进程周期性写入，外部 Guardian 进程检测文件 mtime。
 * mtime 落后超过阈值 → Guardian 判定主进程已死，杀进程并重启 EXE。
 *
 * 文件位置：%APPDATA%/exhi-client/heartbeat.txt
 * 内容：JSON {pid, ts, runtime, package}
 */
export class Heartbeat {
  private timer: NodeJS.Timeout | null = null
  private file: string

  constructor(
    private intervalMs = 5_000,
    private meta: () => Record<string, unknown> = () => ({})
  ) {
    this.file = path.join(app.getPath('userData'), 'heartbeat.txt')
  }

  async start() {
    await fsp.mkdir(path.dirname(this.file), { recursive: true })
    this.tick() // 立即写一次
    this.timer = setInterval(() => this.tick(), this.intervalMs)
    logger.info(`心跳文件: ${this.file} (每 ${this.intervalMs}ms 写入)`)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    // 退出时清理文件，让 Guardian 区分"正常退出"vs"异常死亡"
    try {
      fs.unlinkSync(this.file)
    } catch {
      /* ignore */
    }
  }

  private tick() {
    const data = JSON.stringify({
      pid: process.pid,
      ts: Date.now(),
      ...this.meta()
    })
    try {
      // 同步写：心跳很小，且要保证退出时也能写到
      fs.writeFileSync(this.file, data, 'utf-8')
    } catch (e) {
      // 心跳写不进就算了，下次再试，不打日志（避免刷屏）
      void e
    }
  }
}
