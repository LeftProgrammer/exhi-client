<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue'
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

const bg = resolvePkgUrl(`common/${SCREEN}-bg.png`)
const text = resolvePkgUrl(`common/${SCREEN}-text.png`)

function asset(name: string) {
  return resolvePkgUrl(`points/${activeId.value}/${SCREEN}/${name}`)
}

// excavation 相册当前活跃卡片索引
const activeCard1 = ref(1)
const activeCard2 = ref(1)
const activeCard3 = ref(1)

const imageList = computed(() => point.value?.images?.['bottom-right'] ?? [])
const list1 = computed(() => imageList.value[0] ?? [])
const list2 = computed(() => imageList.value[1] ?? [])
const list3 = computed(() => imageList.value[2] ?? [])

watch(
  point,
  (p) => {
    const imgs = p?.images?.['bottom-right'] ?? []
    activeCard1.value = (imgs[0]?.length ?? 0) >= 2 ? 2 : 1
    activeCard2.value = (imgs[1]?.length ?? 0) >= 2 ? 2 : 1
    activeCard3.value = (imgs[2]?.length ?? 0) >= 2 ? 2 : 1
  },
  { immediate: true }
)

function cardOffset(i: number, active: number) {
  return i - active
}

function createTouchHandlers(ref: Ref<number>, totalRef: { value: number }) {
  let startX = 0
  let isDragging = false
  let stackEl: HTMLElement | null = null

  return {
    onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      isDragging = true
      stackEl = e.currentTarget as HTMLElement
      stackEl.classList.add('is-dragging')
    },
    onTouchMove(e: TouchEvent) {
      if (!isDragging || !stackEl) return
      e.preventDefault()
      const delta = e.touches[0].clientX - startX
      stackEl.style.transform = `translateX(${delta})`
    },
    onTouchEnd(e: TouchEvent) {
      if (!isDragging || !stackEl) return
      isDragging = false
      stackEl.classList.remove('is-dragging')
      stackEl.style.transform = ''

      const delta = e.changedTouches[0].clientX - startX
      const threshold = 80
      if (delta > threshold && ref.value < totalRef.value) {
        ref.value = ref.value + 1
      } else if (delta < -threshold && ref.value > 1) {
        ref.value = ref.value - 1
      }
    }
  }
}

const touch1 = createTouchHandlers(activeCard1, {
  get value() {
    return list1.value.length
  }
})
const touch2 = createTouchHandlers(activeCard2, {
  get value() {
    return list2.value.length
  }
})
const touch3 = createTouchHandlers(activeCard3, {
  get value() {
    return list3.value.length
  }
})

function onCardClick1(i: number) {
  if (i !== activeCard1.value) activeCard1.value = i
}
function onCardClick2(i: number) {
  if (i !== activeCard2.value) activeCard2.value = i
}
function onCardClick3(i: number) {
  if (i !== activeCard3.value) activeCard3.value = i
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
          <div
            class="ex-stack"
            @touchstart="touch1.onTouchStart"
            @touchmove="touch1.onTouchMove"
            @touchend="touch1.onTouchEnd"
          >
            <template v-if="list1.length">
              <div
                v-for="(file, idx) in list1"
                :key="idx"
                class="ex-card-wrap"
                :class="`ex-card-wrap--offset-${cardOffset(idx + 1, activeCard1)}`"
                @click="onCardClick1(idx + 1)"
              >
                <img class="ex-card-frame" :src="asset('file-frame.png')" alt="" />
                <img class="ex-card-content" :src="asset(file)" alt="" />
              </div>
            </template>
            <div v-else class="ex-card-wrap ex-card-wrap--offset-0">
              <img class="ex-card-frame" :src="asset('file-frame.png')" alt="" />
            </div>
          </div>
          <img class="ex-text" :src="asset('text-1.png')" alt="" />
        </div>
        <div class="br__excavation ex-block ex-block--2">
          <div
            class="ex-stack"
            @touchstart="touch2.onTouchStart"
            @touchmove="touch2.onTouchMove"
            @touchend="touch2.onTouchEnd"
          >
            <template v-if="list2.length">
              <div
                v-for="(file, idx) in list2"
                :key="idx"
                class="ex-card-wrap"
                :class="`ex-card-wrap--offset-${cardOffset(idx + 1, activeCard2)}`"
                @click="onCardClick2(idx + 1)"
              >
                <img class="ex-card-frame" :src="asset('file-frame.png')" alt="" />
                <img class="ex-card-content" :src="asset(file)" alt="" />
              </div>
            </template>
            <div v-else class="ex-card-wrap ex-card-wrap--offset-0">
              <img class="ex-card-frame" :src="asset('file-frame.png')" alt="" />
            </div>
          </div>
          <img class="ex-text" :src="asset('text-2.png')" alt="" />
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

      .ex-block {
        position: absolute;
        transition: transform 0.3s ease;

        &--1 {
          left: d.w(681);
          top: d.h(563);
          width: d.w(868);
          height: d.h(1195);
        }

        &--2 {
          left: d.w(2312);
          top: d.h(563);
          width: d.w(867);
          height: d.h(1195);
        }

        &:hover {
          z-index: 10;
        }

        .ex-stack {
          position: absolute;
          left: d.w(323);
          top: 0;
          width: d.w(644);
          height: d.h(890);
          z-index: 1;

          &.is-dragging .ex-card-wrap {
            transition: none !important;
          }
        }

        .ex-card-wrap {
          position: absolute;
          width: 96%;
          height: 96%;
          transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          cursor: pointer;

          &--offset-0 {
            transform: translateX(0) scale(1);
            z-index: 5;
            opacity: 1;
          }

          &--offset--1 {
            transform: translateX(-38%) scale(0.88);
            z-index: 4;
            opacity: 0.55;
          }

          &--offset-1 {
            transform: translateX(38%) scale(0.88);
            z-index: 4;
            opacity: 0.55;
          }

          &--offset--2,
          &--offset--3,
          &--offset--4 {
            transform: translateX(-55%) translateY(25%) scale(0.5);
            z-index: 1;
            opacity: 0;
          }

          &--offset-2,
          &--offset-3,
          &--offset-4 {
            transform: translateX(55%) translateY(25%) scale(0.5);
            z-index: 1;
            opacity: 0;
          }

          .ex-card-frame {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: inherit;
            z-index: 1;
          }

          .ex-card-content {
            position: absolute;
            inset: 0;
            width: 96%;
            height: 96%;
            margin: auto;
            object-fit: contain;
            transition: inherit;
            z-index: 2;
          }

          &--offset-0 {
            .ex-card-frame {
              filter: drop-shadow(0 d.h(6) d.w(20) rgba(0, 0, 0, 0.55));
            }
          }

          &--offset--1,
          &--offset-1 {
            filter: brightness(0.8);
          }
        }

        .ex-text {
          position: absolute;
          left: 0;
          bottom: d.h(20);
          width: 100%;
          height: d.h(120);
          object-fit: contain;
          z-index: 10;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
