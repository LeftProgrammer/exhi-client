<script setup lang="ts">
import { computed } from 'vue'
import type { WebScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'

const props = defineProps<{ scene: WebScene }>()

const src = computed(() => resolvePkgUrl(props.scene.src))
const allowInteraction = computed(() => props.scene.allowInteraction ?? true)
</script>

<template>
  <iframe
    class="scene-layer"
    :src="src"
    :style="{
      pointerEvents: allowInteraction ? 'auto' : 'none',
      background: scene.transparent ? 'transparent' : '#000'
    }"
    frameborder="0"
    allow="autoplay; fullscreen"
  />
</template>

<style scoped>
iframe.scene-layer {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
