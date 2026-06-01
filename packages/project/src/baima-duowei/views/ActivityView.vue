<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { usePageFlip } from '@baima-duowei/composables/usePageFlip'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const { page, prev: goPrev, next: goNext } = usePageFlip(6)

const activeIndex = ref(0)

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
  leftTitle: resolvePkgUrl('activity/activity4/left-title.png'),
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
  leftImgs: [1, 2, 3, 4, 5].map((n) => resolvePkgUrl(`activity/activity6/left-img-${n}.png`)),
  rightText: resolvePkgUrl('activity/activity6/right-text.png'),
  rightLines: [1, 2, 3, 4, 5].map((n) => resolvePkgUrl(`activity/activity6/right-line-${n}.png`))
}

// a6 自动轮播
let a6Timer: ReturnType<typeof setInterval> | null = null
const startA6AutoPlay = () => {
  stopA6AutoPlay()
  a6Timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % a6.rightLines.length
  }, 3000)
}
const stopA6AutoPlay = () => {
  if (a6Timer) {
    clearInterval(a6Timer)
    a6Timer = null
  }
}

watch(page, (p) => {
  if (p === 5) startA6AutoPlay()
  else {
    stopA6AutoPlay()
    activeIndex.value = 0
  }
})

onBeforeUnmount(stopA6AutoPlay)
</script>

<template>
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="安全活动">
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
          <div class="a1__left-title"><img :src="a1.leftTitle" alt="" /></div>
          <div class="a1__left-text"><img :src="a1.leftText" alt="" /></div>
          <div class="a1__right-img1"><img :src="a1.rightImg1" alt="" /></div>
          <div class="a1__right-img2"><img :src="a1.rightImg2" alt="" /></div>
          <div class="a1__right-img3"><img :src="a1.rightImg3" alt="" /></div>
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
          <div class="a2__sub-title"><img :src="a2.subTitle" alt="" /></div>
          <div class="a2__text-img"><img :src="a2.textImg" alt="" /></div>
          <div class="a2__bottom-img"><img :src="a2.bottomImg" alt="" /></div>
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
          <div class="a3__sub-title"><img :src="a3.subTitle" alt="" /></div>
          <div class="a3__left-text"><img :src="a3.leftText" alt="" /></div>
          <div class="a3__right-img"><img :src="a3.rightImg" alt="" /></div>
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
          <div class="a4__left-title"><img :src="a4.leftTitle" alt="" /></div>
          <div class="a4__left-text"><img :src="a4.leftText" alt="" /></div>
          <div class="a4__right-img"><img :src="a4.rightImg" alt="" /></div>
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
          <div class="a5__left-img"><img :src="a5.leftImg" alt="" /></div>
          <div class="a5__right-title"><img :src="a5.rightTitle" alt="" /></div>
          <div class="a5__right-text"><img :src="a5.rightText" alt="" /></div>
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
        <div
          class="a6"
          @mouseenter="stopA6AutoPlay"
          @mouseleave="startA6AutoPlay"
        >
          <div class="a6__sub-title"><img :src="a6.subTitle" alt="" /></div>
          <div class="a6__left-img"><img :src="a6.leftImgs[activeIndex]" alt="" /></div>
          <div class="a6__right-text"><img :src="a6.rightText" alt="" /></div>
          <div
            v-for="(src, i) in a6.rightLines"
            :key="i"
            :class="['a6__right-line', `a6__right-line--${i + 1}`, { 'is-active': activeIndex === i }]"
            @mouseenter="activeIndex = i"
          >
            <img :src="src" alt="" />
          </div>
        </div>
      </ContentArea>
    </Transition>
  </PageLayout>
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

