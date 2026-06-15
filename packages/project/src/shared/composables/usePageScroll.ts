import { onBeforeUnmount, type Ref } from 'vue'
import gsap from 'gsap'

/**
 * 页面内容区滚动控制。
 * wrapperRef：滚动可视窗口（overflow:hidden，有明确高度）
 * contentRef：实际内容容器（高度可能超出 wrapper）
 * holdMs：入场动效结束后，延迟多少毫秒开始自动滚动
 * loopBottomMs：滚动到底部后，延迟多少毫秒回到顶部重新开始
 */
export function usePageScroll(
  wrapperRef: Ref<HTMLElement | null>,
  contentRef: Ref<HTMLElement | null>,
  holdMs = 10_000,
  loopBottomMs = 20_000
) {
  let currentY = 0
  let scrollTween: gsap.core.Tween | null = null
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let loopTimer: ReturnType<typeof setTimeout> | null = null

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

  function clearAllTimers() {
    if (holdTimer !== null) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
    if (loopTimer !== null) {
      clearTimeout(loopTimer)
      loopTimer = null
    }
  }

  function killTween() {
    scrollTween?.kill()
    scrollTween = null
  }

  /** 立即开始自动滚动（从当前位置向底部） */
  function startAutoScroll() {
    if (!canScroll() || !contentRef.value) return
    clearAllTimers()
    const max = maxScroll()
    // 如果已经在底部附近，先回到顶部
    if (Math.abs(currentY) >= max - 1) {
      resetScroll()
    }
    const maxNow = maxScroll()
    // 每 100px 约 3.5s，最少 12s（整体慢速、和缓）
    const duration = Math.max(12, (maxNow / 100) * 3.5)
    scrollTween = gsap.to(contentRef.value, {
      y: -maxNow,
      duration,
      ease: 'none',
      onUpdate: () => {
        currentY = gsap.getProperty(contentRef.value!, 'y') as number
      },
      onComplete: () => {
        currentY = -maxNow
        // 到底后等待 loopBottomMs 回到顶部重新开始
        loopTimer = setTimeout(() => {
          loopTimer = null
          resetScroll()
          startAutoScroll()
        }, loopBottomMs)
      }
    })
  }

  /** 入场完成后调用，延迟 holdMs 开始自动滚动 */
  function scheduleAutoScroll() {
    if (!canScroll()) return
    clearAllTimers()
    holdTimer = setTimeout(() => {
      holdTimer = null
      startAutoScroll()
    }, holdMs)
  }

  /** 停止自动滚动（清除所有计时器和 tween） */
  function pause() {
    clearAllTimers()
    killTween()
  }

  /** 回到顶部并停止 */
  function resetScroll() {
    pause()
    currentY = 0
    if (contentRef.value) gsap.set(contentRef.value, { y: 0 })
  }

  /** 用户操作打断，不再自动恢复（需翻页或中控指令触发） */
  function userInterrupt() {
    pause()
  }

  // ---- 鼠标滚轮 ----
  function onWheel(e: WheelEvent) {
    if (!canScroll()) return
    e.preventDefault()
    userInterrupt()
    applyY(currentY - e.deltaY, true)
  }

  // ---- 触屏拖拽 ----
  let touchStartY = 0
  let touchBaseY = 0

  function onTouchStart(e: TouchEvent) {
    if (!canScroll()) return
    userInterrupt()
    touchStartY = e.touches[0].clientY
    touchBaseY = currentY
  }

  function onTouchMove(e: TouchEvent) {
    if (!canScroll()) return
    applyY(touchBaseY + (e.touches[0].clientY - touchStartY))
  }

  function onTouchEnd() {
    // 触摸结束后不再自动恢复（已去掉 resumeTimer）
  }

  // ---- 点击打断 ----
  function onClick() {
    userInterrupt()
  }

  onBeforeUnmount(resetScroll)

  return {
    scheduleAutoScroll,
    startAutoScroll,
    pause,
    reset: resetScroll,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onClick
  }
}
