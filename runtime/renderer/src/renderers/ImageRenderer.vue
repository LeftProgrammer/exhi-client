<script setup lang="ts">
import { computed } from 'vue'
import type { ImageScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'

const props = defineProps<{ scene: ImageScene }>()

const src = computed(() => resolvePkgUrl(props.scene.src))
const fit = computed(() => props.scene.fit ?? 'cover')
</script>

<template>
  <div class="scene-layer" :style="{ backgroundImage: `url('${src}')`, backgroundSize: fit }" />
</template>

<style scoped>
.scene-layer {
  background-position: center;
  background-repeat: no-repeat;
  background-color: #000;
}
</style>
