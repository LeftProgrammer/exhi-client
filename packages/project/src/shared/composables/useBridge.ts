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
  designBase?: { width: number; height: number }
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
    exhibit?: {
      onBridgeEventFromMain(
        cb: (ev: { name: string; payload?: unknown; targetDisplayId?: string }) => void
      ): () => void
    }
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

let bridgeWarned = false

/**
 * 模块级共享状态：bridge 信息按窗口全局唯一，所有 useBridge 实例共享同一份。
 *
 * 之前 ready/info 是每个 useBridge() 实例各自的局部 ref，且仅在自己的 onMounted
 * 里填充。若在组件已 mounted 之后（如另一个 onMounted 回调里）再调用 useBridge()，
 * 新实例注册的 onMounted 不会执行，其 info 永远为 null —— 导致依赖 info.displayId
 * 的逻辑（如 useControl.setupCommands）误判而提前 return。改为模块级单例后，任何
 * 时机调用 useBridge() 都能读到已解析的 info。
 */
const sharedReady = ref(false)
const sharedInfo = ref<BridgeInfo | null>(null)
let initStarted = false

export function useBridge(): UseBridgeReturn {
  const ready = sharedReady
  const info = sharedInfo
  const subscriptions: Array<() => void> = []

  onMounted(async () => {
    if (!window.exhibitBridge) {
      // dev 模式 / 浏览器直接访问：bridge.js 未注入。
      // 不覆盖 CSS 变量，让 reset.scss 的 :root 默认值自然生效。
      if (!bridgeWarned) {
        bridgeWarned = true
        console.warn('[useBridge] window.exhibitBridge 未就绪，使用 reset.scss 默认值')
      }
      return
    }
    // 只初始化一次：bridge 信息全局唯一，避免多实例重复 getInfo
    if (initStarted || ready.value) return
    initStarted = true
    try {
      info.value = await window.exhibitBridge.getInfo()
      ready.value = true
      // 将 designBase 注入为 CSS 变量，供 design.scss 的 h()/w() 使用
      if (info.value?.designBase) {
        const { width, height } = info.value.designBase
        document.documentElement.style.setProperty('--design-w', String(width))
        document.documentElement.style.setProperty('--design-h', String(height))
      }
    } catch (e) {
      // 失败允许后续实例重试
      initStarted = false
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
