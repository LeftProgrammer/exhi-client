#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

/**
 * dev-helper：开发期调试工具。
 *
 * 用法：
 *   npm run dev:status      显示当前 device-id / 项目包槽 / 心跳 / 离线队列状态
 *   npm run dev:reset       一键清掉所有运行时残留（双槽 / 指针 / 心跳 / 离线队列 / settings）
 *     - 加 --keep-settings 保留 settings.json
 *     - 加 --keep-device 保留 device-id.txt
 *
 * 用于调试场景：换项目包 / 重置环境 / 排查残留数据干扰
 */

const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
const USER_DATA = path.join(APPDATA, 'exhi-client')

const args = process.argv.slice(2)
const sub = args[0]

switch (sub) {
  case 'status':
    showStatus()
    break
  case 'reset':
    resetAll(args.slice(1))
    break
  default:
    printHelp()
    process.exit(0)
}

// ============ status ============

function showStatus() {
  console.log('[dev-helper] userData 目录:', USER_DATA)
  console.log('')

  if (!fs.existsSync(USER_DATA)) {
    console.log('  目录不存在（客户端从未启动过）')
    return
  }

  // device-id
  const deviceIdFile = path.join(USER_DATA, 'device-id.txt')
  if (fs.existsSync(deviceIdFile)) {
    console.log('  device-id:    ', fs.readFileSync(deviceIdFile, 'utf-8').trim())
  } else {
    console.log('  device-id:     （未生成）')
  }

  // settings
  const settingsFile = path.join(USER_DATA, 'settings.json')
  if (fs.existsSync(settingsFile)) {
    try {
      const s = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
      console.log('  settings:      ✓')
      console.log('    hubUrl:        ', s.hubUrl ?? '(none)')
      console.log('    updateFeedUrl: ', s.updateFeedUrl ?? '(none)')
      console.log('    updateChannel: ', s.updateChannel ?? 'stable')
    } catch {
      console.log('  settings:      解析失败')
    }
  } else {
    console.log('  settings:     （无 settings.json，纯 Standalone）')
  }

  // 双槽
  const pkgRoot = path.join(USER_DATA, 'packages')
  const pointerFile = path.join(pkgRoot, 'current.txt')
  if (fs.existsSync(pointerFile)) {
    console.log('  current slot: ', fs.readFileSync(pointerFile, 'utf-8').trim())
  } else {
    console.log('  current slot: （无指针，走 dev fallback 或种子包）')
  }
  for (const slot of ['slot-a', 'slot-b']) {
    const sp = path.join(pkgRoot, slot)
    if (fs.existsSync(sp)) {
      const manifestFile = path.join(sp, 'manifest.json')
      if (fs.existsSync(manifestFile)) {
        try {
          const m = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
          console.log(`  ${slot}:        ${m.projectId} v${m.version}`)
        } catch {
          console.log(`  ${slot}:        (manifest 损坏)`)
        }
      } else {
        console.log(`  ${slot}:        (无 manifest)`)
      }
    }
  }

  // 心跳
  const hbFile = path.join(USER_DATA, 'heartbeat.txt')
  if (fs.existsSync(hbFile)) {
    const stat = fs.statSync(hbFile)
    const ageSec = Math.round((Date.now() - stat.mtimeMs) / 1000)
    try {
      const hb = JSON.parse(fs.readFileSync(hbFile, 'utf-8'))
      console.log(
        `  heartbeat:     pid=${hb.pid}  mtime=${ageSec}s 前  runtime=${hb.runtime ?? '?'}  pkg=${hb.package ?? '?'}`
      )
    } catch {
      console.log(`  heartbeat:     (无法解析) mtime=${ageSec}s 前`)
    }
  } else {
    console.log('  heartbeat:     无（客户端未运行 / 已正常退出）')
  }

  // 离线队列
  const queueFile = path.join(USER_DATA, 'offline-queue.ndjson')
  if (fs.existsSync(queueFile)) {
    const stat = fs.statSync(queueFile)
    const raw = fs.readFileSync(queueFile, 'utf-8')
    const count = raw.split('\n').filter((l) => l.trim()).length
    console.log(`  offline-queue: ${count} 条事件，文件 ${(stat.size / 1024).toFixed(1)}KB`)
  } else {
    console.log('  offline-queue: 空')
  }

  // 日志目录
  const logDir = path.join(USER_DATA, 'logs')
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir).filter((f) => f.endsWith('.log'))
    console.log(
      `  logs:          ${files.length} 个文件，最新: ${files.sort().reverse()[0] ?? '?'}`
    )
  }
}

// ============ reset ============

function resetAll(opts) {
  const keepSettings = opts.includes('--keep-settings')
  const keepDevice = opts.includes('--keep-device')

  console.log('[dev-helper] 重置 userData:', USER_DATA)
  if (!fs.existsSync(USER_DATA)) {
    console.log('  目录不存在，无需重置')
    return
  }

  const toRemove = ['packages', 'heartbeat.txt', 'offline-queue.ndjson', 'logs']
  if (!keepDevice) toRemove.push('device-id.txt')
  if (!keepSettings) toRemove.push('settings.json')

  for (const name of toRemove) {
    const p = path.join(USER_DATA, name)
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true })
      console.log(`  ✓ 删除 ${name}`)
    }
  }
  console.log('[dev-helper] 重置完成')
  if (keepDevice) console.log('  (保留了 device-id.txt)')
  if (keepSettings) console.log('  (保留了 settings.json)')
}

function printHelp() {
  console.log(`dev-helper – 展厅客户端开发期调试工具

用法:
  npm run dev:status        显示当前运行时数据状态
  npm run dev:reset         清空所有运行时残留
  npm run dev:reset -- --keep-settings   清空但保留 settings.json
  npm run dev:reset -- --keep-device     清空但保留 device-id.txt

userData 目录: ${USER_DATA}
`)
}
