<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useSfx } from '@shared/composables/useSfx'
import TabBar from './TabBar.vue'
import { COMMON, type ModuleDef } from '../data/modules'

const props = defineProps<{
  module: ModuleDef
  /** 交互模式：pager（翻页，默认）| scroll（纵向滚动） */
  mode?: 'pager' | 'scroll'
}>()

const router = useRouter()
const sfx = useSfx()
const contentRef = ref<HTMLDivElement | null>(null)

/** 自定义滚动条状态 */
const scrollProgress = ref(0)
const hasOverflow = ref(false)

function updateHasOverflow() {
  const el = contentRef.value
  if (!el) {
    hasOverflow.value = false
    return
  }
  hasOverflow.value = el.scrollHeight > el.clientHeight
}

function onContentScroll() {
  const el = contentRef.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  scrollProgress.value = max > 0 ? el.scrollTop / max : 0
  hasOverflow.value = max > 0
}

/** 滑块高度占轨道的百分比 */
const THUMB_H_PCT = 3

const progressStyle = computed(() => {
  return { height: `${scrollProgress.value * 100}%` }
})

const thumbStyle = computed(() => {
  const maxOffset = 100 - THUMB_H_PCT
  const top = scrollProgress.value * maxOffset
  return { top: `${top}%` }
})

/** 滚动条拖拽交互 */
const isDragging = ref(false)
const dragOnThumb = ref(false)
const dragStartY = ref(0)
const dragStartRatio = ref(0)
const scrollbarRef = ref<HTMLDivElement | null>(null)

function getBarInfo() {
  const bar = scrollbarRef.value
  if (!bar) return null
  const rect = bar.getBoundingClientRect()
  return { top: rect.top, height: rect.height }
}

function scrollToRatio(ratio: number) {
  const el = contentRef.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  el.scrollTop = Math.max(0, Math.min(max, Math.max(0, Math.min(1, ratio)) * max))
}

function onScrollbarPointerDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const info = getBarInfo()
  if (!info) return

  const ratio = (clientY - info.top) / info.height
  const halfThumb = THUMB_H_PCT / 2 / 100
  const maxOffset = 100 - THUMB_H_PCT
  const thumbCenter = (scrollProgress.value * maxOffset + THUMB_H_PCT / 2) / 100

  if (Math.abs(ratio - thumbCenter) <= halfThumb) {
    // 按在胶囊上：记录起始位置，进入相对拖拽
    dragOnThumb.value = true
    dragStartY.value = clientY
    dragStartRatio.value = scrollProgress.value
    sfx.play('tap')
  } else {
    // 按在轨道上：直接跳转
    dragOnThumb.value = false
    scrollToRatio(ratio)
    sfx.play('tap')
  }
  isDragging.value = true
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  // 滚动条拖拽
  if (isDragging.value) {
    if (dragOnThumb.value) {
      const info = getBarInfo()
      if (info) {
        const deltaRatio = (clientY - dragStartY.value) / info.height
        scrollToRatio(dragStartRatio.value + deltaRatio)
      }
    } else {
      const info = getBarInfo()
      if (info) scrollToRatio((clientY - info.top) / info.height)
    }
  }

  // 内容区拖拽
  if (isContentDragging.value && contentRef.value) {
    contentDragLastY.value = clientY
    const deltaY = contentDragStartY.value - clientY
    if (!contentDragMoved.value && Math.abs(deltaY) > CONTENT_DRAG_THRESHOLD) {
      contentDragMoved.value = true
    }
    if (contentDragMoved.value) {
      contentRef.value.scrollTop = contentDragStartScrollTop.value + deltaY
    }
  }
}

