<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'

const SCREEN = 'bottom-right'
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
  <main class="br">
    <img class="br__bg" :src="bg" alt="" />

    <transition name="fade">
      <img v-if="!activeId" class="br__text" :src="text" alt="" />
    </transition>

    <!-- baima-bridge：荣誉认证 -->
    <transition name="fade">
      <div v-if="activeId === 'baima-bridge' && hasContent" class="br__content br__content--baima">
        <img class="br__baima br-title" :src="asset('title.png')" alt="" />
        <img class="br__baima br-center" :src="asset('center.png')" alt="" />
        <img class="br__baima br-bottom" :src="asset('bottom.png')" alt="" />
        <img class="br__baima br-right-bg" :src="asset('right-bg.png')" alt="" />
      </div>
    </transition>

    <!-- slope：科研成果 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && hasContent" class="br__content br__content--slope">
        <img class="br__slope br-st-title" :src="asset('title.png')" alt="" />
        <img class="br__slope br-st-1" :src="asset('content-1.png')" alt="" />
        <img class="br__slope br-st-2" :src="asset('content-2.png')" alt="" />
        <img class="br__slope br-st-3" :src="asset('content-3.png')" alt="" />
        <img class="br__slope br-st-4" :src="asset('content-4.png')" alt="" />
      </div>
    </transition>

    <!-- coating：科研成果 -->
    <transition name="fade">
      <div v-if="activeId === 'coating' && hasContent" class="br__content br__content--coating">
        <img class="br__coating br-ct-title" :src="asset('title.png')" alt="" />
        <img class="br__coating br-ct-files" :src="asset('files.png')" alt="" />
        <img class="br__coating br-ct-desc" :src="asset('desc.png')" alt="" />
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !hasContent" class="br__placeholder">「{{ point.id }}」内容建设中</div>
    </transition>
  </main>
</template>

<style scoped lang="scss">
.br {
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
    object-fit: fill;
    z-index: 0;
  }

  &__text {
    position: absolute;
    top: d.h(49);
    left: d.w(456);
    width: d.w(2543);
    height: d.h(1464);
    z-index: 5;
  }

  &__content {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    gap: d.h(40);
    padding: d.h(120) d.w(90) d.h(80);

    &--baima {
      display: block;

      .br__baima {
        position: absolute;
        object-fit: contain;
      }

      .br-title {
        left: d.w(273);
        top: d.h(212);
        width: d.w(1624);
        height: d.h(149);
      }

      .br-center {
        left: d.w(460);
        top: d.h(524);
        width: d.w(2930);
        height: d.h(901);
      }

      .br-bottom {
        left: d.w(1069);
        top: d.h(1618);
        width: d.w(1713);
        height: d.h(310);
      }

      .br-right-bg {
        left: d.w(1954);
        top: d.h(143);
        width: d.w(1886);
        height: d.h(1958);
      }
    }

    &--slope {
      display: block;

      .br__slope {
        position: absolute;
        object-fit: contain;
      }

      .br-st-title {
        left: d.w(274);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      .br-st-1 {
        left: d.w(567);
        top: d.h(545);
        width: d.w(2516);
        height: d.h(270);
      }

      .br-st-2 {
        left: d.w(0);
        top: d.h(915);
        width: d.w(2516);
        height: d.h(266);
      }

      .br-st-3 {
        left: d.w(455);
        top: d.h(1286);
        width: d.w(2432);
        height: d.h(263);
      }

      .br-st-4 {
        left: d.w(973);
        top: d.h(1656);
        width: d.w(2474);
        height: d.h(263);
      }
    }

    &--coating {
      display: block;

      .br__coating {
        position: absolute;
        object-fit: contain;
      }

      .br-ct-title {
        left: d.w(274);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      .br-ct-desc {
        left: d.w(276);
        top: d.h(524);
        width: d.w(2313);
        height: d.h(223);
      }

      .br-ct-files {
        left: d.w(57);
        top: d.h(577);
        width: d.w(3700);
        height: d.h(1583);
      }
    }
  }

  &__title {
    height: d.h(80);
    width: auto;
    object-fit: contain;
    align-self: flex-start;
  }

  &__list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: d.h(30);
    min-height: 0;

    img {
      flex: 1;
      width: 100%;
      min-height: 0;
      object-fit: contain;
      object-position: left center;
    }
  }

  &__center {
    flex: 1;
    width: 100%;
    object-fit: contain;
  }

  &__bottom {
    height: d.h(100);
    width: auto;
    object-fit: contain;
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
