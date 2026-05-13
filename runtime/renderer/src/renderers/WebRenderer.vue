<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Command, WebScene } from '@shared/types'
import { resolvePkgUrl } from '../utils/url'
import { useDeviceStore } from '../stores/device'

const props = defineProps<{ scene: WebScene }>()
const device = useDeviceStore()

const src = computed(() => resolvePkgUrl(props.scene.src))
const allowInteraction = computed(() => props.scene.allowInteraction ?? true)

const iframeRef = ref<HTMLIFrameElement | null>(null)

/** 父端能接受的 bridge dispatch 指令白名单 */
const BRIDGE_ALLOWED_CMD_TYPES = new Set([
  'cmd.gotoScene',
  'cmd.play',
  'cmd.pause',
  'cmd.seek',
  'cmd.setRate',
  'cmd.volume',
  'cmd.reload',
  'cmd.macro'
])

function isFromOurIframe(e: MessageEvent): boolean {
  return !!iframeRef.value && e.source === iframeRef.value.contentWindow
}

function postToIframe(payload: unknown) {
  // JSON 来回一次，剥掉 Pinia 的 reactive Proxy（structured clone 不能克隆 Proxy → DataCloneError）
  try {
    const safe = JSON.parse(JSON.stringify(payload))
    iframeRef.value?.contentWindow?.postMessage(safe, '*')
  } catch (e) {
    console.warn('[WebRenderer] postMessage 失败', e)
  }
}

function handleMessage(e: MessageEvent) {
  if (!isFromOurIframe(e)) return
  const data = e.data as { _exhi?: string } & Record<string, unknown>
  if (!data || data._exhi == null) return

  switch (data._exhi) {
    case 'hello': {
      // 内容就绪，下发 info
      const info = device.boot
        ? {
            deviceId: device.boot.deviceId,
            displayId: device.boot.displayId,
            runtimeVersion: device.boot.runtimeVersion,
            packageInfo: device.boot.packageInfo
          }
        : null
      postToIframe({ _exhi: 'info', info })
      break
    }
    case 'dispatch': {
      const cmd = data.cmd as Command | undefined
      const id = data.id as string | undefined
      if (!cmd || !id) return
      if (!cmd.type || !BRIDGE_ALLOWED_CMD_TYPES.has(cmd.type)) {
        postToIframe({ _exhi: 'dispatch-result', id, ok: false, error: 'cmd not allowed' })
        return
      }
      // 补全 id/ts，标记 source 由主进程统一打
      const dispatched: Command = {
        ...cmd,
        id: cmd.id || `bridge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ts: cmd.ts || Date.now()
      }
      window.exhibit.dispatchBridgeCommand(dispatched)
      postToIframe({ _exhi: 'dispatch-result', id, ok: true })
      break
    }
    case 'emit': {
      const name = data.name as string | undefined
      const payload = data.payload as unknown
      if (!name) return
      window.exhibit.bridgeEmit(name, payload, device.displayId)
      break
    }
  }
}

/** 接收来自主进程的"广播事件"，转发到 iframe（仅当目标包括本屏时） */
let unsubMainEvent: (() => void) | null = null

onMounted(() => {
  window.addEventListener('message', handleMessage)
  unsubMainEvent = window.exhibit.onBridgeEventFromMain((ev) => {
    if (ev.targetDisplayId && ev.targetDisplayId !== device.displayId) return
    postToIframe({ _exhi: 'event', name: ev.name, payload: ev.payload })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  unsubMainEvent?.()
  unsubMainEvent = null
})
</script>

<template>
  <iframe
    ref="iframeRef"
    class="scene-layer"
    :src="src"
    :style="{
      pointerEvents: allowInteraction ? 'auto' : 'none',
      background: scene.transparent ? 'transparent' : '#000'
    }"
    frameborder="0"
    allow="autoplay; fullscreen"
  />
</template>

<style scoped lang="scss">
iframe.scene-layer {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
