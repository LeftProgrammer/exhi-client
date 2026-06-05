import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 空闲超时后自动回首页（展厅触摸屏的标准行为）。
 *
 * 默认 20 秒无任何 pointer / key / wheel 事件 → 调用 onTimeout()
 *
 * 注意：
 *  - 监听 capture 阶段，业务里的 stopPropagation 不影响计时
 *  - 内含一个内部计时器，组件卸载时自动清理
 */
export function useIdleReset(onTimeout: () => void, idleMs = 20_000) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function arm() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => onTimeout(), idleMs)
  }

  function disarm() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  const handler = () => arm()

  // 只监听离散事件：pointermove / touchmove 在触摸屏上会被轻微滑动持续触发，
  // 导致空闲计时器永远被重置、永远回不到首页。故不监听这两类连续事件。
  const idleEvents: Array<keyof DocumentEventMap> = [
    'pointerdown',
    'keydown',
    'wheel',
    'touchstart'
  ]

  onMounted(() => {
    idleEvents.forEach((ev) =>
      document.addEventListener(ev, handler, { capture: true, passive: true })
    )
    arm()
  })

  onBeforeUnmount(() => {
    idleEvents.forEach((ev) =>
      document.removeEventListener(ev, handler, { capture: true } as EventListenerOptions)
    )
    disarm()
  })

  return { arm, disarm }
}
