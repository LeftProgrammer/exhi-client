<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { Scene } from '@shared/types'
import { useSceneStore } from '../stores/scene'
import { resolveRenderer } from '../renderers/registry'

/**
 * SceneStage：双缓冲场景容器。
 *
 * 实现思路：维护"当前层"和"上一层"两个槽位。
 * 切场景时，把新场景挂到"当前层"，旧场景留在"上一层"，两层透明度做 crossfade。
 * 切换完成后销毁"上一层"。
 *
 * 这样可以避免传统 mode:out-in 的"先黑屏再淡入"问题。
 */

interface Layer {
  key: number
  scene: Scene
  sceneId: string
}

const sceneStore = useSceneStore()
const current = ref<Layer | null>(null)
const previous = ref<Layer | null>(null)

const CROSSFADE_MS = 400

watch(
  () => [sceneStore.switchSeq, sceneStore.currentSceneId] as const,
  ([seq, sceneId]) => {
    if (!sceneId) return
    const scene = sceneStore.scenes[sceneId]
    if (!scene) return

    const newLayer: Layer = { key: seq, scene, sceneId }

    if (current.value) {
      // 把当前层降为 previous，新层挂到 current
      previous.value = current.value
    }
    current.value = newLayer

    // crossfade 完成后清理 previous
    window.setTimeout(() => {
      // 仅当 previous 仍是这次切换前的层时才清理
      if (previous.value && previous.value !== current.value) {
        previous.value = null
      }
    }, CROSSFADE_MS + 50)
  },
  { immediate: true }
)

const previousRenderer = computed(() =>
  previous.value ? resolveRenderer(previous.value.scene.type) : null
)
const currentRenderer = computed(() =>
  current.value ? resolveRenderer(current.value.scene.type) : null
)
</script>

<template>
  <div class="scene-stage">
    <!-- 旧层：固定渲染但淡出 -->
    <div v-if="previous && previousRenderer" class="scene-stage__layer scene-stage__layer--leaving">
      <component :is="previousRenderer" :key="previous.key" :scene="previous.scene" />
    </div>
    <!-- 新层：淡入 -->
    <div v-if="current && currentRenderer" class="scene-stage__layer scene-stage__layer--entering">
      <component :is="currentRenderer" :key="current.key" :scene="current.scene" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@renderer/styles/tokens' as t;

.scene-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;

    &--entering {
      animation: layer-in 0.4s t.$easing-base both;
    }

    &--leaving {
      animation: layer-out 0.4s t.$easing-base both;
    }
  }
}

@keyframes layer-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes layer-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
