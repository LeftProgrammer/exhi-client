<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDeviceStore } from './stores/device'
import { useSceneStore } from './stores/scene'
import AdaptiveStage from './layout/AdaptiveStage.vue'
import { resolveRenderer } from './renderers/registry'
import { SceneOrchestrator } from './orchestrator/SceneOrchestrator'

const device = useDeviceStore()
const scene = useSceneStore()
const errorMsg = ref<string | null>(null)

onMounted(async () => {
  try {
    await device.init()
    // 加载 scenes.json 到 store
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

const rendererComp = computed(() => {
  if (!scene.current) return null
  return resolveRenderer(scene.current.type)
})
</script>

<template>
  <div v-if="errorMsg" class="error-overlay">启动失败：{{ errorMsg }}</div>
  <AdaptiveStage v-else-if="device.ready">
    <Transition name="fade" mode="out-in">
      <component
        :is="rendererComp"
        v-if="rendererComp && scene.current"
        :key="scene.currentSceneId"
        :scene="scene.current"
      />
    </Transition>
  </AdaptiveStage>
</template>
