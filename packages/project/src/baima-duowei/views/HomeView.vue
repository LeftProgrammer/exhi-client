<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

const router = useRouter()

const bgVideo = resolvePkgUrl('home/bg.mp4')
const headerBg = resolvePkgUrl('home/header-bg.png')
const headerTitle = resolvePkgUrl('home/header-title.png')

const buttons = [
  { name: 'safety', img: resolvePkgUrl('home/btn-safety.png'), label: '安全成效' },
  { name: 'tech', img: resolvePkgUrl('home/btn-tech.png'), label: '智慧技术' },
  { name: 'activity', img: resolvePkgUrl('home/btn-activity.png'), label: '安全活动' },
  { name: 'standard', img: resolvePkgUrl('home/btn-standard.png'), label: '标准化建设' }
]

function goTo(name: string) {
  router.push({ name })
}
</script>

<template>
  <main class="home">
    <video
      class="home__video"
      :src="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      disableremoteplayback
      @contextmenu.prevent
    />
    <div class="home__veil" />

    <header class="home__header">
      <img class="home__header-bg" :src="headerBg" alt="" aria-hidden="true" />
      <img class="home__header-title" :src="headerTitle" alt="多维筑安" />
      <div class="home__header-shine" aria-hidden="true" />
    </header>

    <nav class="home__nav">
      <button v-for="btn in buttons" :key="btn.name" class="home__btn" @click="goTo(btn.name)">
        <img :src="btn.img" :alt="btn.label" />
      </button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
}

.home__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
  transform: translateZ(0);
  isolation: isolate;
}

.home__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 0%, rgba(5, 11, 26, 0.3) 70%);
}

.home__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  pointer-events: none;
}

.home__header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.8s, $delay: 0.1s);
}

.home__header-title {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  @include fx.enter-fade-in($duration: 0.9s, $delay: 0.3s);
}

.home__header-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
  @include fx.auto-shine-from-center($duration: 1.2s, $interval: 6s, $width: 30%);
}

.home__nav {
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2vh;
}

.home__btn {
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    filter 0.25s ease;

  @include fx.enter-from-right;

  img {
    display: block;
    width: 32vw;
    height: auto;
  }

  &:hover {
    transform: scale(1.04) translateX(-4px);
    filter: brightness(1.15) drop-shadow(0 0 12px rgba(80, 200, 255, 0.6));
  }

  &:active {
    transform: scale(0.97);
    transition-duration: 0.1s;
  }
}
</style>
