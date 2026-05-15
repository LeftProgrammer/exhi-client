import { BrowserWindow, screen, type Display } from 'electron'
import path from 'node:path'
import { logger } from './logger'
import type { DisplayConfig } from '@shared/types'
import type { LoadedPackage } from './package-loader'
import { Watchdog } from './watchdog'
import { getSafeModeDataUrl } from './safe-mode-page'
import type { WsClient } from './ws-client'

/**
 * 多屏窗口管理 + 每窗口看门狗。
 *
 * 匹配规则优先级：label > primary > bounds > size > index。
 * 未匹配的物理屏不创建窗口；未匹配的逻辑 display 会记录警告。
 *
 * 每个 display 创建独立 BrowserWindow（独立渲染进程）。
 */
export class WindowManager {
  private windows = new Map<string, BrowserWindow>()
  private watchdogs = new Map<string, Watchdog>()
  private displayCfgMap = new Map<string, DisplayConfig>()
  private physicalDisplayMap = new Map<string, Display>()

  constructor(
    private pkg: LoadedPackage,
    private deviceId: string,
    private getWs: () => WsClient | null
  ) {}

  /**
   * 启动时按 displays.json 创建所有窗口。
   */
  createAll(): BrowserWindow[] {
    const physicalDisplays = screen.getAllDisplays()
    logger.info(`检测到 ${physicalDisplays.length} 块物理屏`)

    const used = new Set<number>()
    const created: BrowserWindow[] = []

    for (const cfg of this.pkg.displays.displays) {
      const matched = this.matchDisplay(cfg, physicalDisplays, used)
      if (!matched) {
        logger.warn(`未匹配到物理屏: 逻辑 display "${cfg.id}"`)
        continue
      }
      used.add(matched.id)
      this.displayCfgMap.set(cfg.id, cfg)
      this.physicalDisplayMap.set(cfg.id, matched)
      const win = this.createWindow(cfg, matched)
      this.windows.set(cfg.id, win)
      this.attachWatchdog(cfg.id, win)
      created.push(win)
    }

    if (created.length === 0) {
      logger.warn('没有任何窗口被创建，回退到主屏强制创建第一个 display 配置')
      const fallback = this.pkg.displays.displays[0]
      const primary = screen.getPrimaryDisplay()
      this.displayCfgMap.set(fallback.id, fallback)
      this.physicalDisplayMap.set(fallback.id, primary)
      const win = this.createWindow(fallback, primary)
      this.windows.set(fallback.id, win)
      this.attachWatchdog(fallback.id, win)
      created.push(win)
    }

    return created
  }

  /** 物理屏匹配 */
  private matchDisplay(cfg: DisplayConfig, displays: Display[], used: Set<number>): Display | null {
    const available = displays.filter((d) => !used.has(d.id))
    const { match } = cfg

    if (match.primary) {
      const primary = screen.getPrimaryDisplay()
      if (available.find((d) => d.id === primary.id)) return primary
    }
    if (match.size) {
      const [w, h] = match.size.split('x').map(Number)
      const hit = available.find((d) => d.bounds.width === w && d.bounds.height === h)
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
      fullscreen: !isDev,
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
        additionalArguments: [`--exhi-display-id=${cfg.id}`]
      }
    })

    win.once('ready-to-show', () => {
      win.show()
      logger.info(`窗口已显示: display=${cfg.id}, 物理屏 id=${display.id}`)
    })

    if (isDev) {
      const devUrl = process.env['ELECTRON_RENDERER_URL']!
      win.loadURL(`${devUrl}?displayId=${cfg.id}`)
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

  private attachWatchdog(displayId: string, win: BrowserWindow) {
    const wd = new Watchdog(win, { displayId }, this.deviceId, this.getWs)
    wd.on('rebuild-required', () => {
      logger.warn(`重建窗口: display=${displayId}`)
      this.rebuildWindow(displayId)
    })
    wd.on('safe-mode', () => {
      // 安全模式：加载内置兜底页（data URL，零依赖），不再用 about:blank 白屏
      // 设计原则：不解码视频/复杂 CSS，避免再次诱发渲染崩溃
      try {
        win.loadURL(getSafeModeDataUrl())
      } catch (e) {
        logger.warn('safe-mode loadURL 失败', e)
      }
    })
    wd.on('safe-mode-cleared', () => {
      logger.info(`safe-mode 解除，重新加载 display=${displayId}`)
      this.reloadDisplayContent(displayId)
    })
    this.watchdogs.set(displayId, wd)
  }

  /** 重建窗口（销毁旧的，新建一个） */
  private rebuildWindow(displayId: string) {
    const old = this.windows.get(displayId)
    const cfg = this.displayCfgMap.get(displayId)
    const display = this.physicalDisplayMap.get(displayId)
    const wd = this.watchdogs.get(displayId)
    if (!cfg || !display) {
      logger.error(`重建失败：缺少 ${displayId} 的配置`)
      return
    }
    try {
      wd?.destroy()
      this.watchdogs.delete(displayId)
      if (old && !old.isDestroyed()) old.destroy()
    } catch (e) {
      logger.warn('重建：销毁旧窗口报错', e)
    }
    const win = this.createWindow(cfg, display)
    this.windows.set(displayId, win)
    this.attachWatchdog(displayId, win)
    logger.info(`窗口已重建: display=${displayId}`)
  }

  /** 重新加载某屏的内容（safe-mode 恢复用） */
  private reloadDisplayContent(displayId: string) {
    const win = this.windows.get(displayId)
    const cfg = this.displayCfgMap.get(displayId)
    if (!win || win.isDestroyed() || !cfg) return
    const isDev = !!process.env['ELECTRON_RENDERER_URL']
    if (isDev) {
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']!}?displayId=${cfg.id}`)
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'), {
        query: { displayId: cfg.id }
      })
    }
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
    for (const wd of this.watchdogs.values()) wd.destroy()
    this.windows.clear()
    this.watchdogs.clear()
  }
}
