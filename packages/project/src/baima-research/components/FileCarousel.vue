<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

/**
 * 文件轮播组件（卡片栈），基于 bottom-left 的可用实现封装。
 *
 * 一个组件 = 一个卡片栈（屏幕上的一个展示位）。
 * - 组件根尺寸 = 最上层 card-frame 的尺寸（由父级 wrapper 定位与赋大小）。
 * - 支持多组数据：每组 = 若干卡片图 + 1 个文字/标题图。
 *   所有组的卡片拍平成一个轮播队列，自动往返轮播；
 *   当前置顶卡片属于哪一组，该组的文字图就显示在最上层（覆盖关系）。
 * - 支持触屏左右滑动、点击置顶。
 *
 * 父组件只需传入已解析好的图片 URL。
 */

interface CarouselGroup {
  /** 该组卡片图（已解析 URL），可多张 */
  files: string[]
  /** 该组文字/标题图（已解析 URL），可选 */
  text?: string
}

const props = withDefaults(
  defineProps<{
    /** 卡片框架背景图（已解析 URL） */
    frame: string
    /** 多组数据 */
    groups: CarouselGroup[]
    /**
     * 组件尺寸（设计稿 px）。
     * 传数字 = 只设置宽度，高度由父容器/内容自适应；
     * 传对象 = 分别设置 width / height。
     */
    frameSize?: number | { width: number; height: number }
    /**
     * 文字图尺寸（设计稿 px）。
     * 传数字 = 只设置宽度，高度按图片比例自适应；
     * 传对象 = 分别设置 width / height。
     */
    textSize?: number | { width: number; height: number }
    /** 文字图与卡片栈底部的间距（设计稿 px） */
    textGap?: number
    /** 是否自动轮播 */
    autoplay?: boolean
    /** 自动轮播间隔（ms） */
    interval?: number
    /**
     * 内容图相对框架的缩放比例（0~1）。
     * 可传数字（同时缩放宽高）或对象 { x, y }（分别设置）。
     */
    contentScale?: number | { x: number; y: number }
    /** 图片填充方式 */
    fit?: 'contain' | 'fill'
    /** 是否显示底部 dot 指示器 */
    showDots?: boolean
  }>(),
  {
    textGap: 20,
    autoplay: true,
    interval: 4000,
    contentScale() {
      return { x: 0.94, y: 0.96 }
    },
    fit: 'fill',
    showDots: true
  }
)

// 设计稿像素 -> 自适应 calc（与 design.scss 的 d.w()/d.h() 等价）
const dw = (px: number) => `calc(${px} / var(--design-w) * 100vw)`
const dh = (px: number) => `calc(${px} / var(--design-h) * 100vh)`

const rootStyle = computed(() => {
  const style: Record<string, string> = { position: 'absolute' }
  if (typeof props.frameSize === 'number') {
    style.width = dw(props.frameSize)
  } else if (props.frameSize) {
    style.width = dw(props.frameSize.width)
    style.height = dh(props.frameSize.height)
  } else {
    style.inset = '0'
  }
  return style
})

// 拍平所有组的卡片，并记录每张卡片所属的组下标
const cards = computed(() => {
  const out: { src: string; group: number }[] = []
  props.groups.forEach((g, gi) => {
    ;(g.files ?? []).forEach((f) => out.push({ src: f, group: gi }))
  })
  return out
})

// 当前置顶卡片下标（0-based）
const activeIndex = ref(0)

// 当前置顶卡片所属组
const activeGroup = computed(() => cards.value[activeIndex.value]?.group ?? 0)

// 卡片相对置顶卡片的偏移
function offsetOf(i: number) {
  return i - activeIndex.value
}

// 根据偏移给出卡片变换样式（仅前后各一张可见，其余移出视野）
function cardStyle(offset: number) {
  if (offset === 0) return { transform: 'translateX(0) scale(1)', zIndex: 5, opacity: 1 }
  if (offset === -1) {
    return { transform: 'translateX(-38%) scale(0.88)', zIndex: 4, opacity: 0.55 }
  }
  if (offset === 1) {
    return { transform: 'translateX(38%) scale(0.88)', zIndex: 4, opacity: 0.55 }
  }
  if (offset < 0) {
    return { transform: 'translateX(-55%) translateY(25%) scale(0.5)', zIndex: 1, opacity: 0 }
  }
  return { transform: 'translateX(55%) translateY(25%) scale(0.5)', zIndex: 1, opacity: 0 }
}

// ---------- 自动轮播（往返，避免末尾跳回首张的大幅位移） ----------
let timer: ReturnType<typeof setInterval> | null = null
let dir = 1

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  stopTimer()
  if (!props.autoplay || cards.value.length <= 1) return
  timer = setInterval(() => {
    const n = cards.value.length
    if (n <= 1) return
    if (activeIndex.value + dir > n - 1 || activeIndex.value + dir < 0) dir = -dir
    activeIndex.value += dir
  }, props.interval)
}

watch(
  cards,
  () => {
    activeIndex.value = 0
    dir = 1
    startTimer()
  },
  { immediate: true }
)

watch(
  () => [props.autoplay, props.interval],
  () => startTimer()
)

onBeforeUnmount(stopTimer)

