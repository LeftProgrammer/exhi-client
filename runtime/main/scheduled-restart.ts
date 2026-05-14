import { logger } from './logger'
import type { WindowManager } from './window-manager'

/**
 * 定时重启窗口（缓解长期内存累积、缓存膨胀）。
 *
 * 策略：每天指定时刻（默认 04:00）reload 所有窗口。
 * 仅 reload 渲染层，不重启主进程，对正在播放的内容是 1-2 秒中断。
 */
export class ScheduledRestart {
  private timer: NodeJS.Timeout | null = null

  constructor(
    private winManager: WindowManager,
    private hour = 4,
    private minute = 0
  ) {}

  start() {
    this.scheduleNext()
    logger.info(
      `已开启定时窗口刷新：每日 ${pad(this.hour)}:${pad(this.minute)}`
    )
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private scheduleNext() {
    const now = new Date()
    const next = new Date()
    next.setHours(this.hour, this.minute, 0, 0)
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1)
    }
    const delay = next.getTime() - now.getTime()
    this.timer = setTimeout(() => this.fire(), Math.min(delay, 2_147_000_000))
  }

  private fire() {
    logger.info('定时刷新触发：reload 全部窗口')
    for (const win of this.winManager.all()) {
      if (!win.isDestroyed()) {
        try {
          win.reload()
        } catch (e) {
          logger.warn('定时刷新 reload 失败:', e)
        }
      }
    }
    this.scheduleNext()
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
