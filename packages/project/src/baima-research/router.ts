import type { RouteRecordRaw } from 'vue-router'
import { createProjectRouter } from '@shared/utils/createProjectRouter'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./views/main/index.vue') },
  { path: '/top-left', name: 'top-left', component: () => import('./views/top-left/index.vue') },
  {
    path: '/bottom-left',
    name: 'bottom-left',
    component: () => import('./views/bottom-left/index.vue')
  },
  {
    path: '/top-right',
    name: 'top-right',
    component: () => import('./views/top-right/index.vue')
  },
  {
    path: '/bottom-right',
    name: 'bottom-right',
    component: () => import('./views/bottom-right/index.vue')
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createProjectRouter(routes)
