import { defineStore } from 'pinia'
import type { Scene } from '@shared/types'

interface SceneState {
  /** scenes.json 的全集 */
  scenes: Record<string, Scene>
  /** 当前展示的场景 ID */
  currentSceneId: string | null
  /** 上一个场景 ID（用于淡出/调试） */
  previousSceneId: string | null
  /** 切场景流水号——每次切场景递增，供 SceneStage 标记图层 key */
  switchSeq: number
}

export const useSceneStore = defineStore('scene', {
  state: (): SceneState => ({
    scenes: {},
    currentSceneId: null,
    previousSceneId: null,
    switchSeq: 0
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
      if (sceneId === this.currentSceneId) {
        // 同一场景重复触发：递增 seq 触发 reload
        this.switchSeq++
        window.exhibit.log('info', `重载场景: ${sceneId}`)
        return true
      }
      this.previousSceneId = this.currentSceneId
      this.currentSceneId = sceneId
      this.switchSeq++
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
