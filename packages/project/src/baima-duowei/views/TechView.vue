<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'
import ContentArea from '../components/ContentArea.vue'

const TOTAL = 2
const page = ref(0)

function goPrev() {
  if (page.value > 0) page.value--
}
function goNext() {
  if (page.value < TOTAL - 1) page.value++
}

const headerBg = resolvePkgUrl('shared/header-bg.png')
const headerTitle = resolvePkgUrl('tech/tech1/header-title.png')

// 公共
const contentBg = resolvePkgUrl('shared/content-bg.png')

// Tech 1
const t1 = {
  blockTitle: resolvePkgUrl('tech/tech1/block-title.png'),
  overlay: resolvePkgUrl('tech/tech1/content-overlay.png'),
  leftTop: resolvePkgUrl('tech/tech1/left-top.png'),
  leftBottom: resolvePkgUrl('tech/tech1/left-bottom.png'),
  rightText: resolvePkgUrl('tech/tech1/right-text.png')
}

// Tech 2
const t2 = {
  blockTitle: resolvePkgUrl('tech/tech2/block-title.png'),
  overlay: resolvePkgUrl('tech/tech2/content-overlay.png'),
  leftText: resolvePkgUrl('tech/tech2/left-text.png'),
  rightTopL: resolvePkgUrl('tech/tech2/right-top-left.png'),
  rightTopR: resolvePkgUrl('tech/tech2/right-top-right.png'),
  rightBottom: resolvePkgUrl('tech/tech2/right-bottom.png'),
  imgs: Array.from({ length: 8 }, (_, i) => resolvePkgUrl(`tech/tech2/left-img-${i + 1}.png`))
}
</script>

<template>
  <SecondaryPage :bg-overlay="headerBg" :title-src="headerTitle" title-alt="智慧技术">
    <Transition name="page-fade" mode="out-in">
      <!-- ── Tech 1 ── -->
      <ContentArea
        v-if="page === 0"
        key="tech1"
        :content-bg="contentBg"
        :content-overlay="t1.overlay"
        :block-title="t1.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t1">
          <img class="t1__left-top" :src="t1.leftTop" alt="" />
          <img class="t1__left-bottom" :src="t1.leftBottom" alt="" />
          <img class="t1__right-text" :src="t1.rightText" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 2 ── -->
      <ContentArea
        v-else
        key="tech2"
        :content-bg="contentBg"
        :content-overlay="t2.overlay"
        :block-title="t2.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t2">
          <img class="t2__left-text" :src="t2.leftText" alt="" />
          <div class="t2__left-imgs">
            <img v-for="(src, i) in t2.imgs" :key="i" :src="src" alt="" />
          </div>
          <div class="t2__right-top">
            <img :src="t2.rightTopL" alt="" />
            <img :src="t2.rightTopR" alt="" />
          </div>
          <img class="t2__right-bottom" :src="t2.rightBottom" alt="" />
        </div>
      </ContentArea>
    </Transition>
  </SecondaryPage>
</template>

<style scoped lang="scss">
@use '@shared/styles/transitions' as fx;

/* 页切换淡入淡出 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* ── Tech 1 ── */
.t1 {
  position: absolute;
  inset: 0;

  &__left-top {
    position: absolute;
    top: 2%;
    left: 0;
    width: 63%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__left-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 63%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-text {
    position: absolute;
    top: 5%;
    right: 0;
    width: 34%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }
}

/* ── Tech 2 ── */
.t2 {
  position: absolute;
  inset: 0;

  &__left-text {
    position: absolute;
    top: 2%;
    left: 0;
    width: 56%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__left-imgs {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 56%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto auto;
    gap: 0.4%;

    img {
      width: 100%;
      height: auto;
      display: block;
      @include fx.enter-fade-in($duration: 0.6s, $delay: 1s);

      &:first-child {
        grid-column: 1;
        grid-row: 1;
      }

      &:nth-child(n + 2) {
        grid-row: 2;
      }

      &:nth-child(2) {
        grid-column: 1;
      }
      &:nth-child(3) {
        grid-column: 2;
      }
      &:nth-child(4) {
        grid-column: 3;
      }
      &:nth-child(5) {
        grid-column: 4;
      }
      &:nth-child(6) {
        grid-column: 5;
      }
      &:nth-child(7) {
        grid-column: 6;
      }
      &:nth-child(8) {
        grid-column: 7;
      }
    }
  }

  &__right-top {
    position: absolute;
    top: 2%;
    right: 0;
    width: 41%;
    display: flex;
    gap: 1%;

    img {
      flex: 1;
      width: 0;
      height: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
    }
  }

  &__right-bottom {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 41%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}
</style>
