<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { usePageFlip } from '@baima-duowei/composables/usePageFlip'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const { page, setPage, prev: goPrev, next: goNext, isFirst, isLast } = usePageFlip(9)

// 中控翻页指令（同文档内通过 window 自定义事件传递）
function onPageCmd(e: Event) {
  const p = (e as CustomEvent).detail as { action?: string; index?: number }
  if (typeof p.index === 'number') setPage(p.index)
  else if (p.action === 'next') goNext()
  else if (p.action === 'prev') goPrev()
}
window.addEventListener('uec:page', onPageCmd)
onBeforeUnmount(() => window.removeEventListener('uec:page', onPageCmd))

const headerBg = resolvePkgUrl('shared/header-bg.png')
const headerTitle = resolvePkgUrl('tech/header-title.png')

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
  overlayStyle: {
    top: 'd.h(428)',
    left: 'd.w(2645)',
    width: 'd.w(810)',
    height: 'd.h(652)'
  },
  leftText: resolvePkgUrl('tech/tech2/left-text.png'),
  leftImg1: resolvePkgUrl('tech/tech2/left-img-1.png'),
  leftImg2: resolvePkgUrl('tech/tech2/left-img-2.png'),
  rightImg: resolvePkgUrl('tech/tech2/right-img.png')
}

