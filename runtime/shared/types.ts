/**
 * 客户端与中控/内容/本地代理之间使用的共享类型定义。
 * 三处（main / preload / renderer）共用同一份。
 */

// ============ 项目包配置类型 ============

/** 项目包内单个文件的清单条目（用于增量同步与完整性校验） */
export interface ManifestFile {
  path: string // 相对项目包根的 POSIX 路径，e.g. "contents/intro.mp4"
  size: number // 字节数
  sha256: string // 小写 hex
}

export interface Manifest {
  $schema?: string
  projectId: string
  name: string
  version: string
  runtimeRange: string
  /** 整包校验和（可选；pack-cli 会生成 = 全部文件 sha256 拼接后再 sha256） */
  checksum?: string
  /** 每文件清单。pack-cli 生成；未生成时跳过文件级校验 */
  files?: ManifestFile[]
  createdAt?: string
  author?: string
}

export interface DisplayMatch {
  primary?: boolean
  index?: number
  size?: string // e.g. "1920x1080" / "5760x1080"
  label?: string
  bounds?: { x: number; y: number; width?: number; height?: number }
}

export interface DesignBase {
  width: number
  height: number
}

export type FitPolicy = 'scale' | 'fill' | 'none'

export interface DisplayConfig {
  id: string
  match: DisplayMatch
  designBase: DesignBase
  defaultScene: string
  fitPolicy?: FitPolicy
}

export interface DisplaysConfig {
  displays: DisplayConfig[]
}

// ============ 场景类型 ============

export type SceneType = 'video' | 'image' | 'web' | 'composite'
export type FitMode = 'cover' | 'contain' | 'fill' | 'none'

interface BaseScene {
  type: SceneType
  fit?: FitMode
  syncGroup?: string
  preload?: boolean
}

export interface VideoScene extends BaseScene {
  type: 'video'
  src: string
  loop?: boolean
  muted?: boolean
  autoplay?: boolean
  startAt?: number
  playbackRate?: number
}

export interface ImageScene extends BaseScene {
  type: 'image'
  src: string
}

export interface WebScene extends BaseScene {
  type: 'web'
  src: string
  allowInteraction?: boolean
  transparent?: boolean
  injectBridge?: boolean
}

export interface CompositeScene extends BaseScene {
  type: 'composite'
  layout: 'stack' | 'row' | 'column' | 'grid'
  children: Scene[]
}

export type Scene = VideoScene | ImageScene | WebScene | CompositeScene

export interface ScenesConfig {
  scenes: Record<string, Scene>
}

// ============ Bindings ============

export interface BindingRule {
  on: string // 指令 type，如 'cmd.gotoScene'
  do: string // Action 名，如 'scene.switch'
  params?: Record<string, unknown>
}

export interface MacroStep {
  do: string
  params?: Record<string, unknown>
}

export interface Macro {
  description?: string
  steps: MacroStep[]
}

export interface StandaloneConfig {
  description?: string
  onStartup?: MacroStep[]
  schedule?: unknown[]
}

export interface BindingsConfig {
  bindings: BindingRule[]
  macros?: Record<string, Macro>
  standalone?: StandaloneConfig
}

// ============ 协议消息 ============

export interface Command<P = Record<string, unknown>> {
  id: string
  ts: number
  type: string
  payload?: P
  sig?: string
  source?: CommandSource
}

export type CommandSource = 'hub' | 'bridge' | 'local'

export interface Event<P = Record<string, unknown>> {
  id: string
  ts: number
  type: string
  deviceId: string
  payload?: P
}

// ============ 状态类型 ============

export interface DisplayStatus {
  id: string
  sceneId: string | null
  playState: 'playing' | 'paused' | 'stopped' | 'error'
  position?: number
  duration?: number
}

export interface DeviceStatus {
  deviceId: string
  mode: 'online' | 'standalone'
  uptime: number
  volume: number
  displays: DisplayStatus[]
}

// ============ Boot Info（主进程注入到渲染层）============

export interface BootInfo {
  deviceId: string
  runtimeVersion: string
  packageInfo: {
    projectId: string
    version: string
    path: string
  }
  displayId: string // 当前窗口对应的逻辑 displayId
  display: DisplayConfig
  screen: {
    width: number
    height: number
    scaleFactor: number
  }
}
