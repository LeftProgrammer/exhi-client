import { gsap } from 'gsap'

/**
 * 幻灯片离场：向上推出 + 淡出。
 */
export function slideFadeOut(el: Element, done: () => void) {
  gsap.to(el, {
    duration: 0.5,
    ease: 'power2.in',
    y: -40,
    opacity: 0,
    onComplete: done
  })
}

/**
 * 幻灯片入场：从下方滑入 + 淡入。
 */
export function slideFadeIn(el: Element, done: () => void) {
  gsap.set(el, { y: 60, opacity: 0 })
  gsap.to(el, {
    delay: 0.1,
    duration: 0.75,
    ease: 'expo.out',
    y: 0,
    opacity: 1,
    onComplete: done
  })
}
