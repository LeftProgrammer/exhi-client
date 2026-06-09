<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
// import { useIdleReset } from '@shared/composables/useIdleReset'

const router = useRouter()
const { on } = useBridge()

// 注册并预加载项目音效；首次用户手势时解锁 AudioContext（自动播放策略要求）
const { unlock } = useProjectSfx()

function unlockAudio() {
  unlock()
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('touchstart', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
}

onMounted(() => {
  window.addEventListener('pointerdown', unlockAudio, { once: false })
  window.addEventListener('touchstart', unlockAudio, { once: false })
  window.addEventListener('keydown', unlockAudio, { once: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('touchstart', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
})

// TODO
// useIdleReset(() => {
//   if (router.currentRoute.value.name !== 'home') {
//     router.push({ name: 'home' })
//   }
// }, 20_000)

on('app:home', () => router.push({ name: 'home' }))
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.name" />
    </transition>
  </router-view>
</template>

<style lang="scss">
* {
  box-sizing: border-box;
}

/* 全局页面过渡只做 opacity 淡入淡出，不施加 transform，
   由各页面内部元素自行控制方向性动画 */
.page-enter-active {
  transition: opacity 900ms t.$ease-base;
}

.page-leave-active {
  transition: opacity 600ms ease-out 500ms;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
