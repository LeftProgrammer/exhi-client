import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { logger } from './logger'
import type { HubConfig } from '@shared/types'

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
 *   EXHI_HUB_TRANSPORT=uec  （走 UEC 转发中继，默认 native 直连）
 *   EXHI_HUB_ID=123456      （UEC 本端信箱 id，留空回退 deviceId）
 *   EXHI_HUB_TARGET=654321  （UEC 中控信箱 id，发送 to 目标）
 */
export interface Settings {
  hubUrl: string | null
  hubToken: string | null
  hubSecret: string | null
  enableSign: boolean
  /**
   * 中控传输协议：
   *  - 'native'（默认）：直连中控，收到的即 Command，心跳用 WS ping/pong
   *  - 'uec'：走 UEC 转发中继（www.zzqxs.cn/uec），连接带 ?id=，
   *           发送包裹成 { to, msg }，心跳用字符串 "heartbeat"
   */
  hubTransport: 'native' | 'uec'
  /** UEC 模式：本端信箱 id（拼到 ?id=）；留空回退到 deviceId */
  hubId: string | null
  /** UEC 模式：中控信箱 id（发送时 { to } 的目标），UEC 模式必填 */
  hubTarget: string | null
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
  hubTransport: 'native',
  hubId: null,
  hubTarget: null,
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
 * 中控连接子系统的统一默认配置。
 * 供项目包 hub.json 和 WsClient 运行时共享，一处修改全局生效。
 */
export const HUB_DEFAULTS = {
  url: 'wss://www.zzqxs.cn/uec/UECServer/ws/webSocketServer.do' as string | null,
  transport: 'uec' as const,
  id: '123456789' as string | null,
  target: '123456789' as string | null,
  token: null as string | null,
  enableSign: false,
  heartbeatIntervalMs: 20_000,  // UEC 示例心跳间隔
  heartbeatTimeoutMs: 40_000,   // 超时 > 间隔，给服务端回包留余量
  reconnectBaseMs: 3_000,       // UEC 示例重连延迟
  reconnectMaxMs: 30_000,
  offlineQueueMax: 2_000,
  offlineQueueMaxBytes: 10 * 1024 * 1024 // 10MB
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

/** 把项目包 hub.json 映射成 Settings 的中控字段；缺失项用 HUB_DEFAULTS 兜底 */
function projectHubLayer(projectHub?: HubConfig | null): Partial<Settings> {
  return {
    hubUrl: projectHub?.url ?? HUB_DEFAULTS.url,
    hubTransport: projectHub?.transport ?? HUB_DEFAULTS.transport,
    hubId: projectHub?.id ?? HUB_DEFAULTS.id,
    hubTarget: projectHub?.target ?? HUB_DEFAULTS.target,
    hubToken: projectHub?.token ?? HUB_DEFAULTS.token
  }
}

/**
 * 加载设备配置。
 * @param projectHub 可选的项目包级 hub.json；优先级低于 settings.json / 环境变量，高于内置默认。
 *   合并优先级：环境变量 > settings.json > 项目包 hub.json > 内置默认。
 */
export function loadSettings(projectHub?: HubConfig | null): Settings {
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
  if (process.env['EXHI_HUB_TRANSPORT'])
    fromEnv.hubTransport = process.env['EXHI_HUB_TRANSPORT'] === 'uec' ? 'uec' : 'native'
  if (process.env['EXHI_HUB_ID']) fromEnv.hubId = process.env['EXHI_HUB_ID']
  if (process.env['EXHI_HUB_TARGET']) fromEnv.hubTarget = process.env['EXHI_HUB_TARGET']
  if (process.env['EXHI_UPDATE_FEED']) fromEnv.updateFeedUrl = process.env['EXHI_UPDATE_FEED']
  if (process.env['EXHI_UPDATE_CHANNEL']) fromEnv.updateChannel = process.env['EXHI_UPDATE_CHANNEL']
  if (process.env['EXHI_AUTO_CHECK_UPDATE'])
    fromEnv.autoCheckUpdate = process.env['EXHI_AUTO_CHECK_UPDATE'] === 'true'

  // 合并优先级：环境变量 > settings.json > 项目包 hub.json > 内置默认
  const merged: Settings = {
    ...DEFAULTS,
    ...projectHubLayer(projectHub),
    ...fromFile,
    ...fromEnv
  }
  if (!merged.hubUrl) merged.hubDisabled = true
  return merged
}
