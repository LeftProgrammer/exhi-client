<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'
import { useCarouselAssets } from '../../composables/useCarouselAssets'
import FileCarousel from '../../components/FileCarousel.vue'

const SCREEN = 'bottom-right'
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

// 文件轮播素材解析（复用 composable）
const { blockGroups } = useCarouselAssets(activeId, SCREEN)
const exGroups1 = computed(() => blockGroups(0))
const exGroups2 = computed(() => blockGroups(1))
</script>

<template>
  <main class="br">
    <img class="br__bg" :src="bg" alt="" />

    <transition name="fade">
      <img v-if="!activeId" class="br__text" :src="text" alt="" />
    </transition>

    <!-- baima-bridge：荣誉认证 -->
    <transition name="fade">
      <div
        v-if="activeId === 'baima-bridge' && point?.detail"
        class="br__content br__content--baima"
      >
        <img class="br__baima br-title" :src="asset('title.png')" alt="" />
        <img class="br__baima br-center" :src="asset('center.png')" alt="" />
        <img class="br__baima br-bottom" :src="asset('bottom.png')" alt="" />
        <img class="br__baima br-right-bg" :src="asset('right-bg.png')" alt="" />
      </div>
    </transition>

    <!-- slope：科研成果 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && point?.detail" class="br__content br__content--slope">
        <img class="br__slope br-st-title" :src="asset('title.png')" alt="" />
        <img class="br__slope br-st-1" :src="asset('content-1.png')" alt="" />
        <img class="br__slope br-st-2" :src="asset('content-2.png')" alt="" />
        <img class="br__slope br-st-3" :src="asset('content-3.png')" alt="" />
        <img class="br__slope br-st-4" :src="asset('content-4.png')" alt="" />
      </div>
    </transition>

    <!-- coating：科研成果 -->
    <transition name="fade">
      <div v-if="activeId === 'coating' && point?.detail" class="br__content br__content--coating">
        <img class="br__coating br-ct-title" :src="asset('title.png')" alt="" />
        <img class="br__coating br-ct-files" :src="asset('files.png')" alt="" />
        <img class="br__coating br-ct-desc" :src="asset('desc.png')" alt="" />
      </div>
    </transition>

    <!-- concrete：科研成果 -->
    <transition name="fade">
      <div
        v-if="activeId === 'concrete' && point?.detail"
        class="br__content br__content--concrete"
      >
        <img class="br__concrete br-cc-title" :src="asset('title.png')" alt="" />
        <img class="br__concrete br-cc-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- excavation：研究成果（证书展示，卡片栈） -->
    <transition name="fade">
      <div
        v-if="activeId === 'excavation' && point?.detail"
        class="br__content br__content--excavation"
      >
        <img class="br__excavation ex-title" :src="asset('title.png')" alt="" />
        <div class="br__excavation ex-block ex-block--1">
          <FileCarousel
            :frame="asset('file-frame.png')"
            :groups="exGroups1"
            :frame-size="{ width: 868, height: 1195 }"
            :text-size="{ width: 1712, height: 142 }"
          />
        </div>
        <div class="br__excavation ex-block ex-block--2">
          <FileCarousel
            :frame="asset('file-frame.png')"
            :groups="exGroups2"
            :frame-size="{ width: 867, height: 1195 }"
            :text-size="{ width: 1712, height: 142 }"
          />
        </div>
      </div>
    </transition>

    <!-- navigation：成果目标（预期） -->
    <transition name="fade">
      <div
        v-if="activeId === 'navigation' && point?.detail"
        class="br__content br__content--navigation"
      >
        <img class="br__navigation nav-title" :src="asset('title.png')" alt="" />
        <img class="br__navigation nav-1" :src="asset('content-1.png')" alt="" />
        <img class="br__navigation nav-2" :src="asset('content-2.png')" alt="" />
        <img class="br__navigation nav-3" :src="asset('content-3.png')" alt="" />
        <img class="br__navigation nav-4" :src="asset('content-4.png')" alt="" />
      </div>
    </transition>

    <!-- turbine：研发效益 -->
    <transition name="fade">
      <div v-if="activeId === 'turbine' && point?.detail" class="br__content br__content--turbine">
        <img class="br__turbine tr-title" :src="asset('title.png')" alt="" />
        <img class="br__turbine tr-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <!-- blasting：荣誉认证 -->
    <transition name="fade">
      <div
        v-if="activeId === 'blasting' && point?.detail"
        class="br__content br__content--blasting"
      >
        <img class="br__blasting br-bs-title" :src="asset('title.png')" alt="" />
        <img class="br__blasting br-bs-content" :src="asset('content.png')" alt="" />
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !point.detail" class="br__placeholder">「{{ point.id }}」内容建设中</div>
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

    /* 块内子元素错峰升起，营造层次感 */
    > * {
      animation: br-item-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @for $i from 1 through 12 {
      > *:nth-child(#{$i}) {
        animation-delay: #{0.1 + ($i - 1) * 0.06}s;
      }
    }

    /* 所有标题（类名含 -title）：揭示式炫酷入场 */
    > [class*="-title"] {
      animation-name: br-title-reveal;
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

    &--concrete {
      display: block;

      .br__concrete {
        position: absolute;
        object-fit: contain;
      }

      .br-cc-title {
        left: d.w(274);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      .br-cc-content {
        left: d.w(57);
        top: d.h(524);
        width: d.w(3700);
        height: d.h(1636);
      }
    }

    &--excavation {
      display: block;

      .br__excavation {
        position: absolute;
        object-fit: contain;
      }

      .ex-title {
        left: d.w(274);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      // 文件轮播展示位：尺寸 = 最上层 card-frame 大小，内部由 FileCarousel 组件渲染
      .ex-block {
        position: absolute;

        &--1 {
          left: d.w(681);
          top: d.h(563);
        }

        &--2 {
          left: d.w(2312);
          top: d.h(563);
        }
      }
    }

    &--navigation {
      display: block;

      .br__navigation {
        position: absolute;
        object-fit: contain;
      }

      .nav-title {
        left: d.w(273);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      .nav-1 {
        left: d.w(255);
        top: d.h(546);
        width: d.w(1789);
        height: d.h(912);
      }

      .nav-2 {
        left: d.w(1827);
        top: d.h(546);
        width: d.w(1789);
        height: d.h(912);
      }

      .nav-3 {
        left: d.w(255);
        top: d.h(1361);
        width: d.w(1789);
        height: d.h(543);
      }

      .nav-4 {
        left: d.w(1827);
        top: d.h(1361);
        width: d.w(1789);
        height: d.h(543);
      }
    }

    &--turbine {
      display: block;

      .br__turbine {
        position: absolute;
        object-fit: contain;
      }

      .tr-title {
        left: d.w(274);
        top: d.h(210);
        width: d.w(1624);
        height: d.h(149);
      }

      .tr-content {
        left: d.w(207);
        top: d.h(604);
        width: d.w(3494);
        height: d.h(1259);
      }
    }

    &--blasting {
      display: block;

      .br__blasting {
        position: absolute;
        object-fit: contain;
      }

      .br-bs-title {
        left: d.w(275);
        top: d.h(211);
        width: d.w(1624);
        height: d.h(149);
      }

      .br-bs-content {
        left: d.w(178);
        top: d.h(516);
        width: d.w(3497);
        height: d.h(1202);
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

@keyframes br-item-rise {
  from {
    opacity: 0;
    transform: translateY(d.h(50));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes br-title-reveal {
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
