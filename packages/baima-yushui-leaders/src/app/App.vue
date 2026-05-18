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
    <!--
      不用 mode="out-in"——它会让旧页完全离场后才挂载新页，中间一段空窗。
      用默认 mode：新旧 view 同时存在，靠 CSS 让旧 view 在过渡期 absolute 定位
      脱离文档流，新 view 正常进场，两者交叠淡出/淡入 → 视觉无缝、不黑屏。
    -->
    <transition name="page">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style lang="scss">
@use '@shared/styles/tokens' as t;

/* ===== 全局页面切换 =====
 * 旧页跟新页同时存在 → 旧页用 absolute 脱离文档流（不挤压新页）→
 * 各跑各的 opacity + scale 过渡 → 视觉无缝衔接，没有"黑屏中转"。
 *
 * 时长：进场 720ms（让新页从容浮现）/ 离场 420ms（旧页早走一步避免拥堵）。
 * 缩放：进场 1.04 → 1（远到近）、离场 1 → 0.97（近到远）—— 营造空间纵深感。
 */
.page-enter-active {
  transition:
    opacity 720ms t.$ease-base,
    transform 720ms t.$ease-base;
}
.page-leave-active {
  transition:
    opacity 420ms t.$ease-base,
    transform 420ms t.$ease-base;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none; // 离场页禁交互，避免误点
}
.page-enter-from {
  opacity: 0;
  transform: scale(1.04);
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
