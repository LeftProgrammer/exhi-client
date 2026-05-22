<template>
  <PageLayout ref="layoutRef" :bg="url('bg.png')" :deco="url('page2/deco.png')">
    <template #header>
      <img ref="topBarRef" class="header-bar" :src="url('top-bar.png')" alt="" />
      <img ref="titleRef" class="header-title" :src="url('page2/title.png')" alt="" />
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
      <div :ref="(el) => setHighlightRef(el, i)" class="date-highlight">
        <div class="date-scan" :class="{ scanning: scanActive }" :style="{ '--i': i }" />
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import gsap from 'gsap'
import { resolvePkgUrl } from '@shared/utils/url'
import { playEnterSequence } from '@baima-milestone/effects/gsapPresets'
import PageLayout from './PageLayout.vue'

const url = resolvePkgUrl
const ENTRY_COUNT = 8

const layoutRef = ref<InstanceType<typeof PageLayout> | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const wrapperRefs: HTMLElement[] = []
const highlightRefs: HTMLElement[] = []
const scanActive = ref(false)

function setWrapperRef(el: unknown, i: number) {
  if (el instanceof HTMLElement) wrapperRefs[i] = el
}

function setHighlightRef(el: unknown, i: number) {
  if (el instanceof HTMLElement) highlightRefs[i] = el
}

let tl: gsap.core.Timeline | null = null

function play() {
  tl?.kill()
  scanActive.value = false
  layoutRef.value?.resetScroll()

  const headers = [
    layoutRef.value?.bgEl,
    layoutRef.value?.decoEl,
    topBarRef.value,
    titleRef.value
  ].filter(Boolean) as Element[]
  const rows = wrapperRefs.filter(Boolean) as Element[]
  const highlights = highlightRefs.filter(Boolean) as Element[]

  gsap.set(highlights, { opacity: 0 })

  tl = playEnterSequence(headers, rows)
  tl.to(highlights, { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.06 }, '>')
  tl.call(() => {
    layoutRef.value?.scheduleAutoScroll()
    scanActive.value = true
  })
}

function reset() {
  tl?.kill()
  tl = null
  scanActive.value = false
  layoutRef.value?.resetScroll()

  const headers = [
    layoutRef.value?.bgEl,
    layoutRef.value?.decoEl,
    topBarRef.value,
    titleRef.value
  ].filter(Boolean)
  gsap.set(headers, { opacity: 0 })
  gsap.set(wrapperRefs.filter(Boolean), { opacity: 0, x: 0 })
  gsap.set(highlightRefs.filter(Boolean), { opacity: 0 })
}

defineExpose({ play, reset })
</script>

<style lang="scss" scoped>
@keyframes scan-sweep {
  0% {
    transform: translateX(-160%);
    opacity: 1;
  }

  60% {
    transform: translateX(210%);
    opacity: 1;
  }

  61% {
    opacity: 0;
  }

  99% {
    transform: translateX(-160%);
    opacity: 0;
  }

  100% {
    transform: translateX(-160%);
    opacity: 1;
  }
}

.header-bar {
  width: 100%;
  display: block;
  opacity: 0;
}

.header-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  opacity: 0;
}

.entry-wrapper {
  position: relative;
  width: 100%;
  opacity: 0;
  will-change: transform, opacity;
}

.entry-item {
  width: 100%;
  height: auto;
  display: block;
}

/* 无边框无背景，仅裁剪扫光不溢出 */
.date-highlight {
  position: absolute;
  top: 20%;
  left: 3%;
  width: 45%;
  height: 18%;
  // overflow: hidden;
  pointer-events: none;
  opacity: 0;
}

.date-scan {
  position: absolute;
  left: 0;
  width: 50%;
  height: 120%;
  opacity: 0;
  background: linear-gradient(
    108deg,
    transparent 0%,
    rgba(100, 210, 255, 0.05) 18%,
    rgba(160, 235, 255, 0.3) 32%,
    rgba(210, 248, 255, 0.7) 44%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(210, 248, 255, 0.7) 56%,
    rgba(160, 235, 255, 0.3) 68%,
    rgba(100, 210, 255, 0.05) 82%,
    transparent 100%
  );
  filter: blur(2px);

  &.scanning {
    // 周期5s，扫光占38%≈1.9s，相邻错开1.25s → 相邻卡片有0.65s重叠，形成飘带感
    // delay = i*1.25 - 5  → 负延迟让动画立即从对应相位开始，顺序1→2→3→4
    // 正延迟：入场时严格从 card 0 开始，每张错开 0.3s 向下级联
    animation: scan-sweep 2s linear infinite;
    animation-delay: calc(var(--i) * 0.3s);
  }
}
</style>
