<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useIdleReset } from '@shared/composables/useIdleReset'

const router = useRouter()
const { on } = useBridge()

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
    <transition name="page">
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
  transition: opacity 800ms t.$ease-base;
}

.page-leave-active {
  transition: opacity 800ms t.$ease-base;
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
