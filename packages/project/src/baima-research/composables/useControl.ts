import { useRemoteControl } from '@shared/composables/useRemoteControl'
import { useBridge } from '@shared/composables/useBridge'
import { useScreenSync, setSyncForwarder } from './useScreenSync'
import { useRouter } from 'vue-router'

const HUB_URL = 'wss://www.zzqxs.cn/uec/UECServer/ws/webSocketServer.do'

/** 路由名 → UEC hubId 映射（浏览器模式各屏用各自 id 连 WS） */
const ROUTE_HUB_MAP: Record<string, string> = {
  home: 'research-main',
  'top-left': 'research-tl',
  'bottom-left': 'research-bl',
  'top-right': 'research-tr',
  'bottom-right': 'research-br'
}

/** 4 个副屏的 hubId（主屏收到中控指令后转发到这些目标） */
const SUB_HUB_IDS = ['research-tl', 'research-bl', 'research-tr', 'research-br']

/**
 * 白马科研 中控通信封装。
 *
 * 基于 useRemoteControl（shared 通用指令注册器），
 * 支持中控指令控制点位切换、待机、视频播放/暂停/快进/快退/音量/静音。
 *
 * 架构（多设备分布式部署，每屏一台设备，各自连 WS）：
 *  - 中控只把指令发给主屏（hubId=research-main）。
 *  - 每个屏都注册全部指令处理；handler 调用 syncXxx 把指令“应用到本设备视图”。
 *  - 主屏额外注入 forwarder：收到指令后转发给 4 个副屏设备（syncXxx → broadcast → forwarder）。
 *      · Electron：emit('hub:send', { to: subHubId, msg })，由主进程 ws.sendApp 经 UEC 转发。
 *      · 浏览器 dev：直接用本屏的原生 WebSocket ws.send({ to: subHubId, msg })。
 *  - 副屏不注入 forwarder，收到主屏转发的指令后仅应用到本设备视图，不再二次转发。
 *
 * 接收侧：
 *  - Electron：主进程 WS → hub:command → useRemoteControl 分发。
 *  - 浏览器 dev：window.exhibitBridge 不存在，本屏直接连 UEC WS，收到消息 rc.dispatch。
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
  const { info, emit } = useBridge()
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

      // 每个屏都注册全部指令：handler 调用 syncXxx 把指令应用到本设备视图。
      // 主屏会经 forwarder 把指令转发给副屏，副屏的 forwarder 为 null 不再二次转发。
      rc.onCommand('home', () => syncIdle())
      rc.onCommand('point', (p) => {
        const id = p.id as string
        if (id) syncPoint(id)
      })
      rc.onCommand('goto', (p) => {
        const id = p.id as string
        if (id) syncPoint(id)
      })
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

      if (!isBrowserDev) {
        // Electron：主进程 WS 已连，渲染层经 hub:command 收指令。
        // 主屏注入 forwarder，通过 hub:send 把指令转发给 4 个副屏设备。
        if (isMain) {
          setSyncForwarder((cmd) => {
            for (const subId of SUB_HUB_IDS) emit('hub:send', { to: subId, msg: cmd })
          })
        }
        return
      }

      // 浏览器 dev：每个屏各自连 UEC WS（hubId 由路由名映射）。
      // 主屏连上后注入基于本屏 WebSocket 的 forwarder。
      const hubId = ROUTE_HUB_MAP[String(routeName ?? 'home')] ?? 'research-main'
      startBrowserWsFallback(hubId, isMain)
    }
  }

  function startBrowserWsFallback(hubId: string, isMain: boolean) {
    const wsUrl = `${HUB_URL}?id=${encodeURIComponent(hubId)}`

    const ws = new WebSocket(wsUrl)
    let heartbeatTimer: number | null = null

    // 主屏：注入基于本屏 WebSocket 的转发器。
    // syncXxx → broadcast → forwarder(cmd) 时，把指令发给 4 个副屏 hubId。
    // 既覆盖“中控指令到主屏”的转发，也覆盖“主屏本地用户操作”触发的同步。
    if (isMain) {
      setSyncForwarder((cmd) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const payload = JSON.stringify(cmd)
        for (const subId of SUB_HUB_IDS) {
          ws.send(JSON.stringify({ to: subId, msg: payload }))
        }
        console.log('[useControl] 主屏已转发指令给副屏:', SUB_HUB_IDS, cmd)
      })
    }

    ws.onopen = () => {
      console.log('[useControl] Browser WS connected, id=' + hubId)
      heartbeatTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('heartbeat')
      }, 20000)
    }

    ws.onmessage = (event) => {
      if (event.data === 'heartbeat') return
      console.log('[useControl] Browser WS raw msg:', event.data)
      try {
        const data = JSON.parse(event.data)
        let msg
        if (typeof data.msg === 'string') {
          msg = JSON.parse(data.msg)
        } else if (data.msg && typeof data.msg === 'object') {
          msg = data.msg
        } else {
          msg = data
        }
        console.log('[useControl] Browser WS parsed cmd:', msg.cmd, msg)
        // 应用到本屏（主屏更新自身视图并经 forwarder 转发；副屏仅更新自身视图）
        if (msg && msg.cmd) rc.dispatch(msg.cmd, msg)
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
      setTimeout(() => startBrowserWsFallback(hubId, isMain), 3000)
    }
  }
}
