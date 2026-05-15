#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 启动指定项目包的 Vite dev server（带 HMR）。
 *
 * 用法：
 *   npm run dev:content baima-exhibition
 *   npm run dev:content packages/baima-exhibition   (也支持完整路径)
 *
 * 启动后：
 *   - Vite 监听 5174（项目包 vite.config.ts 配的端口）
 *   - Runtime 的 exhi-pkg:// 协议会优先去 5174 拿 HTML/JS/CSS（dev 代理）
 *   - 改项目包 src/ 文件即时 HMR 到 Electron 窗口
 *
 * 配合：
 *   终端 1: npm run hub
 *   终端 2: npm run dev:content baima-exhibition
 *   终端 3: npm run dev:online
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

const arg = process.argv[2]
if (!arg) {
  console.error('用法: npm run dev:content <package-id-or-path>')
  console.error('  例如：npm run dev:content baima-exhibition')
  process.exit(1)
}

// 支持 "baima-exhibition" 或 "packages/baima-exhibition" 两种写法
const pkgDir = arg.startsWith('packages/')
  ? path.resolve(ROOT, arg)
  : path.resolve(ROOT, 'packages', arg)

if (!fs.existsSync(pkgDir)) {
  console.error(`找不到项目包: ${pkgDir}`)
  process.exit(2)
}

const viteConfig = path.join(pkgDir, 'vite.config.ts')
const viteConfigJs = path.join(pkgDir, 'vite.config.js')
if (!fs.existsSync(viteConfig) && !fs.existsSync(viteConfigJs)) {
  console.error(`项目包不是 Vite 工程（缺 vite.config.ts/js）: ${pkgDir}`)
  console.error('提示：旧式纯 HTML 项目包不需要 dev server，直接 npm run dev:online 即可')
  process.exit(3)
}

console.log(`[content-dev] 启动 Vite dev server: ${pkgDir}`)
console.log('[content-dev] 监听 http://127.0.0.1:5174')
console.log('[content-dev] 在另一个终端运行 npm run dev:online 让 Electron 连入')
console.log('')

const isWindows = process.platform === 'win32'
// Windows 上 spawn .cmd 必须 shell:true（Node 20.12+ 安全策略）
const proc = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: pkgDir,
  stdio: 'inherit',
  shell: isWindows
})

proc.on('exit', (code) => process.exit(code ?? 0))
proc.on('error', (err) => {
  console.error('[content-dev] 启动失败:', err)
  process.exit(4)
})
