<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSfx } from '@shared/composables/useSfx'
import TabBar from './TabBar.vue'
import { COMMON, type ModuleDef } from '../data/modules'
import {
  AUTO_SCROLL_SPEED,
  AUTO_SCROLL_START_DELAY,
} from '../data/config'

const props = defineProps<{
  module: ModuleDef
  /** 交互模式：pager（翻页，默认）| scroll（纵向滚动）| frame-scroll（带边框纵向滚动） */
  mode?: 'pager' | 'scroll' | 'frame-scroll'
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
  // 不用 rAF：exe(iframe/非前台) 下 rAF 可能不产帧，会让滚动条进度卡住。
  // scroll 事件本身已是节流入口，直接同步计算即可。
  const el = contentRef.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  scrollProgress.value = max > 0 ? el.scrollTop / max : 0
  hasOverflow.value = max > 0
}

/** 滑块图（thumb.png）尺寸与内部亮点占位（px，实测自素材）。
 *  图片画布 69×142，但可见亮点只在垂直方向 38~103 之间，
 *  上下各有约 38px 透明/辉光留白，定位需基于亮点而非整张图片盒子。 */
const THUMB_DOT_TOP = 38
const THUMB_DOT_BOTTOM = 103
const THUMB_DOT_H = THUMB_DOT_BOTTOM - THUMB_DOT_TOP

/** 轨道高度（设计稿 px） */
const trackHeight = computed(() => 3840 - contentInset.value.top - contentInset.value.bottom)

const progressStyle = computed(() => {
  return { height: `${scrollProgress.value * 100}%` }
})

/** 滑块定位：让亮点(38~103)在 progress 0→1 间贴齐轨道顶/底，
 *  整张图片盒子相应上下溢出，溢出部分仅是透明辉光。 */
const thumbStyle = computed(() => {
  const trackH = trackHeight.value
  if (trackH <= 0) return { top: '0%' }
  // 盒子顶边相对轨道的位置（px）：progress0 时 -DOT_TOP，使亮点顶=0；progress1 时使亮点底=轨道底
  const topPx = -THUMB_DOT_TOP + scrollProgress.value * (trackH - THUMB_DOT_H)
  return { top: `${(topPx / trackH) * 100}%` }
})

