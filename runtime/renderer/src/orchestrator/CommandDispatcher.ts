import type { BindingsConfig, Command, MacroStep } from '@shared/types'
import { useDeviceStore } from '../stores/device'
import { getAction, type ActionResult } from './actions'
import { resolveVars, type VarContext } from './varSubst'

/**
 * CommandDispatcher：消化 bindings.json 的指令分发器。
 *
 * 流程：
 *   1. 接收一条 cmd（type/payload）
 *   2. 在 bindings 里找匹配的 binding（按 on 字段精确匹配第一个）
 *   3. 若无匹配，但 cmd.type 是 cmd.macro 或 cmd.scenario.<name>，按 macro 处理
 *   4. 替换 params 中的 $payload.* → 执行 action
 *   5. action 是 macro：递归展开 steps（支持 args）
 *   6. action 是 system.*：通过桥接转给主进程
 *   7. 其他：通过 actions 注册表查表执行
 *
 * 防抱死：限制 macro 展开最大深度（防止循环引用）。
 */
const MACRO_MAX_DEPTH = 8

export class CommandDispatcher {
  constructor(private bindings: BindingsConfig) {}

  setBindings(b: BindingsConfig) {
    this.bindings = b
  }

  async handle(cmd: Command): Promise<ActionResult> {
    // 1. 显式 cmd.macro
    if (cmd.type === 'cmd.macro') {
      const name = (cmd.payload as { name?: string } | undefined)?.name
      const args = (cmd.payload as { args?: Record<string, unknown> } | undefined)?.args ?? {}
      if (!name) return { ok: false, error: 'cmd.macro missing name' }
      return this.runMacro(name, args, cmd, 0)
    }

    // 2. 隐式 cmd.scenario.<name>（语法糖）
    if (cmd.type.startsWith('cmd.scenario.')) {
      const name = 'scenario.' + cmd.type.slice('cmd.scenario.'.length)
      return this.runMacro(name, (cmd.payload as Record<string, unknown>) ?? {}, cmd, 0)
    }

    // 3. 走 bindings 表
    const binding = this.bindings.bindings?.find((b) => b.on === cmd.type)
    if (binding) {
      const params = this.buildParams(binding.params ?? {}, cmd, undefined)
      return this.runAction(binding.do, params, cmd, 0)
    }

    return { ok: false, error: `no binding for ${cmd.type}` }
  }

  // ============ 内部 ============

  private async runMacro(
    name: string,
    args: Record<string, unknown>,
    origin: Command,
    depth: number
  ): Promise<ActionResult> {
    if (depth >= MACRO_MAX_DEPTH) {
      return { ok: false, error: `macro depth exceeded: ${name}` }
    }
    const macro = this.bindings.macros?.[name]
    if (!macro) return { ok: false, error: `macro not found: ${name}` }

    const results: ActionResult[] = []
    for (const step of macro.steps) {
      const r = await this.runStep(step, origin, args, depth + 1)
      results.push(r)
      if (!r.ok) {
        return { ok: false, error: `macro ${name} step ${step.do}: ${r.error}` }
      }
    }
    return { ok: true, data: { steps: results.length } }
  }

  private async runStep(
    step: MacroStep,
    origin: Command,
    args: Record<string, unknown>,
    depth: number
  ): Promise<ActionResult> {
    const params = this.buildParams(step.params ?? {}, origin, args)
    return this.runAction(step.do, params, origin, depth)
  }

  /** params 内的占位符替换 */
  private buildParams(
    rawParams: Record<string, unknown>,
    origin: Command,
    args?: Record<string, unknown>
  ): Record<string, unknown> {
    const ctx: VarContext = {
      payload: (origin.payload as Record<string, unknown>) ?? {},
      args: args ?? {},
      device: this.deviceCtx()
    }
    return resolveVars(rawParams, ctx)
  }

  private deviceCtx(): Record<string, unknown> {
    const d = useDeviceStore().boot
    if (!d) return {}
    return {
      deviceId: d.deviceId,
      displayId: d.displayId,
      runtimeVersion: d.runtimeVersion
    }
  }

  /** 真正执行一个 action（含 macro 嵌套与 system.* 转发） */
  private async runAction(
    actionName: string,
    params: Record<string, unknown>,
    origin: Command,
    depth: number
  ): Promise<ActionResult> {
    // 嵌套 macro
    if (actionName === 'macro') {
      const name = String(params.name ?? '')
      if (!name) return { ok: false, error: 'macro action missing name' }
      const macroArgs = (params.args as Record<string, unknown>) ?? {}
      return this.runMacro(name, macroArgs, origin, depth)
    }

    // 系统级转发主进程并等待结果
    if (actionName.startsWith('system.')) {
      const r = await window.exhibit.runSystemAction(actionName, params)
      return r.ok
        ? { ok: true, data: r.data }
        : { ok: false, error: r.error ?? 'system action failed' }
    }

    // 注册表
    const handler = getAction(actionName)
    if (!handler) return { ok: false, error: `unknown action: ${actionName}` }
    try {
      const r = await handler({ origin, params })
      return r
    } catch (e) {
      return { ok: false, error: `action ${actionName} threw: ${(e as Error).message}` }
    }
  }
}
