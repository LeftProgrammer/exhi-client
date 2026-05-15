/**
 * 项目包内：把相对资源路径转成 URL。
 *
 * 业务代码里写 `image: 'yushui/environment/01.jpg'` 这种相对路径，
 * 由本函数翻译成可访问的 URL。
 *
 * 两种运行环境：
 *  - Electron Runtime：拼成 exhi-pkg://pkg/contents/<rel>
 *  - 浏览器直连 vite dev server（开发期 http://127.0.0.1:5174）：
 *    拼成 /<rel>，配合 vite.config 的 publicDir = contents/，浏览器能直接拉到
 *
 * 已经是绝对 URL（http/https/data:/blob:/exhi-pkg:）原样返回。
 */
export function resolvePkgUrl(relOrAbs: string): string {
  if (!relOrAbs) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(relOrAbs)) return relOrAbs
  const clean = relOrAbs.replace(/^\/+/, '').replace(/\\/g, '/')

  // 浏览器直接访问 vite dev（开发期预览 UI 用）
  // 判别：当前页面是普通 http(s) 协议，且没有 exhibitBridge（Electron 注入的）
  if (
    typeof location !== 'undefined' &&
    /^https?:$/.test(location.protocol) &&
    typeof window !== 'undefined' &&
    !window.exhibitBridge
  ) {
    return `/${clean}`
  }

  // Electron Runtime / dev 代理 / 生产 → 走自定义协议
  return `exhi-pkg://pkg/contents/${clean}`
}
