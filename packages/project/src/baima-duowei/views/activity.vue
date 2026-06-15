<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { usePageFlip } from '@baima-duowei/composables/usePageFlip'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const { page, setPage, prev: goPrev, next: goNext, isFirst, isLast } = usePageFlip(6)

// 中控翻页指令（同文档内通过 window 自定义事件传递）
function onPageCmd(e: Event) {
  const p = (e as CustomEvent).detail as { action?: string; index?: number }
  if (typeof p.index === 'number') setPage(p.index)
  else if (p.action === 'next') goNext()
  else if (p.action === 'prev') goPrev()
}
window.addEventListener('uec:page', onPageCmd)
onBeforeUnmount(() => window.removeEventListener('uec:page', onPageCmd))

const groupIndex = ref(0)
const subIndex = ref(0)

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
  overlay: resolvePkgUrl('activity/activity2/content-overlay.png'),
  subTitle: resolvePkgUrl('activity/activity2/sub-title.png'),
  textImg: resolvePkgUrl('activity/activity2/text-img.png'),
  bottomImg1: resolvePkgUrl('activity/activity2/bottom-img-1.png'),
  bottomImg2: resolvePkgUrl('activity/activity2/bottom-img-2.png'),
  bottomImg3: resolvePkgUrl('activity/activity2/bottom-img-3.png')
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
  rightImg1: resolvePkgUrl('activity/activity4/right-img-1.png'),
  rightImg2: resolvePkgUrl('activity/activity4/right-img-2.png'),
  rightImg3: resolvePkgUrl('activity/activity4/right-img-3.png')
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
  overlayStyle: {
    top: 'd.h(693)',
    left: 'd.w(330)',
    width: 'd.w(1334)',
    height: 'd.h(477)'
  },
  subTitle: resolvePkgUrl('activity/activity6/sub-title.png'),
  rightText: resolvePkgUrl('activity/activity6/right-text.png'),
  groups: [
    { imgs: [resolvePkgUrl('activity/activity6/gallery/1-1.jpeg'),resolvePkgUrl('activity/activity6/gallery/1-2.jpeg')], line: resolvePkgUrl('activity/activity6/gallery/line-1.png') },
    { imgs: [resolvePkgUrl('activity/activity6/gallery/2-1.jpeg'),resolvePkgUrl('activity/activity6/gallery/2-2.jpeg')], line: resolvePkgUrl('activity/activity6/gallery/line-2.png') },
    { imgs: [resolvePkgUrl('activity/activity6/gallery/3-1.jpeg'),resolvePkgUrl('activity/activity6/gallery/3-2.jpeg'),resolvePkgUrl('activity/activity6/gallery/3-3.jpeg')], line: resolvePkgUrl('activity/activity6/gallery/line-3.png') },
    { imgs: [resolvePkgUrl('activity/activity6/gallery/4-1.jpeg'),resolvePkgUrl('activity/activity6/gallery/4-2.jpeg')], line: resolvePkgUrl('activity/activity6/gallery/line-4.png') },
    { imgs: [resolvePkgUrl('activity/activity6/gallery/5-1.jpeg'),resolvePkgUrl('activity/activity6/gallery/5-2.jpeg')], line: resolvePkgUrl('activity/activity6/gallery/line-5.png') },
  ]
}

// a6 自动轮播
let a6Timer: ReturnType<typeof setInterval> | null = null
const startA6AutoPlay = () => {
  stopA6AutoPlay()
  a6Timer = setInterval(() => {
    const group = a6.groups[groupIndex.value]
    if (subIndex.value < group.imgs.length - 1) {
      subIndex.value++
    } else {
      groupIndex.value = (groupIndex.value + 1) % a6.groups.length
      subIndex.value = 0
    }
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
    groupIndex.value = 0
    subIndex.value = 0
  }
})

onBeforeUnmount(stopA6AutoPlay)

const pageData = [a1, a2, a3, a4, a5, a6]

const currentBlockTitle = computed(() => pageData[page.value].blockTitle)
const currentOverlay = computed(() => (pageData[page.value] as any).overlay)
const currentOverlayStyle = computed(() => (pageData[page.value] as any).overlayStyle)

/* 内容切换方向：next=向右翻页（内容左滑），prev=向左翻页（内容右滑） */
const slideDirection = ref<'slide-next' | 'slide-prev'>('slide-next')

function onPrev() {
  slideDirection.value = 'slide-prev'
  goPrev()
}
function onNext() {
  slideDirection.value = 'slide-next'
  goNext()
}
</script>

