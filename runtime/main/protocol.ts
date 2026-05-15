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
 * M10 新增：dev 模式下，所有非媒体类资源优先去 Vite dev server 拉，
 *   拿到 HMR 体验。环境变量 EXHI_DEV_CONTENT_URL 控制（默认 http://localhost:5174）。
 *   策略：vite multi-page 模式下，main.ts 的 import 会被 vite 重写成基于
 *   vite root 的绝对路径（如 /hello/App.vue），不带 contents/ 前缀，
 *   所以代理判断改为"黑名单"——媒体类（mp4/jpg 等）走磁盘，其他全部走 proxy。
 *   vite 返回 404 时静默回退磁盘。
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

export function attachProtocolHandler(packageRoot: string) {
  const rootResolved = path.resolve(packageRoot)
  const isDev = !!process.env['ELECTRON_RENDERER_URL']

  protocol.handle(PKG_SCHEME, async (request) => {
    try {
      const url = new URL(request.url)
      const relPath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
      const search = url.search // 带 ? 的原始 query，dev proxy 时必须保留（vite 用 ?vue&type=script 等）

      // 拦截 __exhi__/* 路径，返回 Runtime 内置资源（如 bridge.js）
      if (relPath.startsWith('__exhi__/')) {
        return serveBuiltin(relPath)
      }

      // dev 模式：HTML/JS/CSS/Vue 优先尝试 vite dev server
      if (isDev && shouldDevProxy(relPath)) {
        const proxied = await tryDevProxy(relPath, search)
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
    `exhi-pkg 协议已挂载，root=${rootResolved}` + (isDev ? ` (dev 代理: ${DEV_CONTENT_URL})` : '')
  )
}

/**
 * dev 模式：哪些路径走 vite dev server 代理？
 *
 * 策略改为"白名单 + 黑名单"：
 *  - 黑名单（不走代理）：媒体类资源（mp4/jpg/png 等），它们应走磁盘
 *  - 白名单（走代理）：其他全部
 *
 * 原因：vite multi-page 模式下，main.ts 里 `import App from './App.vue'`
 *   会被 vite 重写成绝对路径 /hello/App.vue（基于 vite root），浏览器从
 *   exhi-pkg:// 视角解析，relPath 就变成 "hello/App.vue"——没有 contents/ 前缀。
 *   只能让 vite dev server 决定 404，我们不能预判。
 */
const NEVER_PROXY_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.mkv',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.pdf'
])

function shouldDevProxy(relPath: string): boolean {
  // __exhi__/* 是 Runtime 内置资源，不走 proxy
  if (relPath.startsWith('__exhi__/')) return false
  // 媒体类资源直接走磁盘（vite 也没这些）
  const ext = path.extname(relPath).toLowerCase()
  if (ext && NEVER_PROXY_EXTENSIONS.has(ext)) return false
  // 其余全部尝试 proxy，失败 fallback 到磁盘
  return true
}

/**
 * 把 exhi-pkg://pkg/contents/<screen>/<rest> 转成 http://localhost:5174/<screen>/<rest>
 *
 * 约定：项目包 vite 工程的 root 是 src/，每个屏一个子目录作为 multi-page 入口。
 *   contents/touch-yushui/index.html  ←→  /touch-yushui/index.html  on dev server
 */
async function tryDevProxy(relPath: string, search = ''): Promise<Response | null> {
  // contents/<screen>/... → /<screen>/...（vite root 是 src/，每屏一个子目录）
  // 其他路径（@vite/client、node_modules/...）原样代理
  const subPath = relPath.startsWith('contents/') ? relPath.slice('contents/'.length) : relPath
  // search 必须保留：vite 用 ?vue&type=script&...&lang.ts 这种 query 区分 SFC 块
  const proxyUrl = `${DEV_CONTENT_URL}/${subPath}${search}`
  try {
    // 用 Node http 模块手动拉，完全控制 buffer 与 headers
    const { body, status, contentType } = await httpGetBuffer(proxyUrl)
    if (status === 404 || status >= 500) return null
    logger.debug(`[dev-proxy] ${relPath} → ${status} (${body.length}B)`)
    const headers = new Headers()
    if (contentType) headers.set('content-type', contentType)
    headers.set('cache-control', 'no-cache')
    // Buffer 在 @types/node 22 + lib.dom 的 BodyInit 类型签名冲突
    // 拷到独立 ArrayBuffer 给 Response（BodyInit 接受 ArrayBuffer）
    const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
    return new Response(ab, { status, headers })
  } catch (e) {
    // dev server 没启动是常见情况（用户没跑 dev:content），不打 warn
    logger.debug(`[dev-proxy] miss ${proxyUrl}: ${(e as Error).message}`)
    return null
  }
}

/** 用 Node http 拉取 URL，返回完整 buffer */
async function httpGetBuffer(url: string): Promise<{
  body: Buffer
  status: number
  contentType: string | null
}> {
  const http = await import('node:http')
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        resolve({
          body: Buffer.concat(chunks),
          status: res.statusCode ?? 200,
          contentType: (res.headers['content-type'] as string | undefined) ?? null
        })
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(5_000, () => {
      req.destroy(new Error('proxy timeout'))
    })
  })
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
