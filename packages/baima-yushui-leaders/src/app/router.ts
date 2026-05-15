import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SectionView from './views/SectionView.vue'

/**
 * 用 createMemoryHistory：
 *  - 我们运行在 exhi-pkg:// 协议 + iframe 环境，不依赖 URL 栏
 *  - 避免和 dev 模式 vite 的 history fallback 冲突
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/section/:sectionId/:categoryId?/:entryIndex?',
    name: 'section',
    component: SectionView,
    props: (route) => ({
      sectionId: route.params.sectionId as string,
      categoryId: (route.params.categoryId as string) || undefined,
      entryIndex: route.params.entryIndex ? parseInt(route.params.entryIndex as string, 10) : 0
    })
  },
  // 兜底
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
