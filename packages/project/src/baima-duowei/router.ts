import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SafetyView from './views/SafetyView.vue'
import PlaceholderView from './views/PlaceholderView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/safety', name: 'safety', component: SafetyView },
  { path: '/tech', name: 'tech', component: PlaceholderView, props: { title: '智慧技术' } },
  {
    path: '/activity',
    name: 'activity',
    component: PlaceholderView,
    props: { title: '安全活动' }
  },
  {
    path: '/standard',
    name: 'standard',
    component: PlaceholderView,
    props: { title: '标准化建设' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
