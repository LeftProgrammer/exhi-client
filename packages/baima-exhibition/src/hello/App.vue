<script setup lang="ts">
import { ref } from 'vue'
import { useBridge } from '@shared/composables/useBridge'

const { info, ready, emit, on, reload } = useBridge()
const counter = ref(0)
const lastEvent = ref<string>('')

on('scene:changed', (payload) => {
  lastEvent.value = `scene:changed → ${JSON.stringify(payload)}`
})

function ping() {
  emit('hello.ping', { counter: counter.value, ts: Date.now() })
  counter.value++
}
</script>

<template>
  <div class="hello">
    <h1>白马筑基 · 时代赞歌</h1>
    <p class="subtitle">M10 Mini · Vite 工程化骨架123</p>

    <div v-if="info" class="info" :class="{ ready }">
      <div><span class="label">device:</span> {{ info.deviceId }}</div>
      <div><span class="label">display:</span> {{ info.displayId }}</div>
      <div><span class="label">runtime:</span> {{ info.runtimeVersion }}</div>
      <div v-if="info.packageInfo">
        <span class="label">package:</span>
        {{ info.packageInfo.projectId }} v{{ info.packageInfo.version }}
      </div>
    </div>
    <div v-else class="info muted">exhibitBridge 未就绪…</div>

    <div class="actions">
      <button @click="ping">📡 emit hello.ping (#{{ counter }})</button>
      <button @click="reload">🔄 reload</button>
    </div>

    <div class="event">{{ lastEvent || '（等待 scene:changed 事件）' }}</div>

    <p class="hint">
      改 src/hello/App.vue 保存 → HMR 即时生效。<br />
      路径别名 @shared/composables/useBridge 已通。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@shared/styles/tokens' as t;
@use '@shared/styles/mixins' as m;

.hello {
  @include m.fill;
  @include m.center-col;
  background: linear-gradient(135deg, t.$color-bg-primary 0%, t.$color-bg-secondary 100%);
  color: t.$color-text-primary;
  @include m.touch-safe;
}

h1 {
  font-size: t.$fs-hero;
  letter-spacing: 0.2em;
  margin: 0 0 t.$space-xs;
  font-weight: t.$fw-bold;
}

.subtitle {
  color: t.$color-text-muted;
  font-size: t.$fs-h3;
  letter-spacing: 0.3em;
  margin: 0 0 t.$space-xl;
}

.info {
  @include m.glass;
  font-size: t.$fs-body;
  padding: t.$space-sm t.$space-lg;
  border-radius: t.$radius-md;
  margin-bottom: t.$space-lg;
  line-height: 1.8;

  .label {
    color: t.$color-text-muted;
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
  margin-bottom: t.$space-lg;
}

button {
  font-size: t.$fs-h3;
  padding: t.$space-sm 3vw;
  border: 1px solid t.$color-border-strong;
  background: rgba(255, 255, 255, 0.05);
  color: t.$color-text-primary;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: all t.$dur-fast t.$ease-base;

  &:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.97);
  }
}

.event {
  font-size: t.$fs-small;
  color: t.$color-text-muted;
  font-family: monospace;
  margin-bottom: t.$space-xl;
  min-height: t.$fs-small;
}

.hint {
  font-size: t.$fs-small;
  color: t.$color-text-disabled;
  text-align: center;
  line-height: 1.8;
}
</style>
