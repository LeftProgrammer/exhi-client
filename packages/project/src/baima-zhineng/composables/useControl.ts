import type { Router } from 'vue-router'
import { useRemoteControl } from '@shared/composables/useRemoteControl'
import { useBrowserFallback } from '@shared/composables/useBrowserFallback'
import { useProjectSfx } from '@shared/composables/useProjectSfx'

/**
 * 白马职能建设 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 支持中控指令控制页面跳转。
 */
export function useControl() {
  const rc = useRemoteControl()
  const fallback = useBrowserFallback()

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
      const sfx = useProjectSfx()

      rc.onCommand('home', () => {
        try { sfx.play('back') } catch { /* 静默忽略 */ }
        router.push({ name: 'home' })
      })

      rc.onCommand('goto', (p) => {
        const target = p.target as string
        const valid = ['zhidu', 'guihua', 'xingdong']
        if (!valid.includes(target)) return
        try { sfx.play('tap') } catch { /* 静默忽略 */ }
        router.push({ name: target })
      })

      rc.onCommand('page', (p) => {
        // 通过 window 自定义事件同文档内派发，当前 view 组件监听
        window.dispatchEvent(new CustomEvent('uec:page', { detail: p }))
      })

      rc.onCommand('scroll', (p) => {
        window.dispatchEvent(new CustomEvent('uec:scroll', { detail: p }))
      })
    },

    /** 浏览器 dev 模式下启动 WS 回退连接 */
    startFallback(hubId: string) {
      fallback.start({
        hubId,
        onDispatch: (cmd, payload) => rc.dispatch(cmd, payload)
      })
    }
  }
}
