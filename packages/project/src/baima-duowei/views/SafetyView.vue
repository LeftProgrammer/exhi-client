<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()

const bgVideo = resolvePkgUrl('shared/line-flow.mp4')
const headerTitle = resolvePkgUrl('safety/header-title.png')
const blockTitleBg = resolvePkgUrl('safety/block-title-bg.png')
const blockTitleText = resolvePkgUrl('safety/block-title-text.png')
const contentBg = resolvePkgUrl('safety/content-bg.png')
const contentBottom = resolvePkgUrl('safety/content-bottom-title.png')
const leftItems = [1, 2, 3].map((n) => resolvePkgUrl(`safety/left-${n}.png`))
const rightItems = [1, 2, 3, 4, 5, 6].map((n) => resolvePkgUrl(`safety/right-${n}.png`))

const btnPrevNormal = resolvePkgUrl('safety/btn-prev-normal.png')
const btnPrevActive = resolvePkgUrl('safety/btn-prev-active.png')
const btnOuterNormal = resolvePkgUrl('safety/btn-outer-normal.png')
const btnOuterActive = resolvePkgUrl('safety/btn-outer-active.png')
const btnInnerNormal = resolvePkgUrl('safety/btn-inner-normal.png')
const btnInnerActive = resolvePkgUrl('safety/btn-inner-active.png')
const btnHomeNormal = resolvePkgUrl('safety/btn-home-normal.png')
const btnHomeActive = resolvePkgUrl('safety/btn-home-active.png')

const prevHover = ref(false)
const nextHover = ref(false)
const homeHover = ref(false)

function goPrev() {
  router.push({ name: 'standard' })
}
function goNext() {
  router.push({ name: 'tech' })
}
function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="safety">
    <video
      class="safety__video"
      :src="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />
    <div class="safety__veil" />

    <PageHeader :title-src="headerTitle" title-alt="安全成效" />

    <section class="safety__content">
      <div class="safety__block-title">
        <img class="safety__block-bg" :src="blockTitleBg" alt="" aria-hidden="true" />
        <img class="safety__block-text" :src="blockTitleText" alt="2025 零事故 零伤亡" />
      </div>

      <div class="safety__body">
        <img class="safety__body-bg" :src="contentBg" alt="" aria-hidden="true" />
        <div class="safety__body-left">
          <img v-for="(src, i) in leftItems" :key="i" :src="src" alt="" />
        </div>
        <div class="safety__body-right">
          <img v-for="(src, i) in rightItems" :key="i" :src="src" alt="" />
        </div>
      </div>

      <div class="safety__bottom">
        <img :src="contentBottom" alt="安全生产目标全面达成" />
      </div>
    </section>

    <nav class="safety__nav">
      <button
        class="safety__nav-btn"
        @mouseenter="prevHover = true"
        @mouseleave="prevHover = false"
        @touchstart="prevHover = true"
        @touchend="prevHover = false"
        @click="goPrev"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" />
        <img
          :src="prevHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer-hover"
          alt=""
        />
        <img
          :src="prevHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
        />
        <img
          :src="prevHover ? btnPrevActive : btnPrevNormal"
          class="btn-layer btn-icon"
          alt="上一页"
        />
      </button>

      <button
        class="safety__nav-btn"
        @mouseenter="nextHover = true"
        @mouseleave="nextHover = false"
        @touchstart="nextHover = true"
        @touchend="nextHover = false"
        @click="goNext"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" />
        <img
          :src="nextHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer-hover"
          alt=""
        />
        <img
          :src="nextHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
        />
        <img
          :src="nextHover ? btnPrevActive : btnPrevNormal"
          class="btn-layer btn-icon btn-icon--flip"
          alt="下一页"
        />
      </button>

      <button
        class="safety__nav-btn"
        @mouseenter="homeHover = true"
        @mouseleave="homeHover = false"
        @touchstart="homeHover = true"
        @touchend="homeHover = false"
        @click="goHome"
      >
        <img :src="btnOuterNormal" class="btn-layer btn-outer" alt="" />
        <img
          :src="homeHover ? btnOuterActive : btnOuterNormal"
          class="btn-layer btn-outer-hover"
          alt=""
        />
        <img
          :src="homeHover ? btnInnerActive : btnInnerNormal"
          class="btn-layer btn-inner"
          alt=""
        />
        <img
          :src="homeHover ? btnHomeActive : btnHomeNormal"
          class="btn-layer btn-icon"
          alt="首页"
        />
      </button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

.safety {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
  display: flex;
  flex-direction: column;
}

.safety__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
}

.safety__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: rgba(5, 11, 26, 0.5);
}

// ── 内容区 ──
.safety__content {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 3% 8%;
  gap: 1.5%;
}

.safety__block-title {
  position: relative;
  flex-shrink: 0;

  .safety__block-bg {
    display: block;
    width: 100%;
    height: auto;
  }

  .safety__block-text {
    position: absolute;
    top: 50%;
    left: 3%;
    transform: translateY(-50%);
    width: 55%;
    @include fx.reveal-shine-lr($duration: 1.2s, $delay: 0.5s);
  }
}

.safety__body {
  position: relative;
  flex: 1;

  .safety__body-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
  }

  .safety__body-left {
    position: absolute;
    top: 5%;
    left: 2%;
    width: 28%;
    display: flex;
    flex-direction: column;
    gap: 4%;

    img {
      display: block;
      width: 100%;
      height: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    }
  }

  .safety__body-right {
    position: absolute;
    top: 8%;
    right: 2%;
    width: 22%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6%;

    img {
      display: block;
      width: 100%;
      height: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
    }
  }
}

.safety__bottom {
  flex-shrink: 0;

  img {
    display: block;
    width: 100%;
    height: auto;
    @include fx.reveal-shine-lr($duration: 1.2s, $delay: 1.3s);
  }
}

// ── 导航按钮 ──
.safety__nav {
  position: absolute;
  bottom: 3%;
  right: 3%;
  z-index: 3;
  display: flex;
  gap: 1.2vw;
}

.safety__nav-btn {
  position: relative;
  width: 6vw;
  height: 6vw;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.92);
  }

  .btn-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .btn-outer-hover {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .btn-outer-hover {
    opacity: 1;
  }

  .btn-icon--flip {
    transform: scaleX(-1);
  }
}
</style>
