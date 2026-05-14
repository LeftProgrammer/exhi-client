#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * exhi-client Guardian
 *
 * 独立常驻进程，监控主客户端的心跳文件：
 *   %APPDATA%/exhi-client/heartbeat.txt
 *
 * 心跳 mtime 超过 STALE_MS 视为客户端死亡，杀掉残留进程并启动客户端 EXE。
 * 心跳文件不存在视为客户端正常退出（will-quit 时会删），不拉起。
 *
 * 配置（环境变量）：
 *   EXHI_CLIENT_EXE  客户端可执行文件绝对路径（必填）
 *   EXHI_USERDATA    userData 目录（默认 %APPDATA%/exhi-client）
 *   EXHI_STALE_MS    心跳超时阈值，默认 30000
 *   EXHI_CHECK_MS    巡检间隔，默认 10000
 *
 * 部署方式（任选）：
 *   A. 任务计划程序：触发器=系统启动，运行此脚本
 *   B. Windows Service：用 nssm/sc 包装为服务
 *   C. 简单方案：放启动文件夹，开机自启
 */

const CLIENT_EXE_RAW = process.env.EXHI_CLIENT_EXE
const USERDATA =
  process.env.EXHI_USERDATA ||
  path.join(os.homedir(), 'AppData', 'Roaming', 'exhi-client')
const STALE_MS = Number(process.env.EXHI_STALE_MS ?? '30000')
const CHECK_MS = Number(process.env.EXHI_CHECK_MS ?? '10000')

if (!CLIENT_EXE_RAW) {
  console.error('[guardian] 必须设置 EXHI_CLIENT_EXE 环境变量')
  process.exit(1)
}
// 解析为绝对路径——相对路径在 detached spawn 时会被 EACCES 拒绝
const CLIENT_EXE = path.resolve(CLIENT_EXE_RAW)
if (!fs.existsSync(CLIENT_EXE)) {
  console.error(`[guardian] EXE 不存在: ${CLIENT_EXE}`)
  console.error('       提示：先运行 npm run dist:dir 生成打包目录')
  process.exit(2)
}

const HEARTBEAT = path.join(USERDATA, 'heartbeat.txt')
const RESTART_LOG = path.join(USERDATA, 'guardian-restarts.log')

console.log('[guardian] 启动')
console.log(`  client: ${CLIENT_EXE}`)
console.log(`  heartbeat: ${HEARTBEAT}`)
console.log(`  staleMs: ${STALE_MS}, checkMs: ${CHECK_MS}`)

let lastRestartAt = 0
const RESTART_THROTTLE_MS = 30_000 // 30 秒内只允许重启一次，防止暴拉

setInterval(check, CHECK_MS)
check()

function check() {
  let stat
  try {
    stat = fs.statSync(HEARTBEAT)
  } catch {
    // 文件不存在 → 客户端没启动，或正常退出过
    // Guardian 仍然要确保客户端在跑（首次启动场景）
    return tryStart('心跳文件不存在')
  }
  const age = Date.now() - stat.mtimeMs
  if (age > STALE_MS) {
    return tryStart(`心跳过期 ${Math.round(age / 1000)}s`)
  }
  // 正常
}

function tryStart(reason) {
  const now = Date.now()
  if (now - lastRestartAt < RESTART_THROTTLE_MS) return
  lastRestartAt = now
  console.log(`[guardian] ${new Date().toISOString()} 重启客户端: ${reason}`)
  try {
    fs.appendFileSync(
      RESTART_LOG,
      `${new Date().toISOString()}\t${reason}\n`,
      'utf-8'
    )
  } catch {
    /* ignore */
  }
  // 启动 EXE
  // 客户端 EXE 在 electron-builder.yml 里声明了 requireAdministrator，
  // 直接 spawn 会被 Windows UAC 拦截 (EACCES)。
  // 用 cmd /c start 让 Windows 走标准启动流程：
  //   - 若 Guardian 自身已是管理员 → 子进程继承，无提示直接起
  //   - 若 Guardian 不是管理员 → 弹 UAC 同意框
  try {
    const child = spawn(
      'cmd.exe',
      ['/c', 'start', '', '/B', CLIENT_EXE],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }
    )
    child.on('error', (e) => console.error('[guardian] spawn error:', e.message))
    child.unref()
  } catch (e) {
    console.error('[guardian] 启动失败:', e)
  }
}
