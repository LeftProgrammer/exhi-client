<template>
  <SlideShow />
</template>

<script setup lang="ts">
import SlideShow from './components/SlideShow.vue'
</script>

<style lang="scss">
@use '@shared/styles/tokens' as t;

html,
body,
#app {
  background: t.$color-bg-primary;
}
</style>
