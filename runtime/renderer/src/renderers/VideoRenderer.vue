<script setup lang="ts">
import { computed } from 'vue'
import type { VideoScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'

const props = defineProps<{ scene: VideoScene }>()

const src = computed(() => resolvePkgUrl(props.scene.src))
const fit = computed(() => props.scene.fit ?? 'contain')
</script>

<template>
  <video
    class="scene-layer"
    :src="src"
    :loop="scene.loop ?? true"
    :muted="scene.muted ?? false"
    :autoplay="scene.autoplay ?? true"
    playsinline
    :style="{ objectFit: fit }"
  />
</template>

<style scoped>
video.scene-layer {
  width: 100%;
  height: 100%;
  background: #000;
}
</style>
