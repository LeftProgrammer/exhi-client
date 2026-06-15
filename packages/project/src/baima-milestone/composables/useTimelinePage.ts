import { ref, type Ref } from 'vue'
import gsap from 'gsap'
import { playEnterSequence } from '@baima-milestone/effects/gsapPresets'
import { SCROLL_ARM_AT } from '@baima-milestone/data/config'
import type PageLayout from '@baima-milestone/components/PageLayout.vue'

export interface TimelinePageOptions {
  /** 是否包含 decoEl 在 headers 中 */
  deco?: boolean
  /** 是否从 wrapper 中 query .breath-dot 和 .breath-line */
  timeline?: boolean
  /** 自定义自动滚动触发时刻（秒），默认 SCROLL_ARM_AT */
  scrollAt?: number
}

/**
 * 封装 timeline 页面通用的 play / reset 逻辑。
 *
 * @param layoutRef   PageLayout 实例 ref
 * @param topBarRef   顶部 bar 图片 ref
 * @param titleRef    标题图片 ref
 * @param rowsRef     行/卡片元素数组（wrapperRefs 或 itemRefs）
 * @param options     可选配置
 */
export function useTimelinePage(
  layoutRef: Ref<InstanceType<typeof PageLayout> | null>,
  topBarRef: Ref<Element | null>,
  titleRef: Ref<Element | null>,
  rowsRef: Element[],
  options: TimelinePageOptions = {}
) {
  const { deco = false, timeline = false, scrollAt = SCROLL_ARM_AT } = options

  let tl: gsap.core.Timeline | null = null

  function buildHeaders(): Element[] {
    const list = [layoutRef.value?.bgEl, topBarRef.value, titleRef.value]
    if (deco) list.push(layoutRef.value?.decoEl)
    return list.filter(Boolean) as Element[]
  }

  function play() {
    tl?.kill()
    layoutRef.value?.resetScroll()

    const headers = buildHeaders()
    const rows = rowsRef.filter(Boolean) as Element[]

    if (timeline) {
      const wrappers = rowsRef as HTMLElement[]
      const dots = wrappers.map((w) => w.querySelector('.breath-dot')).filter(Boolean)
      const lines = wrappers.map((w) => w.querySelector('.breath-line')).filter(Boolean)
      gsap.set(dots, { opacity: 1, scale: 1 })
      tl = playEnterSequence(headers, rows, lines)
    } else {
      tl = playEnterSequence(headers, rows)
    }

    if (!tl) return
    tl.call(() => layoutRef.value?.scheduleAutoScroll(), undefined, scrollAt)
  }

  function pause() {
    layoutRef.value?.pause()
  }

  function resume() {
    layoutRef.value?.startAutoScroll()
  }

  function reset() {
    tl?.kill()
    tl = null
    layoutRef.value?.resetScroll()

    const headers = buildHeaders()
    gsap.set(headers, { opacity: 0 })
    gsap.set(rowsRef.filter(Boolean), { opacity: 0, x: 0 })

    if (timeline) {
      const wrappers = rowsRef as HTMLElement[]
      const dots = wrappers.map((w) => w.querySelector('.breath-dot')).filter(Boolean)
      const lines = wrappers.map((w) => w.querySelector('.breath-line')).filter(Boolean)
      gsap.set(dots, { opacity: 1, scale: 1 })
      gsap.set(lines, { opacity: 0, scaleY: 0, transformOrigin: 'top center' })
    }
  }

  return { play, pause, resume, reset }
}
