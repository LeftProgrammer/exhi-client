import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'
import type { BootInfo, Command, DeviceStatus } from '../shared/types'

/**
 * 暴露给渲染层的 API（window.exhibit）。
 * 严格的最小集，所有 Node 能力都收敛在主进程。
 */

export interface ExhibitAPI {
  onCommand(cb: (cmd: Command) => void): () => void
  reportStatus(status: Partial<DeviceStatus>): void
  log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, ctx?: unknown): void
  readPackageFile(relPath: string): Promise<Uint8Array>
  getBootInfo(): Promise<BootInfo>
  dispatchBridgeCommand(cmd: Command): void
}

const api: ExhibitAPI = {
  onCommand(cb) {
    const listener = (_e: Electron.IpcRendererEvent, cmd: Command) => cb(cmd)
    ipcRenderer.on(IPC.COMMAND, listener)
    return () => ipcRenderer.off(IPC.COMMAND, listener)
  },

  reportStatus(status) {
    ipcRenderer.send(IPC.REPORT_STATUS, status)
  },

  log(level, msg, ctx) {
    ipcRenderer.send(IPC.LOG, level, msg, ctx)
  },

  async readPackageFile(relPath) {
    const buf = await ipcRenderer.invoke(IPC.READ_PACKAGE_FILE, relPath)
    return new Uint8Array(buf)
  },

  getBootInfo() {
    return ipcRenderer.invoke(IPC.GET_BOOT_INFO)
  },

  dispatchBridgeCommand(cmd) {
    ipcRenderer.send(IPC.DISPATCH_BRIDGE_CMD, cmd)
  }
}

contextBridge.exposeInMainWorld('exhibit', api)
