<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const headerBg = resolvePkgUrl('shared/header-bg.png')
const headerTitle = resolvePkgUrl('safety/header-title.png')
const contentBg = resolvePkgUrl('shared/content-bg.png')
const contentOverlay = resolvePkgUrl('safety/content-overlay.png')
const blockTitle = resolvePkgUrl('safety/block-title.png')
const contentBottom = resolvePkgUrl('safety/content-bottom-title.png')
const leftItems = [1, 2, 3].map((n) => resolvePkgUrl(`safety/left-${n}.png`))
const rightItems = [1, 2, 3, 4, 5, 6].map((n) => resolvePkgUrl(`safety/right-${n}.png`))
</script>

<template>
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="安全成效">
    <ContentArea
      :content-bg="contentBg"
      :content-overlay="contentOverlay"
      :block-title="blockTitle"
      :bottom="contentBottom"
    >
      <div class="safety__body-left">
        <img v-for="(src, i) in leftItems" :key="i" :src="src" alt="" />
      </div>
      <div class="safety__body-right">
        <img v-for="(src, i) in rightItems" :key="i" :src="src" alt="" />
      </div>
    </ContentArea>
  </PageLayout>
</template>

<style scoped lang="scss">
/* @use '@shared/styles/transitions' as fx; */

.safety__body-left {
  position: absolute;
  top: 5%;
  left: 2%;
  display: flex;
  flex-direction: column;
  gap: 6vh;

  img {
    display: block;
    height: 8vh;
    width: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

.safety__body-right {
  position: absolute;
  top: 8%;
  right: 6%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 45%;
  column-gap: 20%;
  justify-items: end;

  img {
    display: block;
    height: 6vh;
    width: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
  }
}
</style>
