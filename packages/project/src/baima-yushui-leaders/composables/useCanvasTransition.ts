import type { Ref } from 'vue'
import {
  blurDissolveOut,
  slidePushOut,
  vortexRevealIn,
  slideInFromRight
} from '@baima-yushui/effects/gsapPresets'

/**
 * 画布切换动效 composable。
 * 返回 onLeave / onEnter，直接绑定到 <Transition :css="false"> 的同名事件。
 *
 * transitionType:
 *   'category' → 大动效（漩涡展开 / 溶解离场）
 *   'entry'    → 小动效（右滑入 / 左推出）
 */
export function useCanvasTransition(transitionType: Ref<'category' | 'entry'>) {
  function onLeave(el: Element, done: () => void) {
    if (transitionType.value === 'category') {
      blurDissolveOut(el, done)
    } else {
      slidePushOut(el, done)
    }
  }

  function onEnter(el: Element, done: () => void) {
    if (transitionType.value === 'category') {
      vortexRevealIn(el, done)
    } else {
      slideInFromRight(el, done)
    }
  }

  return { onLeave, onEnter }
}
