<script setup lang="ts">
/**
 * 职能建设 · 首页（待机页）。
 *
 * 展示 3 个模块入口图标，点击后跳转对应二级页并播放 nav 音效。
 */
import { useRouter } from 'vue-router'
import { useSfx } from '@shared/composables/useSfx'
import { MODULES, HOME, type ModuleDef } from '../../data/modules'

const router = useRouter()
const sfx = useSfx()

function iconStyle(m: ModuleDef) {
  return {
    left: `calc(${m.layout.left} / var(--design-w) * 100vw)`,
    top: `calc(${m.layout.top} / var(--design-h) * 100vh)`,
    width: `calc(${m.layout.width} / var(--design-w) * 100vw)`,
    height: `calc(${m.layout.height} / var(--design-h) * 100vh)`
  }
}

function enter(m: ModuleDef) {
  sfx.play('nav')
  router.push({ name: m.route })
}
</script>

<template>
  <main class="home">
    <img class="home__bg" :src="HOME.bg" alt="" />
    <img class="home__title" :src="HOME.title" alt="职能建设" />

    <button
      v-for="m in MODULES"
      :key="m.id"
      class="home__icon"
      :class="`home__icon--${m.id}`"
      :style="iconStyle(m)"
      @click="() => enter(m)"
    >
      <img :src="m.icon" :alt="m.name" />
    </button>
  </main>
</template>

<style scoped lang="scss">
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes home-enter-right {
  from { opacity: 0; transform: translateX(100vw) translateY(40vh) scale(0.55); }
  to   { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
}

@keyframes home-enter-left {
  from { opacity: 0; transform: translateX(-100vw) translateY(40vh) scale(0.55); }
  to   { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
}

@keyframes home-float-sync {
  0%, 100% { transform: translateY(0) scale(1); }
  25%      { transform: translateY(d.h(-28)) scale(1.035); }
  50%      { transform: translateY(d.h(10)) scale(0.97); }
  75%      { transform: translateY(d.h(-12)) scale(1.015); }
}

@keyframes home-float-alt {
  0%, 100% { transform: translateY(0) scale(1); }
  25%      { transform: translateY(d.h(28)) scale(0.97); }
  50%      { transform: translateY(d.h(-10)) scale(1.035); }
  75%      { transform: translateY(d.h(12)) scale(0.97); }
}

@keyframes home-enter-title {
  from { opacity: 0; transform: translateY(d.h(-200)) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

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
    opacity: 0;
    animation: fade-in 1.2s ease-out 0.15s both;
  }

  &__title {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: d.h(862);
    object-fit: fill;
    z-index: 2;
    pointer-events: none;
    opacity: 0;
    animation: home-enter-title 1.2s t.$ease-base 0s both;
  }

  &__icon {
    position: absolute;
    z-index: 3;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    overflow: visible;

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 d.h(8) d.w(24) rgba(0, 80, 200, 0.35));
      transition: transform 0.3s ease, filter 0.3s ease;
    }

    /* 入场 + 待机浮动：
       zhidu/xingdong 从右侧入场，同步呼吸（同放大同缩小）
       guihua 从左侧入场，反向呼吸（互补） */
    &--zhidu {
      opacity: 0;
      animation:
        home-enter-right 1s ease-out 0s both,
        home-float-sync 8.0s ease-in-out 1.2s infinite;
    }
    &--guihua {
      opacity: 0;
      animation:
        home-enter-left  1s ease-out 0s both,
        home-float-alt   8.0s ease-in-out 1.2s infinite;
    }
    &--xingdong {
      opacity: 0;
      animation:
        home-enter-right 1s ease-out 0s both,
        home-float-sync 8.0s ease-in-out 1.2s infinite;
    }

    &:hover img {
      transform: scale(1.06);
      filter: drop-shadow(0 d.h(12) d.w(32) rgba(0, 120, 255, 0.55));
    }

    &:active img {
      transform: scale(0.94);
    }
  }

}
</style>
