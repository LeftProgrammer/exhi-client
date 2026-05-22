<template>
  <div
    class="page"
    @wheel.prevent="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 背景 -->
    <img ref="bgRef" class="layer-bg" :src="url('milestone/participants/bg.png')" alt="" />

    <!-- 固定头部 -->
    <div class="header">
      <img
        ref="topBarRef"
        class="header__bar"
        :src="url('milestone/participants/top-bar.png')"
        alt=""
      />
      <img
        ref="titleRef"
        class="header__title"
        :src="url('milestone/participants/title.png')"
        alt=""
      />
    </div>

    <!-- 可滚动内容区 -->
    <div ref="wrapperRef" class="scroll-wrapper">
      <div ref="contentRef" class="scroll-content">
        <img
          v-for="n in 5"
          :key="n"
          :ref="(el) => setRowRef(el, n - 1)"
          class="row-item"
          :src="url(`milestone/participants/row-${n}.png`)"
          alt=""
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import { resolvePkgUrl } from '@shared/utils/url'
import { playEnterSequence } from '@baima-milestone/effects/gsapPresets'
import { usePageScroll } from '@shared/composables/usePageScroll'
import { SCROLL_HOLD_MS } from '@baima-milestone/data/slides'

const url = resolvePkgUrl

const bgRef = ref<HTMLImageElement | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const rowRefs: HTMLImageElement[] = []

function setRowRef(el: unknown, i: number) {
  if (el instanceof HTMLImageElement) rowRefs[i] = el
}

const {
  scheduleAutoScroll,
  reset: resetScroll,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd
} = usePageScroll(wrapperRef, contentRef, SCROLL_HOLD_MS)

let tl: gsap.core.Timeline | null = null

function play() {
  tl?.kill()
  resetScroll()
  const headers = [bgRef.value, topBarRef.value, titleRef.value].filter(Boolean) as Element[]
  const rows = rowRefs.filter(Boolean) as Element[]
  tl = playEnterSequence(headers, rows)
  tl.then(() => scheduleAutoScroll())
}

function reset() {
  tl?.kill()
  tl = null
  resetScroll()
  const all = [bgRef.value, topBarRef.value, titleRef.value, ...rowRefs].filter(Boolean)
  gsap.set(all, { opacity: 0, x: 0 })
}

onMounted(() => play())
defineExpose({ play, reset })
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
}

.header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  width: 100%;

  &__bar {
    width: 100%;
    display: block;
  }

  &__title {
    display: block;
    width: 80%;
    margin: 2% auto 0;
  }
}

.scroll-wrapper {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow: hidden;
  margin: 3% 4% 4%;
}

.scroll-content {
  display: flex;
  flex-direction: column;
  gap: 2.5%;
  will-change: transform;
}

.row-item {
  width: 100%;
  height: auto;
  display: block;
}
</style>
