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

.page-header__bg {
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

.page-header__title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  max-width: 60%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.3s);
}

.page-header__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}
</style>
