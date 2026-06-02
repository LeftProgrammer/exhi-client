<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'

const SCREEN = 'top-right'
const { onSyncPoint, onSyncIdle } = useScreenSync()

// dev 调试：可通过 URL ?point=baima-bridge 直接预览选中态
const activeId = ref<string | null>(getDebugPoint())
onSyncPoint((id) => (activeId.value = id))
onSyncIdle(() => (activeId.value = null))

const point = computed(() => getPoint(activeId.value))
const hasContent = computed(() => !!point.value?.hasContent)

const bg = resolvePkgUrl(`common/${SCREEN}-bg.png`)
const text = resolvePkgUrl(`common/${SCREEN}-text.png`)

function asset(name: string) {
  return resolvePkgUrl(`points/${activeId.value}/${SCREEN}/${name}`)
}
</script>

<template>
  <main class="tr">
    <img class="tr__bg" :src="bg" alt="" />

    <transition name="fade">
      <img v-if="!activeId" class="tr__text" :src="text" alt="" />
    </transition>

    <!-- 工程效益（预期） -->
    <transition name="fade">
      <div v-if="hasContent" class="tr__content">
        <img class="tr__title" :src="asset('title.png')" alt="工程效益" />
        <div class="tr__row">
          <img :src="asset('content-1.png')" alt="" />
          <img :src="asset('content-2.png')" alt="" />
          <img :src="asset('content-3.png')" alt="" />
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !hasContent" class="tr__placeholder">「{{ point.name }}」内容建设中</div>
    </transition>
  </main>
</template>

<style scoped lang="scss">
.tr {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #061024;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  &__text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: d.w(1500);
    height: auto;
    z-index: 5;
  }

  &__content {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    gap: d.h(50);
    padding: d.h(120) d.w(90) d.h(100);
  }

  &__title {
    height: d.h(80);
    width: auto;
    object-fit: contain;
    align-self: flex-start;
  }

  &__row {
    flex: 1;
    display: flex;
    gap: d.w(40);
    min-height: 0;

    img {
      flex: 1;
      min-width: 0;
      object-fit: contain;
    }
  }

  &__placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 8;
    padding: d.h(40) d.w(80);
    background: rgba(2, 6, 23, 0.8);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: d.w(12);
    color: #00d4ff;
    font-size: d.h(56);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
