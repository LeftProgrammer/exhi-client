import { ref, onBeforeUnmount } from 'vue'
import { useScreenSync } from './useScreenSync'

/**
 * 视频控制 composable：封装中控同步指令的响应逻辑。
 *  - 播放/暂停/快进快退/倍速/音量/静音/长按 scrub。
 *  - 中控操作时的玻璃态提示（showTip）。
 *  - 原生 controls 的 hover 显隐、点击 toggle。
 *  - 点位切换/待机时自动复位视频状态。
 *
 * 由于 useScreenSync 的 onSyncXxx 通过 onBeforeUnmount 自动解绑，
 * 本 composable 必须在组件 setup 的同步上下文中调用。
 * 同一时刻页面只挂载一个视频（v-if 控制），故多处使用不会互相干扰。
 */
export function useVideoControl() {
  const {
    onSyncPoint,
    onSyncIdle,
    onSyncVideoPlay,
    onSyncVideoPause,
    onSyncVideoSeek,
    onSyncVideoSpeed,
    onSyncVideoVolume,
    onSyncVideoMute,
    onSyncVideoScrub
  } = useScreenSync()

  const videoRef = ref<HTMLVideoElement | null>(null)
  const isPaused = ref(true)
  const showControls = ref(false)
  const isHoveringVideo = ref(false)
  let controlsTimer: ReturnType<typeof setTimeout> | null = null

  // 中控操作提示（玻璃态浮窗）
  const tipState = ref({ show: false, text: '' })
  let tipTimer: ReturnType<typeof setTimeout> | null = null

  function showTip(text: string) {
    tipState.value = { show: true, text }
    if (tipTimer) clearTimeout(tipTimer)
    tipTimer = setTimeout(() => {
      tipState.value.show = false
    }, 1500)
  }

  function hideTip() {
    tipState.value.show = false
    if (tipTimer) {
      clearTimeout(tipTimer)
      tipTimer = null
    }
  }

  // 长按快进/快退：speed > 0 快进，speed < 0 快退，speed === 0 停止
  // 正向：用 playbackRate 正常倍速播放（画面流畅、有声）。
  // 反向：playbackRate 不支持负值，用降频 seek 回退（throttle 避免 seek 互相打断导致卡帧）。
  let rewindTimer: number | null = null
  let rewindLastTime = 0
  let wasPlayingBeforeScrub = false

  // 反向快退 seek 间隔（ms）；过小会让 seek 来不及完成导致卡帧
  const REWIND_STEP_MS = 100

  function stopRewind() {
    if (rewindTimer !== null) {
      clearInterval(rewindTimer)
      rewindTimer = null
    }
  }

  // 统一停止入口：清理快进倍速 + 反向定时器
  function stopVideoScrub() {
    stopRewind()
    const v = videoRef.value
    if (v && v.playbackRate !== 1) v.playbackRate = 1
  }

  // 点位切换/待机：复位视频状态
  onSyncPoint(() => {
    isPaused.value = true
    stopVideoScrub()
  })
  onSyncIdle(() => {
    isPaused.value = true
    stopVideoScrub()
  })

  onSyncVideoPlay(() => {
    const v = videoRef.value
    if (!v) return
    // 暂停后重新播放，自动恢复正常 1 倍速（无恢复按钮时的兜底）
    if (v.playbackRate !== 1) v.playbackRate = 1
    v.play()
    isPaused.value = false
  })

  onSyncVideoPause(() => {
    const v = videoRef.value
    if (!v) return
    v.pause()
    isPaused.value = true
  })

  // 快进/快退（offset 单位：秒，正数快进，负数快退）
  onSyncVideoSeek((offset) => {
    const v = videoRef.value
    if (!v || !offset) return
    let target = v.currentTime + offset
    if (isFinite(v.duration) && v.duration > 0) {
      target = Math.min(v.duration - 0.1, target)
    }
    v.currentTime = Math.max(0, target)
    showTip(offset > 0 ? `快进 ${offset} 秒` : `后退 ${Math.abs(offset)} 秒`)
  })

  // 播放倍速（rate 如 0.5、1、1.5、2）
  onSyncVideoSpeed((rate) => {
    const v = videoRef.value
    if (!v) return
    v.playbackRate = rate
    showTip(`倍速 ${rate}x`)
  })

  // 音量调节（delta 单位：0~1，正数加大，负数减小）
  onSyncVideoVolume((delta) => {
    const v = videoRef.value
    if (!v) return
    v.volume = Math.max(0, Math.min(1, v.volume + delta))
    const pct = Math.round(v.volume * 100)
    showTip(`音量 ${pct}%`)
  })

  // 静音/恢复
  onSyncVideoMute((muted) => {
    const v = videoRef.value
    if (!v) return
    v.muted = muted
    showTip(muted ? '🔇 静音' : '🔊 恢复声音')
  })

  onSyncVideoScrub((speed) => {
    const v = videoRef.value
    if (!v) return

    // 任何新指令先停掉上一次的 scrub 状态
    stopVideoScrub()

    if (speed === 0) {
      v.playbackRate = 1
      if (wasPlayingBeforeScrub) {
        v.play()
        isPaused.value = false
      } else {
        v.pause()
        isPaused.value = true
      }
      hideTip()
      return
    }

    wasPlayingBeforeScrub = !v.paused
    showTip(speed > 0 ? `${speed}x 快进中` : `${Math.abs(speed)}x 快退中`)

    if (speed > 0) {
      // 正向快进：倍速正常播放，暂停状态下保持暂停
      v.playbackRate = Math.min(16, speed)
      if (wasPlayingBeforeScrub) {
        v.play()
      }
      isPaused.value = false
    } else {
      // 反向快退：保持原有播放/暂停状态，定时回退 currentTime
      isPaused.value = false
      rewindLastTime = performance.now()
      rewindTimer = window.setInterval(() => {
        const ve = videoRef.value
        if (!ve) {
          stopRewind()
          return
        }
        const now = performance.now()
        const dt = (now - rewindLastTime) / 1000
        rewindLastTime = now
        const target = ve.currentTime + dt * speed // speed < 0，向前回退
        if (target <= 0) {
          ve.currentTime = 0
          if (!wasPlayingBeforeScrub) {
            ve.pause()
            isPaused.value = true
          }
          stopRewind()
          return
        }
        ve.currentTime = target
      }, REWIND_STEP_MS)
    }
  })

  function onVideoMouseEnter() {
    isHoveringVideo.value = true
    showControls.value = true
    if (controlsTimer) {
      clearTimeout(controlsTimer)
      controlsTimer = null
    }
  }

  function onVideoMouseLeave() {
    isHoveringVideo.value = false
    showControls.value = false
  }

  function toggleVideo() {
    const v = videoRef.value
    if (!v) return
    if (v.paused) {
      v.play()
      isPaused.value = false
    } else {
      v.pause()
      isPaused.value = true
    }
  }

  onBeforeUnmount(() => stopVideoScrub())

  return {
    videoRef,
    isPaused,
    showControls,
    tipState,
    showTip,
    hideTip,
    onVideoMouseEnter,
    onVideoMouseLeave,
    toggleVideo,
    stopVideoScrub
  }
}
