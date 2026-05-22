<template>
  <div class="slideshow" @touchstart="resetIdle" @keydown.passive="resetIdle">
    <Transition :css="false" @leave="onLeave" @enter="onEnter">
      <KeepAlive>
        <component :is="currentComponent" :key="currentIndex" ref="pageRef" />
      </KeepAlive>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { slides, IDLE_MS } from '@baima-milestone/data/slides'
import { slideFadeOut, slideFadeIn } from '@baima-milestone/effects/gsapPresets'
import Page1 from './Page1.vue'
import Page2 from './Page2.vue'
import Page3 from './Page3.vue'
import Page4 from './Page4.vue'
import Page5 from './Page5.vue'

const COMPONENT_MAP: Record<string, Component | null> = {
  page1: Page1,
  page2: Page2,
  page3: Page3,
  page4: Page4,
  page5: Page5
}

const currentIndex = ref(0)
const pageRef = ref<{ play: () => void; reset: () => void } | null>(null)

const currentComponent = computed(() => {
  const id = slides[currentIndex.value]?.id ?? ''
  return COMPONENT_MAP[id] ?? null
})

function goto(i: number) {
  if (i < 0 || i >= slides.length) return
  if (i === currentIndex.value) return
  currentIndex.value = i
  resetIdle()
}

function onKeyDown(e: KeyboardEvent) {
  const n = parseInt(e.key)
  if (n >= 1 && n <= 5) goto(n - 1)
  resetIdle()
}

let idleTimer: ReturnType<typeof setTimeout> | null = null

function resetIdle() {
  if (idleTimer !== null) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => goto(0), IDLE_MS)
}

const bridgeOff: Array<() => void> = []

function setupBridge() {
  if (!window.exhibitBridge) return
  bridgeOff.push(
    window.exhibitBridge.on('slide.next', () => goto(currentIndex.value + 1)),
    window.exhibitBridge.on('slide.prev', () => goto(currentIndex.value - 1)),
    window.exhibitBridge.on('slide.goto', (p) => {
      const idx = (p as { index?: number })?.index
      if (idx !== undefined) goto(idx)
    })
  )
}

onMounted(() => {
  setupBridge()
  resetIdle()
  window.addEventListener('keydown', onKeyDown)
  nextTick(() => pageRef.value?.play())
})

onBeforeUnmount(() => {
  if (idleTimer !== null) clearTimeout(idleTimer)
  bridgeOff.forEach((f) => f())
  window.removeEventListener('keydown', onKeyDown)
})

function onLeave(el: Element, done: () => void) {
  slideFadeOut(el, done)
}

function onEnter(el: Element, done: () => void) {
  pageRef.value?.reset()
  slideFadeIn(el, () => {
    pageRef.value?.play()
    done()
  })
}
</script>

<style lang="scss" scoped>
.slideshow {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;
}
</style>
