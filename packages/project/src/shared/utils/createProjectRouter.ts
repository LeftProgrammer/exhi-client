import {
  createRouter,
  createMemoryHistory,
  createWebHashHistory,
  type RouteRecordRaw,
  type Router
} from 'vue-router'

/**
 * Create a project router with the standard history strategy:
 * - DEV mode: WebHashHistory (browser-friendly, supports multi-page via hash)
 * - Production (Electron): MemoryHistory (no URL bar, faster)
 *
 * All project packages use this identical pattern; this factory eliminates the
 * duplicated createRouter() boilerplate.
 */
export function createProjectRouter(routes: RouteRecordRaw[]): Router {
  return createRouter({
    history: import.meta.env.DEV ? createWebHashHistory() : createMemoryHistory(),
    routes
  })
}
