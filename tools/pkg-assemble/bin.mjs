#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * pkg-assemble：把 Vite 工程的 dist/ 输出 + deploy/ 配置，
 * 组装成 pack-cli 可直接消费的可部署包目录。
 *
 * 用法：
 *   node tools/pkg-assemble/bin.mjs [--project=<id>] [--skip-build] [--out=<dir>]
 *
 *   --project     baima-yushui-leaders | baima-milestone（不传则组装全部）
 *   --skip-build  跳过 Vite build（已有 dist/ 时加速）
 *   --out         输出目录（默认 build/packages；dist-cli 会传 build/<projectId>/packages）
 *
 * 输出结构（每个 project）：
 *   <out>/<projectId>/
 *     manifest.json   ← deploy/<projectId>/manifest.json（pack-cli 会追加 files/checksum）
 *     scenes.json
 *     displays.json
 *     bindings.json
 *     contents/
 *       <projectId>/
 *         index.html  ← dist/<projectId>/index.html
 *       assets/       ← dist/assets/（共享 JS/CSS）
 *       <其余 contents 子目录>  ← packages/project/contents/（图片/素材）
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')
const PKG_DIR = path.join(ROOT, 'packages/project')
const DEPLOY_DIR = path.join(PKG_DIR, 'deploy')
const DIST_DIR = path.join(PKG_DIR, 'dist')
const CONTENTS_DIR = path.join(PKG_DIR, 'contents')

const args = process.argv.slice(2)
const projectArg = parseOpt(args, '--project') ?? 'all'
const skipBuild = args.includes('--skip-build')
const outBase = parseOpt(args, '--out') ?? path.join(ROOT, 'build/packages')

// ─── 入口 ────────────────────────────────────────────────────────────────────

const allProjects = await discoverProjects()
const projects = projectArg === 'all' ? allProjects : allProjects.filter((p) => p === projectArg)

if (projects.length === 0) {
  console.error(`[pkg-assemble] 找不到项目: ${projectArg}`)
  console.error(`可用：${allProjects.join(', ')}`)
  process.exit(1)
}

if (!skipBuild) {
  console.log('[pkg-assemble] 运行 Vite build...')
  await runNpm(['run', 'build'], PKG_DIR)
}

for (const project of projects) {
  await assembleProject(project)
}

console.log('[pkg-assemble] 全部完成。')

// ─── 核心：组装单个 project ──────────────────────────────────────────────────

async function assembleProject(project) {
  const deployDir = path.join(DEPLOY_DIR, project)
  const manifestPath = path.join(deployDir, 'manifest.json')

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  const projectId = manifest.projectId
  const outDir = path.join(outBase, projectId)

  console.log(`[pkg-assemble] 组装 ${project} → ${outDir}`)

  // 清空目标
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  // 1. 复制 deploy/ 的四个配置文件
  for (const file of ['manifest.json', 'scenes.json', 'displays.json', 'bindings.json']) {
    await fs.copyFile(path.join(deployDir, file), path.join(outDir, file))
  }

  const contentsOut = path.join(outDir, 'contents')
  await fs.mkdir(contentsOut, { recursive: true })

  // 2. 复制 dist/<projectId>/index.html → contents/<projectId>/index.html
  const screenHtml = path.join(DIST_DIR, projectId, 'index.html')
  if (!(await exists(screenHtml))) {
    throw new Error(`找不到编译产物: ${screenHtml}，请先运行 Vite build`)
  }
  const screenContentsOut = path.join(contentsOut, projectId)
  await fs.mkdir(screenContentsOut, { recursive: true })
  await fs.copyFile(screenHtml, path.join(screenContentsOut, 'index.html'))

  // 3. 复制 dist/assets/ → contents/assets/（JS/CSS 共享块）
  const distAssets = path.join(DIST_DIR, 'assets')
  if (await exists(distAssets)) {
    await copyDir(distAssets, path.join(contentsOut, 'assets'))
  }

  // 4. 复制 packages/project/contents/ 下的静态素材（图片/视频等）
  if (await exists(CONTENTS_DIR)) {
    for (const entry of await fs.readdir(CONTENTS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      // assets/ 由 dist 提供，不从 contents/ 再复制
      if (entry.name === 'assets') continue
      await copyDir(path.join(CONTENTS_DIR, entry.name), path.join(contentsOut, entry.name))
    }
  }

  // 5. 用 pack-cli 计算 SHA256，写回 manifest.json
  console.log(`[pkg-assemble] 计算校验和: ${projectId}`)
  await runNode([path.join(ROOT, 'tools/pack-cli/bin.mjs'), 'build', outDir], ROOT)

  console.log(`[pkg-assemble] ✓ ${projectId} → ${outDir}`)
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

async function discoverProjects() {
  const entries = await fs.readdir(DEPLOY_DIR, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) await copyDir(s, d)
    else await fs.copyFile(s, d)
  }
}

function runNpm(npmArgs, cwd) {
  return runProcess(process.platform === 'win32' ? 'npm.cmd' : 'npm', npmArgs, cwd)
}

function runNode(nodeArgs, cwd) {
  // shell: false，直接传可执行路径，避免含空格的路径在 shell 中被拆分
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, nodeArgs, { cwd, stdio: 'inherit', shell: false })
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`node exit ${code}`))))
    proc.on('error', reject)
  })
}

function runProcess(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))))
    proc.on('error', reject)
  })
}

function parseOpt(args, name) {
  for (const a of args) {
    if (a.startsWith(name + '=')) return a.slice(name.length + 1)
  }
  return null
}
