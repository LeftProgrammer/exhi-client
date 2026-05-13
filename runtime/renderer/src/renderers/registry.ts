import type { Component } from 'vue'
import type { SceneType } from '@shared/types'
import VideoRenderer from './VideoRenderer.vue'
import ImageRenderer from './ImageRenderer.vue'
import WebRenderer from './WebRenderer.vue'

/**
 * ContentRenderer 注册表。
 * 新增类型 → 在这里加一项；不动 SceneOrchestrator。
 */
const registry: Partial<Record<SceneType, Component>> = {
  video: VideoRenderer,
  image: ImageRenderer,
  web: WebRenderer
  // composite: M3 后续补
}

export function resolveRenderer(type: SceneType): Component | null {
  return registry[type] ?? null
}
