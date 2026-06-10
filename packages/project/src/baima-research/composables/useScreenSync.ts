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

type SyncMsg =
  | { type: 'research:point'; id: string }
  | { type: 'research:idle' }
  | { type: 'research:video-play' }
  | { type: 'research:video-pause' }
  | { type: 'research:video-seek'; offset: number }
  | { type: 'research:video-volume'; delta: number }
  | { type: 'research:video-mute'; muted: boolean }

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
    else if (msg.type === 'research:idle') emit('research:idle', {})
    else if (msg.type === 'research:video-play') emit('research:video-play', {})
    else if (msg.type === 'research:video-pause') emit('research:video-pause', {})
    else if (msg.type === 'research:video-seek') emit('research:video-seek', { offset: msg.offset })
    else if (msg.type === 'research:video-volume') emit('research:video-volume', { delta: msg.delta })
    else if (msg.type === 'research:video-mute') emit('research:video-mute', { muted: msg.muted })
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

  /** 主屏：通知所有副屏播放视频 */
  function syncVideoPlay() {
    broadcast({ type: 'research:video-play' })
  }

  /** 主屏：通知所有副屏暂停视频 */
  function syncVideoPause() {
    broadcast({ type: 'research:video-pause' })
  }

  /** 主屏：通知所有副屏视频快进/快退（offset 单位：秒，正数快进，负数快退） */
  function syncVideoSeek(offset: number) {
    broadcast({ type: 'research:video-seek', offset })
  }

  /** 主屏：通知所有副屏调节音量（delta 单位：0~1，正数加大，负数减小） */
  function syncVideoVolume(delta: number) {
    broadcast({ type: 'research:video-volume', delta })
  }

  /** 主屏：通知所有副屏静音/恢复 */
  function syncVideoMute(muted: boolean) {
    broadcast({ type: 'research:video-mute', muted })
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

  /** 副屏：监听视频播放指令 */
  function onSyncVideoPlay(cb: () => void) {
    on('research:video-play', () => cb())
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:video-play') cb()
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  /** 副屏：监听视频暂停指令 */
  function onSyncVideoPause(cb: () => void) {
    on('research:video-pause', () => cb())
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:video-pause') cb()
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  /** 副屏：监听视频快进/快退指令 */
  function onSyncVideoSeek(cb: (offset: number) => void) {
    on('research:video-seek', (payload) => {
      if (payload && typeof payload === 'object' && 'offset' in payload) {
        cb((payload as { offset: number }).offset)
      }
    })
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:video-seek') cb(e.data.offset)
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  /** 副屏：监听音量调节指令 */
  function onSyncVideoVolume(cb: (delta: number) => void) {
    on('research:video-volume', (payload) => {
      if (payload && typeof payload === 'object' && 'delta' in payload) {
        cb((payload as { delta: number }).delta)
      }
    })
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:video-volume') cb(e.data.delta)
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  /** 副屏：监听静音/恢复指令 */
  function onSyncVideoMute(cb: (muted: boolean) => void) {
    on('research:video-mute', (payload) => {
      if (payload && typeof payload === 'object' && 'muted' in payload) {
        cb((payload as { muted: boolean }).muted)
      }
    })
    if (devChannel) {
      const handler = (e: MessageEvent<SyncMsg>) => {
        if (e.data?.type === 'research:video-mute') cb(e.data.muted)
      }
      devChannel.addEventListener('message', handler)
      onBeforeUnmount(() => devChannel.removeEventListener('message', handler))
    }
  }

  return {
    state: readonly(state),
    syncPoint,
    syncIdle,
    syncVideoPlay,
    syncVideoPause,
    syncVideoSeek,
    syncVideoVolume,
    syncVideoMute,
    onSyncPoint,
    onSyncIdle,
    onSyncVideoPlay,
    onSyncVideoPause,
    onSyncVideoSeek,
    onSyncVideoVolume,
    onSyncVideoMute
  }
}
