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

    <!-- baima-bridge：社会效益 -->
    <transition name="fade">
      <div
        v-if="activeId === 'baima-bridge' && point?.detail"
        class="tr__content tr__content--baima"
      >
        <img class="tr__baima tr-title" :src="asset('title.png')" alt="" />
        <img class="tr__baima tr-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- slope：工程效益 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && point?.detail" class="tr__content tr__content--slope">
        <img class="tr__slope tr-st-title" :src="asset('title.png')" alt="" />
        <img class="tr__slope tr-st-1" :src="asset('content-1.png')" alt="" />
        <img class="tr__slope tr-st-2" :src="asset('content-2.png')" alt="" />
        <img class="tr__slope tr-st-3" :src="asset('content-3.png')" alt="" />
      </div>
    </transition>

    <!-- coating：经济效益 -->
    <transition name="fade">
      <div v-if="activeId === 'coating' && point?.detail" class="tr__content tr__content--coating">
        <img class="tr__coating tr-ct-title" :src="asset('title.png')" alt="" />
        <img class="tr__coating tr-ct-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- concrete：经济效益 -->
    <transition name="fade">
      <div
        v-if="activeId === 'concrete' && point?.detail"
        class="tr__content tr__content--concrete"
      >
        <img class="tr__concrete tr-cc-title" :src="asset('title.png')" alt="" />
        <img class="tr__concrete tr-cc-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- excavation：综合效益 -->
    <transition name="fade">
      <div
        v-if="activeId === 'excavation' && point?.detail"
        class="tr__content tr__content--excavation"
      >
        <img class="tr__excavation ex-title" :src="asset('title.png')" alt="" />
        <img class="tr__excavation ex-1" :src="asset('content-1.png')" alt="" />
        <img class="tr__excavation ex-2" :src="asset('content-2.png')" alt="" />
        <img class="tr__excavation ex-3" :src="asset('content-3.png')" alt="" />
        <img class="tr__excavation ex-4" :src="asset('content-4.png')" alt="" />
      </div>
    </transition>

    <!-- navigation：核心效益 -->
    <transition name="fade">
      <div
        v-if="activeId === 'navigation' && point?.detail"
        class="tr__content tr__content--navigation"
      >
        <img class="tr__navigation nav-title" :src="asset('title.png')" alt="" />
        <img class="tr__navigation nav-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- turbine：预期成果产出 -->
    <transition name="fade">
      <div v-if="activeId === 'turbine' && point?.detail" class="tr__content tr__content--turbine">
        <img class="tr__turbine tr-title" :src="asset('title.png')" alt="" />
        <img class="tr__turbine tr-1" :src="asset('content-1.png')" alt="" />
        <img class="tr__turbine tr-2" :src="asset('content-2.png')" alt="" />
        <img class="tr__turbine tr-3" :src="asset('content-3.png')" alt="" />
        <img class="tr__turbine tr-4" :src="asset('content-4.png')" alt="" />
        <img class="tr__turbine tr-5" :src="asset('content-5.png')" alt="" />
        <img class="tr__turbine tr-6" :src="asset('content-6.png')" alt="" />
      </div>
    </transition>

    <!-- blasting：推广和社会效益 -->
    <transition name="fade">
      <div
        v-if="activeId === 'blasting' && point?.detail"
        class="tr__content tr__content--blasting"
      >
        <img class="tr__blasting tr-bs-title" :src="asset('title.png')" alt="" />
        <img class="tr__blasting tr-bs-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !point.detail" class="tr__placeholder">「{{ point.id }}」内容建设中</div>
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
    object-fit: fill;
    z-index: 0;
  }

  &__text {
    position: absolute;
    top: d.h(0);
    left: d.w(423);
    width: d.w(2453);
    height: d.h(1401);
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

    /* 块内子元素错峰升起，营造层次感 */
    > * {
      animation: tr-item-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @for $i from 1 through 12 {
      > *:nth-child(#{$i}) {
        animation-delay: #{0.1 + ($i - 1) * 0.06}s;
      }
    }

    /* 所有标题（类名含 -title）：揭示式炫酷入场 */
    > [class*="-title"] {
      animation-name: tr-title-reveal;
      animation-duration: 1.2s;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    /* 标题单独错峰，间隔 0.08s，等容器淡入（0.6s）基本完成后再揭示 */
    @for $i from 1 through 12 {
      > *:nth-child(#{$i})[class*="-title"] {
        animation-delay: #{0.5 + ($i - 1) * 0.08}s;
      }
    }

    &--baima {
      display: block;

      .tr__baima {
        position: absolute;
        object-fit: contain;
      }

      .tr-title {
        left: d.w(307);
        top: d.h(237);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-content {
        left: d.w(376);
        top: d.h(615);
        width: d.w(3263);
        height: d.h(1256);
      }
    }

    &--slope {
      display: block;

      .tr__slope {
        position: absolute;
        object-fit: contain;
      }

      .tr-st-title {
        left: d.w(307);
        top: d.h(237);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-st-1 {
        left: d.w(261);
        top: d.h(634);
        width: d.w(999);
        height: d.h(1000);
      }

      .tr-st-2 {
        left: d.w(1426);
        top: d.h(634);
        width: d.w(999);
        height: d.h(1000);
      }

      .tr-st-3 {
        left: d.w(2588);
        top: d.h(634);
        width: d.w(999);
        height: d.h(1000);
      }
    }

    &--coating {
      display: block;

      .tr__coating {
        position: absolute;
        object-fit: contain;
      }

      .tr-ct-title {
        left: d.w(308);
        top: d.h(237);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-ct-content {
        left: d.w(207);
        top: d.h(604);
        width: d.w(3494);
        height: d.h(1259);
      }
    }

    &--concrete {
      display: block;

      .tr__concrete {
        position: absolute;
        object-fit: contain;
      }

      .tr-cc-title {
        left: d.w(307);
        top: d.h(238);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-cc-content {
        left: d.w(289);
        top: d.h(513);
        width: d.w(3401);
        height: d.h(1422);
      }
    }

    &--excavation {
      display: block;

      .tr__excavation {
        position: absolute;
        object-fit: contain;
      }

      .ex-title {
        left: d.w(307);
        top: d.h(238);
        width: d.w(1791);
        height: d.h(166);
      }

      .ex-1 {
        left: d.w(161);
        top: d.h(634);
        width: d.w(774);
        height: d.h(1000);
      }

      .ex-2 {
        left: d.w(1078);
        top: d.h(634);
        width: d.w(773);
        height: d.h(1000);
      }

      .ex-3 {
        left: d.w(1996);
        top: d.h(634);
        width: d.w(774);
        height: d.h(1000);
      }

      .ex-4 {
        left: d.w(2913);
        top: d.h(634);
        width: d.w(773);
        height: d.h(1000);
      }
    }

    &--navigation {
      display: block;

      .tr__navigation {
        position: absolute;
        object-fit: contain;
      }

      .nav-title {
        left: d.w(307);
        top: d.h(237);
        width: d.w(1791);
        height: d.h(166);
      }

      .nav-content {
        left: d.w(246);
        top: d.h(637);
        width: d.w(3389);
        height: d.h(1047);
      }
    }

    &--turbine {
      display: block;

      .tr__turbine {
        position: absolute;
        object-fit: contain;
      }

      .tr-title {
        left: d.w(308);
        top: d.h(238);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-1 {
        left: d.w(1459);
        top: d.h(433);
        width: d.w(2381);
        height: d.h(347);
      }

      .tr-2 {
        left: d.w(604);
        top: d.h(693);
        width: d.w(2800);
        height: d.h(347);
      }

      .tr-3 {
        left: d.w(1499);
        top: d.h(960);
        width: d.w(2341);
        height: d.h(348);
      }

      .tr-4 {
        left: d.w(342);
        top: d.h(1210);
        width: d.w(2800);
        height: d.h(348);
      }

      .tr-5 {
        left: d.w(1639);
        top: d.h(1468);
        width: d.w(2201);
        height: d.h(347);
      }

      .tr-6 {
        left: d.w(787);
        top: d.h(1728);
        width: d.w(2800);
        height: d.h(347);
      }
    }

    &--blasting {
      display: block;

      .tr__blasting {
        position: absolute;
        object-fit: contain;
      }

      .tr-bs-title {
        left: d.w(308);
        top: d.h(237);
        width: d.w(1791);
        height: d.h(166);
      }

      .tr-bs-content {
        left: d.w(464);
        top: d.h(749);
        width: d.w(3026);
        height: d.h(799);
      }
    }
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
    color: #00d4ff;
    font-size: d.h(56);
  }
}

.fade-enter-active {
  transition:
    opacity 0.6s ease,
    filter 0.6s ease,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-leave-active {
  transition:
    opacity 0.45s ease,
    filter 0.45s ease,
    transform 0.45s cubic-bezier(0.7, 0, 0.84, 0);
}
.fade-enter-from {
  opacity: 0;
  filter: blur(d.w(10));
  transform: translateY(d.h(30)) scale(0.98);
}
.fade-leave-to {
  opacity: 0;
  filter: blur(d.w(12));
  transform: translateY(d.h(-60)) scale(0.98);
}

@keyframes tr-item-rise {
  from {
    opacity: 0;
    transform: translateY(d.h(50));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tr-title-reveal {
  0% {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
    filter: blur(d.w(8));
  }
  60% {
    filter: blur(0);
  }
  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}
</style>
