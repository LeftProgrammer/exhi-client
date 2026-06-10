import { useRemoteControl } from '@shared/composables/useRemoteControl'
import { useBridge } from '@shared/composables/useBridge'
import { useScreenSync } from './useScreenSync'
import { useRouter } from 'vue-router'

/**
 * 白马科研 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 支持中控指令控制点位切换、待机、视频播放/暂停/快进/快退/音量/静音。
 *
 * 架构（方案 1：中控只发主屏，内部广播同步副屏）：
 *  - 中控 WS 指令只发给 main 屏（通过 hub.json 中不同 id 区分）
 *  - main 收到 point/goto/video 指令后调用 useScreenSync，内部广播到 4 个副屏
 *  - 所有 5 个屏都注册 home（回待机），确保任意屏都能接收 home 指令
 *
 * 浏览器 dev 回退：
 *  - Electron 外直接访问 vite dev server 时，window.exhibitBridge 不存在
 *  - 此时直接创建原生 WebSocket 连 UEC，收到消息后通过 rc.dispatch 触发 handler
 *  - 和 Electron 环境行为一致，方便浏览器多标签页联动调试
 */
export function useControl() {
  const rc = useRemoteControl()
  const {
    syncPoint,
    syncIdle,
    syncVideoPlay,
    syncVideoPause,
    syncVideoSeek,
    syncVideoVolume,
    syncVideoMute
  } = useScreenSync()
  const { info } = useBridge()
  const router = useRouter()

  return {
    /** 向中控上报当前状态 */
    reportState(state: { pointId?: string | null; isStandby?: boolean }) {
      rc.send({ cmd: 'state', ...state })
    },

    /** 向指定设备发送控制消息（多屏互联） */
    sendTo(target: string, payload: unknown) {
      rc.sendTo(target, payload)
    },

    /** 注册中控指令接收处理（在 App.vue 初始化时调用）
     *  需等 bridge ready 后 info.displayId 就绪再调用
     */
    setupCommands() {
      const displayId = info.value?.displayId
      const isBrowserDev = typeof window !== 'undefined' && !window.exhibitBridge
      const routeName = isBrowserDev ? router.currentRoute.value.name : null
      const isMain = displayId === 'main' || (isBrowserDev && (routeName === 'home' || !routeName))

      if (!displayId && !isBrowserDev) return

      // 所有屏都注册 home：中控群发 home 时任意屏都能响应
      rc.onCommand('home', () => syncIdle())

      // 只有 main 屏注册 point/goto/video 指令
      // 中控只给 main 发这些指令，main 通过 useScreenSync 内部广播到副屏
      if (isMain) {
        rc.onCommand('point', (p) => {
          const id = p.id as string
          if (id) syncPoint(id)
        })

        rc.onCommand('goto', (p) => {
          const id = p.id as string
          if (id) syncPoint(id)
        })

        // 视频播放控制
        rc.onCommand('video-play', () => syncVideoPlay())
        rc.onCommand('video-pause', () => syncVideoPause())

        // 视频快进/快退（offset 单位：秒，正数快进，负数快退）
        rc.onCommand('video-seek', (p) => {
          const offset = Number(p.offset)
          if (!isNaN(offset)) syncVideoSeek(offset)
        })

        // 音量调节（delta 单位：0~1，正数加大，负数减小）
        rc.onCommand('video-volume', (p) => {
          const delta = Number(p.delta)
          if (!isNaN(delta)) syncVideoVolume(delta)
        })

        // 静音/恢复
        rc.onCommand('video-mute', (p) => {
          const muted = p.muted !== undefined ? Boolean(p.muted) : true
          syncVideoMute(muted)
        })
      }

      // 浏览器 dev 回退：直接连 UEC WS
      if (isBrowserDev && isMain) {
        startBrowserWsFallback()
      }
    }
  }

  function startBrowserWsFallback() {
    const HUB_URL = 'wss://www.zzqxs.cn/uec/UECServer/ws/webSocketServer.do'
    const urlParams = new URLSearchParams(window.location.search)
    const hubId = urlParams.get('hubId') || 'research-main'
    const wsUrl = `${HUB_URL}?id=${encodeURIComponent(hubId)}`

    const ws = new WebSocket(wsUrl)
    let heartbeatTimer: number | null = null

    ws.onopen = () => {
      console.log('[useControl] Browser WS connected, id=' + hubId)
      heartbeatTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('heartbeat')
        }
      }, 20000)
    }

    ws.onmessage = (event) => {
      if (event.data === 'heartbeat') return
      try {
        const data = JSON.parse(event.data)
        let msg
        if (typeof data.msg === 'string') {
          // UEC 标准格式：{ to: '...', msg: '{"cmd":"..."}' }
          msg = JSON.parse(data.msg)
        } else if (data.msg && typeof data.msg === 'object') {
          // UEC 格式但 msg 已经是对象
          msg = data.msg
        } else {
          // 服务端直接发的业务消息，无 msg 包装
          msg = data
        }
        if (msg && msg.cmd) {
          rc.dispatch(msg.cmd, msg)
        }
      } catch (e) {
        console.warn('[useControl] WS message parse failed:', e)
      }
    }

    ws.onerror = (e) => console.error('[useControl] Browser WS error:', e)

    ws.onclose = () => {
      console.log('[useControl] Browser WS closed, reconnect in 3s')
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      setTimeout(startBrowserWsFallback, 3000)
    }
  }
}
