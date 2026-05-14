<script setup lang="ts">
import { computed } from 'vue'
import { useDeviceStore } from '../stores/device'

/**
 * 自适应舞台（M9 重构版）。
 *
 * 重要变更：**不再做 CSS transform: scale 缩放**。
 *
 * 历史背景：早期版本沿用了"大屏可视化"流派的做法——按 designBase 设计稿铺
 * 一个固定像素的 inner，再 transform: scale 到屏幕。这套方法有两个固有问题：
 *  1. 非整数 scale（如 0.903 / 1.333）触发亚像素采样，所有内容（含 video / iframe / 文本）发糊
 *  2. video 上层一旦有 transform，Chromium 的 video overlay GPU 优化路径失效，
 *     视频帧改走 CPU 软合成 → 同样视频比直接播放糊一档
 *
 * 展厅场景特点："专设备 + 固定物理屏"，与浏览器里访问的可视化大屏完全不同。
 *
 * 正确做法：让 designBase = 屏幕物理分辨率，内容按此制作，Runtime 不做缩放。
 *   - 视频靠 object-fit
 *   - HTML 内容用 100vw/100vh + vw/vh/em 单位写响应式
 *   - 整体 100vw × 100vh 撑满
 *
 * 本组件现在的职责变得很轻：仅作为"舞台容器"语义化标记，并把 designBase 信息透传
 * 给内容侧（通过 CSS 变量 + data 属性，方便内容内 CSS 引用）。
 */
const device = useDeviceStore()

const designBase = computed(() => device.designBase)
const cssVars = computed(() => ({
  '--exhi-design-w': designBase.value.width + 'px',
  '--exhi-design-h': designBase.value.height + 'px'
}))
</script>

<template>
  <div
    class="adaptive-stage"
    :style="cssVars"
    :data-design-w="designBase.width"
    :data-design-h="designBase.height"
  >
    <slot />
  </div>
</template>

<style scoped>
.adaptive-stage {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 关键：不做 transform，让所有子元素物理像素 1:1 */
}
</style>
