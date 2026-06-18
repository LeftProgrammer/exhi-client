<script setup lang="ts">
import { ref, computed } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'
import { useCarouselAssets } from '../../composables/useCarouselAssets'
import FileCarousel from '../../components/FileCarousel.vue'

const SCREEN = 'bottom-left'
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
const blGroups1 = computed(() => blockGroups(0))
const blGroups2 = computed(() => blockGroups(1))
const blGroups3 = computed(() => blockGroups(2))
</script>

<template>
  <main class="bl">
    <img class="bl__bg" :src="bg" alt="" />

    <transition name="fade">
      <img v-if="!activeId" class="bl__text" :src="text" alt="" />
    </transition>

    <!-- baima-bridge：质量创新成果 -->
    <transition name="fade">
      <div
        v-if="activeId === 'baima-bridge' && point?.detail"
        class="bl__content bl__content--baima"
      >
        <img class="bl__baima bl-title" :src="asset('title.png')" alt="" />
        <img class="bl__baima bl-c1" :src="asset('content-1.png')" alt="" />
        <img class="bl__baima bl-c2" :src="asset('content-2.png')" alt="" />
        <img class="bl__baima bl-c3" :src="asset('content-3.png')" alt="" />
      </div>
    </transition>

    <!-- slope：核心创新点 -->
    <transition name="fade">
      <div v-if="activeId === 'slope' && point?.detail" class="bl__content bl__content--slope">
        <img class="bl__slope bl-st-title" :src="asset('title.png')" alt="" />
        <img class="bl__slope bl-st-l1" :src="asset('left-1.png')" alt="" />
        <img class="bl__slope bl-st-l2" :src="asset('left-2.png')" alt="" />
        <img class="bl__slope bl-st-l3" :src="asset('left-3.png')" alt="" />
        <img class="bl__slope bl-st-r1" :src="asset('right-1.png')" alt="" />
        <img class="bl__slope bl-st-r2" :src="asset('right-2.png')" alt="" />
        <img class="bl__slope bl-st-r3" :src="asset('right-3.png')" alt="" />
      </div>
    </transition>

    <!-- coating：专利证书展示（相册堆叠） -->
    <transition name="fade">
      <div v-if="activeId === 'coating' && point?.detail" class="bl__content bl__content--coating">
        <img class="bl__coating ct-title" :src="asset('title.png')" alt="" />
        <div class="bl__coating ct-block ct-block--1">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups1"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
          />
        </div>
        <div class="bl__coating ct-block ct-block--2">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups2"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
          />
        </div>
        <div class="bl__coating ct-block ct-block--3">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups3"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
          />
        </div>
      </div>
    </transition>

    <!-- concrete：科研成果（相册堆叠，与 coating 逻辑一致） -->
    <transition name="fade">
      <div
        v-if="activeId === 'concrete' && point?.detail"
        class="bl__content bl__content--concrete"
      >
        <img class="bl__coating ct-title" :src="asset('title.png')" alt="" />
        <div class="bl__coating ct-block ct-block--1">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups1"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
            :content-scale="{ x: 0.94, y: 0.96 }"
          />
        </div>
        <div class="bl__coating ct-block ct-block--2">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups2"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
            :content-scale="{ x: 0.94, y: 0.96 }"
          />
        </div>
        <div class="bl__coating ct-block ct-block--3">
          <FileCarousel
            :frame="asset('frame-bg.png')"
            :groups="blGroups3"
            :frame-size="{ width: 644, height: 890 }"
            :text-size="{ width: 1290, height: 107 }"
            :content-scale="{ x: 0.94, y: 0.96 }"
          />
        </div>
      </div>
    </transition>

    <!-- excavation：研究成果 -->
    <transition name="fade">
      <div
        v-if="activeId === 'excavation' && point?.detail"
        class="bl__content bl__content--excavation"
      >
        <img class="bl__excavation ex-title" :src="asset('title.png')" alt="" />
        <img class="bl__excavation ex-top" :src="asset('content-top.png')" alt="" />
        <img class="bl__excavation ex-bottom-1" :src="asset('content-bottom-1.png')" alt="" />
        <img class="bl__excavation ex-bottom-2" :src="asset('content-bottom-2.png')" alt="" />
      </div>
    </transition>

    <!-- navigation：已完结课题 -->
    <transition name="fade">
      <div
        v-if="activeId === 'navigation' && point?.detail"
        class="bl__content bl__content--navigation"
      >
        <img class="bl__navigation nav-title" :src="asset('title.png')" alt="" />
        <img class="bl__navigation nav-top" :src="asset('content-top-1.png')" alt="" />
        <img class="bl__navigation nav-bottom" :src="asset('content-bottom.png')" alt="" />
        <img
          class="bl__navigation nav-bottom-title"
          :src="asset('content-bottom-title.png')"
          alt=""
        />
      </div>
    </transition>

    <!-- turbine：实施计划和推进形式 -->
    <transition name="fade">
      <div v-if="activeId === 'turbine' && point?.detail" class="bl__content bl__content--turbine">
        <img class="bl__turbine tr-title" :src="asset('title.png')" alt="" />
        <img class="bl__turbine tr-1" :src="asset('content-1.png')" alt="" />
        <img class="bl__turbine tr-2" :src="asset('content-2.png')" alt="" />
      </div>
    </transition>

    <!-- blasting：成果总结 -->
    <transition name="fade">
      <div
        v-if="activeId === 'blasting' && point?.detail"
        class="bl__content bl__content--blasting"
      >
        <img class="bl__blasting bl-bs-title" :src="asset('title.png')" alt="" />
        <img class="bl__blasting bl-bs-1" :src="asset('content-1.png')" alt="" />
        <img class="bl__blasting bl-bs-2" :src="asset('content-2.png')" alt="" />
        <img class="bl__blasting bl-bs-3" :src="asset('content-3.png')" alt="" />
      </div>
    </transition>

    <transition name="fade">
      <div v-if="point && !point.detail" class="bl__placeholder">「{{ point.id }}」内容建设中</div>
    </transition>
  </main>
