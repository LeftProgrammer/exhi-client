<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { usePageFlip } from '@baima-duowei/composables/usePageFlip'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const { page, setPage, prev: goPrev, next: goNext, isFirst, isLast } = usePageFlip(4)

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
const headerTitle = resolvePkgUrl('standard/header-title.png')
const contentBg = resolvePkgUrl('shared/content-bg.png')

// Standard 1
const s1 = {
  blockTitle: resolvePkgUrl('standard/standard1/block-title.png'),
  overlay: resolvePkgUrl('standard/standard1/content-overlay.png'),
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
  bottomRightText: resolvePkgUrl('standard/standard3/bottom-right-text.png'),
  bottomRightBg: resolvePkgUrl('standard/standard3/bottom-right-bg.png')
}

// Standard 4
const s4 = {
  blockTitle: resolvePkgUrl('standard/standard4/block-title.png'),
  leftImg1: resolvePkgUrl('standard/standard4/left-img-1.png'),
  leftImg2: resolvePkgUrl('standard/standard4/left-img-2.png'),
  rightImg1: resolvePkgUrl('standard/standard4/right-img-1.png'),
  rightImg2: resolvePkgUrl('standard/standard4/right-img-2.png')
}

const pageData = [s1, s2, s3, s4]

const currentBlockTitle = computed(() => pageData[page.value].blockTitle)
const currentOverlay = computed(() => (pageData[page.value] as any).overlay)

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
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="标准化建设">
    <ContentArea
      :content-bg="contentBg"
      :content-overlay="currentOverlay"
      :block-title="currentBlockTitle"
      :show-page-nav="true"
      :is-first="isFirst"
      :is-last="isLast"
      @prev="onPrev"
      @next="onNext"
    >
      <Transition :name="slideDirection" mode="out-in">
        <!-- ── Standard 1：施工标准化 ── -->
        <div v-if="page === 0" class="s1" key="standard1">
          <div class="s1__top-left-text"><img :src="s1.topLeftText" alt="" /></div>
          <div class="s1__top-right-img1"><img :src="s1.topRightImg1" alt="" /></div>
          <div class="s1__top-right-img2"><img :src="s1.topRightImg2" alt="" /></div>
          <div class="s1__bottom">
            <div v-for="(src, i) in s1.bottomImgs" :key="i" class="s1__bottom-item">
              <img :src="src" alt="" />
            </div>
          </div>
        </div>

        <!-- ── Standard 2：现场布设标准化 ── -->
        <div v-else-if="page === 1" class="s2" key="standard2">
          <div class="s2__left-text"><img :src="s2.leftText" alt="" /></div>
          <div class="s2__right-grid">
            <div v-for="(src, i) in s2.rightImgs" :key="i" class="s2__grid-item">
              <img :src="src" alt="" />
            </div>
          </div>
        </div>

        <!-- ── Standard 3：施工工艺标准化 ── -->
        <div v-else-if="page === 2" class="s3" key="standard3">
          <div class="s3__top-text"><img :src="s3.topText" alt="" /></div>
          <div class="s3__bl-img"><img :src="s3.bottomLeftImg" alt="" /></div>
          <div class="s3__br-bg"><img :src="s3.bottomRightBg" alt="" /></div>
          <div class="s3__br-text"><img :src="s3.bottomRightText" alt="" /></div>
        </div>

        <!-- ── Standard 4：施工工艺标准化（续） ── -->
        <div v-else class="s4" key="standard4">
          <div class="s4__left-img1"><img :src="s4.leftImg1" alt="" /></div>
          <div class="s4__left-img2"><img :src="s4.leftImg2" alt="" /></div>
          <div class="s4__right-img1"><img :src="s4.rightImg1" alt="" /></div>
          <div class="s4__right-img2"><img :src="s4.rightImg2" alt="" /></div>
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

/* ── Standard 1：施工标准化 ── */
.s1 {
  position: absolute;
  inset: 0;

  &__top-left-text {
    position: absolute;
    top: d.h(875);
    right: d.w(1331);
    bottom: d.h(1134);
    left: d.w(449);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__top-right-img1 {
    position: absolute;
    top: d.h(730);
    right: d.w(774);
    bottom: d.h(913);
    left: d.w(2680);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.85s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__top-right-img2 {
    position: absolute;
    top: d.h(730);
    right: d.w(355);
    bottom: d.h(912);
    left: d.w(3099);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__bottom {
    position: absolute;
    top: d.h(1274);
    right: d.w(355);
    bottom: d.h(397);
    left: d.w(358);
    display: flex;
    gap: d.w(45);

    &-item {
      flex: 1;
      overflow: hidden;
      @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);

      img {
        width: 100%;
        height: 100%;
        object-fit: fill;
      }
    }
  }
}

/* ── Standard 2：现场布设标准化 ── */
.s2 {
  position: absolute;
  inset: 0;

  &__left-text {
    position: absolute;
    top: d.h(829);
    right: d.w(2818);
    bottom: d.h(542);
    left: d.w(413);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-grid {
    position: absolute;
    top: d.h(727);
    right: d.w(355);
    bottom: d.h(397);
    left: d.w(1138);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr 1fr;
    gap: d.h(45) d.w(44);
  }

  &__grid-item {
    width: 100%;
    height: 100%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
      @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    }
  }
}

/* ── Standard 3：施工工艺标准化（上方文字+下方左图+右文字） ── */
.s3 {
  position: absolute;
  inset: 0;

  &__top-text {
    position: absolute;
    top: d.h(762);
    right: d.w(359);
    bottom: d.h(1252);
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
    top: d.h(952);
    right: d.w(1142);
    bottom: d.h(400);
    left: d.w(389);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-bg {
    position: absolute;
    top: d.h(1058);
    left: d.w(2651);
    width: d.w(964);
    height: d.h(599);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__br-text {
    position: absolute;
    top: d.h(1176);
    left: d.w(2792);
    width: d.w(653);
    height: d.h(330);
    @include fx.enter-fade-in($duration: 1s, $delay: 1.05s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}

/* ── Standard 4：施工工艺标准化续（左侧图+右侧图） ── */
.s4 {
  position: absolute;
  inset: 0;

  &__left-img1 {
    position: absolute;
    top: d.h(751);
    right: d.w(2645);
    bottom: d.h(394);
    left: d.w(359);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
  &__left-img2 {
    position: absolute;
    top: d.h(758);
    right: d.w(2310);
    bottom: d.h(899);
    left: d.w(1145);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.75s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  &__right-img1 {
    position: absolute;
    top: d.h(758);
    right: d.w(388);
    bottom: d.h(764);
    left: d.w(1656);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
  &__right-img2 {
    position: absolute;
    top: d.h(1389);
    right: d.w(387);
    bottom: d.h(489);
    left: d.w(1655);
    @include fx.enter-fade-in($duration: 1s, $delay: 0.95s);
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }
}
</style>
