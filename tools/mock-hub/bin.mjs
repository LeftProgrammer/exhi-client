#!/usr/bin/env node
/* eslint-disable no-console */
import { WebSocketServer } from 'ws'
import { createServer } from 'node:http'

/**
 * 简易 Mock 中控：WS 服务 + 同进程 HTTP 控制接口。
 *
 * 启动：
 *   node tools/mock-hub/bin.mjs serve
 *
 * 发指令（任选其一）：
 *   node tools/mock-hub/bin.mjs send cmd.gotoScene --sceneId=image-demo --display=main
 *   node tools/mock-hub/bin.mjs send cmd.volume --value=0.5
 *   node tools/mock-hub/bin.mjs send cmd.reload
 *
 * 协议（与 Runtime 对齐 §12）：
 *   下行：{ id, ts, type, payload, sig? }
 *   上行：{ id, ts, type, deviceId, payload }
 *
 * M2 简化：暂不开启签名校验；客户端 enableSign=false 时直接通过。
 */

const WS_PORT = 18080
const CTL_PORT = 18081

const args = process.argv.slice(2)
const subCmd = args[0]

if (subCmd === 'serve') {
  serve()
} else if (subCmd === 'send') {
  await sendToServing()
} else {
  printHelp()
  process.exit(0)
}

// ============ serve ============

function serve() {
  const wss = new WebSocketServer({ port: WS_PORT })
  const clients = new Set()

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://x')
    const deviceId = url.searchParams.get('deviceId') ?? 'unknown'
    const pkgV = url.searchParams.get('pkgV') ?? '?'
    console.log(`[hub] 客户端上线: deviceId=${deviceId} pkgV=${pkgV}`)
    clients.add(ws)

    ws.on('message', (raw) => {
      try {
        const ev = JSON.parse(raw.toString())
        console.log(`[evt] ${ev.type} ${shortJson(ev.payload)}`)
      } catch {
        console.log('[evt] (non-json)')
      }
    })
    ws.on('close', () => {
      clients.delete(ws)
      console.log(`[hub] 客户端下线: deviceId=${deviceId}`)
    })
    ws.on('error', (err) => console.log('[hub] error:', err.message))
  })

  // 控制端：HTTP POST /send { type, payload }
  const ctl = createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/send') {
      res.statusCode = 404
      return res.end('not found')
    }
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const cmd = {
          id: randomId(),
          ts: Date.now(),
          type: payload.type,
          payload: payload.payload ?? {}
        }
        let n = 0
        for (const c of clients) {
          c.send(JSON.stringify(cmd))
          n++
        }
        console.log(`[cmd→${n}] ${cmd.type} ${shortJson(cmd.payload)}`)
        res.end(JSON.stringify({ ok: true, delivered: n }))
      } catch (e) {
        res.statusCode = 400
        res.end(JSON.stringify({ ok: false, error: e.message }))
      }
    })
  })
  ctl.listen(CTL_PORT, '127.0.0.1', () => {
    console.log(`[hub] WS  listening on  ws://localhost:${WS_PORT}`)
    console.log(`[hub] CTL listening on http://127.0.0.1:${CTL_PORT}/send`)
    console.log('[hub] 等待客户端连接...')
  })
}

// ============ send ============

async function sendToServing() {
  const type = args[1]
  if (!type) {
    console.error('用法: send <cmd.xxx> [--key=value ...]')
    process.exit(1)
  }
  const payload = {}
  for (let i = 2; i < args.length; i++) {
    const m = /^--([^=]+)=(.*)$/.exec(args[i])
    if (!m) continue
    payload[m[1]] = coerce(m[2])
  }
  const res = await fetch(`http://127.0.0.1:${CTL_PORT}/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, payload })
  }).catch((e) => {
    console.error('调用失败：先在另一个终端运行 `node tools/mock-hub/bin.mjs serve`')
    console.error(e.message)
    process.exit(2)
  })
  const text = await res.text()
  console.log(text)
}

// ============ utils ============

function coerce(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function shortJson(obj) {
  if (!obj) return ''
  const s = JSON.stringify(obj)
  return s.length > 120 ? s.slice(0, 117) + '...' : s
}

function printHelp() {
  console.log(`Mock Hub – exhi-client 开发期中控
用法:
  node tools/mock-hub/bin.mjs serve
  node tools/mock-hub/bin.mjs send <cmd.xxx> [--key=value ...]

示例:
  node tools/mock-hub/bin.mjs send cmd.gotoScene --sceneId=image-demo
  node tools/mock-hub/bin.mjs send cmd.gotoScene --sceneId=welcome --display=main
  node tools/mock-hub/bin.mjs send cmd.volume --value=0.5
  node tools/mock-hub/bin.mjs send cmd.reload
`)
}
