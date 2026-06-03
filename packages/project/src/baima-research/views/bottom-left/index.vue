<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue'
import { resolvePkgUrl } from '@shared/utils/url'
import { useScreenSync, getDebugPoint } from '../../composables/useScreenSync'
import { getPoint } from '../../data/points'

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

// coating 相册当前活跃卡片索引（从 point.images 读取）
const activeCard1 = ref(1)
const activeCard2 = ref(1)
const activeCard3 = ref(1)

const imageList = computed(() => point.value?.images?.['bottom-left'] ?? [])
const list1 = computed(() => imageList.value[0] ?? [])
const list2 = computed(() => imageList.value[1] ?? [])
const list3 = computed(() => imageList.value[2] ?? [])

// 图片数量 >= 2 时默认展示第2张，否则展示第1张
watch(
  point,
  (p) => {
    const imgs = p?.images?.['bottom-left'] ?? []
    activeCard1.value = (imgs[0]?.length ?? 0) >= 2 ? 2 : 1
    activeCard2.value = (imgs[1]?.length ?? 0) >= 2 ? 2 : 1
    activeCard3.value = (imgs[2]?.length ?? 0) >= 2 ? 2 : 1
  },
  { immediate: true }
)

function cardOffset(i: number, active: number) {
  return i - active
}

// 每个块独立的触屏拖拽（实时跟随）
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
      stackEl.style.transform = `translateX(${delta}px)`
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
  <main class="bl">
    <img class="bl__bg" :src="bg" alt="" />

    <transition name="fade">
      <img v-if="!activeId" class="bl__text" :src="text" alt="" />
    </transition>

    <!-- baima-bridge：质量创新成果 -->
    <transition name="fade">
      <div v-if="activeId === 'baima-bridge' && point?.detail" class="bl__content bl__content--baima">
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
          <div
            class="ct-stack"
            @touchstart="touch1.onTouchStart"
            @touchmove="touch1.onTouchMove"
            @touchend="touch1.onTouchEnd"
          >
            <div
              v-for="(file, idx) in list1"
              :key="idx"
              class="ct-card-wrap"
              :class="`ct-card-wrap--offset-${cardOffset(idx + 1, activeCard1)}`"
              @click="onCardClick1(idx + 1)"
            >
              <img class="ct-card-frame" :src="asset('frame-bg.png')" alt="" />
              <img class="ct-card-content" :src="asset(file)" alt="" />
            </div>
          </div>
          <img class="ct-text" :src="asset('text-1.png')" alt="" />
        </div>
        <div class="bl__coating ct-block ct-block--2">
          <div
            class="ct-stack"
            @touchstart="touch2.onTouchStart"
            @touchmove="touch2.onTouchMove"
            @touchend="touch2.onTouchEnd"
          >
            <div
              v-for="(file, idx) in list2"
              :key="idx"
              class="ct-card-wrap"
              :class="`ct-card-wrap--offset-${cardOffset(idx + 1, activeCard2)}`"
              @click="onCardClick2(idx + 1)"
            >
              <img class="ct-card-frame" :src="asset('frame-bg.png')" alt="" />
              <img class="ct-card-content" :src="asset(file)" alt="" />
            </div>
          </div>
          <img class="ct-text" :src="asset('text-2.png')" alt="" />
        </div>
        <div class="bl__coating ct-block ct-block--3">
          <div
            class="ct-stack"
            @touchstart="touch3.onTouchStart"
            @touchmove="touch3.onTouchMove"
            @touchend="touch3.onTouchEnd"
          >
            <div
              v-for="(file, idx) in list3"
              :key="idx"
              class="ct-card-wrap"
              :class="`ct-card-wrap--offset-${cardOffset(idx + 1, activeCard3)}`"
              @click="onCardClick3(idx + 1)"
            >
              <img class="ct-card-frame" :src="asset('frame-bg.png')" alt="" />
              <img class="ct-card-content" :src="asset(file)" alt="" />
            </div>
          </div>
          <img class="ct-text" :src="asset('text-3.png')" alt="" />
        </div>
      </div>
    </transition>

    <!-- blasting：成果总结 -->
    <transition name="fade">
      <div v-if="activeId === 'blasting' && point?.detail" class="bl__content bl__content--blasting">
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

    &--baima {
      display: block;

      .bl__baima {
        position: absolute;
        object-fit: contain;
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
        object-fit: contain;
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
        object-fit: contain;
      }

      .ct-title {
        left: d.w(308);
        top: d.h(238);
        width: d.w(1821);
        height: d.h(167);
      }

      .ct-block {
        position: absolute;
        transition: transform 0.3s ease;

        &--1 {
          left: d.w(104);
          top: d.h(754);
          width: d.w(1290);
          height: d.h(1012);
        }

        &--2 {
          left: d.w(1279);
          top: d.h(754);
          width: d.w(1290);
          height: d.h(1012);
        }

        &--3 {
          left: d.w(2454);
          top: d.h(754);
          width: d.w(1290);
          height: d.h(1012);
        }

        &:hover {
          z-index: 10;
        }

        .ct-stack {
          position: absolute;
          left: d.w(323);
          top: 0;
          width: d.w(644);
          height: d.h(890);
          z-index: 1;

          &.is-dragging .ct-card-wrap {
            transition: none !important;
          }
        }

        .ct-card-wrap {
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

          .ct-card-frame {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: inherit;
            z-index: 1;
          }

          .ct-card-content {
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
            .ct-card-frame {
              filter: drop-shadow(0 d.h(6) d.w(20) rgba(0, 0, 0, 0.55));
            }
          }

          &--offset--1,
          &--offset-1 {
            filter: brightness(0.8);
          }
        }

        .ct-text {
          position: absolute;
          left: 0;
          top: d.h(905);
          width: d.w(1290);
          height: d.h(107);
          object-fit: contain;
          z-index: 2;
        }
      }
    }

    &--blasting {
      display: block;

      .bl__blasting {
        position: absolute;
        object-fit: contain;
      }

      .bl-bs-title {
        left: d.w(309);
        top: d.h(238);
        width: d.w(1821);
        height: d.h(167);
      }

      .bl-bs-1 {
        left: d.w(131);
        top: d.h(570);
        width: d.w(1219);
        height: d.h(1129);
      }

      .bl-bs-2 {
        left: d.w(1243);
        top: d.h(570);
        width: d.w(1430);
        height: d.h(1129);
      }

      .bl-bs-3 {
        left: d.w(2526);
        top: d.h(570);
        width: d.w(1219);
        height: d.h(1129);
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
    display: flex;
    gap: d.w(40);
    width: 100%;
    height: 80%;

    img {
      flex: 1;
      min-width: 0;
      object-fit: contain;
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
