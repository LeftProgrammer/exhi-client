<script setup lang="ts">
import { useRouter } from 'vue-router'
import { resolvePkgUrl } from '@shared/utils/url'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const { play: playSfx } = useProjectSfx()

const bgVideo = resolvePkgUrl('home/bg.mp4')
const bgPoster = resolvePkgUrl('home/poster.png')
const headerBg = resolvePkgUrl('home/header-bg.png')
const headerTitle = resolvePkgUrl('home/header-title.png')

const buttons = [
  { name: 'safety', img: resolvePkgUrl('home/btn-safety.png'), label: '安全成效' },
  { name: 'tech', img: resolvePkgUrl('home/btn-tech.png'), label: '智慧技术' },
  { name: 'activity', img: resolvePkgUrl('home/btn-activity.png'), label: '安全活动' },
  { name: 'standard', img: resolvePkgUrl('home/btn-standard.png'), label: '标准化建设' }
]

function goTo(name: string) {
  playSfx('nav')
  router.push({ name })
}
</script>

<template>
  <PageLayout
    class="home-page"
    :bg-video="bgVideo"
    :bg-video-poster="bgPoster"
    :bg-overlay="headerBg"
    :title-src="headerTitle"
    title-alt="多维筑安"
  >
    <nav class="home__nav">
      <div
        v-for="(btn, i) in buttons"
        :key="btn.name"
        class="home__btn-wrap"
        :style="{ '--step': i }"
      >
        <div class="home__btn-float">
          <button class="home__btn" @click="goTo(btn.name)">
            <img :src="btn.img" :alt="btn.label" />
          </button>
        </div>
      </div>
    </nav>
  </PageLayout>
</template>

<style scoped lang="scss">
.home__nav {
  position: absolute;
  left: 52%;
  top: d.h(350);
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: d.h(24);
}

/* 外层：阶梯偏移 + 弹性入场 */
.home__btn-wrap {
  margin-left: calc(var(--step, 0) * 5vw);
  animation-name: btn-enter;
  animation-duration: 0.85s;
  animation-delay: calc(var(--step, 0) * 0.2s + 0.5s);
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  animation-fill-mode: both;
}

/* 呼吸层：专门承担悬浮微动，避免跟入场/离场动画冲突 */
.home__btn-float {
  display: block;
  @include fx.float-breath($duration: 3.8s, $delay: 0s, $rise: d.h(20), $scale: 1.03);
}

/* nav 内任意按钮 hover → 所有按钮呼吸暂停，避免与 hover 位移叠加 */
.home__nav:hover .home__btn-float {
  animation-play-state: paused;
}

/* 内层：纯交互 */
.home__btn {
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  img {
    display: block;
    width: d.w(1114);
    height: d.h(390);
  }

  &:hover {
    transform: translateX(1.2vw);
    filter: brightness(1.15);
    transition:
      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.25s ease;
  }

  &:active {
    transform: translateX(2.5vw) scaleX(0.96);
    filter: brightness(1.25);
    transition:
      transform 0.08s ease,
      filter 0.08s ease;
  }
}

/* 头部标题淡入：覆盖 PageLayout 的 clip-path 揭幕，恢复为下滑淡入 */
:deep(.sec-page__title) {
  clip-path: inset(0);
  opacity: 1;
  animation: title-fade-in 1.4s 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes title-fade-in {
  from {
    opacity: 0;
    transform: translateY(-2vh) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes btn-enter {
  from {
    opacity: 0;
    transform: translateX(12vw) scale(0.85);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>

<!-- 离场动画：非 scoped，直接匹配全局 transition class -->
<style lang="scss">
/* 离场：从下到上依次向右飞出（与入场方向相反） */
.page-leave-active .home__nav .home__btn-wrap {
  animation: btn-leave 0.6s ease-in calc((3 - var(--step, 0)) * 0.1s) both;
}

.page-leave-active.home-page .sec-page__title {
  animation: title-leave 0.8s ease-in both;
}

@keyframes title-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-4vh) scale(1.04);
  }
}

@keyframes btn-leave {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(12vw) scale(0.85);
  }
}
</style>