/** 亮点在轨道中的中心与半高（占比），用于点击命中判定 */
const dotMetrics = computed(() => {
  const trackH = trackHeight.value
  if (trackH <= 0) return { center: 0, half: 0 }
  const topPx = -THUMB_DOT_TOP + scrollProgress.value * (trackH - THUMB_DOT_H)
  const dotTopPx = topPx + THUMB_DOT_TOP
  return {
    center: (dotTopPx + THUMB_DOT_H / 2) / trackH,
    half: THUMB_DOT_H / 2 / trackH,
  }
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
  const clamped = Math.max(0, Math.min(1, ratio))
  el.scrollTop = clamped * max
}

function onScrollbarPointerDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  onUserInteract() // 用户操作暂停自动滚动
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const info = getBarInfo()
  if (!info) return

  const ratio = (clientY - info.top) / info.height
  const { center: thumbCenter, half: halfThumb } = dotMetrics.value

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

  // pager 模式左右滑动
  if (isSwiping.value) {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    swipeLastX.value = clientX
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

  // pager 模式左右滑动释放
  if (isSwiping.value) {
    const deltaX = swipeStartX.value - swipeLastX.value
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // 向左滑 → 下一页
        sfx.play('page')
        nextPage()
      } else {
        // 向右滑 → 上一页
        sfx.play('page')
        prevPage()
      }
    }
    isSwiping.value = false
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

/** pager 模式左右滑动手势 */
const isSwiping = ref(false)
const swipeStartX = ref(0)
const swipeLastX = ref(0)
const SWIPE_THRESHOLD = 60

function onContentPointerDown(e: MouseEvent | TouchEvent) {
  if (isScroll.value) {
    onUserInteract() // 用户操作暂停自动滚动
    if (!contentRef.value) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    isContentDragging.value = true
    contentDragStartY.value = clientY
    contentDragLastY.value = clientY
    contentDragStartScrollTop.value = contentRef.value.scrollTop
    contentDragMoved.value = false
    return
  }
  // pager 模式：记录水平滑动起始位置
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  isSwiping.value = true
  swipeStartX.value = clientX
  swipeLastX.value = clientX
}

/** 中控 page 指令处理：next/prev/index */
function onUecPage(e: Event) {
  const detail = (e as CustomEvent).detail as Record<string, unknown>
  if (!detail) return
  const action = detail.action as string | undefined
  const index = detail.index as number | undefined

  if (typeof index === 'number') {
    const target = Math.max(0, Math.min(index, tabCount.value - 1))
    if (target !== activeTab.value) activeTab.value = target
    return
  }

  if (action === 'next') {
    nextPage()
  } else if (action === 'prev') {
    prevPage()
  }
}

/** 中控 scroll 指令处理：pause / play / scroll-top */
function onUecScroll(e: Event) {
  const detail = (e as CustomEvent).detail as Record<string, unknown>
  if (!detail) return
  const action = detail.action as string | undefined
  if (action === 'pause') {
    stopAutoScroll()
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = 0
  } else if (action === 'play') {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = 0
    startAutoScroll()
  } else if (action === 'scroll-top') {
    if (contentRef.value) {
      contentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
      stopAutoScroll()
    }
  }
}

// 自动滚动
// 实现要点（exe 适配）：用 setInterval 驱动而非 requestAnimationFrame。
//  - 本应用已全局关闭定时器节流（disable-background-timer-throttling），
//    setInterval 在 kiosk 多窗口/iframe 下可靠触发。
//  - rAF 受渲染可见性/合成器门控，exe 下非前台渲染进程可能不产帧 → 回调不触发，
//    这正是浏览器正常、exe 自动滚动失效的根因。
//  - 采用时间步进（按 performance.now 的 delta 计算位移），节拍抖动也不影响速度。
const AUTO_SCROLL_TICK_MS = 16 // ~60fps
let autoScrollTimer = 0 // setInterval id；0 表示未在滚动
let idleTimer = 0
let autoScrollDelayTimer = 0
let lastScrollTimestamp = 0
let autoScrollSession = { tab: 0, page: 0 }
/** 自维护的浮点滚动位置：exe 渲染进程的 el.scrollTop 会被量化为整数，
 *  若直接 `scrollTop += 0.64`（40px/s @16ms）读回恒为 0 → 永远到不了 1px 而卡死。
 *  改为累加浮点位置再赋值，量化只影响渲染、不丢失累加进度。 */
let autoScrollPos = 0
/** 是否"应当"自动滚动（意图）。与 autoScrollTimer（是否"正在"滚动）区分：
 *  exe(iframe) 下挂载瞬间视口/布局可能未定型，scrollHeight 暂时 <= clientHeight，
 *  此时不能永久放弃，需保留意图，待 ResizeObserver / visibilitychange 后补触发。 */
let autoScrollWanted = false

function startAutoScroll(delay = 0) {
  stopAutoScrollLoop()
  lastScrollTimestamp = 0
  // 标记意图：即使当前还无溢出（布局未就绪），也不放弃，由后续补触发启动。
  autoScrollWanted = true
  if (autoScrollDelayTimer) {
    clearTimeout(autoScrollDelayTimer)
    autoScrollDelayTimer = 0
  }
  // 记录当前页签，用于底部循环判定
  autoScrollSession = { tab: activeTab.value, page: activePage.value }
  // 溢出判定放到延迟之后的 step 中，避免在延迟之前过早退出。
  if (delay > 0) {
    autoScrollDelayTimer = window.setTimeout(() => {
      autoScrollDelayTimer = 0
      runAutoScrollLoop()
    }, delay)
  } else {
    runAutoScrollLoop()
  }
}

/** 仅启动定时器循环（不改变意图/延迟状态），供延迟到期与补触发复用。 */
function runAutoScrollLoop() {
  if (autoScrollTimer) return
  lastScrollTimestamp = performance.now()
  // 从当前实际位置起步（兼容用户/中控已滚动到的位置）
  autoScrollPos = contentRef.value?.scrollTop ?? 0
  autoScrollTimer = window.setInterval(stepAutoScroll, AUTO_SCROLL_TICK_MS)
}

/** 仅停止定时器循环，保留 autoScrollWanted 意图（用于布局未就绪时的暂歇）。 */
function stopAutoScrollLoop() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = 0
  }
  lastScrollTimestamp = 0
}

