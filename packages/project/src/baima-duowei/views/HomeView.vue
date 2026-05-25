<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import SecondaryPage from '../components/SecondaryPage.vue'

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
  <SecondaryPage :bg-video="bgVideo" :bg-overlay="headerBg" :title-src="headerTitle" title-alt="多维筑安">
    <nav class="home__nav">
      <div
        v-for="(btn, i) in buttons"
        :key="btn.name"
        class="home__btn-wrap"
        :style="{ '--step': i }"
      >
        <button class="home__btn" @click="goTo(btn.name)">
          <img :src="btn.img" :alt="btn.label" />
        </button>
      </div>
    </nav>
  </SecondaryPage>
</template>

<style scoped lang="scss">
.home__nav {
  position: absolute;
  left: 56%;
  top: 12%;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 2vh;
}

/* 外层：阶梯偏移 + 入场动画 */
.home__btn-wrap {
  margin-left: calc(var(--step, 0) * 5vw);
  animation: btn-enter 0.9s calc(var(--step, 0) * 0.25s + 1s) cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* 内层：纯交互，不受 animation fill-mode 影响 */
.home__btn {
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  img {
    display: block;
    width: 24vw;
    height: auto;
  }

  &:hover {
    transform: translateX(2vw);
  }

  &:active {
    transform: translateX(3.5vw) scaleX(0.96);
    transition: transform 0.08s ease;
  }
}

@keyframes btn-enter {
  from {
    opacity: 0;
    transform: translateX(10vw);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
