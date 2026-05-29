<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'
import ContentArea from '../components/ContentArea.vue'

const TOTAL = 4
const page = ref(0)

function goPrev() {
  if (page.value > 0) page.value--
}
function goNext() {
  if (page.value < TOTAL - 1) page.value++
}

const headerBg = resolvePkgUrl('shared/header-bg.png')
const headerTitle = resolvePkgUrl('standard/header-title.png')
const contentBg = resolvePkgUrl('shared/content-bg.png')

// Standard 1
const s1 = {
  blockTitle: resolvePkgUrl('standard/standard1/block-title.png'),
  topLeftText: resolvePkgUrl('standard/standard1/top-left-text.png'),
  topRightImg1: resolvePkgUrl('standard/standard1/top-right-img1.png'),
  topRightImg2: resolvePkgUrl('standard/standard1/top-right-img2.png'),
  bottomImgs: [1, 2, 3, 4].map((n) => resolvePkgUrl(`standard/standard1/bottom-img${n}.png`))
}

// Standard 2
const s2 = {
  blockTitle: resolvePkgUrl('standard/standard2/block-title.png'),
  leftText: resolvePkgUrl('standard/standard2/left-text.png'),
  rightImgs: [1, 2, 3, 4, 5, 6].map((n) => resolvePkgUrl(`standard/standard2/right-img${n}.png`))
}

// Standard 3
const s3 = {
  blockTitle: resolvePkgUrl('standard/standard3/block-title.png'),
  topText: resolvePkgUrl('standard/standard3/top-text.png'),
  bottomLeftImg: resolvePkgUrl('standard/standard3/bottom-left-img.png'),
  bottomRightImg: resolvePkgUrl('standard/standard3/bottom-right-img.png')
}

// Standard 4
const s4 = {
  blockTitle: resolvePkgUrl('standard/standard4/block-title.png'),
  leftImg: resolvePkgUrl('standard/standard4/left-img.png'),
  rightImg: resolvePkgUrl('standard/standard4/right-img.png')
}
</script>

<template>
  <SecondaryPage :bg-overlay="headerBg" :title-src="headerTitle" title-alt="标准化建设">
    <Transition name="page-fade" mode="out-in">
      <!-- ── Standard 1：施工标准化 ── -->
      <ContentArea
        v-if="page === 0"
        key="standard1"
        :content-bg="contentBg"
        :block-title="s1.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="s1">
          <img class="s1__top-left-text" :src="s1.topLeftText" alt="" />
          <img class="s1__top-right-img1" :src="s1.topRightImg1" alt="" />
          <img class="s1__top-right-img2" :src="s1.topRightImg2" alt="" />
          <div class="s1__bottom">
            <img v-for="(src, i) in s1.bottomImgs" :key="i" :src="src" alt="" />
          </div>
        </div>
      </ContentArea>

      <!-- ── Standard 2：现场布设标准化 ── -->
      <ContentArea
        v-else-if="page === 1"
        key="standard2"
        :content-bg="contentBg"
        :block-title="s2.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="s2">
          <img class="s2__left-text" :src="s2.leftText" alt="" />
          <div class="s2__right-grid">
            <img v-for="(src, i) in s2.rightImgs" :key="i" :src="src" alt="" />
          </div>
        </div>
      </ContentArea>

      <!-- ── Standard 3：施工工艺标准化 ── -->
      <ContentArea
        v-else-if="page === 2"
        key="standard3"
        :content-bg="contentBg"
        :block-title="s3.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="s3">
          <img class="s3__top-text" :src="s3.topText" alt="" />
          <img class="s3__bl-img" :src="s3.bottomLeftImg" alt="" />
          <img class="s3__br-img" :src="s3.bottomRightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Standard 4：施工工艺标准化（续） ── -->
      <ContentArea
        v-else
        key="standard4"
        :content-bg="contentBg"
        :block-title="s4.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="s4">
          <img class="s4__left-img" :src="s4.leftImg" alt="" />
          <img class="s4__right-img" :src="s4.rightImg" alt="" />
        </div>
      </ContentArea>
    </Transition>
  </SecondaryPage>
</template>

<style scoped lang="scss">
/* @use '@shared/styles/transitions' as fx; */

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* ── Standard 1：施工标准化 ── */
.s1 {
  position: absolute;
  inset: 0;

  &__top-left-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 64%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__top-right-img1 {
    position: absolute;
    top: 0;
    right: 18%;
    width: 14%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }

  &__top-right-img2 {
    position: absolute;
    top: 0;
    right: 0;
    width: 14%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 2%;

    img {
      flex: 1;
      width: 0;
      height: auto;
      object-fit: cover;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    }
  }
}

/* ── Standard 2：现场布设标准化 ── */
.s2 {
  position: absolute;
  inset: 0;

  &__left-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 24%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__right-grid {
    position: absolute;
    top: 0;
    left: 26%;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr 1fr;
    gap: 2%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    }
  }
}

/* ── Standard 3：施工工艺标准化（上方文字+下方左图+右文字） ── */
.s3 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__bl-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 64%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 32%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

/* ── Standard 4：施工工艺标准化续（左侧图+右侧图） ── */
.s4 {
  position: absolute;
  inset: 0;

  &__left-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 36%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__right-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }
}
</style>
