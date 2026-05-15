/**
 * 项目包内：把相对资源路径转成 exhi-pkg:// URL。
 *
 * 用于业务代码引用 contents/ 下的图片、视频等媒体资源。
 * data.ts 里写 `image: 'yushui/environment/01.jpg'`，渲染时通过这个函数解析。
 *
 * 已经是绝对 URL（http/https/data:/blob:/exhi-pkg:）原样返回。
 */
export function resolvePkgUrl(relOrAbs: string): string {
  if (!relOrAbs) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(relOrAbs)) return relOrAbs
  const clean = relOrAbs.replace(/^\/+/, '').replace(/\\/g, '/')
  // 项目数据里的资源路径都相对 contents/，统一加前缀
  return `exhi-pkg://pkg/contents/${clean}`
}
