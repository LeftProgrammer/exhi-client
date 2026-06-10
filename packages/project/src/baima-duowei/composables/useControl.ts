import type { Router } from 'vue-router'
import { useRemoteControl } from '@shared/composables/useRemoteControl'

/**
 * 白马多维筑安 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 支持中控指令控制页面跳转。
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

    /** 注册中控指令接收处理（在 App.vue 初始化时调用）
     *  router: Vue Router 实例
     */
    setupCommands(router: Router) {
      rc.onCommand('home', () => {
        router.push({ name: 'home' })
      })

      rc.onCommand('goto', (p) => {
        const target = p.target as string
        const valid = ['safety', 'tech', 'activity', 'standard']
        if (!valid.includes(target)) return
        const index = p.index as number | undefined
        router.push({
          name: target,
          query: index !== undefined ? { index: String(index) } : undefined
        })
      })

      rc.onCommand('page', (p) => {
        // 通过 window 自定义事件同文档内派发，当前 view 组件监听
        window.dispatchEvent(new CustomEvent('uec:page', { detail: p }))
      })
    }
  }
}
