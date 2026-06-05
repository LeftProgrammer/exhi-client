import {
  createRouter,
  createMemoryHistory,
  createWebHashHistory,
  type RouteRecordRaw
} from 'vue-router'
import HomeView from './views/HomeView.vue'
import SectionView from './views/SectionView.vue'

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
  history: import.meta.env.DEV ? createWebHashHistory() : createMemoryHistory(),
  routes
})
