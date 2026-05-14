import type { BootInfo, Command, DeviceStatus } from '@shared/types'

export interface ExhibitAPI {
  onCommand(cb: (cmd: Command) => void): () => void
  onBridgeEventFromMain(
    cb: (ev: { name: string; payload?: unknown; targetDisplayId?: string }) => void
  ): () => void
  reportStatus(status: Partial<DeviceStatus> & { displayId?: string }): void
  log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, ctx?: unknown): void
  readPackageFile(relPath: string): Promise<Uint8Array>
  getBootInfo(): Promise<BootInfo>
  dispatchBridgeCommand(cmd: Command): void
  bridgeEmit(name: string, payload?: unknown, fromDisplayId?: string): void
  runSystemAction(
    action: string,
    params: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }>
  onDiagHotkey(cb: () => void): () => void
}

declare global {
  interface Window {
    exhibit: ExhibitAPI
  }
}

export {}
