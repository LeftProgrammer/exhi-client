import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'
import type { Command, Event as DomainEvent } from '@shared/types'
import type { WindowManager } from './window-manager'
import type { WsClient } from './ws-client'

/**
 * 诊断指令处理：
 *   cmd.diag.echo   { text } → evt.cmdResult 回原文（调试连接是否通）
 *   cmd.diag.logs   { since?, lines? } → evt.diagLogs 返回日志尾部内容
 *   cmd.diag.screenshot { display? } → evt.diagScreenshot 返回 PNG base64
 */
export class DiagHandler {
  constructor(
    private deviceId: string,
    private winManager: WindowManager,
    private getWs: () => WsClient | null
  ) {}

  async handle(cmd: Command): Promise<boolean> {
    if (!cmd.type.startsWith('cmd.diag.')) return false
    switch (cmd.type) {
      case 'cmd.diag.echo':
        return this.echo(cmd)
      case 'cmd.diag.logs':
        return this.logs(cmd)
      case 'cmd.diag.screenshot':
        return this.screenshot(cmd)
      default:
        logger.warn(`未知 diag 指令: ${cmd.type}`)
        this.publish('evt.cmdResult', { cmdId: cmd.id, ok: false, error: 'unknown diag' })
        return true
    }
  }

  private async echo(cmd: Command) {
    const text = (cmd.payload as { text?: string } | undefined)?.text ?? ''
    this.publish('evt.cmdResult', { cmdId: cmd.id, ok: true, data: { echo: text } })
    return true
  }

  private async logs(cmd: Command) {
    const lines = (cmd.payload as { lines?: number } | undefined)?.lines ?? 200
    const dir = path.join(app.getPath('userData'), 'logs')
    try {
      const files = (await fsp.readdir(dir))
        .filter((f) => f.endsWith('.log'))
        .sort()
        .reverse()
      if (files.length === 0) {
        this.publish('evt.diagLogs', { cmdId: cmd.id, lines: [] })
        return true
      }
      const latest = path.join(dir, files[0])
      const raw = await fsp.readFile(latest, 'utf-8')
      const all = raw.split(/\r?\n/)
      const tail = all.slice(Math.max(0, all.length - lines - 1))
      this.publish('evt.diagLogs', {
        cmdId: cmd.id,
        file: files[0],
        lines: tail
      })
    } catch (e) {
      this.publish('evt.cmdResult', {
        cmdId: cmd.id,
        ok: false,
        error: (e as Error).message
      })
    }
    return true
  }

  private async screenshot(cmd: Command) {
    const displayId = (cmd.payload as { display?: string } | undefined)?.display
    try {
      const targets = displayId
        ? [this.winManager.get(displayId)]
        : this.winManager.all()
      const shots: Array<{ displayId: string; pngBase64: string }> = []
      for (const win of targets) {
        if (!win || win.isDestroyed()) continue
        const image = await win.webContents.capturePage()
        const id = this.findDisplayId(win)
        shots.push({ displayId: id ?? 'unknown', pngBase64: image.toPNG().toString('base64') })
      }
      this.publish('evt.diagScreenshot', { cmdId: cmd.id, shots })
    } catch (e) {
      this.publish('evt.cmdResult', {
        cmdId: cmd.id,
        ok: false,
        error: (e as Error).message
      })
    }
    return true
  }

  /** 内部辅助：通过 win 反查 displayId */
  private findDisplayId(win: Electron.BrowserWindow): string | null {
    const winsRecord = (
      this.winManager as unknown as { windows: Map<string, Electron.BrowserWindow> }
    ).windows
    for (const [id, w] of winsRecord.entries()) {
      if (w === win) return id
    }
    return null
  }

  private publish(type: string, payload: Record<string, unknown>) {
    const ws = this.getWs()
    if (!ws) return
    const ev: DomainEvent = {
      id: `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      deviceId: this.deviceId,
      type,
      payload
    }
    ws.publish(ev)
  }
}

// 让 fs 在 TS strict 下别报未用
void fs
