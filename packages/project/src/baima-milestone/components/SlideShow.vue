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
const pageRef = ref<{ play: () => void; reset: () => void } | null>(null)
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
  resetIdle()
}

// === UEC 中控协议处理 ===
const control = useControl()
control.setupCommands({
  total: slides.length,
  getCurrent: () => currentIndex.value,
  onGoto: goto
})

function onKeyDown(e: KeyboardEvent) {
  const n = parseInt(e.key)
  if (n >= 1 && n <= 5) goto(n - 1)
  resetIdle()
}

let idleTimer: ReturnType<typeof setTimeout> | null = null

function resetIdle() {
  // TODO：暂时不用
  // if (idleTimer !== null) clearTimeout(idleTimer)
  // idleTimer = setTimeout(() => goto(0), IDLE_MS)
}

onMounted(() => {
  resetIdle()
  window.addEventListener('keydown', onKeyDown)
  nextTick(() => pageRef.value?.play())
  sfx.unlock()
})

onBeforeUnmount(() => {
  if (idleTimer !== null) clearTimeout(idleTimer)
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
