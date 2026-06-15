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

/* ── 内容入场方向性动效：左/右两侧滑入、底部上浮 ── */
@keyframes sf-in-left {
  from {
    opacity: 0;
    transform: translateX(-7vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes sf-in-right {
  from {
    opacity: 0;
    transform: translateX(7vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes sf-in-bottom {
  from {
    opacity: 0;
    transform: translateY(6vh);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@mixin sf-from-left($duration: 0.9s, $delay: 0.75s) {
  animation: sf-in-left $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
}
@mixin sf-from-right($duration: 0.9s, $delay: 0.75s) {
  animation: sf-in-right $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
}
@mixin sf-from-bottom($duration: 0.9s, $delay: 0.75s) {
  animation: sf-in-bottom $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
}

.safety__body {
  position: absolute;
  top: d.h(790);
  left: d.w(511);
  width: d.w(2850);
  height: d.h(864);
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
  @include sf-from-left($duration: 0.9s, $delay: 0.75s);

  img {
    display: block;
    width: d.w(843);
    height: d.h(190);
    object-fit: contain;
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
  @include sf-from-right($duration: 0.9s, $delay: 0.75s);

  img {
    display: block;
    height: d.h(129);
    width: auto;
  }
}

.safety__bottom {
  position: absolute;
  top: d.h(1909);
  right: d.w(1440);
  bottom: d.h(159);
  left: d.w(1440);
  @include sf-from-bottom($duration: 0.9s, $delay: 0.75s);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>

<!-- 内容区域离场：非 scoped，匹配全局 transition class -->
<style lang="scss">
.page-leave-active .safety__body-left {
  animation: sf-out-left 0.5s ease-in both;
}

.page-leave-active .safety__body-right {
  animation: sf-out-right 0.5s ease-in both;
}

.page-leave-active .safety__bottom {
  animation: sf-out-bottom 0.5s ease-in both;
}

@keyframes sf-out-left {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-7vw); }
}

@keyframes sf-out-right {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(7vw); }
}

@keyframes sf-out-bottom {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(6vh); }
}
</style>
