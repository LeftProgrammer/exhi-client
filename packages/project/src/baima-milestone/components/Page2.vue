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
import { resolvePkgUrl } from '@shared/utils/url'
import { useTimelinePage } from '@baima-milestone/composables/useTimelinePage'
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

const { play, reset } = useTimelinePage(layoutRef, topBarRef, titleRef, wrapperRefs, {
  deco: true,
  timeline: true
})

defineExpose({ play, reset })
</script>

<style lang="scss" scoped>
@use '@baima-milestone/styles/mixins' as local;

@include local.timeline-entry(d.h(185), d.h(195));
</style>
