<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useScreenSync } from '../../composables/useScreenSync'
import { POINTS, MENU_POINTS, getPoint, type PointStatus } from '../../data/points'

const { syncPoint, syncIdle } = useScreenSync()

const bgImage = resolvePkgUrl('common/main-bg.png')
const topText = resolvePkgUrl('common/main-text.png')

const activeId = ref<string | null>(null)
const activePoint = computed(() => getPoint(activeId.value))
const isStandby = computed(() => activeId.value === null)

// 选中点位的主屏详情素材（仅 hasContent 点位）
const detail = computed(() => {
  if (!activePoint.value?.hasContent) return null
  const base = `points/${activeId.value}/main`
  return {
    zoom: resolvePkgUrl(`${base}/zoom.png`),
    minsheng: resolvePkgUrl(`${base}/minsheng.png`),
    project: resolvePkgUrl(`${base}/project.png`)
  }
})

// ── 素材路径 ──
function menuBtn(id: string, active: boolean) {
  return resolvePkgUrl(`buttons/${id}${active ? '-active' : ''}.png`)
}
function markerName(id: string) {
  return resolvePkgUrl(`buttons/${id}-name.png`)
}
function markerHalo(status: PointStatus) {
  return resolvePkgUrl(`buttons/${status === 'done' ? 'orange' : 'blue'}-base.png`)
}
function markerIcon(status: PointStatus) {
  return resolvePkgUrl(`buttons/${status === 'done' ? 'orange' : 'blue'}-dots.png`)
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

    <!-- 地图标记点位：仅待机展示，选中后隐藏全部 -->
    <transition name="fade">
      <div v-if="isStandby" class="home__markers">
        <button
          v-for="p in POINTS"
          :key="p.id"
          class="home__marker"
          :style="{ top: p.map.top + '%', left: p.map.left + '%' }"
          @click="selectPoint(p.id)"
        >
          <img class="home__marker-name" :src="markerName(p.id)" :alt="p.name" />
          <span class="home__marker-pin">
            <img class="home__marker-halo" :src="markerHalo(p.status)" alt="" />
            <img class="home__marker-icon" :src="markerIcon(p.status)" alt="" />
          </span>
        </button>
      </div>
    </transition>

    <!-- 选中点位详情：区域放大图 + 民生痛点 + 科研项目 -->
    <transition name="fade">
      <div v-if="detail" class="home__detail">
        <img class="home__detail-zoom" :src="detail.zoom" alt="" />
        <img class="home__detail-minsheng" :src="detail.minsheng" alt="民生痛点" />
        <img class="home__detail-project" :src="detail.project" alt="科研项目" />
      </div>
    </transition>

    <!-- 选中无内容点位时的占位提示 -->
    <transition name="fade">
      <div v-if="activePoint && !activePoint.hasContent" class="home__placeholder">
        「{{ activePoint.name }}」内容建设中
      </div>
    </transition>

    <!-- 右侧导航菜单（图片按钮，常驻） -->
    <nav class="home__menu">
      <button
        v-for="p in MENU_POINTS"
        :key="p.id"
        class="home__menu-item"
        @click="selectPoint(p.id)"
      >
        <img :src="menuBtn(p.id, activeId === p.id)" :alt="p.name" />
      </button>
      <button class="home__menu-item home__menu-home" @click="backToStandby">
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
    object-fit: cover;
    z-index: 0;
  }

  &__top-text {
    position: absolute;
    top: d.h(70);
    left: d.w(80);
    width: d.w(1500);
    height: auto;
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
    transform: translate(-50%, -100%);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s ease;

    &-name {
      width: auto;
      height: d.h(46);
      object-fit: contain;
      margin-bottom: d.h(4);
      filter: drop-shadow(0 d.h(2) d.h(6) rgba(0, 0, 0, 0.6));
    }

    &-pin {
      position: relative;
      width: d.w(200);
      height: d.h(200);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &-halo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &-icon {
      position: relative;
      width: auto;
      height: d.h(96);
      object-fit: contain;
      z-index: 1;
    }

    &:hover {
      transform: translate(-50%, -100%) scale(1.08);
    }
  }

  &__detail {
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;

    &-zoom {
      position: absolute;
      top: 50%;
      left: d.w(60);
      transform: translateY(-50%);
      width: d.w(900);
      height: auto;
      object-fit: contain;
    }

    &-minsheng {
      position: absolute;
      top: d.h(180);
      left: d.w(560);
      width: d.w(1100);
      height: auto;
      object-fit: contain;
    }

    &-project {
      position: absolute;
      bottom: d.h(120);
      left: d.w(80);
      width: d.w(1200);
      height: auto;
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

  &__menu {
    position: absolute;
    top: 50%;
    right: d.w(50);
    transform: translateY(-50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: d.h(18);
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
      width: d.w(280);
      height: auto;
    }

    &:hover {
      transform: scale(1.04);
    }
  }

  &__menu-home {
    margin-top: d.h(24);
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
