<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import type { Scene } from '@shared/types'
import { useSceneStore } from '../stores/scene'
import { resolveRenderer } from '../renderers/registry'

/**
 * SceneStage：双缓冲场景容器（M8 升级版）。
 *
 * 实现思路：
 * - 维护"当前层" + "上一层"两个槽位
 * - 切场景时，新场景挂到"当前层"，旧场景留在"上一层"
 * - 等新场景的 video / image 实际 ready 再淡入（避免上层已淡出但新内容黑帧）
 * - 普通 web/composite 场景则等一帧即可
 *
 * 通过 `data-ready` 属性 + opacity 控制：新层默认不可见，<ready> 事件后才淡入。
 */

interface Layer {
  key: number
  scene: Scene
  sceneId: string
  ready: boolean
}

const sceneStore = useSceneStore()
const current = ref<Layer | null>(null)
const previous = ref<Layer | null>(null)

const CROSSFADE_MS = 400
/** 等 ready 的最长时间，超过就强制淡入（哪怕没解码完）。避免坏视频卡死整套切换 */
const READY_TIMEOUT_MS = 3_000

watch(
  () => [sceneStore.switchSeq, sceneStore.currentSceneId] as const,
  ([seq, sceneId]) => {
    if (!sceneId) return
    const scene = sceneStore.scenes[sceneId]
    if (!scene) return

    const newLayer: Layer = { key: seq, scene, sceneId, ready: false }

    if (current.value) previous.value = current.value
    current.value = newLayer

    // 给新层一个 ready 兜底：3 秒后强制 ready（防止坏视频卡死）
    const myKey = seq
    setTimeout(() => {
      if (current.value && current.value.key === myKey && !current.value.ready) {
        current.value.ready = true
      }
    }, READY_TIMEOUT_MS)

    // 非 video/image 场景：等一帧就 ready（web/composite 自己内部异步）
    if (scene.type !== 'video' && scene.type !== 'image') {
      nextTick(() => {
        if (current.value && current.value.key === myKey) current.value.ready = true
      })
    }

    // crossfade 完成后清理 previous（从 ready 算起，不是从切换瞬间）
  },
  { immediate: true }
)

// previous 清理：监听 current.ready 变 true 后等 crossfade 时长再清
watch(
  () => current.value?.ready,
  (ready) => {
    if (!ready) return
    const oldPrev = previous.value
    setTimeout(() => {
      if (previous.value === oldPrev) previous.value = null
    }, CROSSFADE_MS + 50)
  }
)

const previousRenderer = computed(() =>
  previous.value ? resolveRenderer(previous.value.scene.type) : null
)
const currentRenderer = computed(() =>
  current.value ? resolveRenderer(current.value.scene.type) : null
)

/** 当 video/image renderer 通知 ready，标记当前层可淡入 */
function onLayerReady(key: number) {
  if (current.value && current.value.key === key) {
    current.value.ready = true
  }
}
</script>

<template>
  <div class="scene-stage">
    <!-- 旧层：保持显示，靠 z-index 在下方；通过 entering 动画的 opacity 反向"淡出"旧 -->
    <div
      v-if="previous && previousRenderer"
      class="scene-stage__layer scene-stage__layer--previous"
    >
      <component :is="previousRenderer" :key="previous.key" :scene="previous.scene" />
    </div>
    <!-- 新层：ready 才显示，避免黑帧 -->
    <div
      v-if="current && currentRenderer"
      class="scene-stage__layer scene-stage__layer--current"
      :data-ready="current.ready ? 'true' : 'false'"
    >
      <component
        :is="currentRenderer"
        :key="current.key"
        :scene="current.scene"
        @ready="onLayerReady(current.key)"
      />
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

    &--previous {
      // 旧层始终可见但被新层 ready 后覆盖；自身做一次淡出
      opacity: 1;
      transition: opacity 0.4s t.$easing-base;
    }

    &--current {
      opacity: 0;
      transition: opacity 0.4s t.$easing-base;
      &[data-ready='true'] {
        opacity: 1;
      }
    }
  }
}
</style>
