<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useIdleReset } from '@baima-yushui/composables/useIdleReset'

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
@use '@shared/styles/tokens' as t;

* {
  box-sizing: border-box;
}

.page-enter-active {
  transition:
    opacity 600ms t.$ease-base,
    transform 600ms t.$ease-base;
}

.page-leave-active {
  transition:
    opacity 400ms t.$ease-base,
    transform 400ms t.$ease-base;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.page-enter-from {
  opacity: 0;
  transform: scale(1.03);
}

.page-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
