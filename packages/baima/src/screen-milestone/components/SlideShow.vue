<template>
  <div class="slideshow">
    <Transition :css="false" @leave="onLeave" @enter="onEnter">
      <div :key="current.id" class="slide">
        <video
          v-if="current.bgVideo"
          class="slide__bg"
          :src="resolvePkgUrl(current.bgVideo)"
          autoplay loop muted playsinline
        />
        <img
          v-else-if="current.bg"
          class="slide__bg"
          :src="resolvePkgUrl(current.bg)"
          :alt="current.id"
        />
        <div v-else class="slide__placeholder">
          {{ current.placeholder ?? current.id }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { slides } from '@milestone/data/slides'
import { slideFadeIn, slideFadeOut } from '@milestone/effects/gsapPresets'
import { resolvePkgUrl } from '@shared/utils/url'

const AUTO_ADVANCE_MS = 8000

const index = ref(0)
const current = computed(() => slides[index.value])

function next() { index.value = (index.value + 1) % slides.length }
function prev() { index.value = (index.value - 1 + slides.length) % slides.length }
function goto(i: number) { if (i >= 0 && i < slides.length) index.value = i }

let timer: ReturnType<typeof setInterval> | null = null
function startTimer() {
  if (AUTO_ADVANCE_MS <= 0) return
  timer = setInterval(next, AUTO_ADVANCE_MS)
}
function stopTimer() {
  if (timer !== null) { clearInterval(timer); timer = null }
}

const bridgeOff: Array<() => void> = []
function setupBridge() {
  if (!window.exhibitBridge) return
  bridgeOff.push(
    window.exhibitBridge.on('slide.next', () => { stopTimer(); next(); startTimer() }),
    window.exhibitBridge.on('slide.prev', () => { stopTimer(); prev(); startTimer() }),
    window.exhibitBridge.on('slide.goto', (p) => {
      const idx = (p as { index?: number })?.index
      if (idx !== undefined) { stopTimer(); goto(idx); startTimer() }
    })
  )
}

onMounted(() => { setupBridge(); startTimer() })
onBeforeUnmount(() => { stopTimer(); bridgeOff.forEach(f => f()) })

function onLeave(el: Element, done: () => void) { slideFadeOut(el, done) }
function onEnter(el: Element, done: () => void) { slideFadeIn(el, done) }
</script>

<style lang="scss" scoped>
.slideshow {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide {
  position: absolute;
  inset: 0;

  &__bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 28px;
    color: #4a7aaa;
    font-family: 'Microsoft YaHei', sans-serif;
    text-align: center;
    padding: 60px;
    line-height: 1.6;
  }
}
</style>
