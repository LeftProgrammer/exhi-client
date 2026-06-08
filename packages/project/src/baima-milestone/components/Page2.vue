<template>
  <PageLayout ref="layoutRef" :bg="url('bg.png')">
    <template #header>
      <img ref="topBarRef" class="header-bg" :src="url('header-bg.png')" alt="" />
      <img ref="titleRef" class="header-title" :src="url('page2/header-title.png')" alt="" />
    </template>
    <div
      v-for="(_, i) in ENTRY_COUNT"
      :key="i"
      :ref="(el) => setWrapperRef(el, i)"
      class="entry-wrapper"
    >
      <img
        class="entry-item"
        :src="url(`page2/entry-${String(i + 1).padStart(2, '0')}.png`)"
        alt=""
      />
      <div class="breath-line" v-if="i < ENTRY_COUNT - 1" />
      <div class="breath-dot" />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import gsap from 'gsap'
import { resolvePkgUrl } from '@shared/utils/url'
import { playEnterSequence } from '@baima-milestone/effects/gsapPresets'
import { SCROLL_ARM_AT } from '@baima-milestone/data/slides'
import PageLayout from './PageLayout.vue'

const url = resolvePkgUrl
const ENTRY_COUNT = 8

const layoutRef = ref<InstanceType<typeof PageLayout> | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const wrapperRefs: HTMLElement[] = []

function setWrapperRef(el: unknown, i: number) {
  if (el instanceof HTMLElement) wrapperRefs[i] = el
}

let tl: gsap.core.Timeline | null = null

function play() {
  tl?.kill()
  layoutRef.value?.resetScroll()

  const headers = [
    layoutRef.value?.bgEl,
    layoutRef.value?.decoEl,
    topBarRef.value,
    titleRef.value
  ].filter(Boolean) as Element[]
  const rows = wrapperRefs.filter(Boolean) as Element[]

  const dots = wrapperRefs.map((w) => w.querySelector('.breath-dot')).filter(Boolean)
  const lines = wrapperRefs.map((w) => w.querySelector('.breath-line')).filter(Boolean)
  // 圆点入场即显示，直接开始呼吸；线段由 playEnterSequence 内部同步生长
  gsap.set(dots, { opacity: 1, scale: 1 })

  tl = playEnterSequence(headers, rows, lines)
  if (!tl) return

  // 用「绝对时刻」安排自动滚动：从入场开始固定 SCROLL_ARM_AT 秒后触发，
  // 与行数/数据量解耦——首屏可见的前几行此时已入场完，后续行随滚动再补入即可。
  // 这样无论多少条数据，滚动启动时刻恒定，不会数据越多等越久。
  tl.call(() => layoutRef.value?.scheduleAutoScroll(), undefined, SCROLL_ARM_AT)
}

function reset() {
  tl?.kill()
  tl = null
  layoutRef.value?.resetScroll()

  const headers = [
    layoutRef.value?.bgEl,
    layoutRef.value?.decoEl,
    topBarRef.value,
    titleRef.value
  ].filter(Boolean)
  gsap.set(headers, { opacity: 0 })
  gsap.set(wrapperRefs.filter(Boolean), { opacity: 0, x: 0 })

  const dots = wrapperRefs.map((w) => w.querySelector('.breath-dot')).filter(Boolean)
  const lines = wrapperRefs.map((w) => w.querySelector('.breath-line')).filter(Boolean)
  gsap.set(dots, { opacity: 1, scale: 1 })
  gsap.set(lines, { opacity: 0, scaleY: 0, transformOrigin: 'top center' })
}

defineExpose({ play, reset })
</script>

<style lang="scss" scoped>
.entry-wrapper {
  position: relative;
  width: 100%;
  opacity: 0;
  will-change: transform, opacity;
}

.entry-item {
  position: relative;
  z-index: 0;
  width: 100%;
  height: d.h(652);
  display: block;
}

.breath-dot {
  position: absolute;
  top: d.h(185);
  left: d.w(110);
  width: d.w(50);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #65e6e1;
  box-shadow:
    0 0 d.w(8) rgba(101, 230, 225, 0.85),
    0 0 d.w(20) rgba(101, 230, 225, 0.55);
  z-index: 10;
  animation: breathe 2.2s ease-in-out infinite;
}

.breath-line {
  position: absolute;
  top: d.h(195);
  left: d.w(135);
  width: d.w(4);
  height: calc(100% + var(--content-gap));
  background: #65e6e1;
  z-index: 5;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 0 d.w(4) rgba(101, 230, 225, 0.5),
      0 0 d.w(10) rgba(101, 230, 225, 0.2);
  }
  50% {
    transform: scale(1.5);
    box-shadow:
      0 0 d.w(12) rgba(200, 255, 252, 0.9),
      0 0 d.w(28) rgba(101, 230, 225, 0.8),
      0 0 d.w(48) rgba(101, 230, 225, 0.3);
  }
}
</style>
