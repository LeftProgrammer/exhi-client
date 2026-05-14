/**
 * 变量替换：把 bindings 里 params 中的 "$payload.x.y" / "$args.x" / "$device.x" 字面量
 * 替换成实际值。
 *
 * 规则：
 *   - 字符串值若整体匹配 "$<root>.<path>"，整体替换为对应类型（保留 number/bool/object）
 *   - 字符串值含部分占位时按字符串拼接
 *   - 嵌套 object/array 递归处理
 *
 * 例：
 *   resolve({ sceneId: "$payload.sceneId" }, { payload: { sceneId: "x" } })
 *     → { sceneId: "x" }
 *
 *   resolve({ tag: "user-$payload.id" }, { payload: { id: 7 } })
 *     → { tag: "user-7" }
 */
export interface VarContext {
  payload?: Record<string, unknown>
  args?: Record<string, unknown>
  device?: Record<string, unknown>
}

const TOKEN_RE = /\$([a-zA-Z]+)((?:\.[a-zA-Z0-9_-]+)+)/g
const FULL_TOKEN_RE = /^\$([a-zA-Z]+)((?:\.[a-zA-Z0-9_-]+)+)$/

export function resolveVars<T>(input: T, ctx: VarContext): T {
  return walk(input, ctx) as T
}

function walk(value: unknown, ctx: VarContext): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return resolveString(value, ctx)
  if (Array.isArray(value)) return value.map((v) => walk(v, ctx))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walk(v, ctx)
    }
    return out
  }
  return value
}

function resolveString(s: string, ctx: VarContext): unknown {
  const m = FULL_TOKEN_RE.exec(s)
  if (m) {
    return readPath(ctx, m[1], m[2].split('.').filter(Boolean))
  }
  if (s.includes('$')) {
    return s.replace(TOKEN_RE, (_, root: string, dotPath: string) => {
      const v = readPath(ctx, root, dotPath.split('.').filter(Boolean))
      if (v === undefined || v === null) return ''
      return String(v)
    })
  }
  return s
}

function readPath(ctx: VarContext, root: string, segs: string[]): unknown {
  const r = (ctx as unknown as Record<string, unknown>)[root]
  if (r == null) return undefined
  let cur: unknown = r
  for (const k of segs) {
    if (cur == null) return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}
