import type { Command } from '@shared/types'
import { useSceneStore } from '../stores/scene'
import { useDeviceStore } from '../stores/device'

/**
 * 内置 Action 注册表：纯渲染层动作。
 * 系统级动作（system.*）在主进程实现，渲染层不直接处理；
 * 但 dispatcher 收到 system.* 时会通过 IPC 通知主进程（M4.3+）。
 */

export interface ActionContext {
  /** 触发本动作的指令（可能为合成指令，如 macro 展开后的步骤） */
  origin: Command
  /** 已替换变量后的 params */
  params: Record<string, unknown>
}

export type ActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string }

export type ActionHandler = (ctx: ActionContext) => Promise<ActionResult> | ActionResult

const registry: Record<string, ActionHandler> = {}

export function registerAction(name: string, handler: ActionHandler) {
  registry[name] = handler
}

export function getAction(name: string): ActionHandler | undefined {
  return registry[name]
}

export function listActions(): string[] {
  return Object.keys(registry)
}

// ============ 内置 Actions（渲染层） ============

registerAction('scene.switch', ({ params }) => {
  const sceneId = String(params.sceneId ?? '')
  const display = params.display as string | undefined
  if (!sceneId) return { ok: false, error: 'missing sceneId' }
  const device = useDeviceStore()
  // 若指定 display 且不是当前屏，跳过（不是错误，主进程已按 display 路由）
  if (display && device.boot && display !== device.boot.displayId) {
    return { ok: true, data: { skipped: 'not-target-display' } }
  }
  const ok = useSceneStore().switchTo(sceneId)
  return ok ? { ok: true } : { ok: false, error: 'scene not found: ' + sceneId }
})

registerAction('scene.switchAll', ({ params }) => {
  const sceneId = String(params.sceneId ?? '')
  if (!sceneId) return { ok: false, error: 'missing sceneId' }
  const ok = useSceneStore().switchTo(sceneId)
  return ok ? { ok: true } : { ok: false, error: 'scene not found: ' + sceneId }
})

registerAction('scene.reload', () => {
  const cur = useSceneStore().currentSceneId
  if (!cur) return { ok: false, error: 'no current scene' }
  useSceneStore().switchTo(cur)
  return { ok: true }
})

registerAction('renderer.play', () => {
  const v = document.querySelector<HTMLMediaElement>('.scene-stage video')
  if (!v) return { ok: false, error: 'no video on stage' }
  v.play().catch(() => undefined)
  return { ok: true }
})

registerAction('renderer.pause', () => {
  const v = document.querySelector<HTMLMediaElement>('.scene-stage video')
  if (!v) return { ok: false, error: 'no video on stage' }
  v.pause()
  return { ok: true }
})

registerAction('renderer.seek', ({ params }) => {
  const v = document.querySelector<HTMLMediaElement>('.scene-stage video')
  if (!v) return { ok: false, error: 'no video on stage' }
  const time = Number(params.time ?? 0)
  if (!Number.isFinite(time)) return { ok: false, error: 'invalid time' }
  v.currentTime = time
  return { ok: true }
})

registerAction('renderer.setRate', ({ params }) => {
  const v = document.querySelector<HTMLMediaElement>('.scene-stage video')
  if (!v) return { ok: false, error: 'no video on stage' }
  const rate = Number(params.rate ?? 1)
  if (!Number.isFinite(rate) || rate <= 0) return { ok: false, error: 'invalid rate' }
  v.playbackRate = rate
  return { ok: true }
})

// ============ 主进程委托（system.*） ============
// 这些 action 通过 IPC 通知主进程执行。dispatcher 会识别 system.* 前缀转发。
