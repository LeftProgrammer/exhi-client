<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { onMounted, watch } from 'vue'

const router = useRouter()
const { on, info, ready } = useBridge()

on('app:home', () => router.push({ name: 'home' }))

onMounted(async () => {
  // 等 bridge ready 获取 displayId，自动路由到对应视图
  const tryRoute = () => {
    const displayId = info.value?.displayId
    if (!displayId) return
    const routeMap: Record<string, string> = {
      main: 'home',
      'top-left': 'top-left',
      'bottom-left': 'bottom-left',
      'top-right': 'top-right',
      'bottom-right': 'bottom-right'
    }
    const target = routeMap[displayId]
    if (target && router.currentRoute.value.name !== target) {
      router.push({ name: target })
    }
  }
  // bridge 已就绪直接执行，否则监听 ready 后执行
  if (ready.value) {
    tryRoute()
  } else {
    const unwatch = watch(ready, (v) => {
      if (v) {
        tryRoute()
        unwatch()
      }
    })
  }
})
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

.page-enter-active,
.page-leave-active {
  transition:
    opacity 600ms t.$ease-base,
    transform 600ms t.$ease-base;
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
