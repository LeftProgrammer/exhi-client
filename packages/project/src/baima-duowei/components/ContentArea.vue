<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import { useProjectSfx } from '@shared/composables/useProjectSfx'

/** 把 d.h(N) / d.w(N) 字符串转为 CSS calc()
 *  公式：设计稿像素 / designBase × 100vw/vh（与 design.scss 的 d.w()/d.h() 等价）
 */
function resolveDesignValue(val: string | undefined): string | undefined {
  if (!val) return undefined
  return val
    .replace(/d\.h\((\d+(?:\.\d+)?)\)/g, 'calc($1 / var(--design-h) * 100vh)')
    .replace(/d\.w\((\d+(?:\.\d+)?)\)/g, 'calc($1 / var(--design-w) * 100vw)')
}

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
  /** 内容区上层装饰覆盖图（可选，基于页面级定位，不随 contentBg 尺寸） */
  contentOverlay?: string
  /** overlay 定位样式：{ top, right, bottom, left, width, height }（默认 inset:0 填满） */
  contentOverlayStyle?: { top?: string; right?: string; bottom?: string; left?: string; width?: string; height?: string }
  /** 顶部标题块图片（背景+文字合一） */
  blockTitle: string
  /** 是否显示上一页/下一页导航按钮 */
  showPageNav?: boolean
  /** 是否在第一页（上一页按钮置灰禁用） */
  isFirst?: boolean
  /** 是否在最后一页（下一页按钮置灰禁用） */
  isLast?: boolean
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
const { play: playSfx } = useProjectSfx()

function goHome() {
  playSfx('back')
  router.push({ name: 'home' })
}

/** 上一页：边界时给出"到头"反馈，否则播放翻页音并触发翻页 */
function onPrev() {
  if (props.isFirst) {
    playSfx('tap')
    return
  }
  playSfx('page')
  emit('prev')
}

/** 下一页：边界时给出"到头"反馈，否则播放翻页音并触发翻页 */
function onNext() {
  if (props.isLast) {
    playSfx('tap')
    return
  }
  playSfx('page')
  emit('next')
}

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

/** overlay 计算后的行内样式：自动解析 d.h() / d.w() */
const overlayComputedStyle = computed(() => {
  if (!props.contentOverlayStyle) return undefined
  const s = props.contentOverlayStyle
  const style: Record<string, string> = {}
  const keys = ['top', 'right', 'bottom', 'left', 'width', 'height'] as const
  for (const k of keys) {
    const v = s[k]
    if (v) style[k] = resolveDesignValue(v)!
  }
  // 一旦自定义了定位/大小，取消默认 inset:0 的约束
  if (Object.keys(style).length > 0) {
    if (!style.top) style.top = 'auto'
    if (!style.right) style.right = 'auto'
    if (!style.bottom) style.bottom = 'auto'
    if (!style.left) style.left = 'auto'
  }
  return style
})
</script>

<template>
  <div class="content-area__wrapper">
    <!-- 背景层 -->
    <div class="content-area">
      <img class="content-area__bg" :src="props.contentBg" alt="" />
    </div>

    <!-- overlay：基于 content-area__wrapper（页面级）独立定位 -->
    <Transition name="overlay-fade" mode="out-in" appear>
      <img
        v-if="props.contentOverlay"
        :key="props.contentOverlay"
        class="content-area__overlay"
        :src="props.contentOverlay"
        :style="overlayComputedStyle"
        alt=""
      />
    </Transition>

    <!-- 顶部标题块（基于 sec-page__body 定位） -->
    <img
      :key="props.blockTitle"
      class="content-area__block-title"
      :src="props.blockTitle"
      alt=""
    />

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
          :class="{ 'is-disabled': props.isFirst }"
          :disabled="props.isFirst"
          @mouseenter="!props.isFirst && (prevHover = true)"
          @mouseleave="prevHover = false"
          @touchstart="!props.isFirst && (prevHover = true)"
          @touchend="prevHover = false"
          @click="onPrev"
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
          :class="{ 'is-disabled': props.isLast }"
          :disabled="props.isLast"
          @mouseenter="!props.isLast && (nextHover = true)"
          @mouseleave="nextHover = false"
          @touchstart="!props.isLast && (nextHover = true)"
          @touchend="nextHover = false"
          @click="onNext"
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
  position: relative;
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

/* 内容区上层覆盖：基于 content-area__wrapper（页面级）独立定位 */
.content-area__overlay {
  position: absolute;
  top: d.h(302);
  left: d.w(191);
  width: d.w(3458);
  height: d.h(1762);
  object-fit: fill;
  z-index: 0;
  pointer-events: none;
}

/* 内部切换：overlay 离场渐隐 + 入场渐显 + 轻微缩放位移 */
.overlay-fade-enter-active {
  transition:
    opacity 1.4s ease 0.5s,
    transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
}
.overlay-fade-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.overlay-fade-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(2vh);
}
.overlay-fade-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-1vh);
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
  animation: block-title-in 1.2s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* 二级标题块：从右侧滑入 + 淡入 */
@keyframes block-title-in {
  from {
    opacity: 0;
    transform: translateX(20vw);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.18s ease,
    opacity 0.3s ease;

  /* 点击/触屏按压：整体压缩 + 提亮，触屏也能感知 */
  &:active {
    transform: scale(0.9);
    filter: brightness(1.2);
    transition:
      transform 0.08s ease,
      filter 0.08s ease;

    .btn-inner,
    .btn-icon {
      transform: scale(0.88);
    }

    .btn-icon--flip {
      transform: scaleX(-1) scale(0.88);
    }
  }

  /* 边界禁用：置灰半透明、停转、不可点 */
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.32;
    filter: grayscale(0.6);
    pointer-events: none;

    .btn-spin-wrap {
      animation-play-state: paused;
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

<!-- 底部按钮区入场/离场：非 scoped，匹配全局 transition class -->
<style lang="scss">
/* 入场：底部按钮区渐显上浮 */
.content-area__footer {
  animation: footer-fade-in 0.8s 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes footer-fade-in {
  from {
    opacity: 0;
    transform: translateY(3vh);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 离场：overlay 渐隐 */
.page-leave-active .content-area__overlay {
  animation: overlay-fade-out 0.5s ease-in both;
}

@keyframes overlay-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* 离场：内容区整体渐隐 */
.page-leave-active .content-area__main {
  animation: main-fade-out 0.5s ease-in both;
}

@keyframes main-fade-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(1vh); }
}

/* 离场：二级标题渐隐右滑 */
.page-leave-active .content-area__block-title {
  animation: block-title-out 0.5s ease-in both;
}

@keyframes block-title-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20vw);
  }
}

/* 离场：按钮区渐隐下沉 */
.page-leave-active .content-area__footer {
  animation: footer-fade-out 0.5s ease-in both;
}

@keyframes footer-fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(2vh);
  }
}
</style>
