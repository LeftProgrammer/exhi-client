<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'

/**
 * 二级页面通用容器。
 * - bgVideo:        背景视频路径（默认 shared/line-flow.mp4）
 * - bgVideoPoster:  视频封面图（可选）
 * - bgOverlay:      全屏装饰图路径（默认 safety/header-bg.png，各页面替换）
 * - titleSrc:       顶部标题图片路径
 * - titleAlt:       标题 alt 文字
 */
const props = withDefaults(
  defineProps<{
    bgVideo?: string
    bgVideoPoster?: string
    bgOverlay?: string
    titleSrc?: string
    titleAlt?: string
  }>(),
  {
    bgVideo: () => resolvePkgUrl('shared/line-flow.mp4'),
    bgVideoPoster: undefined,
    bgOverlay: undefined,
    titleSrc: undefined
  }
)
</script>

<template>
  <main class="sec-page">
    <!-- 背景视频 -->
    <video
      class="sec-page__video"
      :src="props.bgVideo"
      :poster="props.bgVideoPoster"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />

    <!-- 暗化遮罩 -->
    <div class="sec-page__veil" />

    <!-- 全屏装饰图（可选） -->
    <img v-if="props.bgOverlay" class="sec-page__overlay" :src="props.bgOverlay" alt="" />

    <!-- 顶部标题：有 titleSrc 则显示图片，否则渲染 #header slot -->
    <header class="sec-page__header">
      <img
        v-if="props.titleSrc"
        class="sec-page__title"
        :src="props.titleSrc"
        :alt="props.titleAlt ?? ''"
      />
      <slot v-else name="header" />
    </header>

    <!-- 页面内容区 -->
    <div class="sec-page__body">
      <slot />
    </div>
  </main>
</template>

<style scoped lang="scss">
// @use '@shared/styles/transitions' as fx;

.sec-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #050b1a;
  display: flex;
  flex-direction: column;
}

/* 背景视频 */
.sec-page__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
}

/* 暗化遮罩 */
.sec-page__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: rgba(5, 11, 26, 0.45);
}

/* 全屏装饰图 */
.sec-page__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 2;
  pointer-events: none;
  animation: sec-overlay-in 0.5s ease both;
}

@keyframes sec-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 顶部标题区 */
.sec-page__header {
  position: relative;
  flex-shrink: 0;
  z-index: 3;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  overflow: hidden;
}

.sec-page__title {
  display: block;
  width: d.w(889);
  height: d.h(230);
  animation: sec-title-in 0.9s 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* 头部标题：从右侧滑入 + 淡入 */
@keyframes sec-title-in {
  from {
    opacity: 0;
    transform: translateX(10vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 内容区：剩余高度 */
.sec-page__body {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  overflow: hidden;
}
</style>
