<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface BridgeInfo {
  deviceId: string
  displayId: string
  runtimeVersion: string
  packageInfo?: { projectId: string; version: string }
}

declare global {
  interface Window {
    exhibitBridge?: {
      getInfo(): Promise<BridgeInfo>
      dispatch(cmd: { type: string; payload?: unknown }): Promise<unknown>
      emit(name: string, payload?: unknown): void
      on(name: string, cb: (payload: unknown) => void): () => void
    }
  }
}

const info = ref<BridgeInfo | null>(null)
const counter = ref(0)
const lastEvent = ref<string>('')

onMounted(async () => {
  if (window.exhibitBridge) {
    info.value = await window.exhibitBridge.getInfo()
    window.exhibitBridge.on('scene:changed', (payload) => {
      lastEvent.value = `scene:changed → ${JSON.stringify(payload)}`
    })
  }
})

function reload() {
  window.exhibitBridge?.dispatch({ type: 'cmd.reload' })
}

function ping() {
  window.exhibitBridge?.emit('hello.ping', { counter: counter.value, ts: Date.now() })
  counter.value++
}
</script>

<template>
  <div class="hello">
    <h1>白马筑基 · 时代赞歌</h1>
    <p class="subtitle">M10 Mini Vite 工程化骨架</p>

    <div class="info" v-if="info">
      <div><span>device:</span> {{ info.deviceId }}</div>
      <div><span>display:</span> {{ info.displayId }}</div>
      <div><span>runtime:</span> {{ info.runtimeVersion }}</div>
      <div v-if="info.packageInfo">
        <span>package:</span> {{ info.packageInfo.projectId }} v{{ info.packageInfo.version }}
      </div>
    </div>
    <div v-else class="info muted">exhibitBridge 未就绪（直接刷新一次）</div>

    <div class="actions">
      <button @click="ping">📡 emit hello.ping (#{{ counter }})</button>
      <button @click="reload">🔄 reload</button>
    </div>

    <div class="event">{{ lastEvent || '（等待 scene:changed 事件）' }}</div>

    <p class="hint">
      改 src/hello/App.vue 保存 → HMR 即时生效。<br />
      改素材：放 contents/* 后改 scenes.json。
    </p>
  </div>
</template>

<style scoped lang="scss">
.hello {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a1428 0%, #163056 100%);
  color: #e8eef9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
}

h1 {
  font-size: 6vh;
  letter-spacing: 0.2em;
  margin: 0 0 1vh 0;
  font-weight: 600;
}

.subtitle {
  color: #6b8bb8;
  font-size: 2vh;
  letter-spacing: 0.3em;
  margin: 0 0 6vh 0;
}

.info {
  font-size: 2vh;
  background: rgba(255, 255, 255, 0.05);
  padding: 2vh 4vw;
  border-radius: 1vh;
  margin-bottom: 4vh;
  line-height: 1.8;

  span {
    color: #6b8bb8;
    margin-right: 1vw;
    display: inline-block;
    width: 6em;
    text-align: right;
  }

  &.muted {
    opacity: 0.5;
  }
}

.actions {
  display: flex;
  gap: 2vw;
  margin-bottom: 4vh;
}

button {
  font-size: 2.4vh;
  padding: 1.6vh 3vw;
  border: 1px solid rgba(180, 200, 230, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: #e8eef9;
  border-radius: 1vh;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.97);
  }
}

.event {
  font-size: 1.6vh;
  color: #6b8bb8;
  font-family: monospace;
  margin-bottom: 6vh;
  min-height: 1.6vh;
}

.hint {
  font-size: 1.6vh;
  color: rgba(180, 200, 230, 0.4);
  text-align: center;
  line-height: 1.8;
}
</style>
