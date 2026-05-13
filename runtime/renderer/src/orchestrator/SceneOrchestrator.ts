import type { Command } from '@shared/types'
import { useSceneStore } from '../stores/scene'

/**
 * SceneOrchestrator：场景调度。
 * M1 版本仅实现 cmd.gotoScene → scene.switch 的最小路径。
 * M4 会接入 bindings.json + CommandDispatcher 做完整的指令路由。
 */
export class SceneOrchestrator {
  init(initialSceneId: string) {
    const scene = useSceneStore()
    if (initialSceneId) scene.switchTo(initialSceneId)

    // 接收主进程转发的指令
    window.exhibit.onCommand((cmd) => this.handle(cmd))
  }

  handle(cmd: Command) {
    window.exhibit.log('info', `收到指令: ${cmd.type}`, cmd.payload)
    switch (cmd.type) {
      case 'cmd.gotoScene': {
        const sceneId = (cmd.payload as { sceneId?: string } | undefined)?.sceneId
        if (sceneId) useSceneStore().switchTo(sceneId)
        break
      }
      // 其他指令在 M4 接入
      default:
        window.exhibit.log('warn', `M1 暂未处理的指令: ${cmd.type}`)
    }
  }
}
