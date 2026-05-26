<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'
import ContentArea from '../components/ContentArea.vue'

const TOTAL = 6
const page = ref(0)

function goPrev() {
  if (page.value > 0) page.value--
}
function goNext() {
  if (page.value < TOTAL - 1) page.value++
}

const headerBg = resolvePkgUrl('shared/header-bg.png')
const headerTitle = resolvePkgUrl('activity/header-title.png')
const contentBg = resolvePkgUrl('shared/content-bg.png')

// Activity 1
const a1 = {
  blockTitle: resolvePkgUrl('activity/activity1/block-title.png'),
  overlay: resolvePkgUrl('activity/activity1/content-overlay.png'),
  leftTitle: resolvePkgUrl('activity/activity1/left-title.png'),
  leftText: resolvePkgUrl('activity/activity1/left-text.png'),
  rightImg1: resolvePkgUrl('activity/activity1/right-img1.png'),
  rightImg2: resolvePkgUrl('activity/activity1/right-img2.png'),
  rightImg3: resolvePkgUrl('activity/activity1/right-img3.png')
}

// Activity 2
const a2 = {
  blockTitle: resolvePkgUrl('activity/activity2/block-title.png'),
  subTitle: resolvePkgUrl('activity/activity2/sub-title.png'),
  textImg: resolvePkgUrl('activity/activity2/text-img.png'),
  bottomImg: resolvePkgUrl('activity/activity2/bottom-img.png')
}

// Activity 3
const a3 = {
  blockTitle: resolvePkgUrl('activity/activity3/block-title.png'),
  subTitle: resolvePkgUrl('activity/activity3/sub-title.png'),
  leftText: resolvePkgUrl('activity/activity3/left-text.png'),
  rightImg: resolvePkgUrl('activity/activity3/right-img.png')
}

// Activity 4
const a4 = {
  blockTitle: resolvePkgUrl('activity/activity4/block-title.png'),
  overlay: resolvePkgUrl('activity/activity4/content-overlay.png'),
  leftText: resolvePkgUrl('activity/activity4/left-text.png'),
  rightImg: resolvePkgUrl('activity/activity4/right-img.png')
}

// Activity 5
const a5 = {
  blockTitle: resolvePkgUrl('activity/activity5/block-title.png'),
  leftImg: resolvePkgUrl('activity/activity5/left-img.png'),
  rightTitle: resolvePkgUrl('activity/activity5/right-title.png'),
  rightText: resolvePkgUrl('activity/activity5/right-text.png')
}

// Activity 6
const a6 = {
  blockTitle: resolvePkgUrl('activity/activity6/block-title.png'),
  overlay: resolvePkgUrl('activity/activity6/content-overlay.png'),
  subTitle: resolvePkgUrl('activity/activity6/sub-title.png'),
  leftImg: resolvePkgUrl('activity/activity6/left-img.png'),
  rightText: resolvePkgUrl('activity/activity6/right-text.png'),
  rightLines: [1, 2, 3, 4, 5].map((n) => resolvePkgUrl(`activity/activity6/right-line${n}.png`))
}
</script>

