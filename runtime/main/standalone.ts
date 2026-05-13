import type { EventEmitter } from 'node:events'
import type { BindingsConfig, Command, MacroStep } from '@shared/types'
import { logger } from './logger'

/**
 * Standalone 调度：客户端不连中控时执行 bindings.json 中 standalone.onStartup。
 *
 * 实现方式：把 macro steps 包装成 cmd.macro 风格指令通过事件总线发出，
 * 复用统一的指令处理路径，避免出现"两种执行入口"。
 *
 * M2 简化：onStartup 步骤如果是 scene.switch / system.setVolume 这种简单 Action，
 * 我们暂时直接合成对应 cmd.gotoScene / cmd.volume 派发；
 * M4 接入 CommandDispatcher 后改成 bindings 真正执行。
 */
export class StandaloneScheduler {
  constructor(
    private bus: EventEmitter,
    private bindings: BindingsConfig
  ) {}

  runOnStartup() {
    const steps = this.bindings.standalone?.onStartup
    if (!steps?.length) {
      logger.info('Standalone: 无 onStartup 步骤')
      return
    }
    logger.info(`Standalone: 执行 ${steps.length} 个 onStartup 步骤`)
    for (const step of steps) {
      const cmd = this.stepToCommand(step)
      if (cmd) this.bus.emit('command', cmd)
    }
  }

  private stepToCommand(step: MacroStep): Command | null {
    const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const base = { id, ts: Date.now(), source: 'local' as const }

    switch (step.do) {
      case 'scene.switch':
        return { ...base, type: 'cmd.gotoScene', payload: step.params }
      case 'scene.switchAll':
        return { ...base, type: 'cmd.gotoScene', payload: { ...step.params, display: undefined } }
      case 'system.setVolume':
        return { ...base, type: 'cmd.volume', payload: step.params }
      default:
        logger.warn(`Standalone: M2 暂不支持 step.do=${step.do}（M4 接入 bindings 后支持）`)
        return null
    }
  }
}