<template>
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="安全活动">
    <ContentArea
      :content-bg="contentBg"
      :content-overlay="currentOverlay"
      :content-overlay-style="currentOverlayStyle"
      :block-title="currentBlockTitle"
      :show-page-nav="true"
      :is-first="isFirst"
      :is-last="isLast"
      @prev="onPrev"
      @next="onNext"
    >
      <Transition :name="slideDirection" mode="out-in">
        <!-- ── Activity 1：安全生产月启动仪式 ── -->
        <div v-if="page === 0" class="a1" key="activity1">
          <div class="a1__left-title"><img :src="a1.leftTitle" alt="" /></div>
          <div class="a1__left-text"><img :src="a1.leftText" alt="" /></div>
          <div class="a1__right-img1"><img :src="a1.rightImg1" alt="" /></div>
          <div class="a1__right-img2"><img :src="a1.rightImg2" alt="" /></div>
          <div class="a1__right-img3"><img :src="a1.rightImg3" alt="" /></div>
        </div>

        <!-- ── Activity 2：道路交通安全驾驶知识专项培训 ── -->
        <div v-else-if="page === 1" class="a2" key="activity2">
          <div class="a2__sub-title"><img :src="a2.subTitle" alt="" /></div>
          <div class="a2__text-img"><img :src="a2.textImg" alt="" /></div>
          <div class="a2__bottom-img1"><img :src="a2.bottomImg1" alt="" /></div>
          <div class="a2__bottom-img2"><img :src="a2.bottomImg2" alt="" /></div>
          <div class="a2__bottom-img3"><img :src="a2.bottomImg3" alt="" /></div>
        </div>

        <!-- ── Activity 3：医学急救技能培训 ── -->
        <div v-else-if="page === 2" class="a3" key="activity3">
          <div class="a3__bg"></div>
          <div class="a3__sub-title"><img :src="a3.subTitle" alt="" /></div>
          <div class="a3__left-text"><img :src="a3.leftText" alt="" /></div>
          <div class="a3__right-img"><img :src="a3.rightImg" alt="" /></div>
        </div>

        <!-- ── Activity 4：消防安全知识专题培训 ── -->
        <div v-else-if="page === 3" class="a4" key="activity4">
          <div class="a4__bg"></div>
          <div class="a4__left-title"><img :src="a4.leftTitle" alt="" /></div>
          <div class="a4__left-text"><img :src="a4.leftText" alt="" /></div>
          <div class="a4__right-img1"><img :src="a4.rightImg1" alt="" /></div>
          <div class="a4__right-img2"><img :src="a4.rightImg2" alt="" /></div>
          <div class="a4__right-img3"><img :src="a4.rightImg3" alt="" /></div>
        </div>

        <!-- ── Activity 5：安全大讲堂 ── -->
        <div v-else-if="page === 4" class="a5" key="activity5">
          <div class="a5__bg"></div>
          <div class="a5__left-img"><img :src="a5.leftImg" alt="" /></div>
          <div class="a5__right-title"><img :src="a5.rightTitle" alt="" /></div>
          <div class="a5__right-text"><img :src="a5.rightText" alt="" /></div>
        </div>

        <!-- ── Activity 6：应急演练 ── -->
        <div v-else class="a6" key="activity6" @mouseenter="stopA6AutoPlay" @mouseleave="startA6AutoPlay">
          <div class="a6__bg"></div>
          <div class="a6__sub-title"><img :src="a6.subTitle" alt="" /></div>
          <div class="a6__left-img">
            <img
              v-for="(src, i) in a6.groups[groupIndex].imgs"
              :key="i"
              :src="src"
              :class="{ 'is-active': subIndex === i }"
              alt=""
            />
          </div>
          <div class="a6__right-text"><img :src="a6.rightText" alt="" /></div>
          <div
            v-for="(group, i) in a6.groups"
            :key="i"
            :class="[
              'a6__right-line',
              `a6__right-line--${i + 1}`,
              { 'is-active': groupIndex === i }
            ]"
            @mouseenter="groupIndex = i; subIndex = 0"
          >
            <img :src="group.line" alt="" />
          </div>
        </div>
      </Transition>
    </ContentArea>
  </PageLayout>
</template>

<style scoped lang="scss">
/* @use '@shared/styles/transitions' as fx; */

/* ── 内容切换方向性过渡 ── */
/* 点击"下一页"（右按钮）：当前内容向左滑出，新内容从右侧滑入 */
.slide-next-enter-active {
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-next-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(4vw);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-4vw);
}

/* 点击"上一页"（左按钮）：当前内容向右滑出，新内容从左侧滑入 */
.slide-prev-enter-active {
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-prev-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-4vw);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(4vw);
}