// ---------- 点击置顶 ----------
function onCardClick(i: number) {
  if (i !== activeIndex.value) {
    activeIndex.value = i
    startTimer()
  }
}

// ---------- 触屏拖拽 ----------
let startX = 0
let isDragging = false
let stackEl: HTMLElement | null = null

function onTouchStart(e: TouchEvent) {
  stopTimer()
  startX = e.touches[0].clientX
  isDragging = true
  stackEl = e.currentTarget as HTMLElement
  stackEl.classList.add('is-dragging')
}
function onTouchMove(e: TouchEvent) {
  if (!isDragging || !stackEl) return
  e.preventDefault()
  const delta = e.touches[0].clientX - startX
  stackEl.style.transform = `translateX(${delta}px)`
}
function onTouchEnd(e: TouchEvent) {
  if (!isDragging || !stackEl) return
  isDragging = false
  stackEl.classList.remove('is-dragging')
  stackEl.style.transform = ''

  const delta = e.changedTouches[0].clientX - startX
  const threshold = 80
  const n = cards.value.length
  if (delta > threshold && activeIndex.value > 0) {
    activeIndex.value -= 1
  } else if (delta < -threshold && activeIndex.value < n - 1) {
    activeIndex.value += 1
  }
  startTimer()
}

// ---------- 动态样式 ----------
const textStyle = computed(() => {
  const style: Record<string, string> = {}
  if (typeof props.textSize === 'number') {
    style.width = dw(props.textSize)
  } else if (props.textSize) {
    style.width = dw(props.textSize.width)
    style.height = dh(props.textSize.height)
  }
  style.top = `calc(100% + ${dh(props.textGap)})`
  return style
})

const contentStyle = computed(() => {
  const sx = typeof props.contentScale === 'number' ? props.contentScale : props.contentScale.x
  const sy = typeof props.contentScale === 'number' ? props.contentScale : props.contentScale.y
  return {
    width: `${sx * 100}%`,
    height: `${sy * 100}%`,
    objectFit: props.fit
  }
})
</script>

<template>
  <div class="file-carousel" :style="rootStyle">
    <!-- 卡片栈：填满组件根（= 最上层 card-frame 区域） -->
    <div
      class="fc-stack"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <template v-if="cards.length">
        <div
          v-for="(card, i) in cards"
          :key="i"
          class="fc-card"
          :class="{ 'is-side': Math.abs(offsetOf(i)) === 1 }"
          :style="cardStyle(offsetOf(i))"
          @click="onCardClick(i)"
        >
          <img class="fc-card-frame" :class="{ 'is-top': offsetOf(i) === 0 }" :src="frame" alt="" />
          <img class="fc-card-content" :style="contentStyle" :src="card.src" alt="" />
        </div>
      </template>
      <!-- 无卡片时仅展示空框架 -->
      <div v-else class="fc-card" :style="cardStyle(0)">
        <img class="fc-card-frame is-top" :src="frame" alt="" />
      </div>
    </div>

    <!-- Dot 指示器：卡片数量 > 1 时显示 -->
    <div v-if="showDots && cards.length > 1" class="fc-dots">
      <span
        v-for="(_, i) in cards"
        :key="i"
        class="fc-dot"
        :class="{ 'is-active': i === activeIndex }"
        @click="onCardClick(i)"
      />
    </div>

    <!-- 文字图：每组一张，覆盖在卡片栈下方同一位置，当前组置顶 -->
    <img
      v-for="(g, gi) in groups"
      v-show="g.text"
      :key="gi"
      class="fc-text"
      :class="{ 'is-active': gi === activeGroup }"
      :style="textStyle"
      :src="g.text"
      alt=""
    />
  </div>
</template>

<style scoped lang="scss">
.file-carousel {
  position: absolute;
  /* 首次出现：淡入微缩，与父级 content block 的 fade 进场结合 */
  animation: fc-mount 0.5s 0.1s cubic-bezier(0.16, 1, 0.3, 1) backwards;

  .fc-stack {
    position: absolute;
    inset: 0;
    z-index: 1;

    &.is-dragging .fc-card {
      transition: none !important;
    }
  }

  .fc-card {
    position: absolute;
    width: 100%;
    height: 100%;
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    cursor: pointer;

    &.is-side {
      filter: brightness(0.8);
    }

    .fc-card-frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      transition: inherit;
      z-index: 1;

      &.is-top {
        filter: drop-shadow(0 d.h(6) d.w(20) rgba(0, 0, 0, 0.55));
      }
    }

    .fc-card-content {
      position: absolute;
      inset: 0;
      margin: auto;
      transition: inherit;
      z-index: 2;
    }
  }

  .fc-dots {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% - d.h(20));
    display: flex;
    gap: d.w(18);
    z-index: 3;

    .fc-dot {
      width: d.w(14);
      height: d.w(14);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      cursor: pointer;
      transition: background 0.3s ease;

      &.is-active {
        background: rgba(255, 255, 255, 0.9);
      }
    }
  }

  .fc-text {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    object-fit: contain;
    opacity: 1;
    z-index: 1;
    transition: opacity 0.4s ease;
    pointer-events: none;

    &.is-active {
      opacity: 1;
      z-index: 2;
    }
  }
}

@keyframes fc-mount {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
