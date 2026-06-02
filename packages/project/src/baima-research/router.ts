import {
  createRouter,
  createMemoryHistory,
  createWebHashHistory,
  type RouteRecordRaw
} from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./views/main/index.vue') },
  { path: '/detail/:id', name: 'detail', component: () => import('./views/main/DetailView.vue') },
  { path: '/standby', name: 'standby', component: () => import('./views/main/StandbyView.vue') },
  { path: '/top-left', name: 'top-left', component: () => import('./views/top-left/index.vue') },
  {
    path: '/bottom-left',
    name: 'bottom-left',
    component: () => import('./views/bottom-left/index.vue')
  },
  { path: '/top-right', name: 'top-right', component: () => import('./views/top-right/index.vue') },
  {
    path: '/bottom-right',
    name: 'bottom-right',
    component: () => import('./views/bottom-right/index.vue')
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: import.meta.env.DEV ? createWebHashHistory() : createMemoryHistory(),
  routes
})