/* ── 内容入场方向性动效：左/右两侧滑入、底部上浮 ── */
@keyframes a-in-left {
  from {
    opacity: 0;
    transform: translateX(-8vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes a-in-right {
  from {
    opacity: 0;
    transform: translateX(8vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes a-in-bottom {
  from {
    opacity: 0;
    transform: translateY(6vh);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@mixin a-from-left($duration: 0.7s, $delay: 0.75s) {
  animation: a-in-left $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
}
@mixin a-from-right($duration: 0.7s, $delay: 0.75s) {
  animation: a-in-right $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
}
@mixin a-from-bottom($duration: 0.7s, $delay: 0.75s) {
  animation: a-in-bottom $duration $delay cubic-bezier(0.16, 1, 0.3, 1) both;
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
    @include a-from-left($duration: 0.9s, $delay: 0.75s);
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
    @include a-from-left($duration: 1s, $delay: 0.95s);
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
    @include a-from-right($duration: 1s, $delay: 0.85s);
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
    @include a-from-right($duration: 1s, $delay: 1.05s);
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
    @include a-from-right($duration: 1s, $delay: 1.15s);
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
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.75s);
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
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__bottom-img1 {
    position: absolute;
    top: d.h(1226);
    left: d.w(682);
    width: d.w(750);
    height: d.h(385);
    @include a-from-bottom($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bottom-img2 {
    position: absolute;
    top: d.h(1225);
    left: d.w(1545);
    width: d.w(750);
    height: d.h(386);
    @include a-from-bottom($duration: 1s, $delay: 1.25s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bottom-img3 {
    position: absolute;
    top: d.h(1225);
    left: d.w(2409);
    width: d.w(752);
    height: d.h(386);
    @include a-from-bottom($duration: 1s, $delay: 1.35s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Activity 3：副标题+左文字+右2x2图 ── */
.a3 {
  position: absolute;
  inset: 0;

  &__bg {
    position: absolute;
    top: d.h(1172);
    left: d.w(358);
    width: d.w(1913);
    height: d.h(590);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__sub-title {
    position: absolute;
    top: d.h(854);
    right: d.w(2054);
    bottom: d.h(1214);
    left: d.w(843);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.75s);
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
    @include a-from-left($duration: 1s, $delay: 0.95s);
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
    @include a-from-right($duration: 1s, $delay: 0.85s);
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

  &__bg {
    position: absolute;
    top: d.h(852);
    left: d.w(358);
    width: d.w(3120);
    height: d.h(910);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__left-title {
    position: absolute;
    top: d.h(778);
    right: d.w(2244);
    bottom: d.h(1290);
    left: d.w(653);
    @include a-from-left($duration: 0.9s, $delay: 0.75s);
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
    @include a-from-left($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img1 {
    position: absolute;
    top: d.h(1004);
    left: d.w(1997);
    width: d.w(478);
    height: d.h(359);
    @include a-from-right($duration: 1s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img2 {
    position: absolute;
    top: d.h(999);
    left: d.w(2524);
    width: d.w(492);
    height: d.h(369);
    @include a-from-right($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img3 {
    position: absolute;
    top: d.h(884);
    left: d.w(3061);
    width: d.w(354);
    height: d.h(483);
    @include a-from-right($duration: 1s, $delay: 1.05s);
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

  &__bg {
    position: absolute;
    top: d.h(994);
    left: d.w(1571);
    width: d.w(1914);
    height: d.h(590);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__left-img {
    position: absolute;
    top: d.h(802);
    right: d.w(2284);
    bottom: d.h(358);
    left: d.w(319);
    @include a-from-left($duration: 1s, $delay: 0.75s);
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
    @include a-from-right($duration: 0.9s, $delay: 0.85s);
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
    @include a-from-right($duration: 1s, $delay: 1.05s);
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

  &__bg {
    position: absolute;
    top: d.h(1177);
    left: d.w(1721);
    width: d.w(1765);
    height: d.h(591);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__sub-title {
    position: absolute;
    top: d.h(797);
    right: d.w(1192);
    bottom: d.h(1271);
    left: d.w(1705);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.75s);
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
    @include a-from-left($duration: 1s, $delay: 0.85s);
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.4s ease;
      &.is-active {
        opacity: 1;
      }
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(947);
    right: d.w(404);
    bottom: d.h(515);
    left: d.w(1785);
    @include a-from-right($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-line {
    position: absolute;
    cursor: pointer;
    @include a-from-right($duration: 0.9s, $delay: 1.05s);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transform: scale(0.96) translateX(1vw);
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &.is-active img {
      opacity: 1;
      transform: scale(1) translateX(0);
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

@keyframes bg-fade-in {
  from { opacity: 0; }
  to   { opacity: 0.5; }
}
</style>

<!-- 背景块离场渐隐：非 scoped -->
<style lang="scss">
.page-leave-active .a3__bg,
.page-leave-active .a4__bg,
.page-leave-active .a5__bg,
.page-leave-active .a6__bg {
  animation: bg-fade-out 0.4s ease both;
}

@keyframes bg-fade-out {
  from { opacity: 0.5; }
  to   { opacity: 0; }
}
</style>
