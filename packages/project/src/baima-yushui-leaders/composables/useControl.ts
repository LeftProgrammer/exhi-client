import type { Router } from 'vue-router'
import { useRemoteControl } from '@shared/composables/useRemoteControl'
import { useBrowserFallback } from '@shared/composables/useBrowserFallback'
import { getSection, type SectionId } from '@baima-yushui/data/sections'

/**
 * 渝水新景 + 领导关怀 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 定义本项目特定的上报格式和接收指令处理。
 */
export function useControl() {
  const rc = useRemoteControl()
  const fallback = useBrowserFallback()

  return {
    /** 上报页面导航（进入板块 / 回首页）
     *  page: 0=首页, 1=渝水新景, 2=领导关怀
     *  target: 'home' | 'yushui' | 'leaders'
     */
    reportNav(page: number, target: string) {
      rc.send({ cmd: 'nav', page, target })
    },

    /** 上报分类切换
     *  target: 'yushui' | 'leaders'
     *  id: 分类标识，如 '1' / '2'
     */
    reportCategory(target: string, id: string) {
      rc.send({ cmd: 'category', target, id })
    },

    /** 上报翻页
     *  target: 'yushui' | 'leaders'
     *  category: 当前分类 id
     *  index: 当前条目索引（从 0 开始）
     *  total: 当前分类条目总数
     *  action: 'next' | 'prev'
     */
    reportPage(target: string, category: string, index: number, total: number, action: string) {
      rc.send({ cmd: 'page', target, category, index, total, action })
    },

    /** 向指定设备发送控制消息（用于多屏互联场景）
     *  target: 接收方设备 ID，如 'screen-2'
     *  payload: 消息体，格式与中控协议一致
     */
    sendTo(target: string, payload: unknown) {
      rc.sendTo(target, payload)
    },

    /** 注册中控指令接收处理（在 App.vue 初始化时调用）
     *  router: Vue Router 实例
     */
    setupCommands(router: Router) {
      rc.onCommand('home', () => {
        router.push({ name: 'home' })
      })

      rc.onCommand('goto', (p) => {
        const target = p.target as 'yushui' | 'leaders'
        if (!target || !['yushui', 'leaders'].includes(target)) return
        const category = (p.category as string) ?? getSection(target).categories[0].id
        const index = (p.index as number) ?? 0
        router.push({
          name: 'section',
          params: { sectionId: target, categoryId: category, entryIndex: index }
        })
      })

      rc.onCommand('category', (p) => {
        const route = router.currentRoute.value
        if (route.name !== 'section') return
        const sectionId = route.params.sectionId as string
        const catId = p.id as string
        if (!catId) return
        const section = getSection(sectionId as SectionId)
        if (!section.categories.find((c) => c.id === catId)) return
        router.replace({
          name: 'section',
          params: { sectionId, categoryId: catId, entryIndex: 0 }
        })
      })

      rc.onCommand('page', (p) => {
        const route = router.currentRoute.value
        if (route.name !== 'section') return
        const sectionId = route.params.sectionId as string
        const categoryId = route.params.categoryId as string
        const entryIndex = Number(route.params.entryIndex ?? 0)
        const section = getSection(sectionId as SectionId)
        const category = section.categories.find((c) => c.id === categoryId)
        if (!category) return
        const total = category.entries.length
        const action = p.action as string
        let nextIndex = entryIndex
        if (action === 'next') nextIndex = (entryIndex + 1) % total
        else if (action === 'prev') nextIndex = (entryIndex - 1 + total) % total
        else if (typeof p.index === 'number')
          nextIndex = Math.max(0, Math.min(p.index as number, total - 1))
        if (nextIndex !== entryIndex) {
          router.replace({
            name: 'section',
            params: { sectionId, categoryId, entryIndex: nextIndex }
          })
        }
      })

      rc.onCommand('carousel', (p) => {
        // 通过 window 自定义事件同文档内派发，section.vue 监听
        const action = (p.action as string) ?? 'play'
        window.dispatchEvent(new CustomEvent('uec:carousel', { detail: { action } }))
      })
    },

    /** 浏览器 dev 模式下启动 WS 回退连接 */
    startFallback(hubId: string) {
      fallback.start({
        hubId,
        onDispatch: (cmd, payload) => rc.dispatch(cmd, payload)
      })
    }
  }
}