<template>
  <SecondaryPage :bg-overlay="headerBg" :title-src="headerTitle" title-alt="安全活动">
    <Transition name="page-fade" mode="out-in">
      <!-- ── Activity 1：安全生产月启动仪式 ── -->
      <ContentArea
        v-if="page === 0"
        key="activity1"
        :content-bg="contentBg"
        :content-overlay="a1.overlay"
        :block-title="a1.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a1">
          <img class="a1__left-title" :src="a1.leftTitle" alt="" />
          <img class="a1__left-text" :src="a1.leftText" alt="" />
          <img class="a1__right-img1" :src="a1.rightImg1" alt="" />
          <img class="a1__right-img2" :src="a1.rightImg2" alt="" />
          <img class="a1__right-img3" :src="a1.rightImg3" alt="" />
        </div>
      </ContentArea>

      <!-- ── Activity 2：道路交通安全驾驶知识专项培训 ── -->
      <ContentArea
        v-else-if="page === 1"
        key="activity2"
        :content-bg="contentBg"
        :block-title="a2.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a2">
          <img class="a2__sub-title" :src="a2.subTitle" alt="" />
          <img class="a2__text-img" :src="a2.textImg" alt="" />
          <img class="a2__bottom-img" :src="a2.bottomImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Activity 3：医学急救技能培训 ── -->
      <ContentArea
        v-else-if="page === 2"
        key="activity3"
        :content-bg="contentBg"
        :block-title="a3.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a3">
          <img class="a3__sub-title" :src="a3.subTitle" alt="" />
          <img class="a3__left-text" :src="a3.leftText" alt="" />
          <img class="a3__right-img" :src="a3.rightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Activity 4：消防安全知识专题培训 ── -->
      <ContentArea
        v-else-if="page === 3"
        key="activity4"
        :content-bg="contentBg"
        :content-overlay="a4.overlay"
        :block-title="a4.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a4">
          <img class="a4__left-text" :src="a4.leftText" alt="" />
          <img class="a4__right-img" :src="a4.rightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Activity 5：安全大讲堂 ── -->
      <ContentArea
        v-else-if="page === 4"
        key="activity5"
        :content-bg="contentBg"
        :block-title="a5.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a5">
          <img class="a5__left-img" :src="a5.leftImg" alt="" />
          <img class="a5__right-title" :src="a5.rightTitle" alt="" />
          <img class="a5__right-text" :src="a5.rightText" alt="" />
        </div>
      </ContentArea>

      <!-- ── Activity 6：应急演练 ── -->
      <ContentArea
        v-else
        key="activity6"
        :content-bg="contentBg"
        :content-overlay="a6.overlay"
        :block-title="a6.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="a6">
          <img class="a6__sub-title" :src="a6.subTitle" alt="" />
          <img class="a6__left-img" :src="a6.leftImg" alt="" />
          <img class="a6__right-text" :src="a6.rightText" alt="" />
          <img
            v-for="(src, i) in a6.rightLines"
            :key="i"
            class="a6__right-line"
            :style="{ top: `${38 + i * 10}%` }"
            :src="src"
            alt=""
          />
        </div>
      </ContentArea>
    </Transition>
  </SecondaryPage>
</template>

<style scoped lang="scss">
@use '@shared/styles/transitions' as fx;

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* ── Activity 1：左文字+右图片 ── */
.a1 {
  position: absolute;
  inset: 0;

  &__left-title {
    position: absolute;
    top: 16%;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__left-text {
    position: absolute;
    top: 30%;
    left: 0;
    width: 55%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__right-img1 {
    position: absolute;
    top: 0;
    right: 0;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }

  &__right-img2 {
    position: absolute;
    top: 35%;
    right: 0;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-img3 {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }
}

/* ── Activity 2：居中副标题+全宽内容（文字+图片合成） ── */
.a2 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__text-img {
    position: absolute;
    top: 10%;
    left: 0;
    width: 100%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__bottom-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }
}

/* ── Activity 3：副标题+左文字+右2x2图 ── */
.a3 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: 0;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__left-text {
    position: absolute;
    top: 14%;
    left: 0;
    width: 52%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__right-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }
}

/* ── Activity 4：左文字+右图片（带overlay） ── */
.a4 {
  position: absolute;
  inset: 0;

  &__left-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 52%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__right-img {
    position: absolute;
    top: 8%;
    right: 0;
    width: 40%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }
}

/* ── Activity 5：左图+右标题文字 ── */
.a5 {
  position: absolute;
  inset: 0;

  &__left-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 42%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__right-title {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.7s);
  }

  &__right-text {
    position: absolute;
    top: 14%;
    right: 0;
    width: 50%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

/* ── Activity 6：副标题+左图+右文字+右行列表 ── */
.a6 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: 0;
    left: 42%;
    width: 20%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__left-img {
    position: absolute;
    top: 8%;
    left: 0;
    width: 40%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }

  &__right-text {
    position: absolute;
    top: 8%;
    right: 0;
    width: 52%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__right-line {
    position: absolute;
    left: 42%;
    width: 58%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.5s, $delay: 0.9s);
  }
}
</style>
