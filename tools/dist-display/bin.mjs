#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * dist-display：按屏变体打包项目。
 * 只操作文件系统 + 调用 dist-cli，不改动任何工具链。
 *
 * 用法：
 *   node tools/dist-display/bin.mjs <project-id> [display-variant]
 *
 *   display-variant: main | top-left | bottom-left | top-right | bottom-right | all
 *   main 使用根目录 displays.json，其他使用 displays/<variant>.json
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const args = process.argv.slice(2)
const project = args[0]
const display = args[1]

if (!project) {
  console.error('用法: node tools/dist-display/bin.mjs <project-id> [display-variant]')
  console.error('  display-variant: main | top-left | bottom-left | top-right | bottom-right | all')
  process.exit(1)
}

const deployDir = path.join(ROOT, 'packages/project/deploy', project)
const defaultDisplays = path.join(deployDir, 'displays.json')
const variantsDir = path.join(deployDir, 'displays')

const VARIANTS = ['main', 'top-left', 'bottom-left', 'top-right', 'bottom-right']

async function build(variant) {
  const variantFile = path.join(variantsDir, `${variant}.json`)
  const useVariant = variant !== 'main' || (await exists(variantFile))
  const sourceFile = useVariant ? variantFile : defaultDisplays

  if (useVariant && !(await exists(variantFile))) {
    console.error(`[dist-display] 找不到变体配置: ${variantFile}`)
    process.exit(1)
  }

  // 备份根目录 displays.json
  const backupFile = path.join(deployDir, 'displays.json.bak')
  let restored = false

  try {
    if (useVariant) {
      await fs.copyFile(defaultDisplays, backupFile)
      await fs.copyFile(sourceFile, defaultDisplays)
      console.log(`[dist-display] 已替换 displays.json → ${variant}`)
    }

    // 先清理旧产物，避免 electron-builder 清理 win-unpacked 时 app.asar 被锁定
    const buildDir = path.join(ROOT, `build/${project}`)
    try {
      await fs.rm(buildDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }

    // 调用 dist-cli 正常打包
    console.log(`[dist-display] 开始打包: ${project}`)
    await runNode([path.join(ROOT, 'tools/dist-cli/bin.mjs'), project], ROOT)

    // 重命名产物目录
    const variantBuildDir = path.join(ROOT, `build/${project}-${variant}`)
    try {
      await fs.rm(variantBuildDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    await fs.rename(buildDir, variantBuildDir)
    console.log(`[dist-display] ✓ ${variant} 产物 → build/${project}-${variant}/`)
  } finally {
    if (useVariant && !restored) {
      try {
        await fs.copyFile(backupFile, defaultDisplays)
        await fs.unlink(backupFile)
        console.log('[dist-display] 已恢复 displays.json')
        restored = true
      } catch {
        /* ignore */
      }
    }
  }
}

async function main() {
  if (!display || display === 'all') {
    for (const v of VARIANTS) {
      console.log(`\n========== 开始打包: ${v} ==========`)
      await build(v)
    }
  } else {
    if (!VARIANTS.includes(display)) {
      console.error(`[dist-display] 未知变体: ${display}`)
      process.exit(1)
    }
    await build(display)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

function runNode(nodeArgs, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, nodeArgs, { cwd, stdio: 'inherit', shell: false })
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`node exit ${code}`))))
    proc.on('error', reject)
  })
}