</template>

<style scoped lang="scss">
.bl {
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
    top: d.h(151);
    left: d.w(954);
    width: d.w(2537);
    height: d.h(1460);
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
      animation: bl-item-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @for $i from 1 through 12 {
      > *:nth-child(#{$i}) {
        animation-delay: #{0.1 + ($i - 1) * 0.06}s;
      }
    }

    /* 所有标题（类名含 -title）：揭示式炫酷入场 */
    > [class*="-title"] {
      animation-name: bl-title-reveal;
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

      .bl__baima {
        position: absolute;
        object-fit: fill;
      }

      .bl-title {
        left: d.w(309);
        top: d.h(239);
        width: d.w(1821);
        height: d.h(167);
      }

      .bl-c1 {
        left: d.w(131);
        top: d.h(570);
        width: d.w(1219);
        height: d.h(1129);
      }

      .bl-c2 {
        left: d.w(1243);
        top: d.h(570);
        width: d.w(1430);
        height: d.h(1129);
      }

      .bl-c3 {
        left: d.w(2526);
        top: d.h(570);
        width: d.w(1219);
        height: d.h(1129);
      }
    }

    &--slope {
      display: block;

      .bl__slope {
        position: absolute;
        object-fit: fill;
      }

      .bl-st-title {
        left: d.w(309);
        top: d.h(238);
        width: d.w(1821);
        height: d.h(167);
      }

      .bl-st-l1 {
        left: d.w(258);
        top: d.h(521);
        width: d.w(1595);
        height: d.h(413);
      }

      .bl-st-l2 {
        left: d.w(258);
        top: d.h(1039);
        width: d.w(1595);
        height: d.h(411);
      }

      .bl-st-l3 {
        left: d.w(258);
        top: d.h(1551);
        width: d.w(1595);
        height: d.h(413);
      }

      .bl-st-r1 {
        left: d.w(1996);
        top: d.h(521);
        width: d.w(1595);
        height: d.h(413);
      }

      .bl-st-r2 {
        left: d.w(1996);
        top: d.h(1039);
        width: d.w(1595);
        height: d.h(411);
      }

      .bl-st-r3 {
        left: d.w(1996);
        top: d.h(1551);
        width: d.w(1595);
        height: d.h(413);
      }
    }

    &--coating {
      display: block;

      .bl__coating {
        position: absolute;
        object-fit: fill;
      }

      .ct-title {
        left: d.w(308);
        top: d.h(238);
        width: d.w(1821);
        height: d.h(167);
      }

      // 文件轮播展示位：定位由父级控制，尺寸由 FileCarousel 组件接管
      .ct-block {
        position: absolute;

        &--1 {
          left: d.w(427);
          top: d.h(754);
        }

        &--2 {
          left: d.w(1602);
          top: d.h(754);
        }

        &--3 {
          left: d.w(2777);
          top: d.h(754);
        }
      }
    }

    &--concrete {
      display: block;

      .bl__coating {
        position: absolute;
        object-fit: fill;
      }

      .ct-title {
        left: d.w(308);
        top: d.h(238);
        width: d.w(1821);
        height: d.h(167);
      }

      // 文件轮播展示位：定位由父级控制，尺寸由 FileCarousel 组件接管
      .ct-block {
        position: absolute;

        &--1 {
          left: d.w(427);
          top: d.h(754);
        }

        &--2 {
          left: d.w(1602);
          top: d.h(754);
        }

        &--3 {
          left: d.w(2777);
          top: d.h(754);
        }
      }
    }

    &--excavation {
      display: block;

      .bl__excavation {
        position: absolute;
        object-fit: fill;
      }

      .ex-title {
        left: d.w(308);
        top: d.h(237);
        width: d.w(1821);
        height: d.h(167);
      }

      .ex-top {
        left: d.w(292);
        top: d.h(495);
        width: d.w(3372);
        height: d.h(632);
      }

      .ex-bottom-1 {
        left: d.w(295);
        top: d.h(1182);
        width: d.w(1474);
        height: d.h(820);
      }

      .ex-bottom-2 {
        left: d.w(1807);
        top: d.h(1182);
        width: d.w(1623);
        height: d.h(767);
      }
    }

    &--navigation {
      display: block;

      .bl__navigation {
        position: absolute;
        object-fit: fill;
      }

      .nav-title {
        left: d.w(183);
        top: d.h(237);
        width: d.w(3513);
        height: d.h(167);
      }

      .nav-top {
        left: d.w(188);
        top: d.h(498);
        width: d.w(3500);
        height: d.h(775);
      }

      .nav-bottom {
        left: d.w(791);
        top: d.h(1318);
        width: d.w(2839);
        height: d.h(683);
      }

      .nav-bottom-title {
        left: d.w(0);
        top: d.h(1618);
        width: d.w(727);
        height: d.h(113);
      }
    }

    &--turbine {
      display: block;

      .bl__turbine {
        position: absolute;
        object-fit: fill;
      }

      .tr-title {
        left: d.w(308);
        top: d.h(200);
        width: d.w(1821);
        height: d.h(167);
      }

      .tr-1 {
        left: d.w(313);
        top: d.h(641);
        width: d.w(3240);
        height: d.h(987);
      }

      .tr-2 {
        left: d.w(1808);
        top: d.h(758);
        width: d.w(1490);
        height: d.h(753);
      }
    }

    &--blasting {
      display: block;

      .bl__blasting {
        position: absolute;
        object-fit: fill;
      }

      .bl-bs-title {
        left: d.w(309);
        top: d.h(200);
        width: d.w(1821);
        height: d.h(167);
      }

      .bl-bs-1 {
        left: d.w(258);
        top: d.h(471);
        width: d.w(3285);
        height: d.h(440);
      }

      .bl-bs-2 {
        left: d.w(258);
        top: d.h(1026);
        width: d.w(3285);
        height: d.h(440);
      }

      .bl-bs-3 {
        left: d.w(258);
        top: d.h(1581);
        width: d.w(3285);
        height: d.h(440);
      }
    }
  }

  &__title {
    height: d.h(80);
    width: auto;
    object-fit: fill;
    align-self: flex-start;
  }

  &__row {
    display: flex;
    gap: d.w(40);
    width: 100%;
    height: 80%;

    img {
      flex: 1;
      min-width: 0;
      object-fit: fill;
    }
  }

  &__grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
    gap: d.h(30) d.w(40);
    min-height: 0;

    img {
      width: 100%;
      height: 100%;
      min-height: 0;
      object-fit: fill;
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

@keyframes bl-item-rise {
  from {
    opacity: 0;
    transform: translateY(d.h(50));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bl-title-reveal {
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
