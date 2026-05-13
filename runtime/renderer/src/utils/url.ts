/**
 * 把项目包内的相对路径转成 exhi-pkg:// URL。
 * 主进程 protocol.ts 已注册该协议并指向当前激活的项目包根。
 *
 * 对绝对 URL（http/https/data 等）原样返回。
 */
export function resolvePkgUrl(relOrAbs: string): string {
  if (!relOrAbs) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(relOrAbs)) return relOrAbs // 已是绝对 URL
  const clean = relOrAbs.replace(/^\/+/, '').replace(/\\/g, '/')
  return `exhi-pkg://pkg/${clean}`
}
