<script setup lang="ts">
import SecondaryPage from '../../components/SecondaryPage.vue'
import { getModule } from '../../data/modules'

const module = getModule('zhidu')!
</script>

<template>
  <SecondaryPage :module="module" mode="frame-scroll" />
</template>
