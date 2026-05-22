<template>
  <div
    class="page"
    @wheel.prevent="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 背景 -->
    <img ref="bgRef" class="layer-bg" :src="url('planning/bg.png')" alt="" />
    <img ref="decoRef" class="layer-deco" :src="url('planning/deco.png')" alt="" />

    <!-- 固定标题 -->
    <div class="header">
      <img ref="titleRef" class="header__title" :src="url('planning/title.png')" alt="" />
    </div>

    <!-- 可滚动内容区 -->
    <div ref="wrapperRef" class="scroll-wrapper">
      <div ref="contentRef" class="scroll-content">
        <img
          v-for="(_, i) in ENTRY_COUNT"
          :key="i"
          :ref="(el) => setEntryRef(el, i)"
          class="entry-item"
          :src="url(`planning/entry-${String(i + 1).padStart(2, '0')}.png`)"
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
const ENTRY_COUNT = 10

const bgRef = ref<HTMLImageElement | null>(null)
const decoRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const entryRefs: HTMLImageElement[] = []

function setEntryRef(el: unknown, i: number) {
  if (el instanceof HTMLImageElement) entryRefs[i] = el
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
  const headers = [bgRef.value, decoRef.value, titleRef.value].filter(Boolean) as Element[]
  const rows = entryRefs.filter(Boolean) as Element[]
  tl = playEnterSequence(headers, rows)
  tl.then(() => scheduleAutoScroll())
}

function reset() {
  tl?.kill()
  tl = null
  resetScroll()
  const all = [bgRef.value, decoRef.value, titleRef.value, ...entryRefs].filter(Boolean)
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

.layer-deco {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
  pointer-events: none;
}

.header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  padding: 4% 0 2%;
  text-align: center;

  &__title {
    width: 70%;
    display: inline-block;
  }
}

.scroll-wrapper {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow: hidden;
  margin: 0 4% 4%;
}

.scroll-content {
  display: flex;
  flex-direction: column;
  gap: 2%;
  will-change: transform;
}

.entry-item {
  width: 100%;
  height: auto;
  display: block;
}
</style>
