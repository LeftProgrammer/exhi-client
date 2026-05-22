import { gsap } from 'gsap'

export function slideFadeOut(el: Element, done: () => void) {
  gsap.to(el, { duration: 0.5, ease: 'power2.in', x: -80, opacity: 0, onComplete: done })
}

export function slideFadeIn(el: Element, done: () => void) {
  gsap.set(el, { x: 80, opacity: 0 })
  gsap.to(el, { delay: 0.05, duration: 0.65, ease: 'expo.out', x: 0, opacity: 1, onComplete: done })
}

/**
 * 逐条入场：标题/装饰层先渐显，然后各行依次从左滑入。
 * @param headers  先渐显的元素列表（背景/标题/装饰条）
 * @param rows     逐条滑入的元素列表
 */
export function playEnterSequence(headers: Element[], rows: Element[]): gsap.core.Timeline {
  const tl = gsap.timeline()

  // 初始隐藏
  gsap.set([...headers, ...rows], { opacity: 0 })
  gsap.set(rows, { x: -400 })

  // 1. 背景/标题缓慢渐显
  tl.to(headers, { opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 })

  // 2. 各行依次从左滑入
  tl.to(rows, { opacity: 1, x: 0, duration: 1.6, ease: 'power4.out', stagger: 0.3 }, '-=0.5')

  return tl
}
