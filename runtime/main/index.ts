import { app, BrowserWindow } from 'electron'
import { initLogger, logger } from './logger'
import { applySecurity, registerHotkeyBlocking, unregisterAllHotkeys } from './security'
import { PackageLoader } from './package-loader'
import { WindowManager } from './window-manager'
import { ensureDeviceId, IpcBus } from './ipc'
import { attachProtocolHandler, registerPkgScheme } from './protocol'

/**
 * 主进程入口。
 * 流程：单实例锁 → 日志 → 安全策略 → 等 ready → 加载项目包 → 创建多屏窗口 → 注册 IPC。
 */

initLogger()
applySecurity()
registerPkgScheme() // 必须在 app.ready 之前调用

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
  logger.warn('已有实例在运行，本实例退出')
  app.quit()
  process.exit(0)
}

// Electron 启用后台节流会让非聚焦窗口卡顿，展厅多屏全屏场景必须关掉
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')

app.whenReady().then(async () => {
  try {
    const deviceId = await ensureDeviceId()
    logger.info(`deviceId = ${deviceId}`)

    const loader = new PackageLoader()
    const pkg = loader.load()
    logger.info(`项目包加载成功: ${pkg.manifest.name} (${pkg.manifest.projectId})`)

    attachProtocolHandler(pkg.rootPath)

    const winManager = new WindowManager(pkg)
    const ipcBus = new IpcBus(pkg, winManager, deviceId)
    ipcBus.register()

    winManager.createAll()
    registerHotkeyBlocking()

    app.on('activate', () => {
      // macOS 概念，Windows 一般用不上
      if (BrowserWindow.getAllWindows().length === 0) winManager.createAll()
    })
  } catch (e) {
    logger.error('启动失败:', e)
    // 此处不立即退出，让用户能看到错误页（后续可加错误窗口）
    setTimeout(() => app.quit(), 3000)
  }
})

app.on('window-all-closed', () => {
  // 展厅场景下所有窗口关闭等于退出
  app.quit()
})

app.on('will-quit', () => {
  unregisterAllHotkeys()
  logger.info('应用退出')
})

app.on('second-instance', () => {
  logger.info('第二实例尝试启动，已被单实例锁阻止')
})

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException:', err)
})

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection:', reason)
})
