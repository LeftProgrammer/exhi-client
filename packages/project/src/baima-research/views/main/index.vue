<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useScreenSync } from '../../composables/useScreenSync'
import type { DetailPhase } from '../../composables/useScreenSync'

const { syncPoint, syncPhase, syncIdle } = useScreenSync()

const bgImage = resolvePkgUrl('baima-research/map-bg.png')
const headerTitle = resolvePkgUrl('baima-research/header-title.png')

const points = ref([
  { id: 'p01', label: '工程一', top: 35, left: 20 },
  { id: 'p02', label: '工程二', top: 28, left: 38 },
  { id: 'p03', label: '工程三', top: 45, left: 50 },
  { id: 'p04', label: '工程四', top: 22, left: 65 },
  { id: 'p05', label: '工程五', top: 55, left: 30 },
  { id: 'p06', label: '工程六', top: 60, left: 55 },
  { id: 'p07', label: '工程七', top: 40, left: 75 },
  { id: 'p08', label: '工程八', top: 70, left: 42 },
  { id: 'p09', label: '工程九', top: 15, left: 45 },
  { id: 'p10', label: '工程十', top: 50, left: 85 },
  { id: 'p11', label: '工程十一', top: 32, left: 15 },
  { id: 'p12', label: '工程十二', top: 75, left: 68 }
])

const activePoint = ref<string | null>(null)
const detailVisible = ref(false)
const currentPhase = ref<DetailPhase>('difficulty')
const hintVisible = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | null = null

const phases: DetailPhase[] = ['difficulty', 'core', 'patent', 'honor']
const phaseLabels: Record<DetailPhase, string> = {
  difficulty: '科研难点',
  core: '核心科研',
  patent: '专利技术',
  honor: '荣誉效益'
}

const pointLabel = computed(() => points.value.find((p) => p.id === activePoint.value)?.label ?? '')

const mediaSrc = computed(() =>
  resolvePkgUrl(`baima-research/${activePoint.value}/${currentPhase.value}.png`)
)

const textSrc = computed(() =>
  resolvePkgUrl(`baima-research/${activePoint.value}/${currentPhase.value}-text.png`)
)

function onPointClick(id: string) {
  activePoint.value = id
  currentPhase.value = 'difficulty'
  detailVisible.value = true
  syncPoint(id)
}

function closeDetail() {
  detailVisible.value = false
  activePoint.value = null
  syncIdle()
}

function switchPhase(p: DetailPhase) {
  currentPhase.value = p
  syncPhase(p)
}

useIdleReset(() => {
  if (detailVisible.value) {
    closeDetail()
  }
})

function showHint() {
  hintVisible.value = true
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    hintVisible.value = false
  }, 3000)
}

onBeforeUnmount(() => {
  if (hintTimer) clearTimeout(hintTimer)
})
</script>

