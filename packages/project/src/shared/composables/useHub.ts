import { useBridge } from '@shared/composables/useBridge'

/**
 * UEC 消息收发封装（渲染层）。
 *
 * 底层走 exhibitBridge：
 *   收：主进程 WsClient 收到服务端 msg → mainBus('bridge-event') →
 *       IPC → WebRenderer → iframe postMessage → exhibitBridge.on('hub:command') → useHub.onCommand
 *   发：useHub.send → exhibitBridge.emit('hub:send') → postMessage →
 *       IPC → mainBus → ws.sendApp → 服务端转发
 *   发（指定设备）：useHub.sendTo → 同上，但带 to 字段发给指定设备
 *
 * 用法：
 *   const hub = useHub()
 *   hub.onCommand((cmd) => { console.log('收到消息', cmd) })
 *   hub.send({ Page: 0, cmd: '0' })              // 发给默认 target
 *   hub.sendTo('screen-2', { cmd: 'goto' })       // 发给指定设备
 */

export function useHub() {
  const { emit, on } = useBridge()

  return {
    /** 订阅服务端/其他设备发来的自定义消息。
     * 兼容 msg 为字符串（JSON 嵌套）或对象的情况：
     *  - { to, msg: '{"cmd":"xxx"}' } → 自动 JSON.parse(msg)
     *  - { to, msg: { cmd: 'xxx' } }    → 直接取 msg
     *  - { cmd: 'xxx' }                → 已解析，原样透传
     */
    onCommand: (cb: (payload: unknown) => void) =>
      on('hub:command', (raw) => {
        const envelope = raw as Record<string, unknown>
        let msg: unknown = envelope
        if (envelope && typeof envelope.msg === 'string') {
          try {
            msg = JSON.parse(envelope.msg)
          } catch {
            /* 解析失败则保留原样 */
          }
        } else if (envelope && typeof envelope.msg === 'object') {
          msg = envelope.msg
        }
        cb(msg)
      }),
    /** 向默认 target（中控平台）发送自定义消息 */
    send: (payload: unknown) => emit('hub:send', payload),
    /** 向指定设备发送自定义消息
     *  target: 接收方设备 ID
     *  payload: 消息体
     */
    sendTo: (target: string, payload: unknown) =>
      emit('hub:send', { to: target, msg: payload })
  }
}
