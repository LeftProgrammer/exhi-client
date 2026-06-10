/**
 * 浏览器模式 UEC WebSocket 回退封装。
 *
 * Electron 环境下主进程负责 WS 通信，渲染层通过 exhibitBridge 收发。
 * 浏览器 dev 模式没有 exhibitBridge，每个屏直接连 UEC WS，
 * 本封装提供：连接、心跳、重连、消息解析、指令分发。
 *
 * 用法（在 useControl / App.vue 里）：
 *   const fallback = useBrowserFallback()
 *   fallback.start({
 *     hubId: 'xxx',
 *     onDispatch: (cmd, payload) => rc.dispatch(cmd, payload)
 *   })
 */

const DEFAULT_WS_URL = 'wss://www.zzqxs.cn/uec/UECServer/ws/webSocketServer.do'

export interface BrowserFallbackOptions {
  hubId: string
  wsUrl?: string
  /** 连接成功回调 */
  onConnect?: () => void
  /** 连接断开回调 */
  onDisconnect?: () => void
  /** 收到消息后分发回调 */
  onDispatch?: (cmd: string, payload: Record<string, unknown>) => void
}

export function useBrowserFallback() {
  let ws: WebSocket | null = null
  let heartbeatTimer: number | null = null

  function start(opts: BrowserFallbackOptions) {
    const url = `${opts.wsUrl ?? DEFAULT_WS_URL}?id=${encodeURIComponent(opts.hubId)}`
    const newWs = new WebSocket(url)
    ws = newWs

    newWs.onopen = () => {
      console.log(`[BrowserFallback] WS connected, hubId=${opts.hubId}`)
      heartbeatTimer = window.setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send('heartbeat')
      }, 20000)
      opts.onConnect?.()
    }

    newWs.onmessage = (event) => {
      if (!event.data || event.data === 'heartbeat') return
      try {
        const data = JSON.parse(event.data)
        let msg: unknown
        if (typeof data.msg === 'string') {
          msg = JSON.parse(data.msg)
        } else if (data.msg && typeof data.msg === 'object') {
          msg = data.msg
        } else {
          msg = data
        }
        if (msg && typeof msg === 'object' && (msg as Record<string, unknown>).cmd) {
          const payload = msg as Record<string, unknown>
          console.log('[BrowserFallback] dispatch cmd:', payload.cmd, payload)
          opts.onDispatch?.(String(payload.cmd), payload)
        }
      } catch (e) {
        console.warn('[BrowserFallback] WS message parse failed:', e)
      }
    }

    newWs.onerror = (e) => {
      console.error('[BrowserFallback] WS error:', e)
    }

    newWs.onclose = () => {
      console.log('[BrowserFallback] WS closed, reconnect in 3s')
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      if (ws === newWs) {
        opts.onDisconnect?.()
        setTimeout(() => start(opts), 3000)
      }
    }
  }

  /** 发送消息（仅当 WS open 时生效） */
  function send(data: unknown) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }

  /** 主动关闭连接并停止重连 */
  function stop() {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (ws) {
      const old = ws
      ws = null
      old.close()
    }
  }

  return { start, send, stop }
}
