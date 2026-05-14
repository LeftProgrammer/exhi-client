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
  /** OTA 升级源（electron-updater feed URL）；为空则禁用 OTA */
  updateFeedUrl: string | null
  /** OTA 通道：stable / beta（也支持任意自定义字符串） */
  updateChannel: string
  /** 启动时自动检查 OTA 一次 */
  autoCheckUpdate: boolean
  /** 本地 HTTP /cmd 鉴权 token，留空则不鉴权（仅 127.0.0.1 可达） */
  localToken: string | null
  /** 本地 HTTP /cmd 每个 cmd.type 的最大频率 (Hz)；默认 30 */
  localCmdMaxHz: number
  /**
   * Chromium device scale factor。默认 1（强制忽略 Windows DPI 缩放）。
   * 笔记本/特殊面板需要按物理像素时设 'auto' 让系统决定；或设具体数字（如 1.5）。
   */
  deviceScaleFactor: number | 'auto'
  /** 关掉硬件加速。低配工控 GPU 驱动有问题时设 true */
  disableHardwareAcceleration: boolean
}

const DEFAULTS: Settings = {
  hubUrl: null,
  hubToken: null,
  hubSecret: null,
  enableSign: false,
  hubDisabled: false,
  updateFeedUrl: null,
  updateChannel: 'stable',
  autoCheckUpdate: false,
  localToken: null,
  localCmdMaxHz: 30,
  deviceScaleFactor: 1,
  disableHardwareAcceleration: false
}

/**
 * 早期读取：只取必须在 app.ready 之前用的几个字段。
 * 没用 electron.app.getPath（那个要 ready），直接拼标准 %APPDATA% 路径。
 */
export function loadSettingsEarly(): Pick<
  Settings,
  'deviceScaleFactor' | 'disableHardwareAcceleration'
> {
  const appdata = process.env['APPDATA'] || ''
  const file = path.join(appdata, 'exhi-client', 'settings.json')
  if (!appdata || !fs.existsSync(file)) {
    return {
      deviceScaleFactor: DEFAULTS.deviceScaleFactor,
      disableHardwareAcceleration: DEFAULTS.disableHardwareAcceleration
    }
  }
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<Settings>
    return {
      deviceScaleFactor: j.deviceScaleFactor ?? DEFAULTS.deviceScaleFactor,
      disableHardwareAcceleration:
        j.disableHardwareAcceleration ?? DEFAULTS.disableHardwareAcceleration
    }
  } catch {
    return {
      deviceScaleFactor: DEFAULTS.deviceScaleFactor,
      disableHardwareAcceleration: DEFAULTS.disableHardwareAcceleration
    }
  }
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
  if (process.env['EXHI_UPDATE_FEED']) fromEnv.updateFeedUrl = process.env['EXHI_UPDATE_FEED']
  if (process.env['EXHI_UPDATE_CHANNEL']) fromEnv.updateChannel = process.env['EXHI_UPDATE_CHANNEL']
  if (process.env['EXHI_AUTO_CHECK_UPDATE'])
    fromEnv.autoCheckUpdate = process.env['EXHI_AUTO_CHECK_UPDATE'] === 'true'

  const merged: Settings = { ...DEFAULTS, ...fromFile, ...fromEnv }
  if (!merged.hubUrl) merged.hubDisabled = true
  return merged
}
