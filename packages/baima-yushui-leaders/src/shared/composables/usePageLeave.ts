import { ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'

/**
 * 页面离场动画状态机。
 *
 * 用法（View 组件里）：
 *   const { leaving, leaveTo } = usePageLeave({ duration: 520 })
 *   function onCardClick(id: string) {
 *     leaveTo({ name: 'section', params: { id } })
 *   }
 *
 * 模板里把 `leaving` 透到容器作为 class hook，CSS 自己挂 .leaving 触发对应动画：
 *   <section :class="{ leaving }">...</section>
 *
 * 设计要点：
 * - leaveTo() 立刻把 leaving 翻 true → 触发 CSS 离场动画
 * - 等 duration ms 后再真正 router.push → 离场动画跑完才切页面
 * - 二次点击/重复触发自动忽略（防呆）
 * - 不依赖任何 Vue Router 的导航守卫，纯组件态、可移植到任意路由系统
 */
export interface UsePageLeaveOptions {
  /** 离场动画时长（ms）。跟 CSS 里 .leaving 下的 animation/transition 对齐 */
  duration?: number
}

export function usePageLeave(options: UsePageLeaveOptions = {}) {
  const duration = options.duration ?? 500
  const router = useRouter()
  const leaving = ref(false)

  /** 等离场动画跑完再切路由 */
  function leaveTo(to: RouteLocationRaw) {
    if (leaving.value) return
    leaving.value = true
    window.setTimeout(() => {
      router.push(to)
    }, duration)
  }

  /** 不切路由，只触发离场动画（高级用法：用于自定义切换场景）*/
  function startLeave() {
    if (leaving.value) return
    leaving.value = true
  }

  return { leaving, leaveTo, startLeave }
}
