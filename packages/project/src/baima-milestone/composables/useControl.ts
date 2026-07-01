import { useControlBase } from '@shared/composables/useControlBase'

/**
 * 白马 milestones 中控通信封装。
 *
 * 基于 useControlBase（shared 通用指令注册器 + sendTo/startFallback），
 * 支持中控指令控制幻灯片翻页。
 */
export function useControl() {
  const { rc, sfx, sendTo, startFallback } = useControlBase()

  return {
    sendTo,
    startFallback,

    /** 注册中控指令接收处理 */
    setupCommands(options: {
      total: number
      getCurrent: () => number
      onGoto: (index: number) => void
      onScrollPlay?: () => void
      onScrollPause?: () => void
      onScrollReset?: () => void
    }) {
      rc.onCommand('home', () => {
        try {
          sfx.play('back')
        } catch {
          /* 静默忽略 */
        }
        options.onGoto(0)
      })

      rc.onCommand('goto', (p) => {
        const index = (p.index as number) ?? 0
        if (index >= 0 && index < options.total) {
          try {
            sfx.play('nav')
          } catch {
            /* 静默忽略 */
          }
          options.onGoto(index)
        }
      })

      rc.onCommand('page', (p) => {
        const current = options.getCurrent()
        const total = options.total
        const action = p.action as string
        let next = current
        if (action === 'next') {
          next = (current + 1) % total
        } else if (action === 'prev') {
          next = (current - 1 + total) % total
        } else if (typeof p.index === 'number') {
          next = Math.max(0, Math.min(p.index as number, total - 1))
        }
        if (next !== current) {
          try {
            sfx.play('page')
          } catch {
            /* 静默忽略 */
          }
          options.onGoto(next)
        }
      })

      if (options.onScrollPlay) {
        rc.onCommand('scrollPlay', () => options.onScrollPlay!())
      }
      if (options.onScrollPause) {
        rc.onCommand('scrollPause', () => options.onScrollPause!())
      }
      if (options.onScrollReset) {
        rc.onCommand('scrollReset', () => options.onScrollReset!())
      }
    }
  }
}
