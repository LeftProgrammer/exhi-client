<script setup lang="ts">
import { onMounted } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { IDLE_RESET_MS } from '@baima-yushui/data/config'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import { useControl } from '@baima-yushui/composables/useControl'

/**
 * 应用根。
 *
 * 职责：
 *  - 监听 5 分钟无交互 → 回首页（一级待机）
 *  - 接收中控指令 → cmd.home / cmd.gotoSection 强制跳转
 *  - 接收 scene:changed / scene:ended 等 bridge 事件（如有需要）
 */

const router = useRouter()
const { on } = useBridge()

// 首次用户手势后解锁音频上下文 + 注册项目音效文件
const { unlock } = useProjectSfx()
onMounted(() => unlock())

// 5 分钟无交互回首页
useIdleReset(() => {
  if (router.currentRoute.value.name !== 'home') {
    router.push({ name: 'home' })
  }
}, IDLE_RESET_MS)

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

// === UEC 中控协议处理 ===
const control = useControl()
control.setupCommands(router)

// 浏览器 dev 模式没有 exhibitBridge，直接连 UEC WS 接收中控指令
if (!window.exhibitBridge) {
  control.startFallback('yushui')
}

/**
 * 给 <transition> 算 :key——只在"页面级身份"变化时重挂载：
 *   - section 页：身份 = section + sectionId（同 section 内切 category/entry 不重挂）
 *   - 其它页：身份 = 路由 name
 */
function viewKey(route: RouteLocationNormalizedLoaded): string {
  if (route.name === 'section') {
    return `section-${route.params.sectionId}`
  }
  return String(route.name ?? route.path)
}
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <!--
      不用 mode="out-in"——它会让旧页完全离场后才挂载新页，中间一段空窗。
      用默认 mode：新旧 view 同时存在，靠 CSS 让旧 view 在过渡期 absolute 定位
      脱离文档流，新 view 正常进场，两者交叠淡出/淡入 → 视觉无缝、不黑屏。
    -->
    <!--
      :key 改用"路由名 + sectionId"。这样：
        - 一/二级页切换、不同 section 之间切换 → key 变 → 整页过渡动画
        - 同一 section 内切换 category / entryIndex → key 不变 → 不重挂载、
          不触发整页淡入/标题扫光 → 切换流畅、按钮/标题不会闪动
    -->
    <transition name="page">
      <component :is="Component" :key="viewKey(route)" />
    </transition>
  </router-view>
</template>

<style lang="scss">
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
