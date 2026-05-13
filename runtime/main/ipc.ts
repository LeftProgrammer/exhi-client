import { app, ipcMain, screen } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC, RUNTIME_VERSION } from '@shared/constants'
import type { BootInfo, DeviceStatus } from '@shared/types'
import { logger } from './logger'
import type { LoadedPackage } from './package-loader'
import type { WindowManager } from './window-manager'

/**
 * IPC 总线：注册主进程侧的 handle / on。
 * 渲染层通过 preload 暴露的 API 与这里交互。
 */
export class IpcBus {
  constructor(
    private pkg: LoadedPackage,
    private winManager: WindowManager,
    private deviceId: string
  ) {}

  register() {
    ipcMain.handle(IPC.GET_BOOT_INFO, (event) => {
      return this.buildBootInfo(event.sender.id)
    })

    ipcMain.handle(IPC.READ_PACKAGE_FILE, async (_e, relPath: string) => {
      const safe = this.safeJoin(this.pkg.rootPath, relPath)
      if (!safe) throw new Error('非法路径: ' + relPath)
      return fs.readFile(safe)
    })

    ipcMain.on(IPC.LOG, (_e, level: string, msg: string, ctx?: unknown) => {
      const fn = (logger as unknown as Record<string, (...a: unknown[]) => void>)[level]
      if (typeof fn === 'function') fn(`[renderer] ${msg}`, ctx ?? '')
      else logger.info(`[renderer:${level}] ${msg}`, ctx ?? '')
    })

    ipcMain.on(IPC.REPORT_STATUS, (_e, status: Partial<DeviceStatus>) => {
      // M2 会把状态转给 ws-client 上报；M1 仅记录
      logger.debug('渲染层上报状态:', status)
    })

    ipcMain.on(IPC.DISPATCH_BRIDGE_CMD, (_e, cmd: unknown) => {
      // M3 接入 exhibitBridge → CommandDispatcher，M1 暂不处理
      logger.debug('Bridge 派发指令（M1 暂不处理）:', cmd)
    })
  }

  private buildBootInfo(senderId: number): BootInfo {
    // 通过 senderId 反查窗口对应哪个 displayId
    const win = this.winManager.all().find((w) => w.webContents.id === senderId)
    if (!win) throw new Error('找不到 sender 对应的窗口')
    let displayId = 'unknown'
    for (const [id, w] of (this.winManager as unknown as {
      windows: Map<string, Electron.BrowserWindow>
    }).windows.entries()) {
      if (w === win) {
        displayId = id
        break
      }
    }
    const displayCfg = this.pkg.displays.displays.find((d) => d.id === displayId)
    if (!displayCfg) throw new Error(`未找到 display 配置: ${displayId}`)

    const physical = screen.getDisplayMatching(win.getBounds())

    return {
      deviceId: this.deviceId,
      runtimeVersion: RUNTIME_VERSION,
      packageInfo: {
        projectId: this.pkg.manifest.projectId,
        version: this.pkg.manifest.version,
        path: this.pkg.rootPath
      },
      displayId,
      display: displayCfg,
      screen: {
        width: physical.bounds.width,
        height: physical.bounds.height,
        scaleFactor: physical.scaleFactor
      }
    }
  }

  /**
   * 让 relPath 必须在 packageRoot 内，防止穿越。
   */
  private safeJoin(root: string, relPath: string): string | null {
    const full = path.resolve(root, relPath)
    const normalized = path.normalize(full)
    if (!normalized.startsWith(path.normalize(root))) return null
    return normalized
  }
}

/**
 * 获取或生成 deviceId（持久化到 userData）。
 */
export async function ensureDeviceId(): Promise<string> {
  const file = path.join(app.getPath('userData'), 'device-id.txt')
  try {
    const existing = await fs.readFile(file, 'utf-8')
    if (existing.trim()) return existing.trim()
  } catch {
    /* not exist */
  }
  const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, id, 'utf-8')
  return id
}
