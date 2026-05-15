<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  /** 卡片背景图（含设计稿里的边框/角标/光带的整张图）*/
  bgUrl: string
  /** 卡片标题图（含中文标题 + 拼音副标题，整张图来自蓝湖切图）*/
  titleImage?: string
  /** fallback 标题（titleImage 缺失或加载失败时显示） */
  titleFallback: string
  /** fallback 副标题（仅在没有 titleImage 时使用） */
  subtitleFallback?: string
  /** 标题在卡片内的横向偏移百分比（两张卡片背景图镜像时需要分别设置） */
  titleLeft?: string
  /** 标题在卡片内的纵向偏移百分比 */
  titleTop?: string
  /** 标题宽度百分比 */
  titleWidth?: string
}
const props = withDefaults(defineProps<Props>(), {
  titleLeft: '22%',
  titleTop: '18%',
  titleWidth: '50%'
})
defineEmits<{ (e: 'enter'): void }>()

const pressed = ref(false)
const imgError = ref(false)

function onDown() {
  pressed.value = true
}
function onUp() {
  pressed.value = false
}
</script>

<template>
  <button
    class="entry-card"
    :class="{ pressed }"
    @pointerdown="onDown"
    @pointerup="onUp"
    @pointerleave="onUp"
    @click="$emit('enter')"
  >
    <!-- 卡片底图：设计稿里所有静态视觉都在这里 -->
    <img class="entry-card__bg" :src="bgUrl" alt="" aria-hidden="true" />

    <!-- 标题层（靠卡片左上） -->
    <div
      class="entry-card__title"
      :style="{ top: props.titleTop, left: props.titleLeft, width: props.titleWidth }"
    >
      <img
        v-if="titleImage && !imgError"
        class="entry-card__title-img"
        :src="titleImage"
        :alt="titleFallback"
        @error="imgError = true"
      />
      <!-- titleImage 缺失时的 CSS fallback -->
      <div v-else class="entry-card__title-fallback">
        <h2 class="entry-card__title-text">{{ titleFallback }}</h2>
        <p v-if="subtitleFallback" class="entry-card__subtitle">{{ subtitleFallback }}</p>
      </div>
    </div>
  </button>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

$card-w: 38vh;
$card-h: 52.5vh;

.entry-card {
  position: relative;
  width: $card-w;
  height: $card-h;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform t.$dur-base t.$ease-base;

  &:hover {
    transform: translateY(-6px);
  }
  &.pressed {
    transform: translateY(-2px) scale(0.98);
    transition-duration: t.$dur-fast;
  }
}

/* ===== 卡片底图 ===== */
.entry-card__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  z-index: 1;
}

/* ===== 标题层 =====
   * 位置由 prop titleLeft / titleTop / titleWidth 传入（左右对称的卡片需要不同 left）
   */
.entry-card__title {
  position: absolute;
  z-index: 2;
  pointer-events: none;
}

.entry-card__title-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

/* CSS fallback：模拟标题图的视觉（领导关怀那张图没出时用） */
.entry-card__title-fallback {
  color: t.$color-text-primary;
}

.entry-card__title-text {
  font-size: t.$fs-hero;
  font-weight: t.$fw-medium;
  letter-spacing: 0.2em;
  margin: 0 0 t.$space-xs 0;
  white-space: nowrap;
}

.entry-card__subtitle {
  font-size: t.$fs-h3;
  letter-spacing: 0.25em;
  color: t.$color-text-secondary;
  margin: 0;
  opacity: 0.85;
  font-weight: t.$fw-regular;
  white-space: nowrap;
}
</style>