// Tech 3
const t3 = {
  blockTitle: resolvePkgUrl('tech/tech3/block-title.png'),
  topLeftText: resolvePkgUrl('tech/tech3/top-left-text.png'),
  topArrow: resolvePkgUrl('tech/tech3/top-arrow.png'),
  topRightImg: resolvePkgUrl('tech/tech3/top-right-img.png'),
  bottomLeftTitle: resolvePkgUrl('tech/tech3/bottom-left-title.png'),
  bottomLeftImg1: resolvePkgUrl('tech/tech3/bottom-left-img1.png'),
  bottomLeftImg2: resolvePkgUrl('tech/tech3/bottom-left-img2.png'),
  bottomRightTitle: resolvePkgUrl('tech/tech3/bottom-right-title.png'),
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

const pageData = [t1, t2, t3, t4, t5, t6, t7, t8, t9]

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
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="智慧技术">
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
        <!-- ── Tech 1 ── -->
        <div v-if="page === 0" class="t1" key="tech1">
          <div class="t1__left-top"><img :src="t1.leftTop" alt="" /></div>
          <div class="t1__left-bottom"><img :src="t1.leftBottom" alt="" /></div>
          <div class="t1__right-text"><img :src="t1.rightText" alt="" /></div>
        </div>

        <!-- ── Tech 2 ── -->
        <div v-else-if="page === 1" class="t2" key="tech2">
          <div class="t2__left-text"><img :src="t2.leftText" alt="" /></div>
          <div class="t2__left-img1"><img :src="t2.leftImg1" alt="" /></div>
          <div class="t2__left-img2"><img :src="t2.leftImg2" alt="" /></div>
          <div class="t2__right-img"><img :src="t2.rightImg" alt="" /></div>
        </div>

        <!-- ── Tech 3：高边坡爆破开挖安全防控 ── -->
        <div v-else-if="page === 2" class="t3" key="tech3">
          <!-- 上半：左文字 + 箭头 + 右图 -->
          <div class="t3__top-left-text"><img :src="t3.topLeftText" alt="" /></div>
          <div class="t3__top-arrow"><img :src="t3.topArrow" alt="" /></div>
          <div class="t3__top-right-img"><img :src="t3.topRightImg" alt="" /></div>
          <!-- 下左卡片：薄层岩体深台阶预裂爆破施工 -->
          <div class="t3__bl-title"><img :src="t3.bottomLeftTitle" alt="" /></div>
          <div class="t3__bl-img1"><img :src="t3.bottomLeftImg1" alt="" /></div>
          <div class="t3__bl-img2"><img :src="t3.bottomLeftImg2" alt="" /></div>
          <!-- 下右卡片：边坡支护 -->
          <div class="t3__br-title"><img :src="t3.bottomRightTitle" alt="" /></div>
          <div class="t3__br-img"><img :src="t3.bottomRightImg" alt="" /></div>
        </div>

        <!-- ── Tech 4：智慧安全管理 ── -->
        <div v-else-if="page === 3" class="t4" key="tech4">
          <!-- 上方全宽文字 -->
          <div class="t4__top-text"><img :src="t4.topText" alt="" /></div>
          <!-- 下左图片 -->
          <div class="t4__bl-img"><img :src="t4.bottomLeftImg" alt="" /></div>
          <!-- 下右两组 -->
          <div class="t4__br-title1"><img :src="t4.bottomRightTitle1" alt="" /></div>
          <div class="t4__br-text1"><img :src="t4.bottomRightText1" alt="" /></div>
          <div class="t4__br-title2"><img :src="t4.bottomRightTitle2" alt="" /></div>
          <div class="t4__br-text2"><img :src="t4.bottomRightText2" alt="" /></div>
        </div>

        <!-- ── Tech 5：智慧安全管理 ── -->
        <div v-else-if="page === 4" class="t5" key="tech5">
          <div class="t5__left-bg"></div>
          <div class="t5__right-bg"></div>
          <div class="t5__left-title"><img :src="t5.leftTitle" alt="" /></div>
          <div class="t5__left-img"><img :src="t5.leftImg" alt="" /></div>
          <div class="t5__left-text"><img :src="t5.leftText" alt="" /></div>
          <div class="t5__right-title"><img :src="t5.rightTitle" alt="" /></div>
          <div class="t5__right-img"><img :src="t5.rightImg" alt="" /></div>
          <div class="t5__right-text"><img :src="t5.rightText" alt="" /></div>
        </div>

        <!-- ── Tech 6：白马乌江大桥健康监测 ── -->
        <div v-else-if="page === 5" class="t6" key="tech6">
          <div class="t6__top-text"><img :src="t6.topText" alt="" /></div>
          <div class="t6__bl-img"><img :src="t6.bottomLeftImg" alt="" /></div>
          <div class="t6__br-img"><img :src="t6.bottomRightImg" alt="" /></div>
        </div>

        <!-- ── Tech 7：枢纽建设营运安全监测 ── -->
        <div v-else-if="page === 6" class="t7" key="tech7">
          <div class="t7__left-bg"></div>
          <div class="t7__right-bg"></div>
          <div class="t7__left-title"><img :src="t7.leftTitle" alt="" /></div>
          <div class="t7__left-text"><img :src="t7.leftText" alt="" /></div>
          <div class="t7__left-img"><img :src="t7.leftImg" alt="" /></div>
          <div class="t7__right-title"><img :src="t7.rightTitle" alt="" /></div>
          <div class="t7__right-text"><img :src="t7.rightText" alt="" /></div>
          <div class="t7__right-img"><img :src="t7.rightImg" alt="" /></div>
        </div>

        <!-- ── Tech 8：智慧化喷淋降尘系统 ── -->
        <div v-else-if="page === 7" class="t8" key="tech8">
          <div class="t8__top-text"><img :src="t8.topText" alt="" /></div>
          <div class="t8__bl-img"><img :src="t8.bottomLeftImg" alt="" /></div>
          <div class="t8__br-img"><img :src="t8.bottomRightImg" alt="" /></div>
        </div>

        <!-- ── Tech 9：沉浸式安全培训（VR） ── -->
        <div v-else class="t9" key="tech9">
          <div class="t9__top-text"><img :src="t9.topText" alt="" /></div>
          <div class="t9__bl-img"><img :src="t9.bottomLeftImg" alt="" /></div>
          <div class="t9__br-img"><img :src="t9.bottomRightImg" alt="" /></div>
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

/* ── Tech 1 ── */
.t1 {
  position: absolute;
  inset: 0;

  &__left-top {
    position: absolute;
    top: d.h(712);
    right: d.w(1290);
    bottom: d.h(355);
    left: d.w(325);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-bottom {
    position: absolute;
    top: d.h(1802);
    right: d.w(1321);
    bottom: d.h(211);
    left: d.w(276);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(809);
    right: d.w(356);
    bottom: d.h(563);
    left: d.w(2592);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 2 ── */
.t2 {
  position: absolute;
  inset: 0;

  &__left-text {
    position: absolute;
    top: d.h(811);
    right: d.w(1401);
    bottom: d.h(927);
    left: d.w(358);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-img1 {
    position: absolute;
    top: d.h(1312);
    right: d.w(2831);
    bottom: d.h(396);
    left: d.w(358);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-img2 {
    position: absolute;
    top: d.h(1312);
    right: d.w(1343);
    bottom: d.h(397);
    left: d.w(1025);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(860);
    right: d.w(355);
    bottom: d.h(393);
    left: d.w(2517);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.85s);

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 3：上半(文字+箭头+图) + 下半(左卡片+右卡片) ── */
.t3 {
  position: absolute;
  inset: 0;

  /* 上半区域 */
  &__top-left-text {
    position: absolute;
    top: d.h(743);
    right: d.w(1346);
    bottom: d.h(1175);
    left: d.w(358);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__top-arrow {
    position: absolute;
    top: d.h(708);
    right: d.w(1072);
    bottom: d.h(1210);
    left: d.w(2533);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__top-right-img {
    position: absolute;
    top: d.h(659);
    right: d.w(448);
    bottom: d.h(1174);
    left: d.w(2797);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  /* 下左卡片：薄层岩体深台阶预裂爆破施工 */
  &__bl-title {
    position: absolute;
    top: d.h(1038);
    right: d.w(1559);
    bottom: d.h(433);
    left: d.w(249);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  /* 两张图角叠加：img1 在上，img2 左上角叠在 img1 右下角 */
  &__bl-img1 {
    position: absolute;
    top: d.h(1182);
    right: d.w(1814);
    bottom: d.h(605);
    left: d.w(1284);
    z-index: 1;
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bl-img2 {
    position: absolute;
    top: d.h(1414);
    right: d.w(1617);
    bottom: d.h(395);
    left: d.w(1557);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.25s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  /* 下右卡片：边坡支护 */
  &__br-title {
    position: absolute;
    top: d.h(1038);
    right: d.w(300);
    bottom: d.h(436);
    left: d.w(2380);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-img {
    position: absolute;
    top: d.h(1154);
    right: d.w(421);
    bottom: d.h(437);
    left: d.w(3073);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 4：上方全宽文字 + 下左图 + 下右两组标题文字 ── */
.t4 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: d.h(744);
    right: d.w(366);
    bottom: d.h(1266);
    left: d.w(361);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bl-img {
    position: absolute;
    top: d.h(948);
    right: d.w(2118);
    bottom: d.h(399);
    left: d.w(365);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-title1 {
    position: absolute;
    top: d.h(952);
    right: d.w(1220);
    bottom: d.h(1108);
    left: d.w(1766);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-text1 {
    position: absolute;
    top: d.h(1077);
    right: d.w(357);
    bottom: d.h(869);
    left: d.w(1798);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-title2 {
    position: absolute;
    top: d.h(1322);
    right: d.w(1220);
    bottom: d.h(738);
    left: d.w(1766);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-text2 {
    position: absolute;
    top: d.h(1447);
    right: d.w(368);
    bottom: d.h(422);
    left: d.w(1797);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 5：智慧安全管理（左右两栏：标题+图+文字） ── */
.t5 {
  position: absolute;
  inset: 0;

  /* 左右两栏背景底图 */
  &__left-bg {
    position: absolute;
    top: d.h(777);
    left: d.w(361);
    width: d.w(1510);
    height: d.h(985);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__right-bg {
    position: absolute;
    top: d.h(777);
    left: d.w(1973);
    width: d.w(1510);
    height: d.h(985);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__left-title {
    position: absolute;
    top: d.h(675);
    right: d.w(2297);
    bottom: d.h(1385);
    left: d.w(689);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-img {
    position: absolute;
    top: d.h(801);
    right: d.w(2160);
    bottom: d.h(753);
    left: d.w(552);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-text {
    position: absolute;
    top: d.h(1465);
    right: d.w(2046);
    bottom: d.h(460);
    left: d.w(439);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-title {
    position: absolute;
    top: d.h(676);
    right: d.w(684);
    bottom: d.h(1384);
    left: d.w(2302);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(801);
    right: d.w(548);
    bottom: d.h(753);
    left: d.w(2165);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(1465);
    right: d.w(437);
    bottom: d.h(457);
    left: d.w(2052);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.25s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 6：白马乌江大桥健康监测（上方文字+下方左右图） ── */
.t6 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: d.h(750);
    right: d.w(360);
    bottom: d.h(1168);
    left: d.w(358);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bl-img {
    position: absolute;
    top: d.h(1084);
    right: d.w(2257);
    bottom: d.h(398);
    left: d.w(427);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-img {
    position: absolute;
    top: d.h(958);
    right: d.w(421);
    bottom: d.h(258);
    left: d.w(1737);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 7：枢纽建设营运安全监测（左右两栏：标题+文字+图） ── */
.t7 {
  position: absolute;
  inset: 0;

  /* 左右两栏背景底图 */
  &__left-bg {
    position: absolute;
    top: d.h(777);
    left: d.w(361);
    width: d.w(1488);
    height: d.h(985);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__right-bg {
    position: absolute;
    top: d.h(777);
    left: d.w(1996);
    width: d.w(1487);
    height: d.h(985);
    background: linear-gradient(to top, #0042B0, transparent);
    opacity: 0.5;
    animation: bg-fade-in 0.8s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__left-title {
    position: absolute;
    top: d.h(753);
    right: d.w(2363);
    bottom: d.h(1307);
    left: d.w(729);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-text {
    position: absolute;
    top: d.h(999);
    right: d.w(2010);
    bottom: d.h(539);
    left: d.w(453);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__left-img {
    position: absolute;
    top: d.h(998);
    right: d.w(2029);
    bottom: d.h(705);
    left: d.w(1257);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-title {
    position: absolute;
    top: d.h(753);
    right: d.w(673);
    bottom: d.h(1307);
    left: d.w(2313);
    @include fx.enter-fade-in($duration: 0.9s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-text {
    position: absolute;
    top: d.h(981);
    right: d.w(527);
    bottom: d.h(966);
    left: d.w(2205);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(1107);
    right: d.w(523);
    bottom: d.h(490);
    left: d.w(2246);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.15s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 8：智慧化喷淋降尘系统（上方文字+下方左右图） ── */
.t8 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: d.h(780);
    right: d.w(726);
    bottom: d.h(1138);
    left: d.w(737);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bl-img {
    position: absolute;
    top: d.h(1107);
    right: d.w(2048);
    bottom: d.h(397);
    left: d.w(729);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-img {
    position: absolute;
    top: d.h(1107);
    right: d.w(728);
    bottom: d.h(397);
    left: d.w(1834);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Tech 9：沉浸式安全培训 VR（上方文字+下方左右图） ── */
.t9 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: d.h(772);
    right: d.w(1298);
    bottom: d.h(1150);
    left: d.w(382);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bl-img {
    position: absolute;
    top: d.h(1154);
    right: d.w(2498);
    bottom: d.h(400);
    left: d.w(359);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-img {
    position: absolute;
    top: d.h(1154);
    right: d.w(1278);
    bottom: d.h(400);
    left: d.w(1381);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
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
.page-leave-active .t5__left-bg,
.page-leave-active .t5__right-bg,
.page-leave-active .t8__left-bg,
.page-leave-active .t8__right-bg {
  animation: bg-fade-out 0.4s ease both;
}

@keyframes bg-fade-out {
  from { opacity: 0.5; }
  to   { opacity: 0; }
}
</style>
