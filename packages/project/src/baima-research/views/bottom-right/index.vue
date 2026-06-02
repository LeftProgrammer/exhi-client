<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync } from '../../composables/useScreenSync'
import type { DetailPhase } from '../../composables/useScreenSync'

const { onSyncPoint, onSyncPhase, onSyncIdle } = useScreenSync()

const pointId = ref<string | null>(null)
const phase = ref<DetailPhase>('difficulty')

onSyncPoint((id) => { pointId.value = id })
onSyncPhase((p) => { phase.value = p })
onSyncIdle(() => { pointId.value = null })

const bgImage = resolvePkgUrl('baima-research/bottom-right-bg.png')
const titleImg = resolvePkgUrl('baima-research/bottom-right-title.png')
</script>

<template>
  <main class="bottom-right">
    <img class="bottom-right__bg" :src="bgImage" alt="" />
    <img class="bottom-right__title" :src="titleImg" alt="荣誉效益" />
    <div class="bottom-right__content">
      <img
        v-if="pointId"
        :src="resolvePkgUrl(`baima-research/${pointId}/${phase}-honor.png`)"
        alt=""
      />
      <div v-else class="bottom-right__empty">等待选择...</div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.bottom-right {
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
  }

  &__title {
    position: absolute;
    top: d.h(40);
    left: 50%;
    transform: translateX(-50%);
    width: d.w(800);
    height: auto;
    z-index: 10;
  }

  &__content {
    position: absolute;
    top: d.h(140);
    left: d.w(60);
    right: d.w(60);
    bottom: d.h(40);
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  &__empty {
    color: rgba(255, 255, 255, 0.5);
    font-size: d.h(32);
  }
}
</style>
