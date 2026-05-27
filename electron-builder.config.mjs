/**
 * electron-builder 动态配置。
 *
 * 必须通过 EXHI_SEED 指定内嵌的种子包（dist-cli 会自动传入）：
 *   EXHI_SEED=baima-yushui-leaders  → 渝水+领导触摸屏
 *   EXHI_SEED=baima-milestone        → 里程碑滑轨屏
 *   EXHI_SEED=baima-duowei           → 多维筑安
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
    '[electron-builder] 缺少 EXHI_SEED 环境变量，请用 npm run dist:yushui / dist:milestone / dist:duowei'
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
 *   appId:          com.exhi.baima.<展区>
 *   productName:    智慧展厅·白马·<展区>（任务管理器显示名、快捷方式）
 *   executableName: exhi-baima-<展区>（安装目录下的 exe 文件名）
 *   artifactName:   exhi-baima-<展区>-<version>-x64.exe（安装包文件名）
 */
const PROJECTS = {
  'baima-milestone': { appId: 'com.exhi.baima.milestone', displayName: '智慧展厅·白马·里程碑' },
  'baima-yushui-leaders': { appId: 'com.exhi.baima.yushui', displayName: '智慧展厅·白马·渝水' },
  'baima-duowei': { appId: 'com.exhi.baima.duowei', displayName: '智慧展厅·白马·多维筑安' }
}
const project = PROJECTS[seed] ?? { appId: `com.exhi.${seed}`, displayName: 'Exhi Client' }
const appId = project.appId
const productName = project.displayName

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
    await fs.writeFile(path.join(resourcesDir, 'product-name.txt'), productName, 'utf-8')
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    executableName: `exhi-${seed}`,
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
