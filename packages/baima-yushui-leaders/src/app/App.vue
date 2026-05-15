<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useIdleReset } from '@shared/composables/useIdleReset'

/**
 * 应用根。
 *
 * 职责：
 *  - 监听 20 秒无交互 → 回首页（一级待机）
 *  - 接收中控指令 → cmd.home / cmd.gotoSection 强制跳转
 *  - 接收 scene:changed / scene:ended 等 bridge 事件（如有需要）
 */

const router = useRouter()
const { on } = useBridge()

// 20 秒无交互回首页
useIdleReset(() => {
  if (router.currentRoute.value.name !== 'home') {
    router.push({ name: 'home' })
  }
}, 20_000)

// 监听中控自定义事件（exhibitBridge.emit 由 main 进程或其他屏触发）
on('app:home', () => router.push({ name: 'home' }))
on('app:goto', (payload) => {
  const p = payload as { sectionId?: string; categoryId?: string; entryIndex?: number }
  if (!p?.sectionId) return
  router.push({
    name: 'section',
    params: {
      sectionId: p.sectionId,
      categoryId: p.categoryId,
      entryIndex: p.entryIndex ?? 0
    }
  })
})
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style lang="scss">
@use '@shared/styles/tokens' as t;

/* 全局页面切换动画：放在非 scoped 块里 */
.page-enter-active,
.page-leave-active {
  transition:
    opacity t.$dur-page t.$ease-base,
    transform t.$dur-page t.$ease-base;
}
.page-enter-from {
  opacity: 0;
  transform: scale(1.02);
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
