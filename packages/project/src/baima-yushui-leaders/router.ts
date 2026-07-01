import type { RouteRecordRaw } from 'vue-router'
import { createProjectRouter } from '@shared/utils/createProjectRouter'
import home from './views/home.vue'
import section from './views/section.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: home
  },
  {
    path: '/section/:sectionId/:categoryId?/:entryIndex?',
    name: 'section',
    component: section,
    props: (route) => ({
      sectionId: route.params.sectionId as string,
      categoryId: (route.params.categoryId as string) || undefined,
      entryIndex: route.params.entryIndex ? parseInt(route.params.entryIndex as string, 10) : 0
    })
  },
  // 兜底
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createProjectRouter(routes)
