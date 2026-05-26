<script setup lang="ts">
import { ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'
import ContentArea from '../components/ContentArea.vue'

const TOTAL = 9
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
  leftImg: resolvePkgUrl('tech/tech2/left-img.png'),
  rightImg: resolvePkgUrl('tech/tech2/right-img.png')
}

// Tech 3
const t3 = {
  blockTitle: resolvePkgUrl('tech/tech3/block-title.png'),
  topLeftText: resolvePkgUrl('tech/tech3/top-left-text.png'),
  topArrow: resolvePkgUrl('tech/tech3/top-arrow.png'),
  topRightImg: resolvePkgUrl('tech/tech3/top-right-img.png'),
  bottomLeftTitle: resolvePkgUrl('tech/tech3/bottom-left-title.png'),
  bottomLeftText: resolvePkgUrl('tech/tech3/bottom-left-text.png'),
  bottomLeftImg1: resolvePkgUrl('tech/tech3/bottom-left-img1.png'),
  bottomLeftImg2: resolvePkgUrl('tech/tech3/bottom-left-img2.png'),
  bottomRightTitle: resolvePkgUrl('tech/tech3/bottom-right-title.png'),
  bottomRightText: resolvePkgUrl('tech/tech3/bottom-right-text.png'),
  bottomRightImg: resolvePkgUrl('tech/tech3/bottom-right-img.png')
}

// Tech 4
const t4 = {
  blockTitle: resolvePkgUrl('tech/tech4/block-title.png'),
  topText: resolvePkgUrl('tech/tech4/top-text.png'),
  bottomLeftImg: resolvePkgUrl('tech/tech4/bottom-left-img.png'),
  bottomRightTitle1: resolvePkgUrl('tech/tech4/bottom-right-title1.png'),
  bottomRightText1: resolvePkgUrl('tech/tech4/bottom-right-text1.png'),
  bottomRightTitle2: resolvePkgUrl('tech/tech4/bottom-right-title2.png'),
  bottomRightText2: resolvePkgUrl('tech/tech4/bottom-right-text2.png')
}

// Tech 5
const t5 = {
  blockTitle: resolvePkgUrl('tech/tech5/block-title.png'),
  overlay: resolvePkgUrl('tech/tech5/content-overlay.png'),
  leftTitle: resolvePkgUrl('tech/tech5/left-title.png'),
  leftImg: resolvePkgUrl('tech/tech5/left-img.png'),
  leftText: resolvePkgUrl('tech/tech5/left-text.png'),
  rightTitle: resolvePkgUrl('tech/tech5/right-title.png'),
  rightImg: resolvePkgUrl('tech/tech5/right-img.png'),
  rightText: resolvePkgUrl('tech/tech5/right-text.png')
}

// Tech 6
const t6 = {
  blockTitle: resolvePkgUrl('tech/tech6/block-title.png'),
  overlay: resolvePkgUrl('tech/tech6/content-overlay.png'),
  topText: resolvePkgUrl('tech/tech6/top-text.png'),
  bottomLeftImg: resolvePkgUrl('tech/tech6/bottom-left-img.png'),
  bottomRightImg: resolvePkgUrl('tech/tech6/bottom-right-img.png')
}

// Tech 7
const t7 = {
  blockTitle: resolvePkgUrl('tech/tech7/block-title.png'),
  leftTitle: resolvePkgUrl('tech/tech7/left-title.png'),
  leftText: resolvePkgUrl('tech/tech7/left-text.png'),
  leftImg: resolvePkgUrl('tech/tech7/left-img.png'),
  rightTitle: resolvePkgUrl('tech/tech7/right-title.png'),
  rightText: resolvePkgUrl('tech/tech7/right-text.png'),
  rightImg: resolvePkgUrl('tech/tech7/right-img.png')
}

// Tech 8
const t8 = {
  blockTitle: resolvePkgUrl('tech/tech8/block-title.png'),
  overlay: resolvePkgUrl('tech/tech8/content-overlay.png'),
  topText: resolvePkgUrl('tech/tech8/top-text.png'),
  bottomLeftImg: resolvePkgUrl('tech/tech8/bottom-left-img.png'),
  bottomRightImg: resolvePkgUrl('tech/tech8/bottom-right-img.png')
}

