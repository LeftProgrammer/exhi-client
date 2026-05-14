import log from 'electron-log/main'
import { app } from 'electron'
import path from 'node:path'
import { getActiveReporter } from './remote-log'

/**
 * 初始化 electron-log。
 * 文件落在 %APPDATA%/<productName>/logs/main.log（Windows 默认）。
 * 生产环境关闭控制台输出。
 */
export function initLogger() {
  log.initialize()
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath('userData'), 'logs', `main-${formatDate()}.log`)

  if (app.isPackaged) {
    log.transports.console.level = false
  } else {
    log.transports.console.level = 'debug'
  }
}

function formatDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const baseLogger = log.scope('main')

/**
 * 包装 logger：每次调用主动通知远程 reporter，绕开 electron-log 的 hook 机制。
 *
 * 之前用 log.hooks.push(...) 在 electron-vite dev 模式下会被多个模块实例分别注册（实测 ×3），
 * 我们改成"主动 fan-out"——electron-log 写文件/终端，reporter 走 WS 上报，互不干扰。
 */
type LogFn = (...args: unknown[]) => void

function wrap(level: 'debug' | 'info' | 'warn' | 'error'): LogFn {
  const native = (baseLogger as unknown as Record<string, LogFn>)[level]
  return (...args: unknown[]) => {
    native(...args)
    try {
      getActiveReporter()?.ingest(level, 'main', args)
    } catch {
      // 上报通道不能让 logger 自身崩
    }
  }
}

export const logger = {
  debug: wrap('debug'),
  info: wrap('info'),
  warn: wrap('warn'),
  error: wrap('error')
}
