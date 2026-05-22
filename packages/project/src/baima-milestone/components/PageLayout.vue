<template>
  <div
    class="page"
    @wheel.prevent="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <img ref="bgRef" class="layer-bg" :src="bg" alt="" />
    <img v-if="deco" ref="decoRef" class="layer-deco" :src="deco" alt="" />

    <div class="header">
      <slot name="header" />
    </div>

    <div ref="wrapperRef" class="scroll-wrapper">
      <div ref="contentRef" class="scroll-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePageScroll } from '@shared/composables/usePageScroll'
import { SCROLL_HOLD_MS } from '@baima-milestone/data/slides'

defineProps<{ bg: string; deco?: string }>()

const bgRef = ref<HTMLImageElement | null>(null)
const decoRef = ref<HTMLImageElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const {
  scheduleAutoScroll,
  reset: resetScroll,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = usePageScroll(wrapperRef, contentRef, SCROLL_HOLD_MS)

defineExpose({ bgEl: bgRef, decoEl: decoRef, scheduleAutoScroll, resetScroll })
</script>

<style lang="scss" scoped>
@use '@shared/styles/mixins' as m;

.page {
  @include m.fill;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.layer-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0;
  will-change: opacity;
}

.layer-deco {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}

.header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

.scroll-wrapper {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow: hidden;
  margin: 6% 10% 12% 10%;
}

.scroll-content {
  display: flex;
  flex-direction: column;
  gap: var(--content-gap, 56px);
  will-change: transform;
}
</style>
