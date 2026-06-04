<script setup lang="ts">
import SecondaryPage from '../../components/SecondaryPage.vue'
import { getModule } from '../../data/modules'

const module = getModule('guihua')!
</script>

<template>
  <SecondaryPage :module="module" />
</template>