function onPointerUp() {
  // 滚动条释放
  if (isDragging.value) {
    isDragging.value = false
    dragOnThumb.value = false
    dragStartY.value = 0
    dragStartRatio.value = 0
  }

  // 内容区释放：边界回弹切 tab
  if (isContentDragging.value && contentRef.value) {
    const el = contentRef.value
    const max = el.scrollHeight - el.clientHeight
    const totalDeltaY = contentDragStartY.value - contentDragLastY.value
    if (contentDragMoved.value) {
      // 在顶部继续下拉超过阈值 → 切上一个 tab
      if (contentDragStartScrollTop.value <= 0 && totalDeltaY < -CONTENT_EDGE_SWITCH_THRESHOLD) {
        sfx.play('page')
        prevPage()
      }
      // 在底部继续上拉超过阈值 → 切下一个 tab
      else if (contentDragStartScrollTop.value >= max && totalDeltaY > CONTENT_EDGE_SWITCH_THRESHOLD) {
        sfx.play('page')
        nextPage()
      }
    }
    isContentDragging.value = false
    contentDragMoved.value = false
  }
}

/** 内容区拖拽滚动 */
const isContentDragging = ref(false)
const contentDragStartY = ref(0)
const contentDragLastY = ref(0)
const contentDragStartScrollTop = ref(0)
const contentDragMoved = ref(false)
const CONTENT_DRAG_THRESHOLD = 10
const CONTENT_EDGE_SWITCH_THRESHOLD = 60

function onContentPointerDown(e: MouseEvent | TouchEvent) {
  if (!isScroll.value || !contentRef.value) return
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  isContentDragging.value = true
  contentDragStartY.value = clientY
  contentDragLastY.value = clientY
  contentDragStartScrollTop.value = contentRef.value.scrollTop
  contentDragMoved.value = false
}

// 全局监听拖拽中事件（组件卸载时清理）
onMounted(() => {
  updateHasOverflow()
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onPointerMove, { passive: false } as EventListenerOptions)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchmove', onPointerMove, { passive: false } as EventListenerOptions)
    window.removeEventListener('touchend', onPointerUp)
  }
})

const activeTab = ref(0)
const activePage = ref(0)

const isScroll = computed(() => props.mode === 'scroll')

const currentTab = computed(() => props.module.tabs[activeTab.value])
const pages = computed(() => currentTab.value?.pages ?? [])
const currentPage = computed(() => pages.value[activePage.value] ?? null)
const pageCount = computed(() => pages.value.length)
const tabCount = computed(() => props.module.tabs.length)

const showPager = computed(() => !isScroll.value && (tabCount.value > 1 || pageCount.value > 1))
const canPrev = computed(() => activePage.value > 0 || activeTab.value > 0)
const canNext = computed(
  () => activePage.value < pageCount.value - 1 || activeTab.value < tabCount.value - 1
)

/** scroll 模式下内容区起始偏移（设计稿 px） */
const SCROLL_OFFSET_TOP = 926

/** scroll 模式下根据 blocks 最大 bottom 计算页面所需高度 */
const pageHeightStyle = computed(() => {
  if (!isScroll.value || !currentPage.value?.blocks.length) return undefined
  const maxBottom = currentPage.value.blocks.reduce(
    (max, b) => Math.max(max, b.top + b.height),
    0
  )
  return { height: `calc(${maxBottom - SCROLL_OFFSET_TOP} / var(--design-h) * 100vh)` }
})