<template>
  <main class="home">
    <img class="home__bg" :src="bgImage" alt="" />

    <header class="home__header">
      <img :src="headerTitle" alt="科研创新" />
    </header>

    <div class="home__map">
      <button
        v-for="point in points"
        :key="point.id"
        class="home__point"
        :class="{ 'is-active': activePoint === point.id }"
        :style="{ top: point.top + '%', left: point.left + '%' }"
        @click="onPointClick(point.id)"
      >
        <span class="home__point-label">{{ point.label }}</span>
        <span class="home__point-ring" />
        <span class="home__point-dot" />
      </button>
    </div>

    <button class="home__hint-btn" @click="showHint">操作指引</button>

    <transition name="fade">
      <div v-if="hintVisible" class="home__hint-modal" @click="hintVisible = false">
        <div class="home__hint-content">
          <img :src="headerTitle" alt="" />
          <p>点击地图上的工程点位，查看该工程的科研内容。</p>
        </div>
      </div>
    </transition>

    <!-- 详情 overlay -->
    <transition name="slide-right">
      <div v-if="detailVisible" class="home__detail">
        <header class="home__detail-header">
          <button class="home__detail-back" @click="closeDetail">返回</button>
          <h1 class="home__detail-title">{{ pointLabel }}</h1>
        </header>

        <nav class="home__detail-tabs">
          <button
            v-for="p in phases"
            :key="p"
            class="home__detail-tab"
            :class="{ 'is-active': currentPhase === p }"
            @click="switchPhase(p)"
          >
            {{ phaseLabels[p] }}
          </button>
        </nav>

        <div class="home__detail-content">
          <div class="home__detail-media">
            <img :src="mediaSrc" alt="" />
          </div>
          <div class="home__detail-text">
            <img :src="textSrc" alt="" />
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<style scoped lang="scss">
.home {
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
    object-fit: cover;
  }

  &__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    padding-top: d.h(60);
    pointer-events: none;

    img {
      width: d.w(1200);
      height: auto;
      object-fit: contain;
    }
  }

  &__map {
    position: absolute;
    inset: 0;
    z-index: 5;
  }

  &__point {
    position: absolute;
    width: d.w(120);
    height: d.h(120);
    background: none;
    border: none;
    cursor: pointer;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &-dot {
      width: d.w(24);
      height: d.h(24);
      border-radius: 50%;
      background: #00d4ff;
      box-shadow: 0 0 d.w(20) rgba(0, 212, 255, 0.6);
      transition: transform 0.3s ease;
    }

    &-ring {
      position: absolute;
      width: d.w(80);
      height: d.h(80);
      border-radius: 50%;
      border: 2px solid rgba(0, 212, 255, 0.4);
      animation: point-pulse 2s ease-out infinite;
    }

    &-label {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      color: #fff;
      font-size: d.h(28);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
      margin-bottom: d.h(12);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover .home__point-label,
    &.is-active .home__point-label {
      opacity: 1;
    }

    &:hover .home__point-dot,
    &.is-active .home__point-dot {
      transform: scale(1.5);
    }
  }

  &__hint-btn {
    position: absolute;
    bottom: d.h(60);
    right: d.w(60);
    z-index: 20;
    padding: d.h(16) d.w(40);
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.4);
    border-radius: d.w(8);
    color: #00d4ff;
    font-size: d.h(28);
    cursor: pointer;
    backdrop-filter: blur(8px);
  }

  &__detail {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: d.w(1400);
    z-index: 50;
    background: rgba(2, 6, 23, 0.95);
    backdrop-filter: blur(12px);
    border-left: 1px solid rgba(0, 212, 255, 0.2);
    display: flex;
    flex-direction: column;

    &-header {
      display: flex;
      align-items: center;
      padding: d.h(40) d.w(60);
      gap: d.w(40);
      flex-shrink: 0;
    }

    &-back {
      padding: d.h(12) d.w(32);
      background: rgba(0, 212, 255, 0.15);
      border: 1px solid rgba(0, 212, 255, 0.4);
      border-radius: d.w(8);
      color: #00d4ff;
      font-size: d.h(28);
      cursor: pointer;
    }

    &-title {
      color: #fff;
      font-size: d.h(48);
      font-weight: 600;
    }

    &-tabs {
      display: flex;
      padding: 0 d.w(60);
      gap: d.w(20);
      flex-shrink: 0;
    }

    &-tab {
      padding: d.h(16) d.w(32);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: d.w(8);
      color: rgba(255, 255, 255, 0.7);
      font-size: d.h(28);
      cursor: pointer;
      transition: all 0.3s ease;

      &.is-active {
        background: rgba(0, 212, 255, 0.2);
        border-color: rgba(0, 212, 255, 0.5);
        color: #00d4ff;
      }
    }

    &-content {
      flex: 1;
      display: flex;
      gap: d.w(40);
      padding: d.h(40) d.w(60) d.h(60);
      min-height: 0;
    }

    &-media {
      flex: 1.2;
      border-radius: d.w(16);
      overflow: hidden;
      background: rgba(0, 0, 0, 0.3);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    &-text {
      flex: 0.8;
      border-radius: d.w(16);
      overflow: hidden;
      background: rgba(0, 0, 0, 0.3);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  &__hint-modal {
    position: absolute;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  &__hint-content {
    background: rgba(5, 11, 26, 0.95);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: d.w(16);
    padding: d.h(60) d.w(80);
    text-align: center;

    img {
      width: d.w(600);
      height: auto;
      margin-bottom: d.h(40);
    }

    p {
      color: #fff;
      font-size: d.h(36);
      line-height: 1.6;
    }
  }
}

@keyframes point-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
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

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.4s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
