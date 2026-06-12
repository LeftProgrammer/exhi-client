<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBridge } from '@shared/composables/useBridge'
import { useProjectSfx } from '@shared/composables/useProjectSfx'
import { useControl } from '@baima-zhineng/composables/useControl'

const router = useRouter()
const { on } = useBridge()

// 展厅 runtime 下发回首页指令
on('app:home', () => router.push({ name: 'home' }))

// === UEC 中控协议处理 ===
const control = useControl()
control.setupCommands(router)

// 浏览器 dev 模式没有 exhibitBridge，直接连 UEC WS 接收中控指令
if (!window.exhibitBridge) {
  control.startFallback('zhineng')
}

// 初始化音效系统（注册 + 预加载 + 手势解锁）
onMounted(() => {
  const sfx = useProjectSfx()
  sfx.unlock()
})
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.name" />
    </transition>
  </router-view>
</template>

<style lang="scss">
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  background: #020617;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 500ms t.$ease-base,
    transform 500ms t.$ease-base;
}

.page-leave-active {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.page-enter-from {
  opacity: 0;
  transform: scale(1.03);
}

.page-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
