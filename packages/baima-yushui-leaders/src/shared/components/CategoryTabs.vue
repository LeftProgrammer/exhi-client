<script setup lang="ts">
import type { Category } from '@shared/data/sections'

defineProps<{
  categories: Category[]
  activeId: string
}>()
defineEmits<{ (e: 'select', id: string): void }>()
</script>

<template>
  <ul class="tabs">
    <li
      v-for="cat in categories"
      :key="cat.id"
      class="tab"
      :class="{ 'tab--active': cat.id === activeId }"
      @click="$emit('select', cat.id)"
    >
      <span class="tab__bg" />
      <span class="tab__text">{{ cat.title }}</span>
      <span class="tab__indicator" />
    </li>
  </ul>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;

.tabs {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: t.$space-md;
}

.tab {
  position: relative;
  width: 18vh;
  height: 8vh;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform t.$dur-fast t.$ease-base;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.97);
  }

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0, 229, 212, 0.08) 50%,
      rgba(0, 229, 212, 0.18) 100%
    );
    border: 1px solid t.$color-border-soft;
    border-right: none;
    border-radius: t.$radius-md 0 0 t.$radius-md;
    transition:
      background t.$dur-base t.$ease-base,
      border-color t.$dur-base t.$ease-base;
  }

  &__text {
    position: relative;
    font-size: t.$fs-h3;
    letter-spacing: 0.2em;
    color: t.$color-text-secondary;
    transition: color t.$dur-base t.$ease-base;
    z-index: 2;
  }

  &__indicator {
    position: absolute;
    right: -3px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 60%;
    background: t.$color-accent;
    box-shadow: 0 0 12px t.$color-accent-glow;
    border-radius: t.$radius-sm 0 0 t.$radius-sm;
    opacity: 0;
    transition: opacity t.$dur-base t.$ease-base;
  }

  &--active {
    .tab__bg {
      background: linear-gradient(
        90deg,
        rgba(0, 229, 212, 0.05) 0%,
        rgba(0, 229, 212, 0.18) 50%,
        rgba(0, 229, 212, 0.4) 100%
      );
      border-color: t.$color-border-strong;
    }
    .tab__text {
      color: t.$color-text-primary;
      text-shadow: 0 0 8px t.$color-accent-glow;
    }
    .tab__indicator {
      opacity: 1;
    }
  }
}
</style>
