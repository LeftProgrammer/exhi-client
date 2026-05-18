<script setup lang="ts">
import { ref } from 'vue'
import MovingDot from '@shared/effects/MovingDot.vue'

/**
 * 流光路径内缩量。number 时四边一致；对象时分边可调。
 * 与 MovingDot 的 Inset 同构（这里独立声明避免跨组件 type 导出耦合）。
 */
type Inset =
  | number
  | {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }

interface Props {
  /** 卡片背景图 URL */
  bgUrl: string
  /** 关闭边框流光 */
  noDot?: boolean
  /** 流光方向：'cw' 顺时针 / 'ccw' 逆时针 */
  direction?: 'cw' | 'ccw'
  /** 流光路径四向内缩（贴背景图描边时用，0~50 百分比） */
  dotInset?: Inset
  /** 流光颜色（任何 CSS 颜色） */
  dotColor?: string
}
withDefaults(defineProps<Props>(), {
  noDot: false,
  direction: 'cw',
  dotInset: () => ({}),
  dotColor: '#00e5d4'
})
defineEmits<{ (e: 'enter'): void }>()

const pressed = ref(false)

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
    <!-- 底图：所有静态视觉（边框、角标、装饰）-->
    <img class="entry-card__bg" :src="bgUrl" alt="" aria-hidden="true" />

    <!-- 边框流光：内置圆角矩形，传 dot-inset 即可贴边走 -->
    <MovingDot
      v-if="!noDot"
      :inset="dotInset"
      speed="normal"
      :direction="direction"
      :color="dotColor"
      class="entry-card__dot"
    />

    <!-- 内容层完全交给调用方（标题、图标等都通过 slot 自由摆放） -->
    <div class="entry-card__content">
      <slot />
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

/* ===== 边框流光 ===== */
.entry-card__dot {
  z-index: 2; /* 在底图之上、内容之下 */
}

/* ===== 内容层 =====
   * 占满整张卡片，调用方在 slot 内用绝对定位摆放标题/图标即可。
   */
.entry-card__content {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
</style>
