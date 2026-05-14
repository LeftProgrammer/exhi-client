#!/usr/bin/env node
/* eslint-disable no-console */
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * pack-cli：项目包构建工具。
 *
 * 用法：
 *   node tools/pack-cli/bin.mjs build <package-dir> [--out=<dist-dir>]
 *
 * 行为：
 *   1. 扫描 <package-dir> 下所有文件（除 manifest.json 本身以外）
 *   2. 计算每文件 size + sha256，生成 files[]
 *   3. 算聚合 checksum
 *   4. 把 files 与 checksum 写回 manifest.json（保留其它字段）
 *   5. 复制整个包到 --out 目录（默认 build/packages/<projectId>-<version>/）
 *
 * 输出可直接被中控通过 cmd.package.update 拉取（HTTP 静态服务暴露即可）。
 *
 * 不打 zip：HTTP 增量同步逐文件下载，zip 反而要全量重传。
 * 真要离线分发可在 build 后用 7z 手动打包。
 */

const args = process.argv.slice(2)
const sub = args[0]

if (sub === 'build') {
  const dir = args[1]
  if (!dir) {
    console.error('用法: build <package-dir> [--out=<dist-dir>]')
    process.exit(1)
  }
  const out = parseOption(args, '--out')
  await build(path.resolve(dir), out ? path.resolve(out) : null)
} else if (sub === 'verify') {
  const dir = args[1]
  if (!dir) {
    console.error('用法: verify <package-dir>')
    process.exit(1)
  }
  await verify(path.resolve(dir))
} else {
  printHelp()
  process.exit(0)
}

// ============ build ============

async function build(srcDir, outBase) {
  console.log(`[pack-cli] 构建 ${srcDir}`)
  const manifestPath = path.join(srcDir, 'manifest.json')
  let manifest = {}
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  } catch {
    console.error('找不到或无法解析 manifest.json')
    process.exit(2)
  }

  // 扫描文件
  const files = []
  await walk(srcDir, srcDir, files)
  console.log(`[pack-cli] 扫描到 ${files.length} 个文件，计算 sha256...`)

  const fileEntries = []
  for (const f of files) {
    const sha = await sha256File(f.absolute)
    fileEntries.push({
      path: f.relative,
      size: f.size,
      sha256: sha
    })
  }
  fileEntries.sort((a, b) => a.path.localeCompare(b.path))

  // 聚合 checksum
  const aggHash = createHash('sha256')
  for (const e of fileEntries) aggHash.update(e.path + ':' + e.sha256 + '\n')
  const checksum = aggHash.digest('hex')

  manifest.files = fileEntries
  manifest.checksum = checksum
  manifest.createdAt = new Date().toISOString()

  // 写回 manifest（原地）
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`[pack-cli] 已写入 manifest.json: files=${fileEntries.length} checksum=${checksum.slice(0, 12)}...`)

  // 复制到 --out
  if (outBase) {
    const outDir = path.join(
      outBase,
      `${manifest.projectId ?? 'package'}-${manifest.version ?? '0.0.0'}`
    )
    await fs.rm(outDir, { recursive: true, force: true })
    await copyDir(srcDir, outDir)
    console.log(`[pack-cli] 已输出: ${outDir}`)
  }

  console.log('[pack-cli] OK')
}

// ============ verify ============

async function verify(dir) {
  const manifestPath = path.join(dir, 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  if (!manifest.files?.length) {
    console.error('manifest 缺少 files，跳过校验')
    process.exit(2)
  }
  let bad = 0
  for (const f of manifest.files) {
    const full = path.join(dir, f.path)
    try {
      const stat = await fs.stat(full)
      if (stat.size !== f.size) {
        console.error(`size mismatch: ${f.path}`)
        bad++
        continue
      }
      const got = await sha256File(full)
      if (got !== f.sha256) {
        console.error(`sha256 mismatch: ${f.path}`)
        bad++
      }
    } catch (e) {
      console.error(`missing: ${f.path} (${e.message})`)
      bad++
    }
  }
  if (bad === 0) {
    console.log(`[pack-cli] verify OK (${manifest.files.length} files)`)
  } else {
    console.error(`[pack-cli] verify FAILED: ${bad}/${manifest.files.length} files broken`)
    process.exit(3)
  }
}

// ============ utils ============

async function walk(rootDir, dir, out) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(rootDir, full, out)
    } else {
      const rel = path.relative(rootDir, full).split(path.sep).join('/')
      if (rel === 'manifest.json') continue
      const stat = await fs.stat(full)
      out.push({ absolute: full, relative: rel, size: stat.size })
    }
  }
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256')
    const s = createReadStream(filePath)
    s.on('data', (c) => h.update(c))
    s.on('end', () => resolve(h.digest('hex')))
    s.on('error', reject)
  })
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

function parseOption(args, name) {
  for (const a of args) {
    if (a.startsWith(name + '=')) return a.slice(name.length + 1)
  }
  return null
}

function printHelp() {
  console.log(`pack-cli – 项目包构建工具

用法:
  node tools/pack-cli/bin.mjs build <package-dir> [--out=<dist-dir>]
  node tools/pack-cli/bin.mjs verify <package-dir>

build:
  扫描目录所有文件 → 计算 SHA256 → 写回 manifest.json 的 files 与 checksum
  --out 指定时，把整包复制到该目录的 <projectId>-<version>/ 子目录

verify:
  按 manifest.files 逐项校验 size 与 sha256
`)
}
