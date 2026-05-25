#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * dist-cli：一键打包指定展屏的 exe。
 *
 * 用法：
 *   node tools/dist-cli/bin.mjs <screen-id> [--skip-assemble] [--dir]
 *
 *   screen-id       screen-yushui-leaders | screen-milestone
 *   --skip-assemble 跳过 pkg-assemble（已有 build/packages/ 时加速）
 *   --dir           只打 unpacked 目录，不生成 nsis 安装包（测试用）
 *
 * 流程：
 *   1. pkg-assemble：Vite build → 组装 build/<projectId>/packages/<projectId>/
 *   2. electron-vite build：编译 runtime（out/ 共用，与项目无关）
 *   3. electron-builder：打包 exe → build/<projectId>/，EXHI_SEED 指定内嵌的种子包
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const args = process.argv.slice(2)
const project = args[0]
if (!project) {
  console.error('用法: node tools/dist-cli/bin.mjs <project-id> [--skip-assemble] [--dir]')
  console.error('  project-id: baima-yushui-leaders | baima-milestone')
  process.exit(1)
}
const skipAssemble = args.includes('--skip-assemble')
const dirOnly = args.includes('--dir')

// 读取 projectId（deploy manifest 是静态的，不依赖 assemble）
const deployManifest = path.join(ROOT, `packages/project/deploy/${project}/manifest.json`)
const { projectId } = JSON.parse(await fs.readFile(deployManifest, 'utf-8'))

const packagesOut = path.join(ROOT, `build/${projectId}/packages`)

// 1. 组装项目包 → build/<projectId>/packages/<projectId>/
if (!skipAssemble) {
  console.log(`[dist-cli] 组装项目包: ${project} → build/${projectId}/packages/`)
  await runNode(
    [path.join(ROOT, 'tools/pkg-assemble/bin.mjs'), `--project=${project}`, `--out=${packagesOut}`],
    ROOT
  )
}

// 2. electron-vite build（runtime，out/ 所有项目共用）
console.log('[dist-cli] 编译 runtime...')
await runNpm(['run', 'build'], ROOT)

// 3. 清理旧 exe / blockmap，避免积累历史版本
const buildDir = path.join(ROOT, `build/${projectId}`)
if (
  await fs
    .access(buildDir)
    .then(() => true)
    .catch(() => false)
) {
  for (const f of await fs.readdir(buildDir)) {
    if (f.endsWith('.exe') || f.endsWith('.blockmap') || f.endsWith('.yml')) {
      await fs.rm(path.join(buildDir, f))
    }
  }
}

// 4. electron-builder（注入 EXHI_SEED，输出到 build/<projectId>/）
console.log(`[dist-cli] 打包 exe → build/${projectId}/`)
const builderArgs = ['--config', 'electron-builder.config.mjs']
if (dirOnly) builderArgs.push('--dir')
await runNpx(['electron-builder', ...builderArgs], ROOT, { EXHI_SEED: projectId })

console.log(`[dist-cli] 完成。输出目录: build/${projectId}/`)

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function runNode(nodeArgs, cwd, extraEnv = {}) {
  return runProcess(process.execPath, nodeArgs, cwd, extraEnv)
}

function runNpm(npmArgs, cwd, extraEnv = {}) {
  const isWin = process.platform === 'win32'
  return runProcess(isWin ? 'npm.cmd' : 'npm', npmArgs, cwd, extraEnv, isWin)
}

function runNpx(npxArgs, cwd, extraEnv = {}) {
  const isWin = process.platform === 'win32'
  return runProcess(isWin ? 'npx.cmd' : 'npx', npxArgs, cwd, extraEnv, isWin)
}

function runProcess(cmd, args, cwd, extraEnv = {}, shell = false) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell,
      env: { ...process.env, ...extraEnv }
    })
    proc.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exit ${code}`))
    )
    proc.on('error', reject)
  })
}
