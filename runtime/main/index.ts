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
import { RuntimeUpdater } from './runtime-updater'
import { ScheduledRestart } from './scheduled-restart'
import { Heartbeat } from './heartbeat'
import { RemoteLogReporter } from './remote-log'
import { MetricsReporter } from './metrics'
import { DiagHandler } from './diag'
import type { Command } from '@shared/types'

// app.getVersion() 读 package.json 实际版本，OTA 升级后能反映新版本号
const APP_VERSION = app.getVersion()

/**
 * 主进程入口。
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
let scheduledRestart: ScheduledRestart | null = null
let heartbeat: Heartbeat | null = null
let remoteLog: RemoteLogReporter | null = null
let metrics: MetricsReporter | null = null

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

    // Runtime OTA
    let runtimeUpdater: RuntimeUpdater | null = null
    if (settings.updateFeedUrl) {
      runtimeUpdater = new RuntimeUpdater(
        settings.updateFeedUrl,
        settings.updateChannel,
        deviceId,
        () => wsClient
      )
      runtimeUpdater.init()
      logger.info(
        `Runtime OTA 启用: feed=${settings.updateFeedUrl} channel=${settings.updateChannel}`
      )
    } else {
      logger.info('Runtime OTA 未配置（updateFeedUrl 为空）')
    }

    const mainBus = new MainBus()
    const winManager = new WindowManager(pkg, deviceId, () => wsClient)
    const ipcBus = new IpcBus(pkg, winManager, deviceId, mainBus, () => wsClient)
    ipcBus.register()

    const diag = new DiagHandler(deviceId, winManager, () => wsClient)

    // WS 客户端
    if (!settings.hubDisabled) {
      wsClient = new WsClient(settings, deviceId, pkg.manifest.version)
      wsClient.on('command', (cmd) => mainBus.emit('command', cmd))
      wsClient.on('modeChanged', (mode) => logger.info(`WS 模式切换: ${mode}`))
      wsClient.start()
    }

    // 主进程级指令拦截：包更新 + 诊断指令
    mainBus.on('command', async (cmd: Command) => {
      if (cmd.type === 'cmd.package.update') {
        await updater.handle(cmd)
      } else if (cmd.type === 'cmd.package.cancel') {
        const cancelled = updater.cancelPending()
        logger.info(`package.cancel: ${cancelled ? 'ok' : 'no-pending'}`)
      } else if (cmd.type.startsWith('cmd.diag.')) {
        await diag.handle(cmd)
      } else if (cmd.type === 'cmd.runtime.update') {
        if (runtimeUpdater) await runtimeUpdater.handle(cmd)
        else logger.warn('cmd.runtime.update 被忽略：未配置 updateFeedUrl')
      } else if (cmd.type === 'cmd.runtime.cancel') {
        if (runtimeUpdater) runtimeUpdater.cancelPending()
      }
    })

    // 本地 HTTP
    localServer = new LocalServer(mainBus, () => ({
      ok: true,
      deviceId,
      runtime: APP_VERSION,
      package: pkg.manifest.projectId,
      packageVersion: pkg.manifest.version,
      mode: wsClient?.mode ?? 'standalone',
      uptime: Math.floor(process.uptime())
    }))
    await localServer.start()

    // 创建窗口
    winManager.createAll()
    registerHotkeyBlocking()

    // 定时刷新（每天 04:00）
    scheduledRestart = new ScheduledRestart(winManager, 4, 0)
    scheduledRestart.start()

    // 心跳文件（供 Guardian 监测）
    heartbeat = new Heartbeat(5_000, () => ({
      runtime: APP_VERSION,
      package: pkg.manifest.projectId,
      version: pkg.manifest.version
    }))
    await heartbeat.start()

    // 远程日志上报
    remoteLog = new RemoteLogReporter(deviceId, () => wsClient)
    remoteLog.start()

    // 健康指标
    metrics = new MetricsReporter(deviceId, () => wsClient, 10_000)
    metrics.start()

    // 上线事件
    wsClient?.publish({
      id: `boot-${Date.now().toString(36)}`,
      ts: Date.now(),
      deviceId,
      type: 'evt.online',
      payload: {
        runtime: APP_VERSION,
        package: { id: pkg.manifest.projectId, version: pkg.manifest.version },
        displays: pkg.displays.displays.map((d) => d.id),
        mode: wsClient?.mode ?? 'standalone'
      }
    })

    // Standalone 启动步骤
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
  scheduledRestart?.stop()
  metrics?.stop()
  remoteLog?.stop()
  heartbeat?.stop()
  wsClient?.stop()
  await localServer?.stop()
  logger.info('应用退出')
})

app.on('second-instance', () => {
  logger.info('第二实例尝试启动，已被单实例锁阻止')
})

process.on('uncaughtException', (err) => logger.error('uncaughtException:', err))
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection:', reason))
