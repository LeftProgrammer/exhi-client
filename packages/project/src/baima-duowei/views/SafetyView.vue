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
    >
      <div class="safety__body">
        <div class="safety__body-left">
          <img v-for="(src, i) in leftItems" :key="i" :src="src" alt="" />
        </div>
        <div class="safety__body-right">
          <img v-for="(src, i) in rightItems" :key="i" :src="src" alt="" />
        </div>
      </div>
      <div class="safety__bottom"><img :src="contentBottom" alt="" /></div>
    </ContentArea>
  </PageLayout>
</template>

<style scoped lang="scss">
/* @use '@shared/styles/transitions' as fx; */

.safety__body {
  position: absolute;
  top: d.h(790);
  left: d.w(511);
  right: d.h(479);
  bottom: d.w(506);
}

.safety__body-left {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;

  img {
    display: block;
    width: d.w(843);
    height: d.h(190);
    object-fit: contain;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

.safety__body-right {
  position: absolute;
  top: d.h(37);
  bottom: d.h(37);
  right: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-content: space-between;
  justify-items: end;
  column-gap: d.w(150);

  img {
    display: block;
    height: d.h(129);
    width: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
  }
}

.safety__bottom {
  position: absolute;
  top: d.h(1909);
  right: d.w(1440);
  bottom: d.h(159);
  left: d.w(1440);
  @include fx.enter-fade-in($duration: 0.8s, $delay: 1.3s);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
