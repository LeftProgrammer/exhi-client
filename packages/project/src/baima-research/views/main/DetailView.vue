<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import { useIdleReset } from '@shared/composables/useIdleReset'
import { useScreenSync } from '../../composables/useScreenSync'
import type { DetailPhase } from '../../composables/useScreenSync'

const router = useRouter()
const route = useRoute()
const pointId = computed(() => route.params.id as string)
const { syncPhase, syncIdle } = useScreenSync()

useIdleReset(() => {
  syncIdle()
  router.push({ name: 'home' })
})

const bgImage = resolvePkgUrl('baima-research/detail-bg.png')
const phases: DetailPhase[] = ['difficulty', 'core', 'patent', 'honor']
const phaseLabels: Record<DetailPhase, string> = {
  difficulty: '科研难点',
  core: '核心科研',
  patent: '专利技术',
  honor: '荣誉效益'
}

const currentPhase = ref<DetailPhase>('difficulty')
const mediaType = ref<'img' | 'video'>('img')

const mediaSrc = computed(() => {
  const type = mediaType.value
  return resolvePkgUrl(`baima-research/${pointId.value}/${currentPhase.value}.${type}`)
})

const textSrc = computed(() =>
  resolvePkgUrl(`baima-research/${pointId.value}/${currentPhase.value}-text.png`)
)

function switchPhase(p: DetailPhase) {
  currentPhase.value = p
  syncPhase(p)
}

function backToHome() {
  syncIdle()
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="detail">
    <img class="detail__bg" :src="bgImage" alt="" />

    <header class="detail__header">
      <button class="detail__back" @click="backToHome">返回</button>
      <h1 class="detail__title">{{ pointId }}</h1>
    </header>

    <nav class="detail__tabs">
      <button
        v-for="p in phases"
        :key="p"
        class="detail__tab"
        :class="{ 'is-active': currentPhase === p }"
        @click="switchPhase(p)"
      >
        {{ phaseLabels[p] }}
      </button>
    </nav>

    <div class="detail__content">
      <div class="detail__media">
        <img
          v-if="mediaType === 'img'"
          :src="mediaSrc"
          alt=""
        />
        <video
          v-else
          :src="mediaSrc"
          autoplay
          muted
          loop
          playsinline
        />
      </div>
      <div class="detail__text">
        <img :src="textSrc" alt="" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.detail {
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

  &__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: d.h(40) d.w(60);
    gap: d.w(40);
  }

  &__back {
    padding: d.h(12) d.w(32);
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.4);
    border-radius: d.w(8);
    color: #00d4ff;
    font-size: d.h(28);
    cursor: pointer;
  }

  &__title {
    color: #fff;
    font-size: d.h(48);
    font-weight: 600;
  }

  &__tabs {
    position: absolute;
    top: d.h(140);
    left: d.w(60);
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: d.h(20);
  }

  &__tab {
    width: d.w(280);
    padding: d.h(20) d.w(24);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: d.w(8);
    color: rgba(255, 255, 255, 0.7);
    font-size: d.h(32);
    text-align: left;
    cursor: pointer;
    transition: all 0.3s ease;

    &.is-active {
      background: rgba(0, 212, 255, 0.2);
      border-color: rgba(0, 212, 255, 0.5);
      color: #00d4ff;
    }
  }

  &__content {
    position: absolute;
    top: d.h(140);
    left: d.w(380);
    right: d.w(60);
    bottom: d.h(60);
    z-index: 5;
    display: flex;
    gap: d.w(40);
  }

  &__media {
    flex: 1.2;
    border-radius: d.w(16);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);

    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__text {
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
</style>
