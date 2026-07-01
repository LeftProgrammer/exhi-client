import type { Router } from 'vue-router'
import { useControlBase } from '@shared/composables/useControlBase'

/**
 * 白马多维筑安 中控通信封装。
 *
 * 基于 useControlBase（shared 通用指令注册器 + sendTo/startFallback），
 * 支持中控指令控制页面跳转。
 */
export function useControl() {
  const { rc, sfx, sendTo, startFallback } = useControlBase()

  return {
    sendTo,
    startFallback,

    /** 注册中控指令接收处理（在 App.vue 初始化时调用） */
    setupCommands(router: Router) {
      rc.onCommand('home', () => {
        try {
          sfx.play('back')
        } catch {
          /* 静默忽略 */
        }
        router.push({ name: 'home' })
      })

      rc.onCommand('goto', (p) => {
        const target = p.target as string
        const valid = ['safety', 'tech', 'activity', 'standard']
        if (!valid.includes(target)) return
        try {
          sfx.play('nav')
        } catch {
          /* 静默忽略 */
        }
        const index = p.index as number | undefined
        router.push({
          name: target,
          query: index !== undefined ? { index: String(index) } : undefined
        })
      })

      rc.onCommand('page', (p) => {
        try {
          sfx.play('page')
        } catch {
          /* 静默忽略 */
        }
        window.dispatchEvent(new CustomEvent('uec:page', { detail: p }))
      })
    }
  }
}
