import { onBeforeUnmount, ref, readonly } from 'vue'
import { useBridge } from '@shared/composables/useBridge'

export interface ScreenState {
  /** 当前选中的工程点位 id；null 表示待机 */
  activePointId: string | null
}

const state = ref<ScreenState>({
  activePointId: null
})

/**
 * 开发调试回退：
 * Electron runtime 下跨屏同步由主进程中转 bridge 事件实现。
 * 但浏览器 dev 模式下 window.exhibitBridge 未注入，emit/on 是空操作，
 * 多个副屏标签页无法联动。这里用 BroadcastChannel 在同源多标签间同步。
 */
const isRuntime = typeof window !== 'undefined' && !!window.exhibitBridge
const devChannel: BroadcastChannel | null =
  !isRuntime && typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('baima-research-sync')
    : null

type SyncMsg = { type: 'research:point'; id: string } | { type: 'research:idle' }

/** 从 URL 读取调试点位：如 /baima-research/#/top-left?point=baima-bridge */
export function getDebugPoint(): string | null {
  if (typeof location === 'undefined') return null
  const fromSearch = new URLSearchParams(location.search).get('point')
  if (fromSearch) return fromSearch
  const hash = location.hash
  const qi = hash.indexOf('?')
  if (qi >= 0) return new URLSearchParams(hash.slice(qi + 1)).get('point')
  return null
}

export function useScreenSync() {
  const { emit, on } = useBridge()

  function broadcast(msg: SyncMsg) {
    if (msg.type === 'research:point') emit('research:point', { id: msg.id })
    else emit('research:idle', {})
    devChannel?.postMessage(msg)
  }

  /** 主屏：选中某个点位，通知所有副屏 */
  function syncPoint(id: string) {
    state.value.activePointId = id
    broadcast({ type: 'research:point', id })
  }

  /** 主屏：返回待机，通知所有副屏 */
  function syncIdle() {
    state.value.activePointId = null
    broadcast({ type: 'research:idle' })
  }

  /** 副屏：监听点位选中 */
  function onSyncPoint(cb: (id: string) => void) {
    on('research:point', (payload) => {
      if (payload && typeof payload === 'object' && 'id' in payload) {
        const p = payload as { id: string }
        state.value.activePointId = p.id
        cb(p.id)
      }
    })
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:point') {
          state.value.activePointId = e.data.id
          cb(e.data.id)
        }
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  /** 副屏：监听返回待机 */
  function onSyncIdle(cb: () => void) {
    on('research:idle', () => {
      state.value.activePointId = null
      cb()
    })
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:idle') {
          state.value.activePointId = null
          cb()
        }
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  return {
    state: readonly(state),
    syncPoint,
    syncIdle,
    onSyncPoint,
    onSyncIdle
  }
}
