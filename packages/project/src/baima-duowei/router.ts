import type { RouteRecordRaw } from 'vue-router'
import { createProjectRouter } from '@shared/utils/createProjectRouter'
import home from './views/home.vue'
import safety from './views/safety.vue'
import tech from './views/tech.vue'
import standard from './views/standard.vue'
import activity from './views/activity.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: home },
  { path: '/safety', name: 'safety', component: safety },
  { path: '/tech', name: 'tech', component: tech },
  { path: '/activity', name: 'activity', component: activity },
  { path: '/standard', name: 'standard', component: standard },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createProjectRouter(routes)
