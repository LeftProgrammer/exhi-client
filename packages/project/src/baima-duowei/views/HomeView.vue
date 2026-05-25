<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()

const bgVideo = resolvePkgUrl('home/bg.mp4')
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

    <PageHeader class="home__header" :title-src="headerTitle" title-alt="多维筑安" />

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
