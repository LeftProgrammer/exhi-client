import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { logger } from './logger'
import { BRIDGE_SCRIPT } from './bridge-script'

/**
 * 自定义协议：把 exhi-pkg:// 映射到当前激活项目包根目录。
 *
 * URL 形式：exhi-pkg://pkg/<相对路径>
 *   例如 exhi-pkg://pkg/contents/welcome/index.html
 *
 * 用 host="pkg" 是固定占位（让 URL 合法），实际只看 pathname。
 *
 * 必须分两步：
 *   1) registerSchemes      （app.ready 之前调用，把 scheme 注册为 standard/secure 等特权）
 *   2) attachProtocolHandler（app.ready 之后，且 packageRoot 已知时调用）
 *
 * M10 新增：dev 模式下，contents/<screen>/* 路径优先去 Vite dev server 拉，
 *   拿到 HMR 体验。环境变量 EXHI_DEV_CONTENT_URL 控制（默认 http://localhost:5174）。
 *   仅当能打开 dev server 时启用，启用后失败再回退到文件系统。
 */

export const PKG_SCHEME = 'exhi-pkg'

export function registerPkgScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PKG_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
        bypassCSP: false
      }
    }
  ])
}

/** dev 模式：优先去 vite dev server 拿 HTML/JS/CSS（HMR 体验）；视频图片仍走磁盘 */
const DEV_CONTENT_URL = process.env['EXHI_DEV_CONTENT_URL'] || 'http://localhost:5174'
const DEV_PROXY_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.ts',
  '.css',
  '.scss',
  '.vue',
  '.json'
])

export function attachProtocolHandler(packageRoot: string) {
  const rootResolved = path.resolve(packageRoot)
  const isDev = !!process.env['ELECTRON_RENDERER_URL']

  protocol.handle(PKG_SCHEME, async (request) => {
    try {
      const url = new URL(request.url)
      const relPath = decodeURIComponent(url.pathname).replace(/^\/+/, '')

      // 拦截 __exhi__/* 路径，返回 Runtime 内置资源（如 bridge.js）
      if (relPath.startsWith('__exhi__/')) {
        return serveBuiltin(relPath)
      }

      // dev 模式：HTML/JS/CSS/Vue 优先尝试 vite dev server
      if (isDev && shouldDevProxy(relPath)) {
        const proxied = await tryDevProxy(relPath)
        if (proxied) return proxied
        // dev server 没起或路径不存在 → 回退到磁盘
      }

      const full = path.resolve(rootResolved, relPath)

      // 防穿越
      if (!full.startsWith(rootResolved)) {
        logger.warn(`阻止越界访问: ${relPath}`)
        return new Response('Forbidden', { status: 403 })
      }

      return net.fetch(pathToFileURL(full).toString())
    } catch (e) {
      logger.error('exhi-pkg 协议处理失败:', e)
      return new Response('Internal Error', { status: 500 })
    }
  })

  logger.info(
    `exhi-pkg 协议已挂载，root=${rootResolved}` +
      (isDev ? ` (dev 代理: ${DEV_CONTENT_URL})` : '')
  )
}

function shouldDevProxy(relPath: string): boolean {
  // 仅 contents/ 下的、扩展名为代码/标记类的资源走代理
  if (!relPath.startsWith('contents/')) return false
  const ext = path.extname(relPath).toLowerCase()
  // 没扩展名（比如目录访问）也尝试代理
  if (!ext) return true
  return DEV_PROXY_EXTENSIONS.has(ext)
}

/**
 * 把 exhi-pkg://pkg/contents/<screen>/<rest> 转成 http://localhost:5174/<screen>/<rest>
 *
 * 约定：项目包 vite 工程的 root 是 src/，每个屏一个子目录作为 multi-page 入口。
 *   contents/touch-yushui/index.html  ←→  /touch-yushui/index.html  on dev server
 */
async function tryDevProxy(relPath: string): Promise<Response | null> {
  // 去掉 contents/ 前缀
  const subPath = relPath.slice('contents/'.length)
  const proxyUrl = `${DEV_CONTENT_URL}/${subPath}`
  try {
    const r = await fetch(proxyUrl)
    // dev server 没匹配上会返回 404 或 fallback HTML，让它过去也行（vite 默认有 index 兜底）
    if (r.status >= 400 && r.status !== 404) return null
    if (r.status === 404) return null
    return r
  } catch {
    // dev server 没启动 → 静默回退
    return null
  }
}

function serveBuiltin(relPath: string): Response {
  const sub = relPath.slice('__exhi__/'.length)
  if (sub === 'bridge.js') {
    return new Response(BRIDGE_SCRIPT, {
      status: 200,
      headers: { 'content-type': 'application/javascript; charset=utf-8' }
    })
  }
  return new Response('Not Found', { status: 404 })
}

/** 给渲染层用的工具：拼出 exhi-pkg URL */
export function buildPkgUrl(relPath: string): string {
  const clean = relPath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${PKG_SCHEME}://pkg/${clean}`
}