// Tech 9
const t9 = {
  blockTitle: resolvePkgUrl('tech/tech9/block-title.png'),
  overlay: resolvePkgUrl('tech/tech9/content-overlay.png'),
  topText: resolvePkgUrl('tech/tech9/top-text.png'),
  bottomLeftImg: resolvePkgUrl('tech/tech9/bottom-left-img.png'),
  bottomRightImg: resolvePkgUrl('tech/tech9/bottom-right-img.png')
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
        v-else-if="page === 1"
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
          <img class="t2__left-img" :src="t2.leftImg" alt="" />
          <img class="t2__right-img" :src="t2.rightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 3：高边坡爆破开挖安全防控 ── -->
      <ContentArea
        v-else-if="page === 2"
        key="tech3"
        :content-bg="contentBg"
        :block-title="t3.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t3">
          <!-- 上半：左文字 + 箭头 + 右图 -->
          <img class="t3__top-left-text" :src="t3.topLeftText" alt="" />
          <img class="t3__top-arrow" :src="t3.topArrow" alt="" />
          <img class="t3__top-right-img" :src="t3.topRightImg" alt="" />
          <!-- 下左卡片：薄层岩体深台阶预裂爆破施工 -->
          <img class="t3__bl-title" :src="t3.bottomLeftTitle" alt="" />
          <img class="t3__bl-text" :src="t3.bottomLeftText" alt="" />
          <img class="t3__bl-img1" :src="t3.bottomLeftImg1" alt="" />
          <img class="t3__bl-img2" :src="t3.bottomLeftImg2" alt="" />
          <!-- 下右卡片：边坡支护 -->
          <img class="t3__br-title" :src="t3.bottomRightTitle" alt="" />
          <img class="t3__br-text" :src="t3.bottomRightText" alt="" />
          <img class="t3__br-img" :src="t3.bottomRightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 4：智慧安全管理 ── -->
      <ContentArea
        v-else-if="page === 3"
        key="tech4"
        :content-bg="contentBg"
        :block-title="t4.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t4">
          <!-- 上方全宽文字 -->
          <img class="t4__top-text" :src="t4.topText" alt="" />
          <!-- 下左图片 -->
          <img class="t4__bl-img" :src="t4.bottomLeftImg" alt="" />
          <!-- 下右两组 -->
          <img class="t4__br-title1" :src="t4.bottomRightTitle1" alt="" />
          <img class="t4__br-text1" :src="t4.bottomRightText1" alt="" />
          <img class="t4__br-title2" :src="t4.bottomRightTitle2" alt="" />
          <img class="t4__br-text2" :src="t4.bottomRightText2" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 5：智慧安全管理 ── -->
      <ContentArea
        v-else-if="page === 4"
        key="tech5"
        :content-bg="contentBg"
        :content-overlay="t5.overlay"
        :block-title="t5.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t5">
          <img class="t5__left-title" :src="t5.leftTitle" alt="" />
          <img class="t5__left-img" :src="t5.leftImg" alt="" />
          <img class="t5__left-text" :src="t5.leftText" alt="" />
          <img class="t5__right-title" :src="t5.rightTitle" alt="" />
          <img class="t5__right-img" :src="t5.rightImg" alt="" />
          <img class="t5__right-text" :src="t5.rightText" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 6：白马乌江大桥健康监测 ── -->
      <ContentArea
        v-else-if="page === 5"
        key="tech6"
        :content-bg="contentBg"
        :content-overlay="t6.overlay"
        :block-title="t6.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t6">
          <img class="t6__top-text" :src="t6.topText" alt="" />
          <img class="t6__bl-img" :src="t6.bottomLeftImg" alt="" />
          <img class="t6__br-img" :src="t6.bottomRightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 7：枢纽建设营运安全监测 ── -->
      <ContentArea
        v-else-if="page === 6"
        key="tech7"
        :content-bg="contentBg"
        :block-title="t7.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t7">
          <img class="t7__left-title" :src="t7.leftTitle" alt="" />
          <img class="t7__left-text" :src="t7.leftText" alt="" />
          <img class="t7__left-img" :src="t7.leftImg" alt="" />
          <img class="t7__right-title" :src="t7.rightTitle" alt="" />
          <img class="t7__right-text" :src="t7.rightText" alt="" />
          <img class="t7__right-img" :src="t7.rightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 8：智慧化喷淋降尘系统 ── -->
      <ContentArea
        v-else-if="page === 7"
        key="tech8"
        :content-bg="contentBg"
        :content-overlay="t8.overlay"
        :block-title="t8.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t8">
          <img class="t8__top-text" :src="t8.topText" alt="" />
          <img class="t8__bl-img" :src="t8.bottomLeftImg" alt="" />
          <img class="t8__br-img" :src="t8.bottomRightImg" alt="" />
        </div>
      </ContentArea>

      <!-- ── Tech 9：沉浸式安全培训（VR） ── -->
      <ContentArea
        v-else
        key="tech9"
        :content-bg="contentBg"
        :content-overlay="t9.overlay"
        :block-title="t9.blockTitle"
        :show-page-nav="true"
        @prev="goPrev"
        @next="goNext"
      >
        <div class="t9">
          <img class="t9__top-text" :src="t9.topText" alt="" />
          <img class="t9__bl-img" :src="t9.bottomLeftImg" alt="" />
          <img class="t9__br-img" :src="t9.bottomRightImg" alt="" />
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
    top: 0;
    left: 0;
    width: 68%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__left-bottom {
    position: absolute;
    bottom: -22%;
    left: 0;
    width: 68%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-text {
    position: absolute;
    top: 5%;
    right: 0;
    width: 28%;
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
    width: 64%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__left-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 64%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 34%;
    height: 100%;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }
}

/* ── Tech 3：上半(文字+箭头+图) + 下半(左卡片+右卡片) ── */
.t3 {
  position: absolute;
  inset: 0;

  /* 上半区域 */
  &__top-left-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 62%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__top-arrow {
    position: absolute;
    top: 6%;
    left: 64%;
    width: 8%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.5s, $delay: 0.8s);
  }

  &__top-right-img {
    position: absolute;
    top: 0;
    right: 0;
    width: 24%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
  }

  /* 下左卡片：薄层岩体深台阶预裂爆破施工 */
  &__bl-title {
    position: absolute;
    top: 42%;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.8s);
  }

  &__bl-text {
    position: absolute;
    top: 52%;
    left: 0;
    width: 24%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  /* 两张图角叠加：img1 在上，img2 左上角叠在 img1 右下角 */
  &__bl-img1 {
    position: absolute;
    top: 52%;
    left: 25%;
    width: 16%;
    height: auto;
    z-index: 1;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }

  &__bl-img2 {
    position: absolute;
    bottom: 0;
    left: 32%;
    width: 16%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
  }

  /* 下右卡片：边坡支护 */
  &__br-title {
    position: absolute;
    top: 42%;
    left: 52%;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.8s);
  }

  &__br-text {
    position: absolute;
    top: 52%;
    left: 52%;
    width: 24%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__br-img {
    position: absolute;
    top: 52%;
    right: 0;
    width: 20%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }
}

