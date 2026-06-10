import { useHub } from '@shared/composables/useHub'

export type CommandPayload = Record<string, unknown>
export type CommandHandler = (payload: CommandPayload) => void

/**
 * 通用中控指令注册器。
 *
 * 把 switch-case 改成注册式 handlers，新项目也可以复用同样模式。
 *
 * 用法：
 *   const rc = useRemoteControl()
 *   rc.onCommand('home', () => router.push({ name: 'home' }))
 *   rc.onCommand('goto', (p) => { ... })
 */
export function useRemoteControl() {
  const hub = useHub()
  const handlers = new Map<string, CommandHandler>()

  hub.onCommand((cmd) => {
    const payload = cmd as CommandPayload
    const type = String(payload.cmd ?? '')
    if (!type) return
    const handler = handlers.get(type)
    if (handler) handler(payload)
  })

  return {
    /** 注册某类中控指令的处理函数 */
    onCommand: (type: string, handler: CommandHandler) => {
      handlers.set(type, handler)
    },
    /** 向中控发送消息 */
    send: hub.send,
    /** 向指定设备发送消息 */
    sendTo: hub.sendTo,
    /** 手动触发某类指令（用于浏览器回退等场景） */
    dispatch: (type: string, payload: CommandPayload) => {
      const handler = handlers.get(type)
      if (handler) handler(payload)
    }
  }
}
