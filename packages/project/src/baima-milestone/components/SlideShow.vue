<template>
  <div class="slideshow">
    <Transition :css="false" @leave="onLeave" @enter="onEnter">
      <KeepAlive>
        <component :is="currentComponent" :key="currentIndex" ref="pageRef" />
      </KeepAlive>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { slides } from '@baima-milestone/data/slides'
import { slideFadeOut, slideFadeIn, type SlideDir } from '@baima-milestone/effects/gsapPresets'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import { useControl } from '@baima-milestone/composables/useControl'
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
const pageRef = ref<{ play: () => void; pause?: () => void; resume?: () => void; reset: () => void } | null>(null)
let lastDir: SlideDir = 'next'
const sfx = useProjectSfx()

const currentComponent = computed(() => {
  const id = slides[currentIndex.value]?.id ?? ''
  return COMPONENT_MAP[id] ?? null
})

function goto(i: number) {
  if (i < 0 || i >= slides.length) return
  if (i === currentIndex.value) return
  lastDir = i > currentIndex.value ? 'next' : 'prev'
  currentIndex.value = i
  sfx.play('nav')
}

// === UEC 中控协议处理 ===
const control = useControl()
control.setupCommands({
  total: slides.length,
  getCurrent: () => currentIndex.value,
  onGoto: goto,
  onScrollPlay: () => pageRef.value?.resume?.(),
  onScrollPause: () => pageRef.value?.pause?.(),
  onScrollReset: () => {
    pageRef.value?.reset?.()
    pageRef.value?.resume?.()
  }
})

// 浏览器 dev 模式没有 exhibitBridge，直接连 UEC WS 接收中控指令
if (!window.exhibitBridge) {
  control.startFallback('milestone')
}

function onKeyDown(e: KeyboardEvent) {
  const n = parseInt(e.key)
  if (n >= 1 && n <= 5) goto(n - 1)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  nextTick(() => pageRef.value?.play())
  sfx.unlock()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onLeave(el: Element, done: () => void) {
  slideFadeOut(el, done, lastDir)
}

function onEnter(el: Element, done: () => void) {
  pageRef.value?.reset()
  slideFadeIn(
    el,
    () => {
      pageRef.value?.play()
      done()
    },
    lastDir
  )
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
