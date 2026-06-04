<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'

const router = useRouter()
const { on } = useBridge()

// 展厅 runtime 下发回首页指令
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

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  background: #020617;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 500ms t.$ease-base,
    transform 500ms t.$ease-base;
}

.page-leave-active {
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
