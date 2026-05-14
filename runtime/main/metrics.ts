import os from 'node:os'
import fs from 'node:fs'
import { app } from 'electron'
import { logger } from './logger'
import type { Event as DomainEvent } from '@shared/types'
import type { WsClient } from './ws-client'

/**
 * 健康指标采集器。
 *
 * 每 intervalMs 采集一次，上报 evt.metrics。
 *
 * 字段：
 *   cpu      0~1（应用进程 CPU 占比，跨进程聚合）
 *   memMB    应用进程 + 渲染进程 RSS 总和（MB）
 *   sysMem   系统总内存使用率 0~1
 *   freeMB   系统可用内存（MB）
 *   diskFree 项目包所在磁盘剩余字节
 *   uptime   主进程 uptime（秒）
 *   nNetSent / nNetRecv 网络累计字节（如可获取）
 */
export class MetricsReporter {
  private timer: NodeJS.Timeout | null = null
  private lastCpu: { user: number; system: number; ts: number } | null = null

  constructor(
    private deviceId: string,
    private getWs: () => WsClient | null,
    private intervalMs = 10_000
  ) {}

  start() {
    this.tick() // 立即一次
    this.timer = setInterval(() => this.tick(), this.intervalMs)
    logger.info(`metrics 采集启动：每 ${this.intervalMs}ms`)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private async tick() {
    try {
      const m = await this.collect()
      const ev: DomainEvent = {
        id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        deviceId: this.deviceId,
        type: 'evt.metrics',
        payload: m as unknown as Record<string, unknown>
      }
      this.getWs()?.publish(ev)
    } catch (e) {
      logger.warn('metrics 采集失败:', e)
    }
  }

  private async collect() {
    // CPU：基于 process.cpuUsage 差分
    const cpuUsage = process.cpuUsage()
    let cpu = 0
    const now = Date.now()
    if (this.lastCpu) {
      const dUser = cpuUsage.user - this.lastCpu.user
      const dSystem = cpuUsage.system - this.lastCpu.system
      const dWall = (now - this.lastCpu.ts) * 1000 // μs
      cpu = dWall > 0 ? Math.min(1, (dUser + dSystem) / dWall) : 0
    }
    this.lastCpu = { user: cpuUsage.user, system: cpuUsage.system, ts: now }

    // 跨进程 memory（Electron 提供）
    const memMetrics = await app.getAppMetrics()
    let workingSetBytes = 0
    for (const proc of memMetrics) {
      workingSetBytes += (proc.memory?.workingSetSize ?? 0) * 1024
    }
    const memMB = Math.round(workingSetBytes / 1024 / 1024)

    // 系统内存
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const sysMem = 1 - freeMem / totalMem
    const freeMB = Math.round(freeMem / 1024 / 1024)

    // 磁盘
    let diskFree: number | null = null
    try {
      const userData = app.getPath('userData')
      // statfs 在 Node 20 有
      // @ts-expect-error - statfsSync 在某些 @types/node 还未声明
      const st = fs.statfsSync ? fs.statfsSync(userData) : null
      if (st) diskFree = Number(st.bavail) * Number(st.bsize)
    } catch {
      /* 不致命，忽略 */
    }

    return {
      cpu: Number(cpu.toFixed(3)),
      memMB,
      sysMem: Number(sysMem.toFixed(3)),
      freeMB,
      diskFree,
      uptime: Math.floor(process.uptime()),
      proc: memMetrics.length // 进程数
    }
  }
}
