<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useScreenSync } from '../../composables/useScreenSync'
import { POINTS, MENU_POINTS, getPoint, type PointStatus, type Layout } from '../../data/points'

const { syncPoint, syncIdle } = useScreenSync()

const bgImage = resolvePkgUrl('common/main-bg.png')
const topText = resolvePkgUrl('common/top-text.png')
const iconSample = resolvePkgUrl('buttons/icon-sample.png')
const playImg = resolvePkgUrl('points/baima-bridge/main/play.png')
const pauseImg = resolvePkgUrl('points/baima-bridge/main/pause.png')

const activeId = ref<string | null>(null)
const activePoint = computed(() => getPoint(activeId.value))
const isStandby = computed(() => activeId.value === null)
const visiblePoints = computed(() =>
  isStandby.value ? POINTS : POINTS.filter((p) => p.id === activeId.value)
)

// 选中点位的主屏详情素材（仅 hasContent 点位）
const detail = computed(() => {
  if (!activePoint.value?.hasContent) return null
  const base = `points/${activeId.value}/main`
  return {
    zoom: resolvePkgUrl(`${base}/zoom.png`),
    desc: resolvePkgUrl(`${base}/desc.png`),
    project: resolvePkgUrl(`${base}/project.png`),
    needs: resolvePkgUrl(`${base}/needs.png`)
  }
})

// ── 素材路径 ──
function menuBtn(id: string, active: boolean) {
  return resolvePkgUrl(`buttons/${id}${active ? '-active' : ''}.png`)
}
function markerName(id: string) {
  return resolvePkgUrl(`buttons/${id}-name.png`)
}
function markerBtn(status: PointStatus) {
  return resolvePkgUrl(`buttons/${status}.png`)
}

function toDesignStyle(layout: Layout) {
  return {
    top: `calc(${layout.top} / var(--design-h) * 100vh)`,
    left: `calc(${layout.left} / var(--design-w) * 100vw)`,
    width: `calc(${layout.width} / var(--design-w) * 100vw)`,
    height: `calc(${layout.height} / var(--design-h) * 100vh)`
  }
}

function markerStyle(p: (typeof POINTS)[0]) {
  return {
    top: `calc(${p.map.top} / var(--design-h) * 100vh)`,
    left: `calc(${p.map.left} / var(--design-w) * 100vw)`
  }
}

function selectPoint(id: string) {
  if (activeId.value === id) return
  activeId.value = id
  syncPoint(id)
}

function backToStandby() {
  activeId.value = null
  syncIdle()
}

function handlePlay() {
  // TODO: 向 top-left 屏幕发送播放指令
}

function handlePause() {
  // TODO: 向 top-left 屏幕发送暂停指令
}

useIdleReset(() => {
  if (!isStandby.value) backToStandby()
})
</script>

