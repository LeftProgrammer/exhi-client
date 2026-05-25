/**
 * electron-builder 动态配置。
 *
 * 必须通过 EXHI_SEED 指定内嵌的种子包（dist-cli 会自动传入）：
 *   EXHI_SEED=baima-yushui-leaders  → 渝水+领导触摸屏 exe
 *   EXHI_SEED=baima-milestone        → 里程碑滑轨屏 exe
 *
 * 种子包来源：build/<id>/packages/<id>/（由 npm run dist:* 生成）
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const seed = process.env['EXHI_SEED']
if (!seed) {
  console.error(
    '[electron-builder] 缺少 EXHI_SEED 环境变量，请用 npm run dist:yushui 或 dist:milestone'
  )
  process.exit(1)
}

const seedFrom = path.join(__dirname, `build/${seed}/packages/${seed}`)

// exe 文件名版本号取项目 manifest.json 的 version，而非根 package.json
// 这样改内容只需改 manifest.json，打出的 exe 文件名自动体现版本
const manifestPath = path.join(seedFrom, 'manifest.json')
const contentVersion = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')).version

/**
 * 命名体系：
 *   exhi     展厅类项目通用前缀
 *   baima    白马展厅项目
 *   *        具体展区
 *
 *   appId:       com.exhi.baima.milestone / com.exhi.baima.yushui
 *   productName: Exhi Baima Milestone / Exhi Baima Yushui（显示名、安装目录、快捷方式）
 *   exe 文件名:  exhi-baima-milestone-{manifest.version}-x64.exe（版本号取项目 manifest.json）
 */
const APP_IDS = {
  'baima-milestone': 'com.exhi.baima.milestone',
  'baima-yushui-leaders': 'com.exhi.baima.yushui'
}
const PRODUCT_NAMES = {
  'baima-milestone': 'Exhi Baima Milestone',
  'baima-yushui-leaders': 'Exhi Baima Yushui'
}
const appId = APP_IDS[seed] ?? `com.exhi.${seed}`
const productName = PRODUCT_NAMES[seed] ?? 'Exhi Client'

/** @type {import('electron-builder').Configuration} */
export default {
  appId,
  productName,
  copyright: 'Copyright © 2026 exhi-team',

  directories: {
    output: `build/${seed}`,
    buildResources: 'build-resources'
  },

  files: [
    'out/**/*',
    'package.json',
    '!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,readme.txt,*.flow,*.mjs.map}',
    '!**/node_modules/.package-lock.json'
  ],

  asar: true,
  asarUnpack: ['resources/**'],

  extraResources: [
    // 内嵌种子包
    {
      from: seedFrom,
      to: `packages/${seed}`,
      filter: ['**/*']
    }
  ],

  // afterPack：写入 default-project.txt，package-loader 据此确定首次加载哪个包
  afterPack: async (context) => {
    const fs = await import('node:fs/promises')
    const resourcesDir = context.appOutDir + '/resources'
    await fs.mkdir(resourcesDir, { recursive: true })
    await fs.writeFile(path.join(resourcesDir, 'default-project.txt'), seed, 'utf-8')
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: `exhi-${seed}-${contentVersion}-\${arch}.\${ext}`,
    requestedExecutionLevel: 'asInvoker'
  },

  nsis: {
    oneClick: false,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: productName
  },

  // OTA 更新源：生产部署前替换为真实地址，或通过 settings.json 的 updateFeedUrl 覆盖
  publish: [
    {
      provider: 'generic',
      url: 'https://example.com/exhi-client/${channel}',
      channel: 'stable',
      updaterCacheDirName: 'exhi-client-updater'
    }
  ]
}