function stopAutoScroll() {
  autoScrollWanted = false
  stopAutoScrollLoop()
  if (autoScrollDelayTimer) {
    clearTimeout(autoScrollDelayTimer)
    autoScrollDelayTimer = 0
  }
}

function stepAutoScroll() {
  if (!isScroll.value || !contentRef.value) {
    stopAutoScrollLoop()
    return
  }
  const el = contentRef.value
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) {
    // 布局尚未就绪/暂无溢出：停止循环但保留意图（autoScrollWanted），
    // 待 ResizeObserver / visibilitychange 检测到可滚动后再补触发。
    stopAutoScrollLoop()
    return
  }

  const now = performance.now()
  if (!lastScrollTimestamp) lastScrollTimestamp = now
  const delta = now - lastScrollTimestamp
  lastScrollTimestamp = now

  // 用浮点累加器推进，再赋值给 scrollTop（避免整数量化丢失亚像素增量）
  autoScrollPos += (AUTO_SCROLL_SPEED * delta) / 1000
  if (autoScrollPos >= max) {
    autoScrollPos = max
    el.scrollTop = max
    stopAutoScrollLoop()
    autoScrollWanted = false // 已滚到底，结束意图，避免补触发重启
    return
  }
  el.scrollTop = autoScrollPos
}

/** 内容/视口尺寸变化回调：exe(iframe) 布局就绪后补触发自动滚动。 */
function onContentResize() {
  updateHasOverflow()
  // 有滚动意图、当前未在滚动、延迟已结束、且内容已可滚动 → 补启动
  if (!autoScrollWanted || autoScrollTimer || autoScrollDelayTimer) return
  const el = contentRef.value
  if (isScroll.value && el && el.scrollHeight > el.clientHeight) {
    runAutoScrollLoop()
  }
}

/** 页面重新可见时自愈：若有滚动意图但未在滚动，尝试补触发。 */
function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  onContentResize()
}

function onUserInteract() {
  if (!isScroll.value) return
  stopAutoScroll()
}

/** transition 钩子：插入瞬间强制隐藏，防止默认样式闪现 */
function onBeforeEnter(el: Element) {
  ;(el as HTMLElement).style.opacity = '0'
}

/** transition 钩子：过渡完成后清理内联样式 */
function onAfterEnterClean(el: Element) {
  ;(el as HTMLElement).style.opacity = ''
  updateHasOverflow()
}

/** 监听内容区/视口尺寸变化：exe(iframe) 下视口尺寸定型较晚，需借此补触发自动滚动。 */
let resizeObserver: ResizeObserver | null = null

