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
 * @param lines    可选：时间轴竖线，和 rows 同步从上往下生长
 */
export interface LinesConfig {
  startAt?: number
  stagger?: number
  duration?: number
}

export function playEnterSequence(
  headers: Element[],
  rows: Element[],
  lines?: (Element | null)[],
  linesConfig?: LinesConfig
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // 初始隐藏
  gsap.set([...headers, ...rows], { opacity: 0 })
  gsap.set(rows, { x: -400 })
  if (lines) {
    gsap.set(lines, { opacity: 0, scaleY: 0, transformOrigin: 'top center' })
  }

  // 1. 背景/标题缓慢渐显
  tl.to(headers, { opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 })

  // 2. 各行依次从左滑入
  tl.to(rows, { opacity: 1, x: 0, duration: 1.6, ease: 'power4.out', stagger: 0.3 }, '-=0.5')

  // 3. 时间轴竖线跟随卡片同步生长（提前 0.1s，和卡片入场错开一点层次）
  if (lines) {
    const cfg = { startAt: 2.5, stagger: 0.8, duration: 1.0, ...linesConfig }
    lines.forEach((line, i) => {
      if (!line) return
      const startTime = cfg.startAt + i * cfg.stagger
      tl.to(line, { opacity: 1, scaleY: 1, duration: cfg.duration, ease: 'power2.out' }, startTime)
    })
  }

  return tl
}
