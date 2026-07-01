import { createApp, type Component } from 'vue'
import type { Router } from 'vue-router'
import { initDesignBase } from './initDesignBase'

export interface ProjectAppOptions {
  /** Design base width (px). */
  designWidth: number
  /** Design base height (px). */
  designHeight: number
  /** Root Vue component. */
  rootComponent: Component
  /** Vue Router instance (optional — milestone has no router). */
  router?: Router
}

/**
 * Standard project app bootstrap.
 *
 * All project packages follow the same initialization sequence:
 *   1. initDesignBase(w, h)
 *   2. import reset styles
 *   3. createApp(Root).use(router?).mount('#app')
 *
 * This factory encapsulates that pattern. The reset styles import is handled
 * by the caller's main.ts (must remain a static import for Vite).
 */
export function createProjectApp(options: ProjectAppOptions): void {
  initDesignBase(options.designWidth, options.designHeight)
  const app = createApp(options.rootComponent)
  if (options.router) {
    app.use(options.router)
  }
  app.mount('#app')
}
