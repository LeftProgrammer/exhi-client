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
  let s: number
  if (device.fitPolicy === 'fill') {
    s = Math.max(vw / baseW, vh / baseH)
  } else if (device.fitPolicy === 'none') {
    s = 1
  } else {
    s = Math.min(vw / baseW, vh / baseH)
  }
  // 缩放比非常接近 1 时强制 snap 到 1，避免 CSS transform 的亚像素渲染导致整屏发糊。
  // 典型场景：dev 模式窗口刚好被任务栏挤掉 16px，scale=0.991x。
  if (Math.abs(s - 1) < 0.03) s = 1
  scale.value = s
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
