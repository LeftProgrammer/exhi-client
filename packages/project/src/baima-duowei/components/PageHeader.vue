<script setup lang="ts">
defineProps<{ titleSrc: string; titleAlt?: string }>()
</script>

<template>
  <header class="page-header">
    <img class="page-header__title" :src="titleSrc" :alt="titleAlt ?? ''" />
    <div class="page-header__shine" aria-hidden="true" />
  </header>
</template>

<style scoped lang="scss">
@use '@shared/styles/transitions' as fx;

/* 顶部标题区：固定高度，水平居中 */
.page-header {
  position: relative;
  flex-shrink: 0;
  pointer-events: none;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5vh 0;
}

.page-header__title {
  display: block;
  height: auto;
  max-height: 12vh;
  width: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.2s);
}

.page-header__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}
</style>
