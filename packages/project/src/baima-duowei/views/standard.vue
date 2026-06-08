<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'
import { usePageFlip } from '@baima-duowei/composables/usePageFlip'
import PageLayout from '../components/PageLayout.vue'
import ContentArea from '../components/ContentArea.vue'

const { page, prev: goPrev, next: goNext } = usePageFlip(4)

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
  <PageLayout :bg-overlay="headerBg" :title-src="headerTitle" title-alt="标准化建设">
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
          <div class="s1__top-left-text"><img :src="s1.topLeftText" alt="" /></div>
          <div class="s1__top-right-img1"><img :src="s1.topRightImg1" alt="" /></div>
          <div class="s1__top-right-img2"><img :src="s1.topRightImg2" alt="" /></div>
          <div class="s1__bottom">
            <div v-for="(src, i) in s1.bottomImgs" :key="i" class="s1__bottom-item">
              <img :src="src" alt="" />
            </div>
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
          <div class="s2__left-text"><img :src="s2.leftText" alt="" /></div>
          <div class="s2__right-grid">
            <div v-for="(src, i) in s2.rightImgs" :key="i" class="s2__grid-item">
              <img :src="src" alt="" />
            </div>
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
          <div class="s3__top-text"><img :src="s3.topText" alt="" /></div>
          <div class="s3__bl-img"><img :src="s3.bottomLeftImg" alt="" /></div>
          <div class="s3__br-img"><img :src="s3.bottomRightImg" alt="" /></div>
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
          <div class="s4__left-img"><img :src="s4.leftImg" alt="" /></div>
          <div class="s4__right-img"><img :src="s4.rightImg" alt="" /></div>
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

/* ── Standard 1：施工标准化 ── */
.s1 {
  position: absolute;
  inset: 0;

  &__top-left-text {
    position: absolute;
    top: d.h(722);
    right: d.w(1283);
    bottom: d.h(952);
    left: d.w(403);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__top-right-img1 {
    position: absolute;
    top: d.h(730);
    right: d.w(774);
    bottom: d.h(913);
    left: d.w(2680);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.7s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__top-right-img2 {
    position: absolute;
    top: d.h(730);
    right: d.w(355);
    bottom: d.h(912);
    left: d.w(3099);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
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
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
      object-fit: contain;
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
    top: d.h(762);
    right: d.w(359);
    bottom: d.h(1252);
    left: d.w(361);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__bl-img {
    position: absolute;
    top: d.h(952);
    right: d.w(1142);
    bottom: d.h(400);
    left: d.w(389);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__br-img {
    position: absolute;
    top: d.h(1176);
    right: d.w(395);
    bottom: d.h(654);
    left: d.w(2792);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* ── Standard 4：施工工艺标准化续（左侧图+右侧图） ── */
.s4 {
  position: absolute;
  inset: 0;

  &__left-img {
    position: absolute;
    top: d.h(751);
    right: d.w(2645);
    bottom: d.h(394);
    left: d.w(359);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.6s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__right-img {
    position: absolute;
    top: d.h(758);
    right: d.w(388);
    bottom: d.h(489);
    left: d.w(1656);
    @include fx.enter-fade-in($duration: 0.7s, $delay: 0.8s);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
