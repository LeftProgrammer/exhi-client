import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { logger } from './logger'

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

export function attachProtocolHandler(packageRoot: string) {
  const rootResolved = path.resolve(packageRoot)

  protocol.handle(PKG_SCHEME, (request) => {
    try {
      const url = new URL(request.url)
      const relPath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
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

  logger.info(`exhi-pkg 协议已挂载，root=${rootResolved}`)
}

/** 给渲染层用的工具：拼出 exhi-pkg URL */
export function buildPkgUrl(relPath: string): string {
  const clean = relPath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${PKG_SCHEME}://pkg/${clean}`
}
