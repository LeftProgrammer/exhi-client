<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useDeviceStore } from '../stores/device'

/**
 * 自适应舞台：用 designBase + 等比缩放实现内容大小自适应。
 * 内容内部用 designBase 的像素值布局即可。
 */

const device = useDeviceStore()
const scale = ref(1)

function compute() {
  const baseW = device.designBase.width
  const baseH = device.designBase.height
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (device.fitPolicy === 'fill') {
    scale.value = Math.max(vw / baseW, vh / baseH)
  } else if (device.fitPolicy === 'none') {
    scale.value = 1
  } else {
    scale.value = Math.min(vw / baseW, vh / baseH)
  }
}

onMounted(() => {
  compute()
  window.addEventListener('resize', compute)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', compute)
})

const innerStyle = computed(() => ({
  width: device.designBase.width + 'px',
  height: device.designBase.height + 'px',
  transform: `scale(${scale.value})`
}))
</script>

<template>
  <div class="adaptive-stage">
    <div class="adaptive-stage__inner" :style="innerStyle">
      <slot />
    </div>
  </div>
</template>
