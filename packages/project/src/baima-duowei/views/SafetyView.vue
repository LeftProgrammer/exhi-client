<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'

const router = useRouter()

const headerBg = resolvePkgUrl('safety/header-bg.png')
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
  <SecondaryPage :bg-overlay="headerBg" :title-src="headerTitle" title-alt="安全成效">
    <div class="safety__body">
      <img class="safety__body-bg" :src="contentBg" alt="" aria-hidden="true" />

      <div class="safety__block-title">
        <img class="safety__block-bg" :src="blockTitleBg" alt="" aria-hidden="true" />
        <img class="safety__block-text" :src="blockTitleText" alt="2025 零事故 零伤亡" />
      </div>

      <div class="safety__body-main">
        <div class="safety__body-left">
          <img v-for="(src, i) in leftItems" :key="i" :src="src" alt="" />
        </div>
        <div class="safety__body-right">
          <img v-for="(src, i) in rightItems" :key="i" :src="src" alt="" />
        </div>
      </div>

      <div class="safety__footer">
        <div class="safety__bottom">
          <img :src="contentBottom" alt="安全生产目标全面达成" />
        </div>

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
      </div>
      <!-- safety__footer -->
    </div>
    <!-- safety__body -->
  </SecondaryPage>
</template>

<style scoped lang="scss">
@use '@shared/styles/transitions' as fx;

.safety__block-title {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 58%;

  .safety__block-bg {
    display: block;
    width: 100%;
    height: auto;
  }

  .safety__block-text {
    position: absolute;
    top: 24%;
    left: 9%;
    display: block;
    width: 55%;
    height: auto;
    @include fx.enter-fade-in($duration: 0.8s, $delay: 0.5s);
  }
}

/* 大容器：绝对定位，四周留边距，flex 列排内容 */
.safety__body {
  position: absolute;
  top: 3%;
  left: 4%;
  right: 4%;
  bottom: 3%;
  display: flex;
  flex-direction: column;
  padding: 5vh 5vw 3vh 5vw;
  gap: 2vh;

  .safety__body-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }
}

/* 中部内容区：奖杯 + 左右数据 */
.safety__body-main {
  position: relative;
  z-index: 1;
  flex: 1;

  .safety__body-left {
    position: absolute;
    top: 5%;
    left: 2%;
    display: flex;
    flex-direction: column;
    gap: 6vh;

    img {
      display: block;
      height: 8vh; // 与右边统一高度，字体大小一致
      width: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 0.9s);
    }
  }

  .safety__body-right {
    position: absolute;
    top: 8%;
    right: 6%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 45%;
    column-gap: 20%;

    img {
      display: block;
      // 固定高度保持文字比例一致，宽度自适应
      height: 6vh;
      width: auto;
      @include fx.enter-fade-in($duration: 0.7s, $delay: 1.1s);
    }
  }
}

/* 底部区：标语绝对居中，导航按钮靠右 */
.safety__footer {
  position: relative;
  flex-shrink: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

/* 底部标语：绝对居中于 footer */
.safety__bottom {
  position: absolute;
  left: 52%;
  transform: translateX(-50%);

  img {
    display: block;
    width: 30vw;
    height: auto;
    @include fx.enter-fade-in($duration: 0.8s, $delay: 1.3s);
  }
}

.safety__nav {
  display: flex;
  gap: 1.2vw;
  flex-shrink: 0;
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
