/**
 * 客户端运行常量。
 */

/**
 * 兜底版本号。
 * 主进程实际应使用 app.getVersion()，仅在该 API 不可用时回退到此常量。
 * 渲染层 / preload 通过 BootInfo.runtimeVersion 间接拿到主进程注入的真实值。
 */
export const RUNTIME_VERSION = '0.0.0-fallback'

/** 本地 HTTP 服务端口（exhibitBridge 兜底通道 + 本地代理入口） */
export const LOCAL_SERVER_PORT = 17600

/** WebSocket 心跳与重连参数 */
export const WS_HEARTBEAT_INTERVAL_MS = 30_000
export const WS_HEARTBEAT_TIMEOUT_MS = 60_000
export const WS_RECONNECT_BASE_MS = 1_000
export const WS_RECONNECT_MAX_MS = 30_000

/** IPC 通道名 */
export const IPC = {
  // 主 → 渲染
  COMMAND: 'exhi:command',
  STATE_PUSH: 'exhi:state-push',
  BOOT_INFO: 'exhi:boot-info',
  BRIDGE_EVENT_FROM_MAIN: 'exhi:bridge-event-from-main',
  // 渲染 → 主
  REPORT_STATUS: 'exhi:report-status',
  LOG: 'exhi:log',
  READ_PACKAGE_FILE: 'exhi:read-package-file',
  GET_BOOT_INFO: 'exhi:get-boot-info',
  DISPATCH_BRIDGE_CMD: 'exhi:dispatch-bridge-cmd',
  BRIDGE_EMIT: 'exhi:bridge-emit',
  RUN_SYSTEM_ACTION: 'exhi:run-system-action'
} as const

/** 项目包相关路径（相对 userData / ProgramData） */
export const PACKAGE_DIR = 'packages'
export const PACKAGE_SLOT_A = 'slot-a'
export const PACKAGE_SLOT_B = 'slot-b'
export const PACKAGE_POINTER_FILE = 'current.txt'

/** 错误码 */
export const ErrorCode = {
  AUTH: 'E_AUTH',
  SIG: 'E_SIG',
  CMD_UNKNOWN: 'E_CMD_UNKNOWN',
  SCENE_NOTFOUND: 'E_SCENE_NOTFOUND',
  RESOURCE_MISSING: 'E_RESOURCE_MISSING',
  PACKAGE_INVALID: 'E_PACKAGE_INVALID',
  RENDERER_CRASH: 'E_RENDERER_CRASH',
  INTERNAL: 'E_INTERNAL'
} as const
