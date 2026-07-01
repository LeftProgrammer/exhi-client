import type { Router } from 'vue-router'
import { useControlBase } from '@shared/composables/useControlBase'
import { getSection, type SectionId } from '@baima-yushui/data/sections'

/**
 * 渝水新景 + 领导关怀 中控通信封装。
 *
 * 基于 useControlBase（shared 通用指令注册器 + sendTo/startFallback），
 * 定义本项目特定的上报格式和接收指令处理。
 */
export function useControl() {
  const { rc, sfx, sendTo, startFallback } = useControlBase()

  return {
    /** 上报页面导航 */
    reportNav(page: number, target: string) {
      rc.send({ cmd: 'nav', page, target })
    },

    /** 上报分类切换 */
    reportCategory(target: string, id: string) {
      rc.send({ cmd: 'category', target, id })
    },

    /** 上报翻页 */
    reportPage(target: string, category: string, index: number, total: number, action: string) {
      rc.send({ cmd: 'page', target, category, index, total, action })
    },

    sendTo,
    startFallback,

    /** 注册中控指令接收处理（在 App.vue 初始化时调用） */
    setupCommands(router: Router) {
      rc.onCommand('home', () => {
        try {
          sfx.play('back')
        } catch {
          /* 静默忽略 */
        }
        router.push({ name: 'home' })
      })

      rc.onCommand('goto', (p) => {
        const target = p.target as 'yushui' | 'leaders'
        if (!target || !['yushui', 'leaders'].includes(target)) return
        try {
          sfx.play('nav')
        } catch {
          /* 静默忽略 */
        }
        const category = (p.category as string) ?? getSection(target).categories[0].id
        const index = (p.index as number) ?? 0
        router.push({
          name: 'section',
          params: { sectionId: target, categoryId: category, entryIndex: index }
        })
      })

      rc.onCommand('category', (p) => {
        const route = router.currentRoute.value
        const catId = p.id as string
        if (!catId) return

        const allSections: SectionId[] = ['yushui', 'leaders']

        // 当前在 section 页面：先查当前 section，没有再跨 section
        if (route.name === 'section') {
          const currentSectionId = route.params.sectionId as string
          const currentSection = getSection(currentSectionId as SectionId)
          if (currentSection.categories.find((c) => c.id === catId)) {
            try {
              sfx.play('tap')
            } catch {
              /* 静默忽略 */
            }
            router.replace({
              name: 'section',
              params: { sectionId: currentSectionId, categoryId: catId, entryIndex: 0 }
            })
            return
          }
          for (const sid of allSections) {
            if (sid === currentSectionId) continue
            const section = getSection(sid)
            if (section.categories.find((c) => c.id === catId)) {
              try {
                sfx.play('tap')
              } catch {
                /* 静默忽略 */
              }
              router.replace({
                name: 'section',
                params: { sectionId: sid, categoryId: catId, entryIndex: 0 }
              })
              return
            }
          }
          return
        }

        // 当前不在 section 页面（如首页）：跨 section 查找并直接跳转
        for (const sid of allSections) {
          const section = getSection(sid)
          if (section.categories.find((c) => c.id === catId)) {
            try {
              sfx.play('tap')
            } catch {
              /* 静默忽略 */
            }
            router.push({
              name: 'section',
              params: { sectionId: sid, categoryId: catId, entryIndex: 0 }
            })
            return
          }
        }
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
          window.dispatchEvent(
            new CustomEvent('uec:page', {
              detail: { action, sectionId, categoryId, entryIndex: nextIndex }
            })
          )
          router.replace({
            name: 'section',
            params: { sectionId, categoryId, entryIndex: nextIndex }
          })
        }
      })

      rc.onCommand('carousel', (p) => {
        const action = (p.action as string) ?? 'play'
        window.dispatchEvent(new CustomEvent('uec:carousel', { detail: { action } }))
      })
    }
  }
}
