<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'

defineProps<{ title: string }>()

const router = useRouter()
const bgVideo = resolvePkgUrl('shared/line-flow.mp4')

function goHome() {
  router.push({ name: 'home' })
}
function goPrev() {
  router.go(-1)
}
function goNext() {
  router.go(1)
}
</script>

<template>
  <main class="placeholder">
    <video
      class="placeholder__video"
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
    <div class="placeholder__veil" />

    <div class="placeholder__center">
      <h1 class="placeholder__title">{{ title }}</h1>
      <p class="placeholder__hint">内容建设中</p>
    </div>

    <nav class="placeholder__nav">
      <button class="placeholder__nav-btn" @click="goPrev">上一页</button>
      <button class="placeholder__nav-btn" @click="goNext">下一页</button>
      <button class="placeholder__nav-btn placeholder__nav-btn--home" @click="goHome">首页</button>
    </nav>
  </main>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.placeholder {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: t.$color-bg-primary;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  transform: translateZ(0);
}

.placeholder__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(5, 11, 26, 0.6);
}

.placeholder__center {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
}

.placeholder__title {
  font-size: 4vw;
  font-weight: 700;
  color: #7ee8ff;
  margin-bottom: 2vh;
  letter-spacing: 0.1em;
}

.placeholder__hint {
  font-size: 2vw;
  opacity: 0.55;
}

.placeholder__nav {
  position: absolute;
  bottom: 4%;
  right: 3%;
  z-index: 3;
  display: flex;
  gap: 1.5vw;
}

.placeholder__nav-btn {
  padding: 1vh 2vw;
  background: rgba(80, 200, 255, 0.12);
  border: 1px solid rgba(80, 200, 255, 0.35);
  border-radius: 4px;
  color: #fff;
  font-size: 1.4vw;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  &:hover {
    background: rgba(80, 200, 255, 0.28);
    border-color: rgba(80, 200, 255, 0.75);
  }

  &--home {
    background: rgba(80, 200, 255, 0.22);
  }
}
</style>
