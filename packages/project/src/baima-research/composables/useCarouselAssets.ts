import { computed, type Ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { getPoint } from '../data/points'

/**
 * 文件轮播素材解析组合式函数。
 *
 * 根据当前选中的点位和屏幕名称，自动解析 `points.ts` 中的轮播数据为已解析 URL。
 *
 * @example
 * const { blockGroups } = useCarouselAssets(activeId, 'bottom-left')
 * const groups1 = computed(() => blockGroups(0)) // 第 0 个展示位
 * const groups2 = computed(() => blockGroups(1)) // 第 1 个展示位
 */
export function useCarouselAssets(activeId: Ref<string | null>, screen: string) {
  const point = computed(() => getPoint(activeId.value))

  /** 当前点位的轮播原始数据 */
  const imageList = computed(() => point.value?.images?.[screen] ?? [])

  /** 解析单条素材路径为完整 URL */
  function asset(name: string) {
    return resolvePkgUrl(`points/${activeId.value}/${screen}/${name}`)
  }

  /**
   * 获取第 idx 个展示位的解析后组数据（可直接传给 FileCarousel 的 groups）。
   */
  function blockGroups(idx: number) {
    return (imageList.value[idx] ?? []).map((g) => ({
      files: (g.files ?? []).map((f) => asset(f)),
      text: g.text ? asset(g.text) : undefined
    }))
  }

  return { blockGroups, point }
}
