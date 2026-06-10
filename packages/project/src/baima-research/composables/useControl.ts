import { useRemoteControl } from '@shared/composables/useRemoteControl'
import { useBridge } from '@shared/composables/useBridge'
import { useScreenSync } from './useScreenSync'

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
      if (!displayId) return

      // 所有屏都注册 home：中控群发 home 时任意屏都能响应
      rc.onCommand('home', () => syncIdle())

      // 只有 main 屏注册 point/goto/video 指令
      // 中控只给 main 发这些指令，main 通过 useScreenSync 内部广播到副屏
      if (displayId === 'main') {
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
    }
  }
}