/* ── Tech 4：上方全宽文字 + 下左图 + 下右两组标题文字 ── */
.t4 {
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
    top: 26%;
    left: 0;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-title1 {
    position: absolute;
    top: 26%;
    left: 40%;
    width: 36%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.7s);
  }

  &__br-text1 {
    position: absolute;
    top: 34%;
    left: 40%;
    width: 60%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-title2 {
    position: absolute;
    top: 60%;
    left: 40%;
    width: 36%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.9s);
  }

  &__br-text2 {
    position: absolute;
    top: 68%;
    left: 40%;
    width: 60%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }
}

/* ── Tech 5：智慧安全管理（左右两栏：标题+图+文字） ── */
.t5 {
  position: absolute;
  inset: 0;

  &__left-title {
    position: absolute;
    top: 0;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__left-img {
    position: absolute;
    top: 12%;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__left-text {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }

  &__right-title {
    position: absolute;
    top: 0;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.7s);
  }

  &__right-img {
    position: absolute;
    top: 12%;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-text {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
  }
}

/* ── Tech 6：白马乌江大桥健康监测（上方文字+下方左右图） ── */
.t6 {
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
    width: 46%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 50%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

/* ── Tech 7：枢纽建设营运安全监测（左右两栏：标题+文字+图） ── */
.t7 {
  position: absolute;
  inset: 0;

  &__left-title {
    position: absolute;
    top: 0;
    left: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
  }

  &__left-text {
    position: absolute;
    top: 12%;
    left: 0;
    width: 30%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__left-img {
    position: absolute;
    top: 12%;
    left: 30%;
    width: 18%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-title {
    position: absolute;
    top: 0;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.7s);
  }

  &__right-text {
    position: absolute;
    top: 12%;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }

  &__right-img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 30%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
  }
}

/* ── Tech 8：智慧化喷淋降尘系统（上方文字+下方左右图） ── */
.t8 {
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
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 48%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}

/* ── Tech 9：沉浸式安全培训 VR（上方文字+下方左右图） ── */
.t9 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 72%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
  }

  &__bl-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
  }

  &__br-img {
    position: absolute;
    bottom: 0;
    left: 40%;
    width: 38%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
  }
}
</style>
