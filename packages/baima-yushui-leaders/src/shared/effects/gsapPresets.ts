import { gsap } from 'gsap'

/**
 * 向前扑面放大 + 模糊溶解离场。
 * 适合大分类切换的离场，视觉重心保持在屏幕中央。
 */
export function blurDissolveOut(
  el: Element,
  done: () => void,
  opts: { duration?: number; scale?: number; blur?: number } = {}
) {
  const { duration = 0.45, scale = 1.1, blur = 14 } = opts
  gsap.to(el, {
    duration,
    ease: 'power2.in',
    scale,
    opacity: 0,
    filter: `blur(${blur}px)`,
    onComplete: done
  })
}

/**
 * 轻推向左滑出 + 微缩离场。
 * 适合同分类内翻页的离场，为右侧滑入腾出空间。
 */
export function slidePushOut(
  el: Element,
  done: () => void,
  opts: { duration?: number; x?: number; scale?: number } = {}
) {
  const { duration = 0.32, x = -55, scale = 0.97 } = opts
  gsap.to(el, {
    duration,
    ease: 'power2.in',
    x,
    scale,
    opacity: 0,
    onComplete: done
  })
}

/**
 * "硬币落定"漩涡展开入场：从中心极小 + 大角度旋转爆开，expo.out 减速，
 * back.out 弹性落位。适合大分类切换的揭幕式入场。
 */
export function vortexRevealIn(
  el: Element,
  done: () => void,
  opts: {
    initScale?: number
    initRotate?: number
    overshootScale?: number
    mainDuration?: number
    settleDuration?: number
    settleOverlap?: number
  } = {}
) {
  const {
    initScale = 0.1,
    initRotate = 90,
    overshootScale = 1.06,
    mainDuration = 1.1,
    settleDuration = 0.5,
    settleOverlap = 0.38
  } = opts

  gsap.set(el, {
    scale: initScale,
    rotate: initRotate,
    opacity: 0,
    filter: 'blur(22px) brightness(2.2)',
    transformOrigin: '50% 50%'
  })

  gsap
    .timeline({ onComplete: done })
    .to(el, {
      duration: mainDuration,
      ease: 'expo.out',
      scale: overshootScale,
      rotate: -3,
      opacity: 1,
      filter: 'blur(0px) brightness(1)'
    })
    .to(
      el,
      {
        duration: settleDuration,
        ease: 'back.out(2.2)',
        scale: 1,
        rotate: 0
      },
      `-=${settleOverlap}`
    )
}

/**
 * 从右侧带微模糊滑入。适合同分类内翻页的入场。
 */
export function slideInFromRight(
  el: Element,
  done: () => void,
  opts: { delay?: number; x?: number; blur?: number; duration?: number } = {}
) {
  const { delay = 0.2, x = 70, blur = 4, duration = 0.82 } = opts
  gsap.set(el, { x, opacity: 0, filter: `blur(${blur}px)` })
  gsap.to(el, {
    delay,
    duration,
    ease: 'expo.out',
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    onComplete: done
  })
}