<template>
  <main class="home">
    <img class="home__bg" :src="bgImage" alt="" />

    <!-- 顶部说明文字（仅待机展示） -->
    <transition name="fade">
      <img v-if="isStandby" class="home__top-text" :src="topText" alt="" />
    </transition>

    <!-- 地图标记点位：待机展示全部，选中后仅保留当前点位 -->
    <transition name="fade">
      <div v-if="visiblePoints.length" class="home__markers">
        <button
          v-for="p in visiblePoints"
          :key="p.id"
          class="home__marker"
          :style="markerStyle(p)"
          @click="selectPoint(p.id)"
        >
          <img class="home__marker-name" :src="markerName(p.id)" :alt="p.id" />
          <img class="home__marker-btn" :src="markerBtn(p.status)" alt="" />
        </button>
      </div>
    </transition>

    <!-- 选中点位详情：区域放大图 + 民生痛点 + 科研项目 -->
    <transition name="fade">
      <div v-if="detail && activePoint?.detail" class="home__detail">
        <img
          class="home__detail-zoom"
          :src="detail.zoom"
          :style="toDesignStyle(activePoint.detail.zoom)"
          alt=""
        />
        <img
          class="home__detail-desc"
          :src="detail.desc"
          :style="toDesignStyle(activePoint.detail.desc)"
          alt="详情描述"
        />
        <img
          class="home__detail-project"
          :src="detail.project"
          :style="toDesignStyle(activePoint.detail.project)"
          alt="科研项目"
        />
        <img
          v-if="activePoint.detail.needs"
          class="home__detail-needs"
          :src="detail.needs"
          :style="toDesignStyle(activePoint.detail.needs)"
          alt="科研需求"
        />
      </div>
    </transition>

    <!-- 选中无内容点位时的占位提示 -->
    <transition name="fade">
      <div v-if="activePoint && !activePoint.hasContent" class="home__placeholder">
        「{{ activePoint.id }}」内容建设中
      </div>
    </transition>

    <!-- 左下角常驻 icon（待机时显示，选中点位后隐藏） -->
    <img v-if="isStandby" class="home__icon-sample" :src="iconSample" alt="" />

    <!-- 右侧导航菜单（图片按钮，常驻） -->
    <nav class="home__menu">
      <template v-for="p in MENU_POINTS" :key="p.id">
        <div v-if="p.id === 'baima-bridge'" class="home__menu-wrapper">
          <button class="home__menu-item" @click="selectPoint(p.id)">
            <img :src="menuBtn(p.id, activeId === p.id)" :alt="p.id" />
          </button>
          <transition name="fade">
            <div v-if="activeId === 'baima-bridge'" class="home__media-controls">
              <button class="home__media-play" @click="handlePlay">
                <img :src="playImg" alt="播放" />
              </button>
              <button class="home__media-pause" @click="handlePause">
                <img :src="pauseImg" alt="暂停" />
              </button>
            </div>
          </transition>
        </div>
        <button v-else class="home__menu-item" @click="selectPoint(p.id)">
          <img :src="menuBtn(p.id, activeId === p.id)" :alt="p.id" />
        </button>
      </template>
      <button class="home__menu-item" @click="backToStandby">
        <img :src="menuBtn('home', isStandby)" alt="首页" />
      </button>
    </nav>
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
    object-fit: fill;
    z-index: 0;
  }

  &__top-text {
    position: absolute;
    top: d.h(107);
    left: d.w(213);
    width: d.w(2999);
    height: d.h(441);
    z-index: 6;
    pointer-events: none;
  }

  &__markers {
    position: absolute;
    inset: 0;
    z-index: 5;
  }

  &__marker {
    position: absolute;
    width: d.w(227);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s ease;

    &-name {
      width: 100%;
      height: d.h(61);
      object-fit: contain;
      margin-bottom: d.h(21);
      filter: drop-shadow(0 d.h(2) d.h(6) rgba(0, 0, 0, 0.6));
    }

    &-btn {
      width: d.w(253);
      height: d.h(253);
      object-fit: contain;
    }

    &:hover {
      transform: scale(1.08);
    }
  }

  &__detail {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;

    &-zoom {
      position: absolute;
      object-fit: contain;
      z-index: 1;
    }

    &-desc,
    &-project,
    &-needs {
      position: absolute;
      object-fit: contain;
    }
  }

  &__placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 8;
    padding: d.h(40) d.w(80);
    background: rgba(2, 6, 23, 0.8);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: d.w(12);
    color: #00d4ff;
    font-size: d.h(48);
  }

  &__icon-sample {
    position: absolute;
    left: d.w(213);
    top: d.h(1645);
    width: d.w(606);
    height: d.h(201);
    z-index: 20;
    pointer-events: none;
  }

  &__menu {
    position: absolute;
    bottom: d.h(302);
    right: d.w(196);
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: d.h(49);
  }

  &__menu-item {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: block;
    transition: transform 0.2s ease;

    img {
      display: block;
      width: d.w(287);
      height: d.h(80);
    }

    &:hover {
      transform: scale(1.04);
    }
  }

  &__menu-wrapper {
    position: relative;
  }

  &__media-controls {
    position: absolute;
    right: calc(100% + d.w(30));
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: d.h(11);
    pointer-events: auto;
  }

  &__media-play,
  &__media-pause {
    background: none;
    border: none;
    padding: 0;
    width: d.w(213);
    height: d.h(51);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
