<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  subtitle: string
  iconUrl: string
}
defineProps<Props>()
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
    <!-- 4 个角的装饰角标 -->
    <span class="corner corner--tl" />
    <span class="corner corner--tr" />
    <span class="corner corner--bl" />
    <span class="corner corner--br" />

    <!-- 左右光带装饰 -->
    <span class="stripe stripe--left" />
    <span class="stripe stripe--right" />

    <div class="content">
      <div class="title-row">
        <h2 class="title">{{ title }}</h2>
        <p class="subtitle">{{ subtitle }}</p>
      </div>

      <div class="icon-wrap">
        <img :src="iconUrl" alt="" class="icon" />
        <span class="icon-halo" />
      </div>
    </div>

    <!-- hover/press 时的扫光 -->
    <span class="sweep" />
  </button>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.entry-card {
  position: relative;
  width: 38vh;
  height: 64vh;
  background: linear-gradient(
    180deg,
    rgba(15, 35, 60, 0.4) 0%,
    rgba(8, 24, 42, 0.6) 50%,
    rgba(15, 35, 60, 0.4) 100%
  );
  border: 1px solid t.$color-border-soft;
  border-radius: t.$radius-md;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform t.$dur-base t.$ease-base,
    box-shadow t.$dur-base t.$ease-base,
    border-color t.$dur-base t.$ease-base;
  outline: none;
  padding: 0;

  &:hover {
    border-color: t.$color-border-strong;
    box-shadow: t.$glow-accent;
    transform: translateY(-6px);
  }

  &.pressed {
    transform: translateY(-2px) scale(0.98);
    transition-duration: t.$dur-fast;
  }
}

/* ===== 角标 ===== */
.corner {
  position: absolute;
  width: 5vh;
  height: 5vh;
  pointer-events: none;
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: t.$color-accent;
    box-shadow: 0 0 8px t.$color-accent-glow;
  }
  /* 横条 */
  &::before {
    width: 100%;
    height: 2px;
  }
  /* 竖条 */
  &::after {
    width: 2px;
    height: 100%;
  }

  &--tl {
    top: 0;
    left: 0;
    &::before {
      top: 0;
      left: 0;
    }
    &::after {
      top: 0;
      left: 0;
    }
  }
  &--tr {
    top: 0;
    right: 0;
    &::before {
      top: 0;
      right: 0;
    }
    &::after {
      top: 0;
      right: 0;
    }
  }
  &--bl {
    bottom: 0;
    left: 0;
    &::before {
      bottom: 0;
      left: 0;
    }
    &::after {
      bottom: 0;
      left: 0;
    }
  }
  &--br {
    bottom: 0;
    right: 0;
    &::before {
      bottom: 0;
      right: 0;
    }
    &::after {
      bottom: 0;
      right: 0;
    }
  }
}

/* ===== 左右光带 ===== */
.stripe {
  position: absolute;
  top: 12%;
  bottom: 12%;
  width: 4px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    t.$color-accent 20%,
    t.$color-accent 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px t.$color-accent-glow;
  pointer-events: none;

  &--left {
    left: 8%;
  }
  &--right {
    right: 8%;
  }
}

/* ===== 内容布局 ===== */
.content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: t.$space-lg t.$space-md;
}

.title-row {
  text-align: center;
  margin-bottom: t.$space-xl;
  z-index: 2;
}

.title {
  font-size: t.$fs-hero;
  font-weight: t.$fw-medium;
  letter-spacing: 0.3em;
  color: t.$color-text-primary;
  text-shadow: 0 0 18px rgba(0, 229, 212, 0.4);
  margin: 0;
}

.subtitle {
  font-size: t.$fs-h3;
  letter-spacing: 0.4em;
  color: t.$color-text-secondary;
  margin-top: t.$space-sm;
  opacity: 0.8;
}

/* ===== 图标 + 光晕 ===== */
.icon-wrap {
  position: relative;
  width: 20vh;
  height: 20vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 12px rgba(0, 229, 212, 0.5));
  pointer-events: none;
}

.icon-halo {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 229, 212, 0.25) 0%,
    rgba(0, 229, 212, 0.08) 40%,
    transparent 70%
  );
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* ===== 扫光（hover 时从下往上扫一次） ===== */
.sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 40%,
    rgba(0, 229, 212, 0.12) 50%,
    transparent 60%
  );
  transform: translateY(100%);
  transition: transform t.$dur-slow t.$ease-base;
}
.entry-card:hover .sweep {
  transform: translateY(-100%);
}
</style>
