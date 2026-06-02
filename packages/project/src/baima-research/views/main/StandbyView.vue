<script setup lang="ts">
import { resolvePkgUrl } from '@shared/utils/url'
import { useRouter } from 'vue-router'
import { useIdleReset } from '@shared/composables/useIdleReset'

const router = useRouter()
const bgImage = resolvePkgUrl('baima-research/standby-bg.png')
const logo = resolvePkgUrl('baima-research/logo.png')
const tapHint = resolvePkgUrl('baima-research/tap-hint.png')

useIdleReset(() => {
  /* 待机页保持不动 */
})
</script>

<template>
  <main class="standby" @click="router.push({ name: 'home' })">
    <img class="standby__bg" :src="bgImage" alt="" />
    <img class="standby__logo" :src="logo" alt="" />
    <img class="standby__hint" :src="tapHint" alt="点击任意位置进入" />
  </main>
</template>

<style scoped lang="scss">
.standby {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;
  cursor: pointer;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: d.w(1200);
    height: auto;
    object-fit: contain;
    @include fx.enter-fade-in($duration: 1s, $delay: 0.3s);
  }

  &__hint {
    position: absolute;
    bottom: d.h(120);
    left: 50%;
    transform: translateX(-50%);
    width: d.w(600);
    height: auto;
    object-fit: contain;
    animation: standby-blink 2s ease-in-out infinite;
  }
}

@keyframes standby-blink {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
