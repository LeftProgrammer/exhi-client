<script setup lang="ts">
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
      :style="iconStyle(m)"
      @click="enter(m)"
    >
      <img :src="m.icon" :alt="m.name" />
    </button>
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

  &__title {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: d.h(862);
    object-fit: fill;
    z-index: 2;
    pointer-events: none;
  }

  &__icon {
    position: absolute;
    z-index: 3;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: transform 0.25s ease;

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 d.h(8) d.w(24) rgba(0, 80, 200, 0.35));
    }

    &:active {
      transform: scale(0.96);
    }

    &:hover {
      transform: scale(1.04);
    }
  }
}
</style>
