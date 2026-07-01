import { app, BrowserWindow, globalShortcut, session } from 'electron'
import { logger } from './logger'
import { IPC } from '@shared/constants'

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

/** 注册调试热键（Ctrl+Shift+Alt+D），打开/关闭 DevTools。仅开发模式。 */
export function registerDevToolsHotkey() {
  if (app.isPackaged) return
  const key = 'CommandOrControl+Shift+Alt+D'
  try {
    globalShortcut.register(key, () => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (win.isDestroyed()) continue
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools()
        } else {
          win.webContents.openDevTools({ mode: 'detach' })
        }
      }
    })
    logger.info(`调试热键已注册: ${key}`)
  } catch (e) {
    logger.warn('调试热键注册失败:', e)
  }
}

/** 注册运维热键：Ctrl+Shift+Alt+Q 退出程序，Ctrl+Shift+Alt+W 退出 kiosk 模式 */
export function registerQuitHotkey() {
  if (!app.isPackaged) return

  try {
    globalShortcut.register('CommandOrControl+Shift+Alt+Q', () => {
      logger.info('退出热键触发，app.quit()')
      app.quit()
    })
    logger.info('退出热键已注册: Ctrl+Shift+Alt+Q')
  } catch (e) {
    logger.warn('退出热键注册失败:', e)
  }

  try {
    globalShortcut.register('CommandOrControl+Shift+Alt+W', () => {
      const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
      if (!wins.length) return
      // 以第一个窗口的 kiosk 状态判断当前模式
      const inKiosk = wins[0].isKiosk()
      logger.info(`kiosk 切换: ${inKiosk ? '退出' : '恢复'}`)
      for (const win of wins) {
        if (inKiosk) {
          win.setKiosk(false)
          win.setAlwaysOnTop(false)
          win.setFullScreen(false)
          win.setMovable(true)
          win.setResizable(true)
          win.setSkipTaskbar(false)
        } else {
          win.setMovable(false)
          win.setResizable(false)
          win.setSkipTaskbar(true)
          win.setAlwaysOnTop(true)
          win.setKiosk(true)
          win.focus()
        }
      }
    })
    logger.info('退出 kiosk 热键已注册: Ctrl+Shift+Alt+W')
  } catch (e) {
    logger.warn('退出 kiosk 热键注册失败:', e)
  }
}

/**
 * 注册诊断面板唤起热键（Ctrl+Shift+Alt+E）。
 *
 * 用 globalShortcut 而非渲染层 keydown 监听，避免 iframe 抢焦点导致按键收不到——
 * 这是触摸一体机最常见的现场救火盲区。
 *
 * 收到热键后，向所有窗口推 IPC，渲染层 DiagPanel 自己决定显示策略（如连按 3 次）。
 */
export function registerDiagHotkey() {
  const key = 'CommandOrControl+Shift+Alt+E'
  try {
    const ok = globalShortcut.register(key, () => {
      logger.info('诊断热键触发')
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send(IPC.DIAG_HOTKEY)
      }
    })
    if (!ok) logger.warn(`诊断热键注册失败（可能被系统占用）: ${key}`)
    else logger.info(`诊断热键已注册: ${key}`)
  } catch (e) {
    logger.warn('诊断热键注册异常:', e)
  }
}
