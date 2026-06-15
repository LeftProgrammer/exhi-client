<template>
  <PageLayout ref="layoutRef" :bg="url('bg.png')">
    <template #header>
      <img ref="topBarRef" class="header-bg" :src="url('header-bg.png')" alt="" />
      <img ref="titleRef" class="header-title" :src="url('page1/header-title.png')" alt="" />
    </template>
    <img
      v-for="n in 5"
      :key="n"
      :ref="(el) => setItemRef(el, n - 1)"
      class="row-item"
      :src="url(`page1/row-${n}.png`)"
      alt=""
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useTimelinePage } from '@baima-milestone/composables/useTimelinePage'
import PageLayout from './PageLayout.vue'

const url = resolvePkgUrl

const layoutRef = ref<InstanceType<typeof PageLayout> | null>(null)
const topBarRef = ref<HTMLImageElement | null>(null)
const titleRef = ref<HTMLImageElement | null>(null)
const itemRefs: HTMLImageElement[] = []

function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLImageElement) itemRefs[i] = el
}

const { play, pause, resume, reset } = useTimelinePage(layoutRef, topBarRef, titleRef, itemRefs)

defineExpose({ play, pause, resume, reset })
</script>

<style lang="scss" scoped>
.row-item {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  will-change: transform, opacity;
}
</style>
