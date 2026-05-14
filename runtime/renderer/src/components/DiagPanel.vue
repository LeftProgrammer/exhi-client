<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDeviceStore } from '../stores/device'
import { useSceneStore } from '../stores/scene'
import { useCommandStore } from '../stores/command'

/**
 * 隐藏诊断面板。
 * 触发：在主屏窗口连按 3 次 Ctrl+Shift+Alt+E（5 秒内）。
 * 仅运维使用，紧急排错；ESC 关闭。
 */

const visible = ref(false)
const device = useDeviceStore()
const scene = useSceneStore()
const cmd = useCommandStore()

const lastTimes: number[] = []
const HOTKEY_WINDOW_MS = 5_000

/**
 * 唤起策略：连续 3 次（5 秒内）触发主进程热键 → 打开面板。
 * 主进程热键用 globalShortcut，焦点在 iframe 也能收到，解决了之前的盲区。
 */
function onHotkeyFromMain() {
  const now = Date.now()
  lastTimes.push(now)
  while (lastTimes.length && now - lastTimes[0] > HOTKEY_WINDOW_MS) lastTimes.shift()
  if (lastTimes.length >= 3) {
    visible.value = true
    lastTimes.length = 0
  }
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) visible.value = false
}

let unsubHotkey: (() => void) | null = null

onMounted(() => {
  unsubHotkey = window.exhibit?.onDiagHotkey?.(onHotkeyFromMain) ?? null
  window.addEventListener('keydown', onEsc, true)
})

onBeforeUnmount(() => {
  unsubHotkey?.()
  unsubHotkey = null
  window.removeEventListener('keydown', onEsc, true)
})

const recentCmds = computed(() => cmd.recent.slice(0, 12))

function reloadSelf() {
  window.location.reload()
}
</script>

<template>
  <div v-if="visible" class="diag-panel" @click.self="visible = false">
    <div class="diag-panel__inner" @click.stop>
      <div class="diag-panel__head">
        <span>诊断面板</span>
        <button class="diag-panel__close" @click="visible = false">×</button>
      </div>

      <section>
        <h4>设备</h4>
        <pre>{{ JSON.stringify({
          deviceId: device.boot?.deviceId,
          displayId: device.boot?.displayId,
          runtime: device.boot?.runtimeVersion,
          package: device.boot?.packageInfo
        }, null, 2) }}</pre>
      </section>

      <section>
        <h4>当前场景</h4>
        <pre>{{ scene.currentSceneId }} → {{ scene.current?.type }}</pre>
      </section>

      <section>
        <h4>最近指令（{{ cmd.totalCount }}）</h4>
        <ul class="diag-panel__cmds">
          <li v-for="(c, i) in recentCmds" :key="i">
            <span class="t">{{ c.type }}</span>
            <span class="src">[{{ c.source ?? '?' }}]</span>
            <span class="p">{{ JSON.stringify(c.payload ?? {}) }}</span>
          </li>
        </ul>
      </section>

      <section>
        <h4>操作</h4>
        <button @click="reloadSelf">重新加载本屏</button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@renderer/styles/tokens' as t;

.diag-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: t.$z-diagnostic;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: auto;

  &__inner {
    width: 720px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 24px 28px;
    background: #111;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #ddd;
    font-family: Consolas, monospace;
    font-size: 13px;

    h4 {
      margin: 16px 0 8px 0;
      color: #6ee7b7;
      font-size: 14px;
    }

    pre {
      background: #000;
      padding: 10px 12px;
      border-radius: 4px;
      white-space: pre-wrap;
      max-height: 240px;
      overflow: auto;
      margin: 0;
    }

    button {
      background: #2563eb;
      color: #fff;
      border: 0;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      &:hover {
        background: #1d4ed8;
      }
    }
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 8px;
  }

  &__close {
    background: transparent;
    color: #999;
    font-size: 20px;
    line-height: 1;
    width: 32px;
    height: 32px;
    padding: 0;
    &:hover {
      color: #fff;
      background: transparent;
    }
  }

  &__cmds {
    list-style: none;
    padding: 0;
    margin: 0;
    background: #000;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;

    li {
      padding: 6px 12px;
      border-bottom: 1px solid #1a1a1a;
      display: flex;
      gap: 8px;

      .t {
        color: #93c5fd;
        flex: 0 0 auto;
      }
      .src {
        color: #fbbf24;
        font-size: 11px;
      }
      .p {
        color: #888;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