// 全局监听拖拽中事件（组件卸载时清理）
onMounted(() => {
  updateHasOverflow()
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
    window.addEventListener('uec:page', onUecPage)
    window.addEventListener('uec:scroll', onUecScroll)
    // iframe 视口尺寸变化（如全屏化）会改变 vh 基准 → 重新评估溢出/补触发
    window.addEventListener('resize', onContentResize)
    // 渲染进程重新可见（exe 多窗口/iframe 场景）时自愈补触发
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  // 观察内容区盒子尺寸：布局就绪后补触发，解决 exe 下挂载即判定失败的问题
  if (typeof ResizeObserver !== 'undefined' && contentRef.value) {
    resizeObserver = new ResizeObserver(() => onContentResize())
    resizeObserver.observe(contentRef.value)
  }
  if (isScroll.value) startAutoScroll(AUTO_SCROLL_START_DELAY)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onPointerMove, { passive: false } as EventListenerOptions)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchmove', onPointerMove, { passive: false } as EventListenerOptions)
    window.removeEventListener('touchend', onPointerUp)
    window.removeEventListener('uec:page', onUecPage)
    window.removeEventListener('uec:scroll', onUecScroll)
    window.removeEventListener('resize', onContentResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  stopAutoScroll()
  if (idleTimer) clearTimeout(idleTimer)
})

const activeTab = ref(0)
const activePage = ref(0)
const slideDirection = ref<'right' | 'left'>('right')

const isScroll = computed(() => props.mode === 'scroll' || props.mode === 'frame-scroll')
const isFrameScroll = computed(() => props.mode === 'frame-scroll')
const showFrame = computed(() => props.mode !== 'scroll')

const currentTab = computed(() => props.module.tabs[activeTab.value])
const pages = computed(() => currentTab.value?.pages ?? [])
const currentPage = computed(() => pages.value[activePage.value] ?? null)
const pageCount = computed(() => pages.value.length)
const tabCount = computed(() => props.module.tabs.length)

const showPager = computed(() => props.mode === 'pager' && (tabCount.value > 1 || pageCount.value > 1))
const canPrev = computed(() => activePage.value > 0 || activeTab.value > 0)
const canNext = computed(
  () => activePage.value < pageCount.value - 1 || activeTab.value < tabCount.value - 1
)

/** scroll / frame-scroll 模式下内容区边界（设计稿 px，模块可自定义） */
const contentInset = computed(() => ({
  top: props.module.contentInset?.top ?? 926,
  bottom: props.module.contentInset?.bottom ?? 435,
  left: props.module.contentInset?.left ?? 0,
  right: props.module.contentInset?.right ?? 0,
}))

/** 内容区动态位置样式（scroll / frame-scroll 模式） */
const contentStyle = computed(() => {
  if (!isScroll.value) return undefined
  return {
    top: `calc(${contentInset.value.top} / var(--design-h) * 100vh)`,
    bottom: `calc(${contentInset.value.bottom} / var(--design-h) * 100vh)`,
    left: `calc(${contentInset.value.left} / var(--design-w) * 100vw)`,
    right: `calc(${contentInset.value.right} / var(--design-w) * 100vw)`,
  }
})

/** 自定义滚动条动态位置 */
const scrollbarStyle = computed(() => {
  if (!isScroll.value) return undefined
  return {
    top: `calc(${contentInset.value.top} / var(--design-h) * 100vh)`,
    bottom: `calc(${contentInset.value.bottom} / var(--design-h) * 100vh)`,
  }
})

/** scroll 模式下根据 blocks 最大 bottom 计算页面所需高度 */
const pageHeightStyle = computed(() => {
  if (!isScroll.value || !currentPage.value?.blocks.length) return undefined
  const maxBottom = currentPage.value.blocks.reduce(
    (max, b) => Math.max(max, b.top + b.height),
    0
  )
  return { height: `calc(${maxBottom - contentInset.value.top} / var(--design-h) * 100vh)` }
})

