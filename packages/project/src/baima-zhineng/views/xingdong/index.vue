<script setup lang="ts">
/**
 * 职能建设 · 行动举措板块。
 *
 * 基于 SecondaryPage 通用组件，使用 scroll 模式（无边框纵向滚动）。
 */
import SecondaryPage from '../../components/SecondaryPage.vue'
import { getModule } from '../../data/modules'

const module = getModule('xingdong')!
</script>

<template>
  <SecondaryPage :module="module" mode="scroll" />
</template>
