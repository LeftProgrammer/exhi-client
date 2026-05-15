#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

/**
 * release-cli: 把 electron-builder 的产物组织成 OTA 频道目录。
 *
 * 用法：
 *   node tools/release-cli/bin.mjs publish [--channel=stable] [--src=build] [--out=build/ota]
 *
 * 行为：
 *   1. 从 --src 目录扫描 latest*.yml / *.exe / *.exe.blockmap
 *   2. 复制到 <out>/<channel>/ 目录
 *   3. 打印 feed URL 提示
 *
 * 配合 content-server 起来即可作为 OTA 源：
 *   npm run content-server -- --root=build/ota
 *   → feed URL: http://127.0.0.1:18090/
 *
 * 客户端 settings.json:
 *   { "updateFeedUrl": "http://127.0.0.1:18090", "updateChannel": "stable" }
 */

const args = process.argv.slice(2)
const sub = args[0]

if (sub === 'publish') {
  await publish()
} else {
  console.log(`release-cli
用法:
  node tools/release-cli/bin.mjs publish [--channel=stable] [--src=build] [--out=build/ota]`)
  process.exit(0)
}

async function publish() {
  const channel = parseOption('--channel') ?? 'stable'
  const src = path.resolve(parseOption('--src') ?? 'build')
  const out = path.resolve(parseOption('--out') ?? 'build/ota')

  if (!fs.existsSync(src)) {
    console.error(`[release] src 不存在: ${src}（先运行 npm run dist）`)
    process.exit(1)
  }

  // electron-updater 通用 provider 期望的文件
  const latestYml = channel === 'stable' ? 'latest.yml' : `latest-${channel}.yml`
  const candidates = await fsp.readdir(src)
  const yml = candidates.find(
    (n) => n === latestYml || n === 'latest.yml' || n === 'beta.yml' || n === `${channel}.yml`
  )
  if (!yml) {
    console.error(`[release] 找不到 ${latestYml} 在 ${src} 中`)
    console.error('       检查 electron-builder publish 配置是否生成 yml')
    process.exit(2)
  }

  const dest = path.join(out, channel)
  await fsp.mkdir(dest, { recursive: true })

  // 复制 yml（统一改名为 latest.yml）
  const ymlSrc = path.join(src, yml)
  const ymlDst = path.join(dest, 'latest.yml')
  await fsp.copyFile(ymlSrc, ymlDst)
  console.log(`[release] yml: ${yml} → ${path.relative(process.cwd(), ymlDst)}`)

  // 复制所有 exe / blockmap
  const all = await fsp.readdir(src)
  let copied = 0
  for (const f of all) {
    if (f.endsWith('.exe') || f.endsWith('.exe.blockmap')) {
      const s = path.join(src, f)
      const d = path.join(dest, f)
      await fsp.copyFile(s, d)
      copied++
      console.log(`[release] ${f}`)
    }
  }
  console.log(`[release] 共复制 ${copied} 个二进制文件 → ${dest}`)
  console.log('')
  console.log('启动 OTA 服务器:')
  console.log(`  npm run content-server -- --root=${path.relative(process.cwd(), out)}`)
  console.log('客户端 settings.json:')
  console.log(`  {`)
  console.log(`    "updateFeedUrl": "http://127.0.0.1:18090",`)
  console.log(`    "updateChannel": "${channel}"`)
  console.log(`  }`)
  console.log('触发更新:')
  console.log('  npm run hub:send -- cmd.runtime.update --applyAt=now')
}

function parseOption(name) {
  for (const a of args) if (a.startsWith(name + '=')) return a.slice(name.length + 1)
  return null
}
