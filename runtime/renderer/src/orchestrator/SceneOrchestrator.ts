import type { BindingsConfig, Command } from '@shared/types'
import { useCommandStore } from '../stores/command'
import { useSceneStore } from '../stores/scene'
import { useDeviceStore } from '../stores/device'
import { CommandDispatcher } from './CommandDispatcher'

/**
 * SceneOrchestrator：渲染层的指令入口。
 *
 * - 启动时切到默认场景
 * - 监听主进程下发的指令，交给 CommandDispatcher
 * - 监听 scene store 变化触发状态上报
 */
export class SceneOrchestrator {
  private dispatcher!: CommandDispatcher

  async init(initialSceneId: string) {
    const sceneStore = useSceneStore()

    // 加载 bindings.json 给 dispatcher
    const buf = await window.exhibit.readPackageFile('bindings.json')
    const bindings = JSON.parse(new TextDecoder().decode(buf)) as BindingsConfig
    this.dispatcher = new CommandDispatcher(bindings)

    if (initialSceneId) sceneStore.switchTo(initialSceneId)

    window.exhibit.onCommand((cmd) => this.handle(cmd))

    this.reportStatus()
    setInterval(() => this.reportStatus(), 30_000)
    sceneStore.$subscribe(() => this.reportStatus())
  }

  async handle(cmd: Command) {
    useCommandStore().push(cmd)
    window.exhibit.log('debug', `dispatcher 收到: ${cmd.type}`, cmd.payload)

    const result = await this.dispatcher.handle(cmd)
    if (!result.ok) {
      window.exhibit.log('warn', `指令处理失败: ${cmd.type} → ${result.error}`)
    }
  }

  private reportStatus() {
    const device = useDeviceStore()
    const scene = useSceneStore()
    if (!device.boot) return
    window.exhibit.reportStatus({
      displayId: device.boot.displayId,
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
