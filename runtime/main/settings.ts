import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'

/**
 * 客户端运行时配置。文件位置：%APPDATA%/exhi-client/settings.json
 *
 * 所有字段可选；缺省时进入纯 Standalone 模式（无中控）。
 *
 * 开发期可不创建此文件；M2 还会通过环境变量覆盖：
 *   EXHI_HUB_URL=ws://localhost:18080
 *   EXHI_HUB_TOKEN=xxx
 *   EXHI_HUB_SECRET=xxx
 *   EXHI_HUB_SIGN=true  （开启签名校验，默认关）
 */
export interface Settings {
  hubUrl: string | null
  hubToken: string | null
  hubSecret: string | null
  enableSign: boolean
  /** 是否禁用整个 WS 通道（纯 Standalone） */
  hubDisabled: boolean
}

const DEFAULTS: Settings = {
  hubUrl: null,
  hubToken: null,
  hubSecret: null,
  enableSign: false,
  hubDisabled: false
}

export function loadSettings(): Settings {
  const file = path.join(app.getPath('userData'), 'settings.json')
  let fromFile: Partial<Settings> = {}
  if (fs.existsSync(file)) {
    try {
      fromFile = JSON.parse(fs.readFileSync(file, 'utf-8'))
      logger.info('已加载 settings.json')
    } catch (e) {
      logger.warn('settings.json 解析失败，使用默认值:', e)
    }
  } else {
    logger.info('未发现 settings.json，使用默认值（Standalone 模式）')
  }

  // 环境变量覆盖
  const fromEnv: Partial<Settings> = {}
  if (process.env['EXHI_HUB_URL']) fromEnv.hubUrl = process.env['EXHI_HUB_URL']
  if (process.env['EXHI_HUB_TOKEN']) fromEnv.hubToken = process.env['EXHI_HUB_TOKEN']
  if (process.env['EXHI_HUB_SECRET']) fromEnv.hubSecret = process.env['EXHI_HUB_SECRET']
  if (process.env['EXHI_HUB_SIGN']) fromEnv.enableSign = process.env['EXHI_HUB_SIGN'] === 'true'

  const merged: Settings = { ...DEFAULTS, ...fromFile, ...fromEnv }
  if (!merged.hubUrl) merged.hubDisabled = true
  return merged
}
