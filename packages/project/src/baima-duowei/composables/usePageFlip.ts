import { ref, computed } from 'vue'

/**
 * 分页翻页 composable。
 *
 * @param total 总页数
 * @returns { page, prev, next, isFirst, isLast, total }
 */
export function usePageFlip(total: number) {
  const page = ref(0)

  /** 是否在第一页（不能再上一页） */
  const isFirst = computed(() => page.value <= 0)
  /** 是否在最后一页（不能再下一页） */
  const isLast = computed(() => page.value >= total - 1)

  /** 上一页；成功翻页返回 true，已在首页返回 false */
  function prev() {
    if (page.value > 0) {
      page.value--
      return true
    }
    return false
  }

  /** 下一页；成功翻页返回 true，已在末页返回 false */
  function next() {
    if (page.value < total - 1) {
      page.value++
      return true
    }
    return false
  }

  return { page, prev, next, isFirst, isLast, total }
}
