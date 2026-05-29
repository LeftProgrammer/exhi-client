import type { Ref } from 'vue'

/**
 * 单个过渡动作：拿到 DOM 元素与 done 回调，自行驱动动画，结束时调用 done()。
 * 直接对接 <Transition :css="false"> 的 @enter / @leave。
 */
export type TransitionFn = (el: Element, done: () => void) => void

/** 一种模式对应的进/出场动作对 */
export interface TransitionPreset {
  enter: TransitionFn
  leave: TransitionFn
}

/**
 * 通用视图切换 composable（与具体动画库解耦）。
 *
 * 把"当前模式"和"模式 → 进出场动作"解耦：业务只管切换 mode 的值，
 * 本 composable 负责在 Transition 触发时分派到对应的 enter / leave 函数。
 *
 * 用法：
 *   const mode = ref<'category' | 'entry'>('category')
 *   const { onEnter, onLeave } = useViewTransition(mode, {
 *     category: { enter: vortexRevealIn, leave: blurDissolveOut },
 *     entry:    { enter: slideInFromRight, leave: slidePushOut }
 *   })
 *
 * 模板：
 *   <Transition :css="false" @enter="onEnter" @leave="onLeave">...</Transition>
 *
 * 设计要点：
 * - 不依赖 gsap / 任何动画库，preset 自带实现即可（gsap、Web Animations、CSS 皆可）
 * - 泛型 K 约束 mode 取值与 presets 的键一一对应，缺失模式编译期即报错
 * - 切换瞬间读取 mode.value，保证用当前模式对应的动作
 */
export function useViewTransition<K extends string>(
  mode: Ref<K>,
  presets: Record<K, TransitionPreset>
) {
  function onEnter(el: Element, done: () => void) {
    presets[mode.value].enter(el, done)
  }

  function onLeave(el: Element, done: () => void) {
    presets[mode.value].leave(el, done)
  }

  return { onEnter, onLeave }
}