// 切换 tab 时回到首页内容，scroll 模式滚动到顶部
watch(activeTab, (newVal, oldVal) => {
  if (typeof oldVal === 'number') {
    slideDirection.value = newVal > oldVal ? 'right' : 'left'
  }
  activePage.value = 0
  if (isScroll.value && contentRef.value) {
    contentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
  nextTick(() => {
    updateHasOverflow()
    if (isScroll.value) startAutoScroll(AUTO_SCROLL_START_DELAY)
  })
})

function prevPage() {
  slideDirection.value = 'left'
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
  slideDirection.value = 'right'
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
  setTimeout(() => router.push({ name: 'home' }), 150)
}

// TODO:触摸屏空闲超时回首页
// useIdleReset(() => router.push({ name: 'home' }))
</script>

<template>
  <main class="sec" :class="{ 'sec--scroll': isScroll, 'sec--frame-scroll': isFrameScroll }">
    <img class="sec__bg" :src="COMMON.bg" alt="" />

    <!-- 顶部标题（含副标题，按 tab 切换） -->
    <transition name="title-slide" mode="out-in" @before-enter="onBeforeEnter" @after-enter="onAfterEnterClean">
      <img :key="currentTab?.id" class="sec__title" :src="currentTab?.title" alt="" />
    </transition>

    <!-- 内容区：覆盖整个页面，图片使用页面绝对坐标（基于设计稿 2160×3840） -->
    <div
      ref="contentRef"
      class="sec__content"
      :class="{ 'sec__content--scroll': isScroll }"
      :style="contentStyle"
      @scroll="onContentScroll"
      @mousedown="onContentPointerDown"
      @touchstart.passive="onContentPointerDown"
      @wheel="onUserInteract"
    >
      <transition :name="`slide-${slideDirection}`" @before-enter="onBeforeEnter" @after-enter="onAfterEnterClean" @after-leave="updateHasOverflow">
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
                ? `calc((${block.top} - ${contentInset.top}) / var(--design-h) * 100vh)`
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
      :style="scrollbarStyle"
      @mousedown="onScrollbarPointerDown"
      @touchstart.passive="onScrollbarPointerDown"
    >
      <div class="sec__scrollbar-track" />
      <div class="sec__scrollbar-progress" :style="progressStyle" />
      <img class="sec__scrollbar-thumb" :src="COMMON.thumb" :style="thumbStyle" alt="" />
    </div>

    <!-- 边框（pager / frame-scroll 模式显示） -->
    <div v-if="showFrame" class="sec__frame">
      <img class="sec__frame-bg" :src="COMMON.frame" alt="" />
    </div>

    <!-- 右侧上下翻页按钮（仅 pager 模式显示） -->
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
@keyframes sec-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes sec-title-enter {
  from { opacity: 0; transform: translateY(d.h(-50)) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes sec-enter-up {
  from { opacity: 0; transform: translateY(d.h(60)); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes sec-frame-enter {
  from { opacity: 0; transform: translateX(-50%) translateY(d.h(60)); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes sec-enter-right {
  from { opacity: 0; transform: translateX(d.w(60)); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes sec-img-fade {
  from { opacity: 0; transform: translateY(d.h(20)) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

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
    opacity: 0;
    animation: sec-fade-in 0.8s ease-out 0s both;
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
    opacity: 0;
    animation: sec-title-enter 0.5s ease-out 0.1s both;

    // scroll / frame-scroll 模式下标题需浮在可滚动内容区之上
    .sec--scroll &,
    .sec--frame-scroll & {
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
    opacity: 0;
    animation: sec-frame-enter 0.6s ease-out 0.35s both;

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
    opacity: 0;
    animation: sec-enter-up 0.6s ease-out 0.35s both;

    &--scroll {
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
    opacity: 0;
    animation: sec-img-fade 0.5s ease-out both;

    &:nth-child(1) { animation-delay: 0.05s; }
    &:nth-child(2) { animation-delay: 0.12s; }
    &:nth-child(3) { animation-delay: 0.19s; }
    &:nth-child(4) { animation-delay: 0.26s; }
    &:nth-child(5) { animation-delay: 0.33s; }
    &:nth-child(6) { animation-delay: 0.40s; }
    &:nth-child(7) { animation-delay: 0.47s; }
    &:nth-child(8) { animation-delay: 0.54s; }
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

    // 滑块图片
    &-thumb {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: d.w(69);
      height: d.h(142);
      object-fit: contain;
      pointer-events: none;
      transition:
        top 0.15s ease-out,
        transform 0.15s ease;

      &:hover {
        transform: translateX(-50%) scale(1.05);
      }

      &:active {
        transform: translateX(-50%) scale(0.92);
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
    opacity: 0;
    animation: sec-enter-right 0.5s ease-out 0.5s both;
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
      opacity 0.2s ease,
      filter 0.2s ease;
    filter: drop-shadow(0 d.h(4) d.w(12) rgba(0, 80, 200, 0.25));

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    &:hover:not(:disabled) {
      transform: scale(1.06);
      filter: drop-shadow(0 d.h(6) d.w(20) rgba(0, 120, 255, 0.45));
    }

    &:active:not(:disabled) {
      transform: scale(0.92);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
      filter: none;
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
    opacity: 0;
    animation: sec-enter-up 0.5s ease-out 0.6s both;
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
    opacity: 0;
    animation: sec-enter-up 0.5s ease-out 0.6s both;
    transition:
      transform 0.3s ease,
      filter 0.3s ease,
      opacity 0.3s ease;
    filter: drop-shadow(0 d.h(6) d.w(16) rgba(0, 80, 200, 0.3));

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: fill;
      pointer-events: none;
      -webkit-user-select: none;
      user-select: none;
    }

    &:hover {
      transform: scale(1.06);
      filter: drop-shadow(0 d.h(10) d.w(28) rgba(0, 120, 255, 0.5));
    }

    &:active {
      transform: scale(0.94) translateY(d.h(10)) !important;
      filter: drop-shadow(0 d.h(1) d.w(4) rgba(0, 30, 100, 0.15)) !important;
      opacity: 0.3 !important;
    }
  }
}

/* ========== tab/page 切换过渡（覆盖式）========== */
/* 核心：transition 期间禁用默认 animation，避免冲突 */
.slide-right-enter-active,
.slide-left-enter-active,
.slide-right-leave-active,
.slide-left-leave-active {
  animation: none !important;
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

/* 新内容在上层 */
.slide-right-enter-active,
.slide-left-enter-active {
  z-index: 10 !important;
}
/* 旧内容在下层 */
.slide-right-leave-active,
.slide-left-leave-active {
  z-index: 5 !important;
}

/* 关键：transition 期间强制子元素可见，让内容真正参与过渡 */
.slide-right-enter-active .sec__img,
.slide-left-enter-active .sec__img,
.slide-right-leave-active .sec__img,
.slide-left-leave-active .sec__img {
  animation: none !important;
  opacity: 1 !important;
}

/* ========== 标题切换过渡（纯 opacity 淡入淡出，无位移无缩放）========== */
.title-slide-enter-active,
.title-slide-leave-active {
  animation: none !important;
}
.title-slide-enter-active {
  transition: opacity 0.35s ease;
  z-index: 10 !important;
}
.title-slide-leave-active {
  transition: opacity 0.25s ease;
  z-index: 5 !important;
}

.title-slide-enter-from,
.title-slide-leave-to {
  opacity: 0;
}
.title-slide-enter-to,
.title-slide-leave-from {
  opacity: 1;
}

/* ========== 内容切换过渡（覆盖式大位移）========== */
/* 往右切（next）：新内容从下方大幅上滑覆盖 */
.slide-right-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.slide-right-enter-to {
  opacity: 1;
  transform: scale(1);
}
.slide-right-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.slide-right-leave-to {
  opacity: 0.25;
  transform: translateY(-25vh) scale(0.9);
}

/* 往左切（prev）：新内容从上方大幅下滑覆盖 */
.slide-left-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.slide-left-enter-to {
  opacity: 1;
  transform: scale(1);
}
.slide-left-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.slide-left-leave-to {
  opacity: 0.25;
  transform: translateY(25vh) scale(0.9);
}
</style>
