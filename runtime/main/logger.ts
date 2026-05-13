import log from 'electron-log/main'
import { app } from 'electron'
import path from 'node:path'

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

export const logger = log.scope('main')
