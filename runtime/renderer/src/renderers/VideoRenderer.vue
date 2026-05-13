<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { VideoScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'
import { useDeviceStore } from '../stores/device'
import { useSceneStore } from '../stores/scene'

const props = defineProps<{ scene: VideoScene }>()
const device = useDeviceStore()
const sceneStore = useSceneStore()

const src = computed(() => resolvePkgUrl(props.scene.src))
const fit = computed(() => props.scene.fit ?? 'contain')
const videoRef = ref<HTMLVideoElement | null>(null)

let lastReportAt = 0

function reportPlayState(playState: 'playing' | 'paused' | 'stopped') {
  const v = videoRef.value
  if (!device.boot) return
  window.exhibit.reportStatus({
    displayId: device.boot.displayId,
    displays: [
      {
        id: device.boot.displayId,
        sceneId: sceneStore.currentSceneId,
        playState,
        position: v?.currentTime ?? 0,
        duration: v?.duration ?? 0
      }
    ]
  })
}

function onTimeUpdate() {
  const now = Date.now()
  if (now - lastReportAt < 1000) return
  lastReportAt = now
  reportPlayState('playing')
}

function onEnded() {
  reportPlayState('stopped')
}

function onError() {
  const err = videoRef.value?.error
  window.exhibit.log('error', `视频加载/解码失败 ${props.scene.src}`, {
    code: err?.code,
    message: err?.message
  })
}

onMounted(() => {
  const v = videoRef.value
  if (!v) return
  v.addEventListener('timeupdate', onTimeUpdate)
  v.addEventListener('ended', onEnded)
  v.addEventListener('error', onError)
  if (typeof props.scene.startAt === 'number') v.currentTime = props.scene.startAt
  if (typeof props.scene.playbackRate === 'number') v.playbackRate = props.scene.playbackRate
})

onBeforeUnmount(() => {
  const v = videoRef.value
  if (!v) return
  v.removeEventListener('timeupdate', onTimeUpdate)
  v.removeEventListener('ended', onEnded)
  v.removeEventListener('error', onError)
})
</script>

<template>
  <video
    ref="videoRef"
    class="scene-layer"
    :src="src"
    :loop="scene.loop ?? true"
    :muted="scene.muted ?? false"
    :autoplay="scene.autoplay ?? true"
    playsinline
    :style="{ objectFit: fit }"
  />
</template>

<style scoped lang="scss">
video.scene-layer {
  width: 100%;
  height: 100%;
  background: #000;
}
</style>
