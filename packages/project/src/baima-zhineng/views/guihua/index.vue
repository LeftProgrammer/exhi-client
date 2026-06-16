<script setup lang="ts">
/**
 * 职能建设 · 规划计划板块。
 *
 * 基于 SecondaryPage 通用组件，使用 frame-scroll 模式（带边框纵向滚动）。
 */
import SecondaryPage from '../../components/SecondaryPage.vue'
import { getModule } from '../../data/modules'

const module = getModule('guihua')!
</script>

<template>
  <SecondaryPage :module="module" mode="frame-scroll" />
</template>
