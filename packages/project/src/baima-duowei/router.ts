import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SafetyView from './views/SafetyView.vue'
import TechView from './views/TechView.vue'
import StandardView from './views/StandardView.vue'
import PlaceholderView from './views/PlaceholderView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/safety', name: 'safety', component: SafetyView },
  { path: '/tech', name: 'tech', component: TechView },
  {
    path: '/activity',
    name: 'activity',
    component: PlaceholderView,
    props: { title: '安全活动' }
  },
  { path: '/standard', name: 'standard', component: StandardView },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
