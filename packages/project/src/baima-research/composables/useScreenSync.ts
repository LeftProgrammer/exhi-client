import { onBeforeUnmount, ref, readonly } from 'vue'

export interface ScreenState {
  /** 当前选中的工程点位 id；null 表示待机 */
  activePointId: string | null
}

const state = ref<ScreenState>({
  activePointId: null
})

type SyncMsg =
  | { type: 'research:point'; id: string }
  | { type: 'research:idle' }
  | { type: 'research:video-play' }
  | { type: 'research:video-pause' }
  | { type: 'research:video-seek'; offset: number }
  | { type: 'research:video-speed'; rate: number }
  | { type: 'research:video-volume'; delta: number }
  | { type: 'research:video-mute'; muted: boolean }

/**
 * 架构（多设备分布式部署）：
 *  - 每台设备（主屏 + 4 副屏）各自运行一个实例，各自连 WS（hubId 区分）。
 *  - 中控只把指令发给主屏；主屏收到后通过 forwarder 转发给 4 个副屏设备。
 *  - 各设备收到指令后调用 syncXxx 把指令"应用到本设备视图"。
 *
 * 本模块只负责"本设备内"的同步分发：
 *  - point/idle 维护共享 state（主屏视图 watch state，副屏视图也可读）。
 *  - 所有指令通过渲染进程内的 EventTarget 总线投递给 onSyncXxx 监听者
 *    （副屏视图靠此驱动；视频类是命令式动作，必须走事件）。
 * 跨设备转发不在此处，由 useControl 注入 forwarder 完成（仅主屏注入）。
 */
const bus = new EventTarget()

/** 跨设备转发器：由 useControl 在确认本屏为主屏后注入；非主屏为 null（不转发） */
let forwarder: ((cmd: Record<string, unknown>) => void) | null = null

/** 注入/清除主屏转发器（Electron 走 hub:send，浏览器走 ws.send，由调用方决定） */
export function setSyncForwarder(fn: ((cmd: Record<string, unknown>) => void) | null): void {
  forwarder = fn
}

/** 把内部 SyncMsg 转换成中控/转发用的 { cmd, ... } 指令 */
function msgToCmd(msg: SyncMsg): Record<string, unknown> {
  switch (msg.type) {
    case 'research:point':
      return { cmd: 'point', id: msg.id }
    case 'research:idle':
      return { cmd: 'home' }
    case 'research:video-play':
      return { cmd: 'video-play' }
    case 'research:video-pause':
      return { cmd: 'video-pause' }
    case 'research:video-seek':
      return { cmd: 'video-seek', offset: msg.offset }
    case 'research:video-speed':
      return { cmd: 'video-speed', rate: msg.rate }
    case 'research:video-volume':
      return { cmd: 'video-volume', delta: msg.delta }
    case 'research:video-mute':
      return { cmd: 'video-mute', muted: msg.muted }
  }
}

/** 订阅本地总线的某类同步消息（自动在组件卸载时解绑） */
function subscribe<T extends SyncMsg['type']>(
  type: T,
  cb: (msg: Extract<SyncMsg, { type: T }>) => void
): void {
  const handler = (e: Event) => {
    const msg = (e as CustomEvent<SyncMsg>).detail
    if (msg.type === type) cb(msg as Extract<SyncMsg, { type: T }>)
  }
  bus.addEventListener('sync', handler)
  onBeforeUnmount(() => bus.removeEventListener('sync', handler))
}

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
  function broadcast(msg: SyncMsg) {
    // 本设备内投递：驱动本渲染进程内的 onSyncXxx 监听者（副屏视图靠此更新）
    bus.dispatchEvent(new CustomEvent('sync', { detail: msg }))
    // 跨设备转发：仅主屏注入了 forwarder，副屏为 null 不转发
    forwarder?.(msgToCmd(msg))
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

  /** 主屏：通知所有副屏设置播放倍速（rate 如 0.5、1、1.5、2） */
  function syncVideoSpeed(rate: number) {
    broadcast({ type: 'research:video-speed', rate })
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
    subscribe('research:point', (msg) => {
      state.value.activePointId = msg.id
      cb(msg.id)
    })
  }

  /** 副屏：监听返回待机 */
  function onSyncIdle(cb: () => void) {
    subscribe('research:idle', () => {
      state.value.activePointId = null
      cb()
    })
  }

  /** 副屏：监听视频播放指令 */
  function onSyncVideoPlay(cb: () => void) {
    subscribe('research:video-play', () => cb())
  }

  /** 副屏：监听视频暂停指令 */
  function onSyncVideoPause(cb: () => void) {
    subscribe('research:video-pause', () => cb())
  }

  /** 副屏：监听视频快进/快退指令 */
  function onSyncVideoSeek(cb: (offset: number) => void) {
    subscribe('research:video-seek', (msg) => cb(msg.offset))
  }

  /** 副屏：监听播放倍速指令 */
  function onSyncVideoSpeed(cb: (rate: number) => void) {
    subscribe('research:video-speed', (msg) => cb(msg.rate))
  }

  /** 副屏：监听音量调节指令 */
  function onSyncVideoVolume(cb: (delta: number) => void) {
    subscribe('research:video-volume', (msg) => cb(msg.delta))
  }

  /** 副屏：监听静音/恢复指令 */
  function onSyncVideoMute(cb: (muted: boolean) => void) {
    subscribe('research:video-mute', (msg) => cb(msg.muted))
  }

  return {
    state: readonly(state),
    syncPoint,
    syncIdle,
    syncVideoPlay,
    syncVideoPause,
    syncVideoSeek,
    syncVideoSpeed,
    syncVideoVolume,
    syncVideoMute,
    onSyncPoint,
    onSyncIdle,
    onSyncVideoPlay,
    onSyncVideoPause,
    onSyncVideoSeek,
    onSyncVideoSpeed,
    onSyncVideoVolume,
    onSyncVideoMute
  }
}