/* ── Activity 1：左文字+右图片 ── */
.a1 {
  position: absolute;
  inset: 0;

  &__left-title {
    position: absolute;
    top: d.h(997);
    right: d.w(2066);
    bottom: d.h(1071);
    left: d.w(689);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__left-text {
    position: absolute;
    top: d.h(1147);
    right: d.w(1759);
    bottom: d.h(587);
    left: d.w(381);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img1 {
    position: absolute;
    top: d.h(711);
    right: d.w(871);
    bottom: d.h(1063);
    left: d.w(2217);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img2 {
    position: absolute;
    top: d.h(1013);
    right: d.w(619);
    bottom: d.h(761);
    left: d.w(2469);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img3 {
    position: absolute;
    top: d.h(1316);
    right: d.w(355);
    bottom: d.h(459);
    left: d.w(2733);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Activity 2：居中副标题+全宽内容（文字+图片合成） ── */
.a2 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: d.h(754);
    right: d.w(1136);
    bottom: d.h(1314);
    left: d.w(1148);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__text-img {
    position: absolute;
    top: d.h(901);
    right: d.w(358);
    bottom: d.h(1017);
    left: d.w(368);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__bottom-img {
    position: absolute;
    top: d.h(1225);
    right: d.w(356);
    bottom: d.h(369);
    left: d.w(356);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 1s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Activity 3：副标题+左文字+右2x2图 ── */
.a3 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: d.h(854);
    right: d.w(2054);
    bottom: d.h(1214);
    left: d.w(843);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__left-text {
    position: absolute;
    top: d.h(1000);
    right: d.w(1670);
    bottom: d.h(550);
    left: d.w(458);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(576);
    right: d.w(214);
    bottom: d.h(258);
    left: d.w(2154);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Activity 4：左文字+右图片（带overlay） ── */
.a4 {
  position: absolute;
  inset: 0;

  &__left-title {
    position: absolute;
    top: d.h(778);
    right: d.w(2244);
    bottom: d.h(1290);
    left: d.w(653);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__left-text {
    position: absolute;
    top: d.h(941);
    right: d.w(1985);
    bottom: d.h(521);
    left: d.w(412);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(124);
    right: d.w(295);
    bottom: d.h(544);
    left: d.w(1890);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Activity 5：左图+右标题文字 ── */
.a5 {
  position: absolute;
  inset: 0;

  &__left-img {
    position: absolute;
    top: d.h(802);
    right: d.w(2284);
    bottom: d.h(358);
    left: d.w(319);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-title {
    position: absolute;
    top: d.h(898);
    right: d.w(821);
    bottom: d.h(1170);
    left: d.w(2076);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.7s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(1055);
    right: d.w(479);
    bottom: d.h(678);
    left: d.w(1695);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Activity 6：副标题+左图+右文字+右行列表 ── */
.a6 {
  position: absolute;
  inset: 0;

  &__sub-title {
    position: absolute;
    top: d.h(797);
    right: d.w(1192);
    bottom: d.h(1271);
    left: d.w(1705);
    @include fx.enter-fade-in($duration: 0.6s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__left-img {
    position: absolute;
    top: d.h(838);
    right: d.w(2170);
    bottom: d.h(370);
    left: d.w(320);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(947);
    right: d.w(404);
    bottom: d.h(515);
    left: d.w(1785);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-line {
    position: absolute;
    cursor: pointer;
    @include fx.enter-fade-in($duration: 0.5s, $delay: 0.9s);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &.is-active img {
      opacity: 1;
    }

    &--1 {
      top: d.h(1025);
      right: d.w(1679);
      bottom: d.h(1052);
      left: d.w(1670);
    }
    &--2 {
      top: d.h(1115);
      right: d.w(879);
      bottom: d.h(962);
      left: d.w(1670);
    }
    &--3 {
      top: d.h(1207);
      right: d.w(479);
      bottom: d.h(869);
      left: d.w(1670);
    }
    &--4 {
      top: d.h(1301);
      right: d.w(365);
      bottom: d.h(776);
      left: d.w(1670);
    }
    &--5 {
      top: d.h(1393);
      right: d.w(1679);
      bottom: d.h(684);
      left: d.w(1670);
    }
  }
}
</style>
