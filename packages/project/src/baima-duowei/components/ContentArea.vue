<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

/**
 * 二级页面内容区容器。
 *
 * 层级（从底到顶）：contentBg(z0) → contentOverlay(z0) → main/slot(z1) → blockTitle/footer(z2)
 * slot 内容可超出 main 区域，超出部分自动滑入标题和底栏下方。
 *
 * @slot default 中间内容区（自由布局，支持溢出）
 */
const props = defineProps<{
  /** 内容区底层背景图 */
  contentBg: string
  /** 内容区上层装饰覆盖图（可选，与 contentBg 同尺寸，叠在其上） */
  contentOverlay?: string
  /** 顶部标题块图片（背景+文字合一） */
  blockTitle: string
  /** 是否显示上一页/下一页导航按钮 */
  showPageNav?: boolean
  /** 中间内容区边距（默认 title 下方全铺满） */
  mainInset?: { top?: string; left?: string; right?: string; bottom?: string }
}>()

const emit = defineEmits<{
  /** 点击上一页 */
  prev: []
  /** 点击下一页 */
  next: []
}>()

const router = useRouter()

const btnOuterNormal = resolvePkgUrl('shared/btn-outer-normal.png')
const btnOuterActive = resolvePkgUrl('shared/btn-outer-active.png')
const btnInnerNormal = resolvePkgUrl('shared/btn-inner-normal.png')
const btnInnerActive = resolvePkgUrl('shared/btn-inner-active.png')
const btnHomeNormal = resolvePkgUrl('shared/btn-home-normal.png')
const btnHomeActive = resolvePkgUrl('shared/btn-home-active.png')
const btnPrevNormal = resolvePkgUrl('shared/btn-prev-normal.png')
const btnPrevActive = resolvePkgUrl('shared/btn-prev-active.png')

const homeHover = ref(false)
const prevHover = ref(false)
const nextHover = ref(false)

function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="content-area__wrapper">
    <!-- 背景层 -->
    <div class="content-area">
      <img class="content-area__bg" :src="props.contentBg" alt="" />
      <img
        v-if="props.contentOverlay"
        class="content-area__overlay"
        :src="props.contentOverlay"
        alt=""
      />
    </div>

    <!-- 顶部标题块（基于 sec-page__body 定位） -->
    <img class="content-area__block-title" :src="props.blockTitle" alt="" />

    <!-- 中间内容区：不设定位样式，slot 内容直接基于 sec-page__body 定位 -->
    <div class="content-area__main">
      <slot />
    </div>

    <!-- 底部 footer：导航按钮（基于 sec-page__body 定位） -->
    <div class="content-area__footer">
      <nav class="content-area__nav">
        <!-- 上一页 -->
        <button
          v-if="props.showPageNav"
          class="content-area__nav-btn"
          @mouseenter="prevHover = true"
          @mouseleave="prevHover = false"
          @touchstart="prevHover = true"
          @touchend="prevHover = false"
          @click="emit('prev')"
        >
          <img :src="btnOuterNormal" class="btn-layer btn-outer--normal" alt="" />
          <img :src="btnOuterActive" class="btn-layer btn-outer--active" alt="" />
          <div class="btn-spin-wrap">
            <img :src="btnInnerNormal" class="btn-layer btn-inner--normal" alt="" />
            <img :src="btnInnerActive" class="btn-layer btn-inner--active" alt="" />
          </div>
          <img
            :src="prevHover ? btnPrevActive : btnPrevNormal"
            class="btn-layer btn-icon"
            alt="上一页"
          />
        </button>

        <!-- 下一页（图标水平翻转复用 prev） -->
        <button
          v-if="props.showPageNav"
          class="content-area__nav-btn"
          @mouseenter="nextHover = true"
          @mouseleave="nextHover = false"
          @touchstart="nextHover = true"
          @touchend="nextHover = false"
          @click="emit('next')"
        >
          <img :src="btnOuterNormal" class="btn-layer btn-outer--normal" alt="" />
          <img :src="btnOuterActive" class="btn-layer btn-outer--active" alt="" />
          <div class="btn-spin-wrap">
            <img :src="btnInnerNormal" class="btn-layer btn-inner--normal" alt="" />
            <img :src="btnInnerActive" class="btn-layer btn-inner--active" alt="" />
          </div>
          <img
            :src="nextHover ? btnPrevActive : btnPrevNormal"
            class="btn-layer btn-icon btn-icon--flip"
            alt="下一页"
          />
        </button>

        <!-- 首页 -->
        <button
          class="content-area__nav-btn"
          @mouseenter="homeHover = true"
          @mouseleave="homeHover = false"
          @touchstart="homeHover = true"
          @touchend="homeHover = false"
          @click="goHome"
        >
          <img :src="btnOuterNormal" class="btn-layer btn-outer--normal" alt="" />
          <img :src="btnOuterActive" class="btn-layer btn-outer--active" alt="" />
          <div class="btn-spin-wrap">
            <img :src="btnInnerNormal" class="btn-layer btn-inner--normal" alt="" />
            <img :src="btnInnerActive" class="btn-layer btn-inner--active" alt="" />
          </div>
          <img
            :src="homeHover ? btnHomeActive : btnHomeNormal"
            class="btn-layer btn-icon"
            alt="首页"
          />
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped lang="scss">
@keyframes btn-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.content-area__wrapper {
  position: static;
  width: 100%;
  height: 100%;
}

