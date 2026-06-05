import { onBeforeUnmount, onMounted, watch } from 'vue'

/**
 * 自动轮播 composable。
 * 在指定间隔后调用 step，并在依赖变化时自动重置计时器。
 *
 * @param deps  依赖数组（路由参数等），变化时重置计时器
 * @param step  每次轮播要执行的回调
 * @param ms    轮播间隔毫秒数（默认 6000）
 */
export function useAutoplay(deps: () => readonly unknown[], step: () => void, ms = 6000) {
  let timer: number | null = null

  function start() {
    stop()
    timer = window.setInterval(step, ms)
  }

  function stop() {
    if (timer != null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  watch(deps, () => start(), { immediate: true })
  onMounted(() => start())
  onBeforeUnmount(() => stop())
}
