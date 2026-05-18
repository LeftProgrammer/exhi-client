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
  /**
   * hover 扫光方向：
   *   'lr'（默认）= 从左下扫到右上
   *   'rl'         = 从右上扫到左下（左右镜像的卡片用，跟 PNG 边框气流方向对齐）
   */
  shineDirection?: 'lr' | 'rl'
}
const props = withDefaults(defineProps<Props>(), {
  noDot: false,
  direction: 'cw',
  dotInset: () => ({}),
  dotColor: '#00e5d4',
  shineDirection: 'lr'
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

    <!-- 扫光层：hover 时一道斜向高光，方向由 shineDirection 决定 -->
    <div
      class="entry-card__shine"
      :class="`entry-card__shine--${props.shineDirection}`"
      aria-hidden="true"
    />

    <!-- 内容层完全交给调用方（标题、图标等都通过 slot 自由摆放） -->
    <div class="entry-card__content">
      <slot />
    </div>
  </button>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/transitions' as fx;

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
  z-index: 3; /* 在底图、扫光之上、内容之下 */
}

/* ===== 扫光层 =====
   * hover 时一道斜向高光从左向右扫过；离开瞬间归位（无反向）。
   * 扫光方向由 modifier class 决定：
   *   --lr：从左下扫到右上（默认）
   *   --rl：从右上扫到左下（左右镜像卡片用，跟边框气流方向对齐）
   */
.entry-card__shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 4px;
  overflow: hidden; // 把伪元素亮带裁在卡片内
}

.entry-card__shine--lr {
  @include fx.shine-base;
}
.entry-card:hover .entry-card__shine--lr {
  @include fx.shine-trigger($duration: 1.4s);
}

.entry-card__shine--rl {
  @include fx.shine-base($reverse: true);
}
.entry-card:hover .entry-card__shine--rl {
  @include fx.shine-trigger($duration: 1.4s, $reverse: true);
}

/* ===== 内容层 =====
   * 占满整张卡片，调用方在 slot 内用绝对定位摆放标题/图标即可。
   */
.entry-card__content {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
</style>
