<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ImageScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'

const props = defineProps<{ scene: ImageScene }>()
const emit = defineEmits<{ (e: 'ready'): void }>()

const src = computed(() => resolvePkgUrl(props.scene.src))
const fit = computed(() => props.scene.fit ?? 'cover')

onMounted(() => {
  // 预解码图片：用 Image() 单独加载，加载完成后再通知 SceneStage 淡入
  // 用 background-image 没法监听 load 事件，所以用一个隐藏的 Image 对象
  const img = new Image()
  img.onload = () => emit('ready')
  img.onerror = () => emit('ready') // 加载失败也得淡入，否则会卡死
  img.src = src.value
  // 极小图可能同步命中缓存
  if (img.complete) emit('ready')
})
</script>

<template>
  <div class="scene-layer" :style="{ backgroundImage: `url('${src}')`, backgroundSize: fit }" />
</template>

<style scoped>
.scene-layer {
  background-position: center;
  background-repeat: no-repeat;
  background-color: #000;
  width: 100%;
  height: 100%;
}
</style>
