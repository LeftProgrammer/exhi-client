<template>
  <PageLayout ref="layoutRef" :bg="url('bg.png')">
    <template #header>
      <img ref="topBarRef" class="header-bg" :src="url('header-bg.png')" alt="" />
      <img ref="titleRef" class="header-title" :src="url('page4/header-title.png')" alt="" />
    </template>
    <div
      v-for="(item, i) in entries"
      :key="i"
      :ref="(el) => setWrapperRef(el, i)"
      class="entry-wrapper"
      :style="{
        '--aspect': `${item.width} / ${item.height}`,
        '--dot-top': `${(item.dotY / item.height) * 100}%`,
        '--dot-left': `${(item.dotX / item.width) * 100}%`,
        '--dot-size': `${(item.dotSize / item.width) * 100}%`
      }"
    >
      <img
        class="entry-item"
        :src="url(item.src)"
        alt=""
      />
      <div class="breath-line" v-if="i < entries.length - 1" />
      <div class="breath-dot" />
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useTimelinePage } from '@baima-milestone/composables/useTimelinePage'
import { page4Entries } from '@baima-milestone/data/slides'
import PageLayout from './PageLayout.vue'

const url = resolvePkgUrl
const entries = page4Entries

const layoutRef = ref<InstanceType<typeof PageLayout> | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const wrapperRefs: HTMLElement[] = []

function setWrapperRef(el: unknown, i: number) {
  if (el instanceof HTMLElement) wrapperRefs[i] = el
}

const { play, pause, resume, reset } = useTimelinePage(layoutRef, topBarRef, titleRef, wrapperRefs, {
  timeline: true
})

defineExpose({ play, pause, resume, reset })
</script>

<style lang="scss" scoped>
@use '@baima-milestone/styles/mixins' as local;

@include local.timeline-entry();
</style>
