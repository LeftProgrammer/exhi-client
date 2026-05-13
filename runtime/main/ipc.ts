import { app, ipcMain, screen } from 'electron'
import { EventEmitter } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IPC, RUNTIME_VERSION } from '@shared/constants'
import type { BootInfo, Command, DeviceStatus, DisplayStatus, Event as DomainEvent } from '@shared/types'
import { logger } from './logger'
import type { LoadedPackage } from './package-loader'
import type { WindowManager } from './window-manager'
import type { WsClient } from './ws-client'

/**
 * 主进程的"事件总线"：把 ws / local-server / standalone 产出的指令，
 * 以及渲染层上报的状态，集中调度。
 *
 * 事件：
 *  - 'command'  (cmd: Command)              ：任何来源的指令
 *  - 'status'   (display: DisplayStatus)    ：渲染层上报的状态
 */
export class MainBus extends EventEmitter {}

export class IpcBus {
  /** 渲染层最新状态缓存，按 displayId 聚合 */
  private statusByDisplay = new Map<string, DisplayStatus>()
  private deviceVolume = 1

  constructor(
    private pkg: LoadedPackage,
    private winManager: WindowManager,
    private deviceId: string,
    private mainBus: MainBus,
    private getWsClient: () => WsClient | null
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

    ipcMain.on(IPC.REPORT_STATUS, (_e, status: Partial<DeviceStatus> & { displayId?: string }) => {
      this.handleStatusReport(status)
    })

    ipcMain.on(IPC.DISPATCH_BRIDGE_CMD, (_e, cmd: Command) => {
      // 来自 web 内容（exhibitBridge）的指令
      cmd.source = 'bridge'
      this.mainBus.emit('command', cmd)
    })

    // 监听总线指令 → 分发到对应窗口
    this.mainBus.on('command', (cmd: Command) => this.dispatchCommand(cmd))
  }

  /** 把 cmd 转发给指定 display 的窗口；payload.display 为空则广播给所有 */
  private dispatchCommand(cmd: Command) {
    logger.info(`总线指令: ${cmd.type} from=${cmd.source ?? 'unknown'}`)
    const targetDisplay = (cmd.payload as { display?: string } | undefined)?.display
    const targets = targetDisplay ? [this.winManager.get(targetDisplay)] : this.winManager.all()
    let delivered = 0
    for (const win of targets) {
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC.COMMAND, cmd)
        delivered++
      }
    }
    // 给中控回执
    const ws = this.getWsClient()
    if (ws) {
      ws.publish({
        id: randomId(),
        ts: Date.now(),
        deviceId: this.deviceId,
        type: 'evt.cmdResult',
        payload: { cmdId: cmd.id, ok: delivered > 0, delivered }
      })
    }
  }

  private handleStatusReport(s: Partial<DeviceStatus> & { displayId?: string }) {
    if (s.displayId && s.displays?.[0]) {
      this.statusByDisplay.set(s.displayId, s.displays[0])
    }
    if (typeof s.volume === 'number') this.deviceVolume = s.volume

    // 转发整合后的状态给中控
    const ws = this.getWsClient()
    if (!ws) return
    const full: DeviceStatus = {
      deviceId: this.deviceId,
      mode: ws.mode,
      uptime: Math.floor(process.uptime()),
      volume: this.deviceVolume,
      displays: Array.from(this.statusByDisplay.values())
    }
    const ev: DomainEvent = {
      id: randomId(),
      ts: Date.now(),
      deviceId: this.deviceId,
      type: 'evt.status',
      payload: full as unknown as Record<string, unknown>
    }
    ws.publish(ev)
  }

  private buildBootInfo(senderId: number): BootInfo {
    const winsRecord = (
      this.winManager as unknown as { windows: Map<string, Electron.BrowserWindow> }
    ).windows
    let displayId = 'unknown'
    let win: Electron.BrowserWindow | null = null
    for (const [id, w] of winsRecord.entries()) {
      if (w.webContents.id === senderId) {
        displayId = id
        win = w
        break
      }
    }
    if (!win) throw new Error('找不到 sender 对应的窗口')
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

  private safeJoin(root: string, relPath: string): string | null {
    const full = path.resolve(root, relPath)
    const normalized = path.normalize(full)
    if (!normalized.startsWith(path.normalize(root))) return null
    return normalized
  }
}

/** 持久化 deviceId */
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

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
