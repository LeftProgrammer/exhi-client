import type { Command } from '@shared/types'
import { useCommandStore } from '../stores/command'
import { useSceneStore } from '../stores/scene'
import { useDeviceStore } from '../stores/device'

/**
 * SceneOrchestrator：渲染层指令调度。
 *
 * M2 阶段支持：cmd.gotoScene / cmd.reload / cmd.volume
 * M4 接入 bindings.json 真正的 CommandDispatcher，本类会被替代或瘦身。
 */
export class SceneOrchestrator {
  init(initialSceneId: string) {
    const sceneStore = useSceneStore()
    if (initialSceneId) sceneStore.switchTo(initialSceneId)

    window.exhibit.onCommand((cmd) => this.handle(cmd))

    // 周期性上报状态（30s 兜底，状态变化时另有触发）
    this.reportStatus()
    setInterval(() => this.reportStatus(), 30_000)

    // 切场景时立即上报
    sceneStore.$subscribe(() => this.reportStatus())
  }

  handle(cmd: Command) {
    useCommandStore().push(cmd)
    window.exhibit.log('debug', `收到指令: ${cmd.type}`, cmd.payload)

    switch (cmd.type) {
      case 'cmd.gotoScene': {
        const sceneId = (cmd.payload as { sceneId?: string } | undefined)?.sceneId
        if (sceneId) useSceneStore().switchTo(sceneId)
        break
      }
      case 'cmd.reload': {
        // 简单实现：重新载入当前场景
        const cur = useSceneStore().currentSceneId
        if (cur) {
          useSceneStore().switchTo(cur)
        }
        break
      }
      case 'cmd.volume': {
        // 系统音量需要主进程通过 PowerShell/nircmd 调节，M2 这里仅记录与上报
        const value = (cmd.payload as { value?: number } | undefined)?.value
        if (typeof value === 'number') {
          window.exhibit.log('info', `M2 暂不真改系统音量，仅记录 value=${value}`)
        }
        break
      }
      default:
        window.exhibit.log('warn', `M2 暂未处理的指令: ${cmd.type}`)
    }
  }

  private reportStatus() {
    const device = useDeviceStore()
    const scene = useSceneStore()
    if (!device.boot) return
    window.exhibit.reportStatus({
      deviceId: device.boot.deviceId,
      displays: [
        {
          id: device.boot.displayId,
          sceneId: scene.currentSceneId,
          playState: scene.currentSceneId ? 'playing' : 'stopped'
        }
      ]
    })
  }
}
