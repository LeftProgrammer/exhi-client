import { app, globalShortcut, session } from 'electron'
import { logger } from './logger'

/**
 * 应用层安全策略。
 * 真正防退出依赖 Windows Kiosk Mode / Shell Launcher，应用层是辅助。
 */
export function applySecurity() {
  // CSP：仅允许加载本地资源
  app.on('ready', () => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' exhi-pkg: file: data: blob:; " +
              "script-src 'self' 'unsafe-inline' exhi-pkg: file:; " +
              "style-src 'self' 'unsafe-inline' exhi-pkg: file: data:; " +
              "img-src 'self' exhi-pkg: file: data: blob:; " +
              "media-src 'self' exhi-pkg: file: data: blob:; " +
              "font-src 'self' exhi-pkg: file: data:; " +
              "connect-src 'self' exhi-pkg: ws: wss: http://127.0.0.1:* https:; " +
              "frame-src 'self' exhi-pkg: file: data:;"
          ]
        }
      })
    })

    // 禁止打开新窗口（防止内容内 window.open 弹出）
    app.on('web-contents-created', (_e, contents) => {
      contents.setWindowOpenHandler(() => ({ action: 'deny' }))
      contents.on('will-navigate', (event, url) => {
        // 允许 file://、exhi-pkg:// 和 dev server，拒绝其他
        if (
          !url.startsWith('file://') &&
          !url.startsWith('exhi-pkg://') &&
          !url.startsWith('http://localhost')
        ) {
          logger.warn('阻止导航到外部 URL:', url)
          event.preventDefault()
        }
      })
    })
  })
}

/** 注册全局热键屏蔽（Alt+F4 / Win 等只能尽力屏蔽） */
export function registerHotkeyBlocking() {
  if (!app.isPackaged) {
    logger.info('开发模式：跳过热键屏蔽，方便调试')
    return
  }
  const blocked = ['Alt+F4', 'Alt+Tab', 'Super', 'Super+L', 'Super+D']
  for (const key of blocked) {
    try {
      globalShortcut.register(key, () => {
        logger.info(`已拦截热键: ${key}`)
      })
    } catch (e) {
      logger.warn(`热键注册失败 ${key}:`, e)
    }
  }
}

export function unregisterAllHotkeys() {
  globalShortcut.unregisterAll()
}
