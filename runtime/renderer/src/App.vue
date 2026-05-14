<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDeviceStore } from './stores/device'
import { useSceneStore } from './stores/scene'
import AdaptiveStage from './layout/AdaptiveStage.vue'
import SceneStage from './components/SceneStage.vue'
import DiagPanel from './components/DiagPanel.vue'
import { SceneOrchestrator } from './orchestrator/SceneOrchestrator'

const device = useDeviceStore()
const scene = useSceneStore()
const errorMsg = ref<string | null>(null)

onMounted(async () => {
  try {
    await device.init()
    const buf = await window.exhibit.readPackageFile('scenes.json')
    const scenesConfig = JSON.parse(new TextDecoder().decode(buf))
    scene.setScenes(scenesConfig.scenes)

    const orchestrator = new SceneOrchestrator()
    orchestrator.init(device.boot!.display.defaultScene)
  } catch (e) {
    errorMsg.value = (e as Error).message
    window.exhibit?.log?.('error', '渲染层启动失败', errorMsg.value)
  }
})
</script>

<template>
  <div v-if="errorMsg" class="error-overlay">启动失败：{{ errorMsg }}</div>
  <AdaptiveStage v-else-if="device.ready">
    <SceneStage />
  </AdaptiveStage>
  <DiagPanel />
</template>
