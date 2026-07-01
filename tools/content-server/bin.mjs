#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { parseOption } from '../_shared/utils.mjs'

/**
 * 简易静态内容服务器（开发期 / 测试用）。
 *
 * 用法:
 *   node tools/content-server/bin.mjs [--root=<dir>] [--port=18090]
 *
 * 默认 root = ./build/packages（配合 dist:yushui 用 --root=build/baima-yushui-leaders/packages）
 *
 * 暴露：
 *   GET /<projectId>-<version>/manifest.json
 *   GET /<projectId>-<version>/<rel-path>
 *
 * 实际生产用 nginx 代替即可。
 */

const args = process.argv.slice(2)
const root = path.resolve(parseOption(args, '--root') ?? './build/packages')
const port = Number(parseOption(args, '--port') ?? '18090')

if (!fs.existsSync(root)) {
  console.error(`root 不存在: ${root}`)
  console.error('提示：先运行 npm run dist:yushui 或 dist:milestone 生成项目包')
  console.error(
    '      然后指定路径：npm run content-server -- --root=build/baima-yushui-leaders/packages'
  )
  process.exit(1)
}

const server = http.createServer((req, res) => {
  if (!req.url) return res.end()
  // 解码 + 防穿越
  let urlPath
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  } catch {
    res.statusCode = 400
    return res.end('bad url')
  }
  const full = path.resolve(root, '.' + urlPath)
  if (!full.startsWith(root)) {
    res.statusCode = 403
    return res.end('forbidden')
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.statusCode = 404
    return res.end('not found')
  }
  const stat = fs.statSync(full)
  res.setHeader('content-type', guessType(full))
  res.setHeader('content-length', String(stat.size))
  fs.createReadStream(full).pipe(res)
  console.log(`[content] 200 ${urlPath} (${stat.size}B)`)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`[content] 监听 http://127.0.0.1:${port}/`)
  console.log(`[content] root: ${root}`)
  console.log('[content] 可用包：')
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory()) console.log(`  - http://127.0.0.1:${port}/${e.name}/`)
  }
})

function guessType(p) {
  const ext = path.extname(p).toLowerCase()
  return (
    {
      '.json': 'application/json; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    }[ext] ?? 'application/octet-stream'
  )
}