// 切换 tab 时回到首页内容，scroll 模式滚动到顶部
watch(activeTab, () => {
  activePage.value = 0
  if (isScroll.value && contentRef.value) {
    contentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
  nextTick(() => {
    updateHasOverflow()
  })
})

function prevPage() {
  if (activePage.value > 0) {
    activePage.value -= 1
    sfx.play('page')
  } else if (activeTab.value > 0) {
    activeTab.value -= 1
    sfx.play('page')
    nextTick(() => {
      activePage.value = Math.max(0, pages.value.length - 1)
    })
  }
}
function nextPage() {
  if (activePage.value < pageCount.value - 1) {
    activePage.value += 1
    sfx.play('page')
  } else if (activeTab.value < tabCount.value - 1) {
    activeTab.value += 1
    sfx.play('page')
  }
}

function goHome() {
  sfx.play('back')
  router.push({ name: 'home' })
}

// TODO:触摸屏空闲超时回首页
// useIdleReset(() => router.push({ name: 'home' }))
</script>

<template>
  <main class="sec" :class="{ 'sec--scroll': isScroll }">
    <img class="sec__bg" :src="COMMON.bg" alt="" />

    <!-- 顶部标题（含副标题，按 tab 切换） -->
    <transition name="fade" mode="out-in">
      <img :key="currentTab?.id" class="sec__title" :src="currentTab?.title" alt="" />
    </transition>

    <!-- 内容区：覆盖整个页面，图片使用页面绝对坐标（基于设计稿 2160×3840） -->
    <div
      ref="contentRef"
      class="sec__content"
      :class="{ 'sec__content--scroll': isScroll }"
      @scroll="onContentScroll"
      @mousedown="onContentPointerDown"
      @touchstart.passive="onContentPointerDown"
    >
      <transition name="page-slide" mode="out-in" @after-enter="updateHasOverflow" @after-leave="updateHasOverflow">
        <div
          v-if="currentPage"
          :key="`${currentTab?.id}-${activePage}`"
          class="sec__page"
          :class="{ 'sec__page--scroll': isScroll }"
          :style="pageHeightStyle"
        >
          <img
            v-for="(block, bi) in currentPage.blocks"
            :key="bi"
            class="sec__img"
            :src="block.src"
            alt=""
            :style="{
              left: `calc(${block.left} / var(--design-w) * 100vw)`,
              top: isScroll
                ? `calc((${block.top} - ${SCROLL_OFFSET_TOP}) / var(--design-h) * 100vh)`
                : `calc(${block.top} / var(--design-h) * 100vh)`,
              width: `calc(${block.width} / var(--design-w) * 100vw)`,
              height: `calc(${block.height} / var(--design-h) * 100vh)`
            }"
          />
        </div>
        <div v-else :key="`empty-${currentTab?.id}`" class="sec__empty">内容建设中</div>
      </transition>
    </div>

    <!-- 自定义滚动条（仅 scroll 模式且内容溢出时） -->
    <div
      v-if="isScroll && hasOverflow"
      ref="scrollbarRef"
      class="sec__scrollbar"
      @mousedown="onScrollbarPointerDown"
      @touchstart.passive="onScrollbarPointerDown"
    >
      <div class="sec__scrollbar-track" />
      <div class="sec__scrollbar-progress" :style="progressStyle" />
      <div class="sec__scrollbar-thumb" :style="thumbStyle" />
    </div>

    <!-- 边框（仅 pager 模式显示） -->
    <div v-if="!isScroll" class="sec__frame">
      <img class="sec__frame-bg" :src="COMMON.frame" alt="" />
    </div>

    <!-- 右侧上下翻页按钮（仅 pager 模式且多页时显示） -->
    <div v-if="showPager" class="sec__pager">
      <button class="sec__pager-btn" :disabled="!canPrev" @click="prevPage">
        <img :src="COMMON.arrowUp" alt="上一页" />
      </button>
      <button class="sec__pager-btn" :disabled="!canNext" @click="nextPage">
        <img :src="COMMON.arrowDown" alt="下一页" />
      </button>
    </div>

    <!-- 底部 tab 菜单 -->
    <div class="sec__tabs">
      <TabBar v-model="activeTab" :tabs="module.tabs" />
    </div>

    <!-- 右下角首页按钮 -->
    <button class="sec__home" @click="goHome">
      <img :src="COMMON.home" alt="首页" />
    </button>
  </main>
</template>

