import { onBeforeUnmount, type Ref } from 'vue'
import gsap from 'gsap'

/**
 * 页面内容区滚动控制。
 * wrapperRef：滚动可视窗口（overflow:hidden，有明确高度）
 * contentRef：实际内容容器（高度可能超出 wrapper）
 * holdMs：入场动效结束后，延迟多少毫秒开始自动滚动
 */
export function usePageScroll(
  wrapperRef: Ref<HTMLElement | null>,
  contentRef: Ref<HTMLElement | null>,
  holdMs = 10_000
) {
  let currentY = 0
  let scrollTween: gsap.core.Tween | null = null
  let holdTimer: ReturnType<typeof setTimeout> | null = null

  function maxScroll() {
    if (!wrapperRef.value || !contentRef.value) return 0
    return Math.max(0, contentRef.value.offsetHeight - wrapperRef.value.offsetHeight)
  }

  function canScroll() {
    return maxScroll() > 0
  }

  function clamp(y: number) {
    return Math.min(0, Math.max(-maxScroll(), y))
  }

  function applyY(y: number, smooth = false) {
    if (!contentRef.value) return
    currentY = clamp(y)
    if (smooth) {
      gsap.to(contentRef.value, {
        y: currentY,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true
      })
    } else {
      gsap.set(contentRef.value, { y: currentY })
    }
  }

  // 自动慢速滚动到底（仅内容溢出时）
  function startAutoScroll() {
    if (!canScroll() || !contentRef.value) return
    const max = maxScroll()
    // 每 100px 约 3.5s，最少 12s（整体慢速、和缓）
    const duration = Math.max(12, (max / 100) * 3.5)
    scrollTween = gsap.to(contentRef.value, {
      y: -max,
      duration,
      ease: 'none',
      onUpdate: () => {
        currentY = gsap.getProperty(contentRef.value!, 'y') as number
      }
    })
  }

  // 入场完成后调用，按需安排自动滚动
  function scheduleAutoScroll() {
    if (!canScroll()) return
    holdTimer = setTimeout(startAutoScroll, holdMs)
  }

  function reset() {
    scrollTween?.kill()
    scrollTween = null
    if (holdTimer !== null) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
    currentY = 0
    if (contentRef.value) gsap.set(contentRef.value, { y: 0 })
  }

  // ---- 鼠标滚轮 ----
  function onWheel(e: WheelEvent) {
    if (!canScroll()) return
    e.preventDefault()
    scrollTween?.pause()
    applyY(currentY - e.deltaY, true)
  }

  // ---- 触屏拖拽 ----
  let touchStartY = 0
  let touchBaseY = 0

  function onTouchStart(e: TouchEvent) {
    if (!canScroll()) return
    scrollTween?.pause()
    touchStartY = e.touches[0].clientY
    touchBaseY = currentY
  }

  function onTouchMove(e: TouchEvent) {
    if (!canScroll()) return
    applyY(touchBaseY + (e.touches[0].clientY - touchStartY))
  }

  function onTouchEnd() {
    // 松手后不恢复自动滚动（用户已介入，让 idle 回到首页后重新触发）
  }

  onBeforeUnmount(reset)

  return { scheduleAutoScroll, reset, onWheel, onTouchStart, onTouchMove, onTouchEnd }
}
