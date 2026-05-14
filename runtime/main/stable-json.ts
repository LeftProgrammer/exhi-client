/**
 * 稳定 JSON 序列化：对象 key 按字典序排序后输出。
 *
 * 用于 HMAC 签名：客户端/中控两端字段顺序不一致时若用普通 JSON.stringify
 * 会算出不同的 hash → 签名 100% 不通过。stable stringify 把这个问题消除。
 *
 * 实现简单递归；不处理 BigInt / Symbol / 循环引用（业务消息里没有）。
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(v: unknown): unknown {
  if (v === null || typeof v !== 'object') return v
  if (Array.isArray(v)) return v.map(canonicalize)
  // 普通对象：按 key 排序重建
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k] = canonicalize(obj[k])
  return out
}
