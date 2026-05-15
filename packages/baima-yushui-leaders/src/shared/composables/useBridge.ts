import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'

/**
 * exhibitBridge 高层封装。
 *
 * 项目里组件用：
 *   const { info, goto, emit, on } = useBridge()
 *   goto('wall', 'opening-video')
 *   emit('analytics', { event: 'click' })
 *   on('scene:changed', payload => console.log(payload))
 *
 * 自动管理：
 *  - 等 bridge ready 后填充 info
 *  - 组件卸载时清理 on() 订阅
 */

export interface BridgeInfo {
  deviceId: string
  displayId: string
  runtimeVersion: string
  packageInfo?: { projectId: string; version: string }
}

interface ExhibitBridgeApi {
  getInfo(): Promise<BridgeInfo>
  dispatch(cmd: { type: string; payload?: unknown }): Promise<unknown>
  emit(name: string, payload?: unknown): void
  on(name: string, cb: (payload: unknown) => void): () => void
}

declare global {
  interface Window {
    exhibitBridge?: ExhibitBridgeApi
  }
}

export interface UseBridgeReturn {
  /** bridge 是否已就绪 */
  ready: Readonly<Ref<boolean>>
  /** 设备信息（ready 后填充） */
  info: Readonly<Ref<BridgeInfo | null>>
  /** 切某块屏的场景 */
  goto: (display: string, sceneId: string) => Promise<void>
  /** 切所有屏的场景 */
  gotoAll: (sceneId: string) => Promise<void>
  /** 重载当前屏 */
  reload: () => Promise<void>
  /** 调用宏 */
  macro: (name: string, args?: Record<string, unknown>) => Promise<void>
  /** 抛事件给客户端 / 中控 */
  emit: (name: string, payload?: unknown) => void
  /** 订阅客户端事件（自动 onBeforeUnmount 解除） */
  on: (name: string, cb: (payload: unknown) => void) => void
  /** 派发任意 cmd（高阶用法） */
  dispatch: (cmd: { type: string; payload?: unknown }) => Promise<unknown>
}

export function useBridge(): UseBridgeReturn {
  const ready = ref(false)
  const info = ref<BridgeInfo | null>(null)
  const subscriptions: Array<() => void> = []

  onMounted(async () => {
    if (!window.exhibitBridge) {
      // dev 模式直接刷新浏览器 / bridge.js 未注入：留 null
      console.warn('[useBridge] window.exhibitBridge 未就绪')
      return
    }
    try {
      info.value = await window.exhibitBridge.getInfo()
      ready.value = true
    } catch (e) {
      console.error('[useBridge] getInfo 失败', e)
    }
  })

  onBeforeUnmount(() => {
    while (subscriptions.length) {
      const off = subscriptions.pop()
      try {
        off?.()
      } catch {
        /* noop */
      }
    }
  })

  function dispatch(cmd: { type: string; payload?: unknown }): Promise<unknown> {
    if (!window.exhibitBridge) {
      console.warn('[useBridge] dispatch 跳过（bridge 未就绪）:', cmd.type)
      return Promise.resolve()
    }
    return window.exhibitBridge.dispatch(cmd)
  }

  return {
    ready: readonly(ready),
    info: readonly(info),

    goto: (display, sceneId) =>
      dispatch({ type: 'cmd.gotoScene', payload: { display, sceneId } }) as Promise<void>,

    gotoAll: (sceneId) =>
      dispatch({ type: 'cmd.gotoScene', payload: { sceneId } }) as Promise<void>,

    reload: () => dispatch({ type: 'cmd.reload' }) as Promise<void>,

    macro: (name, args) =>
      dispatch({ type: 'cmd.macro', payload: { name, args } }) as Promise<void>,

    emit: (name, payload) => {
      if (!window.exhibitBridge) return
      window.exhibitBridge.emit(name, payload)
    },

    on: (name, cb) => {
      if (!window.exhibitBridge) return
      const off = window.exhibitBridge.on(name, cb)
      subscriptions.push(off)
    },

    dispatch
  }
}
