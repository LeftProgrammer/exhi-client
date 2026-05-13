import { BrowserWindow, screen, type Display } from 'electron'
import path from 'node:path'
import { logger } from './logger'
import type { DisplayConfig, DisplaysConfig } from '@shared/types'
import type { LoadedPackage } from './package-loader'

/**
 * 多屏窗口管理：把 displays.json 中的逻辑 display 映射到物理屏，并为每块物理屏创建窗口。
 *
 * 匹配规则优先级：label > primary > bounds > size > index。
 * 未匹配的物理屏不创建窗口；未匹配的逻辑 display 会记录警告。
 *
 * 每个 display 创建独立 BrowserWindow（独立渲染进程）。
 */
export class WindowManager {
  private windows = new Map<string, BrowserWindow>()

  constructor(private pkg: LoadedPackage) {}

  /**
   * 启动时按 displays.json 创建所有窗口。
   */
  createAll(): BrowserWindow[] {
    const physicalDisplays = screen.getAllDisplays()
    logger.info(`检测到 ${physicalDisplays.length} 块物理屏`)

    const used = new Set<number>() // 已被占用的物理屏 id
    const created: BrowserWindow[] = []

    for (const cfg of this.pkg.displays.displays) {
      const matched = this.matchDisplay(cfg, physicalDisplays, used)
      if (!matched) {
        logger.warn(`未匹配到物理屏: 逻辑 display "${cfg.id}"`)
        continue
      }
      used.add(matched.id)
      const win = this.createWindow(cfg, matched)
      this.windows.set(cfg.id, win)
      created.push(win)
    }

    if (created.length === 0) {
      // 兜底：如果一个都没匹配上（开发环境常见），用第一个 display 配置 + 主屏强制创建一个
      logger.warn('没有任何窗口被创建，回退到主屏强制创建第一个 display 配置')
      const fallback = this.pkg.displays.displays[0]
      const primary = screen.getPrimaryDisplay()
      const win = this.createWindow(fallback, primary)
      this.windows.set(fallback.id, win)
      created.push(win)
    }

    return created
  }

  /** 物理屏匹配 */
  private matchDisplay(
    cfg: DisplayConfig,
    displays: Display[],
    used: Set<number>
  ): Display | null {
    const available = displays.filter((d) => !used.has(d.id))
    const { match } = cfg

    if (match.label) {
      // Electron 暂无公开的 label 字段，留作扩展点（部署时可用 deviceId 匹配）
    }
    if (match.primary) {
      const primary = screen.getPrimaryDisplay()
      if (available.find((d) => d.id === primary.id)) return primary
    }
    if (match.size) {
      const [w, h] = match.size.split('x').map(Number)
      const hit = available.find(
        (d) => d.bounds.width === w && d.bounds.height === h
      )
      if (hit) return hit
    }
    if (match.bounds) {
      const hit = available.find(
        (d) => d.bounds.x === match.bounds!.x && d.bounds.y === match.bounds!.y
      )
      if (hit) return hit
    }
    if (typeof match.index === 'number') {
      if (displays[match.index] && !used.has(displays[match.index].id)) {
        return displays[match.index]
      }
    }
    // 兜底：取第一个可用屏
    return available[0] ?? null
  }

  /** 创建窗口 */
  private createWindow(cfg: DisplayConfig, display: Display): BrowserWindow {
    const isDev = !!process.env['ELECTRON_RENDERER_URL']

    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      fullscreen: !isDev, // 开发模式不全屏，方便调试
      frame: isDev,
      kiosk: !isDev,
      alwaysOnTop: !isDev,
      skipTaskbar: !isDev,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        webSecurity: true,
        // 把当前 displayId 通过 query 传给渲染层，渲染层启动时就知道自己是哪块屏
        additionalArguments: [`--exhi-display-id=${cfg.id}`]
      }
    })

    win.once('ready-to-show', () => {
      win.show()
      logger.info(`窗口已显示: display=${cfg.id}, 物理屏 id=${display.id}`)
    })

    win.webContents.on('render-process-gone', (_e, details) => {
      logger.error(`渲染进程异常: display=${cfg.id}, reason=${details.reason}`)
      // M6 中会接入 watchdog，自动 reload
      if (!win.isDestroyed()) {
        setTimeout(() => win.reload(), 3000)
      }
    })

    win.webContents.on('unresponsive', () => {
      logger.warn(`渲染进程无响应: display=${cfg.id}`)
    })

    // 加载渲染层
    if (isDev) {
      const devUrl = process.env['ELECTRON_RENDERER_URL']!
      win.loadURL(`${devUrl}?displayId=${cfg.id}`)
      // 每个窗口都打开独立 DevTools
      win.webContents.once('did-finish-load', () => {
        win.webContents.openDevTools({ mode: 'detach' })
      })
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'), {
        query: { displayId: cfg.id }
      })
    }

    return win
  }

  get(displayId: string): BrowserWindow | undefined {
    return this.windows.get(displayId)
  }

  all(): BrowserWindow[] {
    return Array.from(this.windows.values())
  }

  closeAll() {
    for (const w of this.windows.values()) {
      if (!w.isDestroyed()) w.close()
    }
    this.windows.clear()
  }
}
