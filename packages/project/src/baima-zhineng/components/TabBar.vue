<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useSfx } from '@shared/composables/useSfx'
import type { TabDef } from '../data/modules'

const props = defineProps<{
  tabs: TabDef[]
  modelValue: number
}>()

const emit = defineEmits<{ 'update:modelValue': [index: number] }>()

const sfx = useSfx()

const viewportEl = ref<HTMLElement | null>(null)
const stripEl = ref<HTMLElement | null>(null)
const itemEls = ref<HTMLElement[]>([])
const offset = ref(0)
const prevIndex = ref(0)

// 拖拽状态
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartOffset = ref(0)
const dragMoved = ref(false)
const DRAG_THRESHOLD = 5 // px，超过此位移视为拖拽而非点击

function setItemRef(el: Element | null, i: number) {
  if (el) itemEls.value[i] = el as HTMLElement
}

function getMaxScroll() {
  const vp = viewportEl.value
  const strip = stripEl.value
  if (!vp || !strip) return 0
  return Math.max(0, strip.scrollWidth - vp.clientWidth)
}

function clampOffset(val: number) {
  return Math.min(Math.max(0, val), getMaxScroll())
}

function updateOffset() {
  const vp = viewportEl.value
  const item = itemEls.value[props.modelValue]
  if (!vp || !item) return

  const maxScroll = getMaxScroll()

  if (props.modelValue > prevIndex.value) {
    // 向右点：选中项贴左
    offset.value = Math.min(item.offsetLeft, maxScroll)
  } else if (props.modelValue < prevIndex.value) {
    // 向左点：选中项贴右
    const target = item.offsetLeft + item.offsetWidth - vp.clientWidth
    offset.value = Math.min(Math.max(0, target), maxScroll)
  } else {
    // 初始化 / 不变
    offset.value = Math.min(item.offsetLeft, maxScroll)
  }
}

function select(i: number) {
  if (dragMoved.value) {
    dragMoved.value = false
    return
  }
  sfx.play('tap')
  emit('update:modelValue', i)
}

// ── 拖拽滚动 ──
function onDragStart(x: number) {
  isDragging.value = true
  dragMoved.value = false
  dragStartX.value = x
  dragStartOffset.value = offset.value
}
function onDragMove(x: number) {
  if (!isDragging.value) return
  if (!dragMoved.value && Math.abs(x - dragStartX.value) > DRAG_THRESHOLD) {
    dragMoved.value = true
  }
  const delta = dragStartX.value - x
  offset.value = clampOffset(dragStartOffset.value + delta)
}
function onDragEnd() {
  isDragging.value = false
}

function onTouchStart(e: TouchEvent) {
  if (getMaxScroll() <= 0) return
  onDragStart(e.touches[0].clientX)
}
function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  onDragMove(e.touches[0].clientX)
}
function onTouchEnd() {
  onDragEnd()
}

function onMouseDown(e: MouseEvent) {
  if (getMaxScroll() <= 0) return
  onDragStart(e.clientX)
}
function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  onDragMove(e.clientX)
}
function onMouseUp() {
  onDragEnd()
}

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    prevIndex.value = oldVal ?? 0
    nextTick(updateOffset)
  }
)
watch(
  () => props.tabs,
  () => {
    prevIndex.value = props.modelValue
    nextTick(updateOffset)
  }
)
onMounted(() => nextTick(updateOffset))
</script>

<template>
  <div
    ref="viewportEl"
    class="tabbar"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
  >
    <div ref="stripEl" class="tabbar__strip" :style="{ transform: `translateX(${-offset}px)` }">
      <button
        v-for="(t, i) in tabs"
        :key="t.id"
        :ref="(el) => setItemRef(el as Element | null, i)"
        class="tabbar__item"
        :class="{ 'is-active': i === modelValue }"
        @click="select(i)"
      >
        <img :src="i === modelValue ? t.tabActive : t.tab" alt="" @load="updateOffset" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabbar {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__strip {
    display: flex;
    align-items: center;
    height: 100%;
    gap: d.w(1);
    transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform;
  }

  &__item {
    flex: 0 0 auto;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.2s ease;

    img {
      display: block;
      height: 100%;
      width: auto;
      object-fit: contain;
    }

    &:active {
      transform: scale(0.97);
    }
  }
}
</style>
