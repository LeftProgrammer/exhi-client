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

    <!-- 其他点位：科研成果 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && hasContent" class="br__content br__content--default">
        <img class="br__title" :src="asset('title.png')" alt="科研成果" />
        <div class="br__list">
          <img :src="asset('content-1.png')" alt="" />
          <img :src="asset('content-2.png')" alt="" />
          <img :src="asset('content-3.png')" alt="" />
          <img :src="asset('content-4.png')" alt="" />
        </div>
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
        top: d.h(224);
        width: d.w(1598);
        height: d.h(144);
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
