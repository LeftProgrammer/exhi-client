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
  /* 从左到右揭幕显示 */
  opacity: 1;
  clip-path: inset(0 100% 0 0);
  animation: sec-title-reveal 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards;
}

/* 头部标题：从左到右揭幕 */
@keyframes sec-title-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 0);
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

<!-- 离场动画：非 scoped，匹配全局 page-leave-active -->
<style lang="scss">
/* 二级标题离场：从右到左反向收起 */
.page-leave-active .sec-page__title {
  animation: sec-title-hide 0.6s cubic-bezier(0.55, 0, 1, 1) forwards;
}

@keyframes sec-title-hide {
  from {
    clip-path: inset(0 0% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 100%);
  }
}
</style>
