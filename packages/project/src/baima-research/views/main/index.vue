<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import { useScreenSync } from '../../composables/useScreenSync'
import { POINTS, MENU_POINTS, getPoint, type PointStatus, type Layout } from '../../data/points'

const sfx = useProjectSfx()

const { syncPoint, syncIdle, syncVideoPlay, syncVideoPause } = useScreenSync()

const bgImage = resolvePkgUrl('common/main-bg.png')
const topText = resolvePkgUrl('common/top-text.png')
const iconSample = resolvePkgUrl('buttons/icon-sample.png')
const playImg = computed(() =>
  activeId.value ? resolvePkgUrl(`points/${activeId.value}/main/play.png`) : ''
)
const pauseImg = computed(() =>
  activeId.value ? resolvePkgUrl(`points/${activeId.value}/main/pause.png`) : ''
)

const activeId = ref<string | null>(null)
const activePoint = computed(() => getPoint(activeId.value))
const isStandby = computed(() => activeId.value === null)
const visiblePoints = computed(() =>
  isStandby.value ? POINTS : POINTS.filter((p) => p.id === activeId.value)
)

// 选中点位的主屏详情素材（有 detail 配置时展示）
const detail = computed(() => {
  const p = activePoint.value
  if (!p?.detail) return null
  const base = `points/${activeId.value}/main`
  const result: Record<string, string> = {}
  if (p.detail.zoom) result.zoom = resolvePkgUrl(`${base}/zoom.png`)
  if (p.detail.desc) {
    result.desc = resolvePkgUrl(`${base}/desc.png`)
    result.desc2 = resolvePkgUrl(`${base}/desc-2.png`)
    result.desc3 = resolvePkgUrl(`${base}/desc-3.png`)
  }
  if (p.detail.project) result.project = resolvePkgUrl(`${base}/project.png`)
  if (p.detail.needs) result.needs = resolvePkgUrl(`${base}/needs.png`)
  if (p.detail.guide) result.guide = resolvePkgUrl(`${base}/guide.png`)
  return result
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
  sfx.play('tap')
}

function backToStandby() {
  if (isStandby.value) return
  activeId.value = null
  syncIdle()
  sfx.play('tap')
}

function handlePlay() {
  syncVideoPlay()
  sfx.play('tap')
}

function handlePause() {
  syncVideoPause()
  sfx.play('tap')
}

useIdleReset(() => {
  if (!isStandby.value) backToStandby()
})
</script>

<template>
  <main class="home">
    <img class="home__bg" :src="bgImage" alt="" />

    <!-- 顶部说明文字（仅待机展示） -->
    <transition name="top-text" appear>
      <img v-if="isStandby" class="home__top-text" :src="topText" alt="" />
    </transition>

    <!-- 地图标记点位：待机展示全部，选中后仅保留当前点位 -->
    <transition name="markers" mode="out-in">
      <div v-if="visiblePoints.length" :key="isStandby ? 'all' : (activeId || 'selected')" class="home__markers">
        <button
          v-for="(p, i) in visiblePoints"
          :key="p.id"
          class="home__marker"
          :class="{ 'home__marker--active': activeId === p.id }"
          :style="[markerStyle(p), { '--enter-delay': `${0.3 + i * 0.12}s` }]"
          @click="selectPoint(p.id)"
        >
          <img class="home__marker-name" :src="markerName(p.id)" :alt="p.id" />
          <img class="home__marker-btn" :src="markerBtn(p.status)" alt="" />
        </button>
      </div>
    </transition>

    <!-- 选中点位详情：区域放大图 + 详情描述 + 科研项目 + 科研需求 -->
    <transition name="content" mode="out-in">
      <div v-if="detail && activePoint?.detail" :key="activeId ?? 'standby'" class="home__detail">
        <img
          v-if="activePoint.detail.zoom"
          class="home__detail-zoom"
          :src="detail.zoom"
          :style="toDesignStyle(activePoint.detail.zoom)"
          alt=""
        />
        <img
          v-if="activePoint.detail.desc"
          class="home__detail-desc"
          :src="detail.desc"
          :style="toDesignStyle(activePoint.detail.desc)"
          alt="详情描述"
        />
        <img
          v-if="activePoint.detail.desc2 && detail.desc2"
          class="home__detail-desc2"
          :src="detail.desc2"
          :style="toDesignStyle(activePoint.detail.desc2)"
          alt="详情描述2"
        />
        <img
          v-if="activePoint.detail.desc3 && detail.desc3"
          class="home__detail-desc3"
          :src="detail.desc3"
          :style="toDesignStyle(activePoint.detail.desc3)"
          alt="详情描述3"
        />
        <img
          v-if="activePoint.detail.project"
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
        <img
          v-if="activePoint.detail.guide"
          class="home__detail-guide"
          :src="detail.guide"
          :style="toDesignStyle(activePoint.detail.guide)"
          alt=""
        />
      </div>
    </transition>

    <!-- 选中无内容点位时的占位提示 -->
    <transition name="content" mode="out-in">
      <div
        v-if="activePoint && !activePoint.detail"
        :key="activeId ?? 'standby'"
        class="home__placeholder"
      >
        「{{ activePoint.id }}」内容建设中
      </div>
    </transition>

    <!-- 左下角常驻 icon（待机时显示，选中点位后淡出隐藏） -->
    <transition name="fade">
      <img v-if="isStandby" class="home__icon-sample" :src="iconSample" alt="" />
    </transition>

    <!-- 右侧导航菜单（图片按钮，常驻） -->
    <nav class="home__menu">
      <template v-for="(p, i) in MENU_POINTS" :key="p.id">
        <div v-if="p.id === 'baima-bridge' || p.id === 'blasting'" class="home__menu-wrapper">
          <button
            class="home__menu-item"
            :class="{ 'home__menu-item--active': activeId === p.id }"
            :style="{ '--enter-delay': `${0.6 + i * 0.06}s` }"
            @click="selectPoint(p.id)"
          >
            <img :src="menuBtn(p.id, activeId === p.id)" :alt="p.id" />
          </button>
          <transition name="fade">
            <div v-if="activeId === p.id" class="home__media-controls">
              <button class="home__media-play" @click="handlePlay">
                <img :src="playImg" alt="播放" />
              </button>
              <button class="home__media-pause" @click="handlePause">
                <img :src="pauseImg" alt="暂停" />
              </button>
            </div>
          </transition>
        </div>
        <button
          v-else
          class="home__menu-item"
          :class="{ 'home__menu-item--active': activeId === p.id }"
          :style="{ '--enter-delay': `${0.6 + i * 0.06}s` }"
          @click="selectPoint(p.id)"
        >
          <img :src="menuBtn(p.id, activeId === p.id)" :alt="p.id" />
        </button>
      </template>
      <button
        class="home__menu-item"
        :class="{ 'home__menu-item--active': isStandby }"
        :style="{ '--enter-delay': `${0.6 + MENU_POINTS.length * 0.06}s` }"
        @click="backToStandby"
      >
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
    pointer-events: none;
    /* 首次入场：淡入 */
    animation: bg-fade 0.8s fx.$ease-enter both;
  }

  &__top-text {
    position: absolute;
    top: d.h(107);
    left: d.w(213);
    width: d.w(2999);
    height: d.h(441);
    z-index: 6;
    pointer-events: none;
    /* 首次入场由 Vue transition appear 处理，不再用 CSS animation（避免 fill-mode 锁定 opacity 导致离场 transition 不触发） */
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
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter 0.35s ease;
    /* 首次入场：错峰淡入 + 轻微上浮 */
    animation: marker-enter 0.8s var(--enter-delay) fx.$ease-enter both;

    &-name {
      width: 100%;
      height: d.h(61);
      object-fit: contain;
      margin-bottom: d.h(21);
      filter: drop-shadow(0 d.h(2) d.h(6) rgba(0, 0, 0, 0.6));
      transition: transform 0.25s ease;
    }

    &-btn {
      width: d.w(253);
      height: d.h(253);
      object-fit: contain;
      /* 待机时缓慢呼吸光晕，吸引触摸 */
      animation: marker-breathe 2.6s ease-in-out infinite;
      will-change: transform, filter;
    }

    /* hover：放大 + 名称上浮 */
    &:hover {
      transform: scale(1.08);
    }
    &:hover &-name {
      transform: translateY(d.h(-8));
    }
    /* hover/按下时定格呼吸并强化光晕 */
    &:hover &-btn,
    &:active &-btn {
      animation-play-state: paused;
      filter: drop-shadow(0 0 d.w(28) rgba(0, 212, 255, 0.9));
    }
    /* 触屏点按：明显缩放 + 提亮，反馈持续时间更长 */
    &:active {
      transform: scale(0.86);
      filter: brightness(1.2);
      transition-duration: 0.3s;
    }
    /* 选中态：聚焦脉冲扩散光环（从待机态切过来时非常明显） */
    &--active {
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: d.w(253);
        height: d.h(253);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        animation: marker-focus-ring 0.7s fx.$ease-enter both;
        pointer-events: none;
        z-index: -1;
      }
      .home__marker-btn {
        animation-play-state: paused;
        filter: drop-shadow(0 0 d.w(36) rgba(0, 212, 255, 1));
      }
    }
  }

  &__detail {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;

    /* 内部图片错峰入场：容器到位后逐个上浮淡入（排除 zoom，zoom 有独立动画） */
    > img:not(.home__detail-zoom) {
      animation: content-item-enter 0.5s fx.$ease-enter both;
      opacity: 0; /* delay 期间由 backwards 保持不可见 */
    }
    /* 按 DOM 顺序错峰（间隔 0.1s） */
    > img:nth-child(1):not(.home__detail-zoom) { animation-delay: 0.15s; }
    > img:nth-child(2):not(.home__detail-zoom) { animation-delay: 0.25s; }
    > img:nth-child(3):not(.home__detail-zoom) { animation-delay: 0.35s; }
    > img:nth-child(4):not(.home__detail-zoom) { animation-delay: 0.45s; }
    > img:nth-child(5):not(.home__detail-zoom) { animation-delay: 0.55s; }
    > img:nth-child(6):not(.home__detail-zoom) { animation-delay: 0.65s; }
    > img:nth-child(7):not(.home__detail-zoom) { animation-delay: 0.75s; }

    /* zoom 放大图：淡入+轻微放大入场，与 markers 效果协调 */
    &-zoom {
      position: absolute;
      object-fit: contain;
      z-index: 1;
      animation: zoom-enter 0.8s 0.15s fx.$ease-enter both;
    }

    &-desc,
    &-desc2,
    &-desc3,
    &-project,
    &-needs,
    &-guide {
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
    /* 入场：淡入 + 上浮 */
    animation: content-item-enter 0.5s 0.15s fx.$ease-enter both;
  }

  &__icon-sample {
    position: absolute;
    left: d.w(213);
    top: d.h(1645);
    width: d.w(606);
    height: d.h(201);
    z-index: 20;
    pointer-events: none;
    /* 首次入场：淡入 + 轻微缩放（backwards：delay 期间不可见，结束后不锁定避免和 transition 冲突） */
    animation: icon-enter 0.6s 0.5s fx.$ease-enter backwards;
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
    position: relative;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: block;
    overflow: hidden;
    border-radius: d.w(8);
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter 0.35s ease;
    /* 首次入场：错峰淡入 + 轻微上浮 */
    animation: menu-enter 0.7s var(--enter-delay) fx.$ease-enter both;

    img {
      display: block;
      width: d.w(287);
      height: d.h(80);
    }

    &:hover {
      transform: scale(1.06);
    }
    /* 触屏点按：明显缩放 + 提亮，反馈持续时间更长 */
    &:active {
      transform: scale(0.86);
      filter: brightness(1.4);
      transition-duration: 0.3s;
    }
    /* 选中态：放大定格 + 青色光晕（触屏无 hover，靠它明确当前选中） */
    &--active {
      transform: scale(1.08);
      filter: drop-shadow(0 0 d.w(22) rgba(0, 212, 255, 0.8));
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
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.2s ease,
      filter 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
    &:active {
      transform: scale(0.92);
      filter: brightness(1.3);
      transition-duration: 0.1s;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }
}

.fade-enter-active {
  transition: opacity 0.4s ease;
}
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* top-text 专属：离场向上滑出+淡出，不挡内容 */
.top-text-enter-active {
  transition:
    opacity 1.2s 0.3s fx.$ease-enter,
    transform 1.2s 0.3s fx.$ease-enter;
}
.top-text-leave-active {
  transition:
    opacity 0.35s fx.$ease-leave,
    transform 0.35s fx.$ease-leave;
}
.top-text-enter-from {
  opacity: 0;
  transform: translateY(d.h(-100));
}
.top-text-leave-to {
  opacity: 0;
  transform: translateY(d.h(-100));
}

/* ── 地标整组切换：先全部消失，再重新出现 ── */
.markers-enter-active {
  transition: opacity 0.4s fx.$ease-enter;
}
.markers-leave-active {
  transition: opacity 0.25s fx.$ease-leave;
}
.markers-enter-from,
.markers-leave-to {
  opacity: 0;
}

/* zoom 放大图入场：淡入+轻微放大，呼应 markers 入场节奏 */
@keyframes zoom-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
  }
}

