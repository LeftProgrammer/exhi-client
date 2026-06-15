<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { onMounted, watch } from 'vue'
import { useControl } from './composables/useControl'
import { useProjectSfx } from '@shared/composables/useProjectSfx'

const router = useRouter()
const { on, info, ready } = useBridge()
const { unlock } = useProjectSfx()

on('app:home', () => router.push({ name: 'home' }))

onMounted(async () => {
  const control = useControl()

  // 等 bridge ready 获取 displayId，自动路由到对应视图 + 初始化中控指令
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

  const initAll = () => {
    tryRoute()
    control.setupCommands()
  }

  // 浏览器 dev 模式：没有 exhibitBridge，直接初始化中控指令
  // 注意：需等 router.isReady()，否则 hash 路由（如 #/top-left）尚未解析完成，
  // setupCommands 读到的还是初始路由，会把副屏的 hubId 误判为 research-main
  // Electron 环境：等 bridge ready 后再初始化
  if (!window.exhibitBridge) {
    await router.isReady()
    initAll()
    unlock()
    return
  }

  if (ready.value) {
    initAll()
    unlock()
  } else {
    const unwatch = watch(ready, (v) => {
      if (v) {
        initAll()
        unlock()
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
