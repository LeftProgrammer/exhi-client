<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'

defineProps<{ titleSrc: string; titleAlt?: string }>()

const headerBg = resolvePkgUrl('home/header-bg.png')
</script>

<template>
  <header class="page-header">
    <img class="page-header__bg" :src="headerBg" alt="" aria-hidden="true" />
    <img class="page-header__title" :src="titleSrc" :alt="titleAlt ?? ''" />
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

/* 背景图铺满全宽撑起容器高度 */
.page-header__bg {
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

/* 标题居中叠在背景上 */
.page-header__title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 40%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.3s);
}

/*
 * 扫光：overflow:hidden 限定在 header 内，
 * auto-shine-from-center 的伪元素用 vw 偏移，外层裁掉不影响其他区域
 */
.page-header__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}
</style>
