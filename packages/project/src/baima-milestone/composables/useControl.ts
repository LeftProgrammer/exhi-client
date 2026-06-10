import { useRemoteControl } from '@shared/composables/useRemoteControl'

/**
 * 白马 milestones 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 支持中控指令控制幻灯片翻页。
 */
export function useControl() {
  const rc = useRemoteControl()

  return {
    /** 向指定设备发送控制消息（多屏互联）
     *  target: 接收方设备 ID
     *  payload: 消息体
     */
    sendTo(target: string, payload: unknown) {
      rc.sendTo(target, payload)
    },

    /** 注册中控指令接收处理
     *  options:
     *    total:     幻灯片总页数
     *    getCurrent: () => 获取当前页索引
     *    onGoto:    (index) => 跳转到指定页
     */
    setupCommands(options: {
      total: number
      getCurrent: () => number
      onGoto: (index: number) => void
    }) {
      rc.onCommand('home', () => {
        options.onGoto(0)
      })

      rc.onCommand('goto', (p) => {
        const index = (p.index as number) ?? 0
        if (index >= 0 && index < options.total) {
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
          options.onGoto(next)
        }
      })
    }
  }
}