<style scoped lang="scss">
.sec {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }

  &__title {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: d.h(865);
    object-fit: fill;
    z-index: 2;
    pointer-events: none;

    // scroll 模式下标题需浮在可滚动内容区之上
    .sec--scroll & {
      z-index: 4;
    }
  }

  // 内容边框区：1834×2470，水平居中，标题之下
  &__frame {
    position: absolute;
    left: 50%;
    top: d.h(926);
    transform: translateX(-50%);
    width: d.w(1834);
    height: d.h(2470);
    z-index: 2;

    &-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      pointer-events: none;
      z-index: 1;
    }
  }

  // 内容区：pager 模式覆盖整个页面；scroll 模式精确到中部区域
  &__content {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 3;
    pointer-events: none;

    &--scroll {
      top: d.h(926);
      bottom: d.h(435);
      left: 0;
      right: 0;
      overflow-y: scroll;
      pointer-events: auto;
      user-select: none; // 拖拽时禁止选中文本
      -webkit-user-select: none;

      // 隐藏原生滚动条
      &::-webkit-scrollbar {
        display: none;
      }
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
  }

  &__page {
    position: absolute;
    inset: 0;

    &--scroll {
      position: relative;
      inset: auto;
      width: 100%;
    }
  }

  &__img {
    position: absolute;
    object-fit: fill;
    pointer-events: none;
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(180, 220, 255, 0.7);
    font-size: d.w(64);
    letter-spacing: d.w(6);
  }

  // 自定义滚动条（scroll 模式）
  &__scrollbar {
    position: absolute;
    right: d.w(100);
    top: d.h(926);
    bottom: d.h(435);
    width: d.w(30); // 加宽点击区域，视觉轨道仍是 4px
    z-index: 10;
    pointer-events: auto;
    display: flex;
    justify-content: center;
    cursor: pointer;

    // 白色轨道底色（居中细线，比滑块窄）
    &-track {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: d.w(4);
      background: rgba(255, 255, 255, 0.6);
      border-radius: d.w(2);
    }

    // 已滚动部分：渐变色，居中细线
    &-progress {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: d.w(4);
      background: linear-gradient(180deg, #a8deff 0%, #5cb3ff 100%);
      border-radius: d.w(2);
      transition: height 0.15s ease-out;
    }

    // 椭圆滑块
    &-thumb {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: d.w(30);
      height: 4%;
      min-height: d.h(28);
      border-radius: d.w(15);
      border: d.w(1.5) solid rgba(255, 255, 255, 0.9);
      background: linear-gradient(180deg, #c8e8ff 0%, #7ec4ff 100%);
      box-shadow:
        0 0 d.w(4) rgba(180, 220, 255, 0.8),
        0 0 d.w(8) rgba(80, 170, 255, 0.6),
        0 0 d.w(16) rgba(80, 170, 255, 0.3),
        0 0 d.w(50) rgba(100, 190, 255, 0.35),
        inset 0 d.w(2) d.w(4) rgba(255, 255, 255, 0.6);
      transition:
        top 0.15s ease-out,
        transform 0.15s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;

      // 悬停：更亮更大光晕
      &:hover {
        background: linear-gradient(180deg, #d4ecff 0%, #8acaff 100%);
        box-shadow:
          0 0 d.w(6) rgba(180, 220, 255, 1),
          0 0 d.w(12) rgba(80, 170, 255, 0.8),
          0 0 d.w(24) rgba(80, 170, 255, 0.5),
          0 0 d.w(60) rgba(100, 190, 255, 0.45),
          inset 0 d.w(2) d.w(5) rgba(255, 255, 255, 0.7);
      }

      // 按下：微微缩小、光晕内聚、颜色加深
      &:active {
        transform: translateX(-50%) scale(0.92);
        background: linear-gradient(180deg, #a8d8ff 0%, #6cb8ff 100%);
        box-shadow:
          0 0 d.w(2) rgba(180, 220, 255, 0.9),
          0 0 d.w(6) rgba(80, 170, 255, 0.8),
          0 0 d.w(12) rgba(80, 170, 255, 0.5),
          0 0 d.w(24) rgba(100, 190, 255, 0.3),
          inset 0 d.w(1) d.w(3) rgba(255, 255, 255, 0.4);
      }
    }
  }

  // 右侧翻页按钮
  &__pager {
    position: absolute;
    right: d.w(87);
    top: d.h(1879);
    display: flex;
    flex-direction: column;
    gap: d.h(90);
    z-index: 3;
  }

  &__pager-btn {
    width: d.w(168);
    height: d.w(168);
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    &:active {
      transform: scale(0.92);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  // 底部 tab
  &__tabs {
    position: absolute;
    left: d.w(171);
    right: d.w(400);
    bottom: d.h(196);
    height: d.h(181);
    z-index: 4;
  }

  // 首页按钮
  &__home {
    position: absolute;
    right: d.w(148);
    bottom: d.h(120);
    width: d.w(222);
    height: d.h(278);
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    z-index: 5;
    transition: transform 0.2s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    &:active {
      transform: scale(0.94);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateY(d.h(40));
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(d.h(-40));
}
</style>
