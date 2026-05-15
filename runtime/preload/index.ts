import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'
import type { BootInfo, Command, DeviceStatus } from '../shared/types'

/**
 * 暴露给渲染层的 API（window.exhibit）。
 * 严格的最小集，所有 Node 能力都收敛在主进程。
 */

export interface ExhibitAPI {
  onCommand(cb: (cmd: Command) => void): () => void
  onBridgeEventFromMain(
    cb: (ev: { name: string; payload?: unknown; targetDisplayId?: string }) => void
  ): () => void
  reportStatus(status: Partial<DeviceStatus> & { displayId?: string }): void
  log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, ctx?: unknown): void
  readPackageFile(relPath: string): Promise<Uint8Array>
  existsPackageFile(relPath: string): Promise<boolean>
  getBootInfo(): Promise<BootInfo>
  dispatchBridgeCommand(cmd: Command): void
  bridgeEmit(name: string, payload?: unknown, fromDisplayId?: string): void
  runSystemAction(
    action: string,
    params: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }>
  onDiagHotkey(cb: () => void): () => void
}

const api: ExhibitAPI = {
  onCommand(cb) {
    const listener = (_e: Electron.IpcRendererEvent, cmd: Command) => cb(cmd)
    ipcRenderer.on(IPC.COMMAND, listener)
    return () => ipcRenderer.off(IPC.COMMAND, listener)
  },

  onBridgeEventFromMain(cb) {
    const listener = (
      _e: Electron.IpcRendererEvent,
      ev: { name: string; payload?: unknown; targetDisplayId?: string }
    ) => cb(ev)
    ipcRenderer.on(IPC.BRIDGE_EVENT_FROM_MAIN, listener)
    return () => ipcRenderer.off(IPC.BRIDGE_EVENT_FROM_MAIN, listener)
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

  existsPackageFile(relPath) {
    return ipcRenderer.invoke(IPC.EXISTS_PACKAGE_FILE, relPath)
  },

  getBootInfo() {
    return ipcRenderer.invoke(IPC.GET_BOOT_INFO)
  },

  dispatchBridgeCommand(cmd) {
    ipcRenderer.send(IPC.DISPATCH_BRIDGE_CMD, cmd)
  },

  bridgeEmit(name, payload, fromDisplayId) {
    ipcRenderer.send(IPC.BRIDGE_EMIT, { name, payload, fromDisplayId })
  },

  runSystemAction(action, params) {
    return ipcRenderer.invoke(IPC.RUN_SYSTEM_ACTION, { action, params })
  },

  onDiagHotkey(cb) {
    const listener = () => cb()
    ipcRenderer.on(IPC.DIAG_HOTKEY, listener)
    return () => ipcRenderer.off(IPC.DIAG_HOTKEY, listener)
  }
}

contextBridge.exposeInMainWorld('exhibit', api)
