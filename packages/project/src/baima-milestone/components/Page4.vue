<template>
  <PageLayout ref="layoutRef" :bg="url('bg.png')">
    <template #header>
      <img ref="topBarRef" class="header-bg" :src="url('header-bg.png')" alt="" />
      <img ref="titleRef" class="header-title" :src="url('page4/header-title.png')" alt="" />
    </template>
    <img
      v-for="(_, i) in ENTRY_COUNT"
      :key="i"
      :ref="(el) => setItemRef(el, i)"
      class="entry-item"
      :src="url(`page4/entry-${String(i + 1).padStart(2, '0')}.png`)"
      alt=""
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import gsap from 'gsap'
import { resolvePkgUrl } from '@shared/utils/url'
import { playEnterSequence } from '@baima-milestone/effects/gsapPresets'
import PageLayout from './PageLayout.vue'

const url = resolvePkgUrl
const ENTRY_COUNT = 4

const layoutRef = ref<InstanceType<typeof PageLayout> | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const itemRefs: HTMLImageElement[] = []

function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLImageElement) itemRefs[i] = el
}

let tl: gsap.core.Timeline | null = null

function play() {
  tl?.kill()
  layoutRef.value?.resetScroll()
  const headers = [layoutRef.value?.bgEl, topBarRef.value, titleRef.value].filter(
    Boolean
  ) as Element[]
  const rows = itemRefs.filter(Boolean) as Element[]
  tl = playEnterSequence(headers, rows)
  tl.then(() => layoutRef.value?.scheduleAutoScroll())
}

function reset() {
  tl?.kill()
  tl = null
  layoutRef.value?.resetScroll()
  const headers = [layoutRef.value?.bgEl, topBarRef.value, titleRef.value].filter(Boolean)
  const rows = itemRefs.filter(Boolean)
  gsap.set(headers, { opacity: 0 })
  gsap.set(rows, { opacity: 0, x: 0 })
}

defineExpose({ play, reset })
</script>

<style lang="scss" scoped>
.header-bg {
  width: 100%;
  display: block;
  opacity: 0;
}

.header-title {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
}

.entry-item {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  will-change: transform, opacity;
}
</style>
