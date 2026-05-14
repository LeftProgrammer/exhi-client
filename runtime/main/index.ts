import { app, BrowserWindow } from 'electron'
import { initLogger, logger } from './logger'
import { applySecurity, registerHotkeyBlocking, unregisterAllHotkeys } from './security'
import { PackageLoader } from './package-loader'
import { WindowManager } from './window-manager'
import { ensureDeviceId, IpcBus, MainBus } from './ipc'
import { attachProtocolHandler, registerPkgScheme } from './protocol'
import { loadSettings } from './settings'
import { WsClient } from './ws-client'
import { LocalServer } from './local-server'
import { StandaloneScheduler } from './standalone'
import { PackageUpdater } from './package-updater'
import { RUNTIME_VERSION } from '@shared/constants'
import type { Command } from '@shared/types'

/**
 * 主进程入口。
 * 启动顺序：日志 → 安全 → 协议注册 → 单实例锁 → ready → 项目包 → WS/Local/IPC → 窗口 → Standalone 启动
 */

initLogger()
applySecurity()
registerPkgScheme()

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
  logger.warn('已有实例在运行，本实例退出')
  app.quit()
  process.exit(0)
}

app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.commandLine.appendSwitch('high-dpi-support', '1')

let wsClient: WsClient | null = null
let localServer: LocalServer | null = null

app.whenReady().then(async () => {
  try {
    const deviceId = await ensureDeviceId()
    logger.info(`deviceId = ${deviceId}`)

    const settings = loadSettings()
    logger.info(
      `Settings: hubUrl=${settings.hubUrl ?? '(disabled)'} enableSign=${settings.enableSign}`
    )

    const loader = new PackageLoader()
    const pkg = loader.load()
    logger.info(`项目包加载成功: ${pkg.manifest.name} (${pkg.manifest.projectId})`)
    attachProtocolHandler(pkg.rootPath)

    const updater = new PackageUpdater(loader, deviceId, () => wsClient)

    const mainBus = new MainBus()
    const winManager = new WindowManager(pkg)
    const ipcBus = new IpcBus(pkg, winManager, deviceId, mainBus, () => wsClient)
    ipcBus.register()

    // WS 客户端
    if (!settings.hubDisabled) {
      wsClient = new WsClient(settings, deviceId, pkg.manifest.version)
      wsClient.on('command', (cmd) => mainBus.emit('command', cmd))
      wsClient.on('modeChanged', (mode) => logger.info(`WS 模式切换: ${mode}`))
      wsClient.start()
    }

    // 项目包更新指令：截胡 cmd.package.update / cmd.package.cancel，不下到渲染层
    mainBus.on('command', async (cmd: Command) => {
      if (cmd.type === 'cmd.package.update') {
        await updater.handle(cmd)
      } else if (cmd.type === 'cmd.package.cancel') {
        const cancelled = updater.cancelPending()
        logger.info(`package.cancel: ${cancelled ? 'ok' : 'no-pending'}`)
      }
    })

    // 本地 HTTP
    localServer = new LocalServer(mainBus, () => ({
      ok: true,
      deviceId,
      runtime: RUNTIME_VERSION,
      package: pkg.manifest.projectId,
      packageVersion: pkg.manifest.version,
      mode: wsClient?.mode ?? 'standalone',
      uptime: Math.floor(process.uptime())
    }))
    await localServer.start()

    // 创建窗口（注意：必须在 IPC 注册后，避免渲染层先于 IPC 启动）
    winManager.createAll()
    registerHotkeyBlocking()

    // 上线事件
    wsClient?.publish({
      id: `boot-${Date.now().toString(36)}`,
      ts: Date.now(),
      deviceId,
      type: 'evt.online',
      payload: {
        runtime: RUNTIME_VERSION,
        package: { id: pkg.manifest.projectId, version: pkg.manifest.version },
        displays: pkg.displays.displays.map((d) => d.id),
        mode: wsClient?.mode ?? 'standalone'
      }
    })

    // Standalone 启动步骤（等窗口 ready 后再触发，给渲染层时间初始化）
    setTimeout(() => {
      const scheduler = new StandaloneScheduler(mainBus, pkg.bindings)
      scheduler.runOnStartup()
    }, 1500)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) winManager.createAll()
    })
  } catch (e) {
    logger.error('启动失败:', e)
    setTimeout(() => app.quit(), 3000)
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('will-quit', async () => {
  unregisterAllHotkeys()
  wsClient?.stop()
  await localServer?.stop()
  logger.info('应用退出')
})

app.on('second-instance', () => {
  logger.info('第二实例尝试启动，已被单实例锁阻止')
})

process.on('uncaughtException', (err) => logger.error('uncaughtException:', err))
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection:', reason))
