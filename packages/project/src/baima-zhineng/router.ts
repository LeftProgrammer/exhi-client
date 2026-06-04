import {
  createRouter,
  createMemoryHistory,
  createWebHashHistory,
  type RouteRecordRaw
} from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./views/home/index.vue') },
  { path: '/zhidu', name: 'zhidu', component: () => import('./views/zhidu/index.vue') },
  { path: '/guihua', name: 'guihua', component: () => import('./views/guihua/index.vue') },
  { path: '/xingdong', name: 'xingdong', component: () => import('./views/xingdong/index.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: import.meta.env.DEV ? createWebHashHistory() : createMemoryHistory(),
  routes
})
