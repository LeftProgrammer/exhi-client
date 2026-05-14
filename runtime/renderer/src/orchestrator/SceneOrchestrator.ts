import type { BindingsConfig, Command } from '@shared/types'
import { useCommandStore } from '../stores/command'
import { useSceneStore } from '../stores/scene'
import { useDeviceStore } from '../stores/device'
import { CommandDispatcher } from './CommandDispatcher'
import { makeProjectHost } from './actions'
import { resolvePkgUrl } from '../utils/url'

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

    // 加载项目包 actions.js（如有）：项目包扩展自定义 Action
    await this.loadProjectActions()

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

  /**
   * 加载项目包根目录的 actions.js（如有），让项目包扩展自定义 Action。
   *
   * 项目包写法：
   *   // actions.js
   *   export default function register(exhi) {
   *     exhi.registerAction('mypkg.fancy', async ({params}) => { ... })
   *   }
   *
   * 通过 exhi-pkg:// 协议加载（与 web 内容用同一套），缺失则静默跳过。
   */
  private async loadProjectActions() {
    try {
      // 先探测是否存在（用 fetch 读 HEAD 之类不可靠，直接用 readPackageFile 试）
      await window.exhibit.readPackageFile('actions.js')
    } catch {
      // 没有就跳过
      return
    }
    try {
      // 用 exhi-pkg:// URL 动态 import；@vite-ignore 让 Vite 不静态分析
      const url = resolvePkgUrl('actions.js')
      const mod = (await import(/* @vite-ignore */ url)) as {
        default?: (host: ReturnType<typeof makeProjectHost>) => void | Promise<void>
      }
      if (typeof mod.default === 'function') {
        await mod.default(makeProjectHost())
        window.exhibit.log('info', '项目包 actions.js 加载完成')
      } else {
        window.exhibit.log('warn', '项目包 actions.js 缺少 default export')
      }
    } catch (e) {
      window.exhibit.log('error', '项目包 actions.js 加载失败', (e as Error).message)
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