/* ── 地点内容切换：旧内容淡出离场，新内容从容淡入 ── */
.content-enter-active {
  transition:
    opacity 0.8s ease-in-out,
    transform 0.8s ease-in-out,
    filter 0.8s ease-in-out;
}
.content-leave-active {
  transition:
    opacity 0.35s fx.$ease-leave,
    transform 0.35s fx.$ease-leave,
    filter 0.35s fx.$ease-leave;
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.content-enter-from {
  opacity: 0;
  transform: translateY(d.h(25)) scale(1.02);
  filter: blur(d.w(5));
}
.content-leave-to {
  opacity: 0;
  transform: translateY(d.h(-15)) scale(0.98);
  filter: blur(d.w(3));
}

/* 标记呼吸：缓慢缩放 + 青色光晕脉动 */
@keyframes marker-breathe {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(0, 212, 255, 0));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 d.w(16) rgba(0, 212, 255, 0.55));
  }
}

/* 内容内部图片错峰入场 */
@keyframes content-item-enter {
  from {
    opacity: 0;
    transform: translateY(d.h(20));
  }
  to {
    opacity: 1;
  }
}

/* 选中聚焦：向外扩散的青色光环 */
@keyframes marker-focus-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.85);
  }
  100% {
    box-shadow: 0 0 d.w(60) d.w(20) rgba(0, 212, 255, 0);
  }
}

/* ── 首次入场动效 ── */
@keyframes marker-enter {
  from {
    opacity: 0;
    transform: translateY(-70px);
  }
  to {
    opacity: 1;
  }
}

@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
  }
}

@keyframes top-enter {
  from {
    opacity: 0;
    transform: translateY(-40px);
  }
  to {
    opacity: 1;
  }
}

@keyframes icon-enter {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
  }
}

@keyframes bg-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
