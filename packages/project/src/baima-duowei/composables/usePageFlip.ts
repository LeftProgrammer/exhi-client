import { ref } from 'vue'

/**
 * 分页翻页 composable。
 *
 * @param total 总页数
 * @returns { page, prev, next }
 */
export function usePageFlip(total: number) {
  const page = ref(0)

  function prev() {
    if (page.value > 0) page.value--
  }

  function next() {
    if (page.value < total - 1) page.value++
  }

  return { page, prev, next }
}
