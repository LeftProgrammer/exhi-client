import { defineStore } from 'pinia'
import type { Scene } from '@shared/types'

interface SceneState {
  /** scenes.json 的全集（由 SceneOrchestrator 在 boot 时灌入） */
  scenes: Record<string, Scene>
  /** 当前展示的场景 ID */
  currentSceneId: string | null
  /** 上一个场景 ID（用于淡出） */
  previousSceneId: string | null
}

export const useSceneStore = defineStore('scene', {
  state: (): SceneState => ({
    scenes: {},
    currentSceneId: null,
    previousSceneId: null
  }),
  actions: {
    setScenes(scenes: Record<string, Scene>) {
      this.scenes = scenes
    },
    switchTo(sceneId: string) {
      if (!this.scenes[sceneId]) {
        window.exhibit.log('warn', `场景不存在: ${sceneId}`)
        return false
      }
      this.previousSceneId = this.currentSceneId
      this.currentSceneId = sceneId
      window.exhibit.log('info', `切换场景: ${sceneId}`)
      return true
    }
  },
  getters: {
    current(state): Scene | null {
      return state.currentSceneId ? state.scenes[state.currentSceneId] ?? null : null
    }
  }
})
