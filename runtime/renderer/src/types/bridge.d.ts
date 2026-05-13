import type { BootInfo, Command, DeviceStatus } from '@shared/types'

export interface ExhibitAPI {
  onCommand(cb: (cmd: Command) => void): () => void
  reportStatus(status: Partial<DeviceStatus>): void
  log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, ctx?: unknown): void
  readPackageFile(relPath: string): Promise<Uint8Array>
  getBootInfo(): Promise<BootInfo>
  dispatchBridgeCommand(cmd: Command): void
}

declare global {
  interface Window {
    exhibit: ExhibitAPI
  }
}

export {}