.content-area {
  position: absolute;
  top: d.h(290);
  left: d.w(191);
  right: d.w(191);
  bottom: d.h(96);

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }
}

/* 内容区上层覆盖 */
.content-area__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 0;
  pointer-events: none;
}

/* 顶部标题块（基于 sec-page__body 绝对定位） */
.content-area__block-title {
  position: absolute;
  top: d.h(452);
  left: d.w(343);
  z-index: 2;
  display: block;
  width: auto;
  height: d.h(305);
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.5s);
}

/* 底部区 */
.content-area__footer {
  position: absolute;
  left: d.w(343);
  right: d.w(343);
  bottom: d.h(159);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

/* 导航按钮 */
.content-area__nav {
  display: flex;
  gap: 1.2vw;
  flex-shrink: 0;
}

.content-area__nav-btn {
  position: relative;
  width: d.w(171);
  height: d.h(171);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  /* 点击：整体压缩 */
  &:active {
    .btn-inner,
    .btn-icon {
      transform: scale(0.88);
    }
  }

  .btn-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition:
      transform 0.15s ease,
      opacity 0.2s ease;
  }

  /* 旋转由 div 负责，不接触 img 的 transform，避免与 transition 冲突 */
  .btn-spin-wrap {
    position: absolute;
    inset: 0;
    animation: btn-spin 6s linear infinite;

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: opacity 0.25s ease;
    }
  }

  /* 外框静止，hover 切换 opacity */
  .btn-outer--normal,
  .btn-outer--active {
    transition: opacity 0.25s ease;
  }

  .btn-outer--normal {
    opacity: 1;
  }
  .btn-outer--active {
    opacity: 0;
  }

  /* 内层圆盘旋转，hover 切换颜色 */
  .btn-inner--normal {
    opacity: 1;
    transition: opacity 0.25s ease;
  }
  .btn-inner--active {
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  &:hover {
    .btn-outer--normal {
      opacity: 0;
    }
    .btn-outer--active {
      opacity: 1;
    }
    .btn-inner--normal {
      opacity: 0;
    }
    .btn-inner--active {
      opacity: 1;
    }
    .btn-icon {
      transform: scale(1.12);
    }
  }

  .btn-icon--flip {
    transform: scaleX(-1);
  }

  &:hover .btn-icon--flip {
    transform: scaleX(-1) scale(1.12);
  }
}
</style>
