<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'

defineProps<{ titleSrc: string; titleAlt?: string }>()

const headerBg = resolvePkgUrl('home/header-bg.png')
</script>

<template>
  <header class="page-header">
    <!-- 背景图铺满全宽，高度由图片比例决定，容器跟随撑高 -->
    <img class="page-header__bg" :src="headerBg" alt="" aria-hidden="true" />
    <!-- 标题图绝对居中叠在背景上 -->
    <img class="page-header__title" :src="titleSrc" :alt="titleAlt ?? ''" />
    <!-- 扫光限定在 header 范围内 -->
    <div class="page-header__shine" aria-hidden="true" />
  </header>
</template>

<style scoped lang="scss">
@use '@shared/styles/transitions' as fx;

.page-header {
  position: relative;
  flex-shrink: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 背景图：全宽铺满，撑起容器高度 */
.page-header__bg {
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

/* 标题：绝对居中叠在背景上，宽度不超过背景宽度的 50% */
.page-header__title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 50%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.35s);
}

/*
 * 扫光层：必须限定在 header 范围内。
 * auto-shine-from-center 的伪元素用 vw 做偏移，会超出容器。
 * 改用手写 keyframes，让扫光从左到右只在 header 内移动。
 */
.page-header__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -20%;
    width: 20%;
    height: 140%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(100, 220, 255, 0.25) 40%,
      rgba(200, 248, 255, 0.55) 50%,
      rgba(100, 220, 255, 0.25) 60%,
      transparent 100%
    );
    animation: header-shine 6s ease-in-out infinite;
  }

  &::before {
    animation-delay: 0s;
    left: -25%;
  }

  &::after {
    animation-delay: 0.4s;
    left: -25%;
  }
}

@keyframes header-shine {
  0% {
    transform: translateX(0);
    opacity: 0;
  }

  5% {
    opacity: 1;
  }

  38% {
    transform: translateX(600%);
    opacity: 1;
  }

  39% {
    opacity: 0;
  }

  100% {
    transform: translateX(600%);
    opacity: 0;
  }
}
</style>
