import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'

// 与 runtime/main/protocol.ts 的 DEV_CONTENT_URL 保持一致
const DEV_PORT = 5174

const DEPLOY_DIR = resolve(__dirname, 'deploy')
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|ico|woff2?|mp3|wav)$/i
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
}

const MPA_ENTRIES = [
  'baima-duowei',
  'baima-yushui-leaders',
  'baima-milestone',
  'baima-research',
  'baima-zhineng'
]

/**
 * /baima-duowei 不带尾部斜杠时 302 重定向到 /baima-duowei/
 * 必须带 / 才能让浏览器正确解析 HTML 内的相对路径。
 */
function mpaTrailingSlash(): Plugin {
  return {
    name: 'mpa-trailing-slash',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        for (const entry of MPA_ENTRIES) {
          if (url === `/${entry}`) {
            res.writeHead(302, { Location: `/${entry}/` })
            res.end()
            return
          }
        }
        next()
      })
    }
  }
}

/**
 * 发送本地文件，支持 HTTP Range（206 Partial Content）。
 * 视频/音频 seek 依赖 Range，否则浏览器拿到的是完整文件 200，会导致 seek 失败 / 视频重置回开头。
 */
function sendFileWithRange(
  req: { headers: Record<string, string | string[] | undefined> },
  res: {
    statusCode: number
    setHeader(name: string, value: string | number): void
    end(): void
  },
  file: string
): void {
  const stat = fs.statSync(file)
  const ext = path.extname(file).toLowerCase()
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
  res.setHeader('Accept-Ranges', 'bytes')

  const rangeHeader = req.headers.range
  const range = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null

  if (match) {
    const start = match[1] ? parseInt(match[1], 10) : 0
    const end = match[2] ? parseInt(match[2], 10) : stat.size - 1
    if (start >= stat.size || end >= stat.size || start > end) {
      res.statusCode = 416
      res.setHeader('Content-Range', `bytes */${stat.size}`)
      res.end()
      return
    }
    res.statusCode = 206
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
    res.setHeader('Content-Length', end - start + 1)
    fs.createReadStream(file, { start, end }).pipe(res)
    return
  }

  res.setHeader('Content-Length', stat.size)
  fs.createReadStream(file).pipe(res)
}

/**
 * 开发模式下，从所有 deploy/<pkg>/contents/ 目录提供静态素材。
 * 不依赖 publicDir（publicDir 只能指向单一目录，多项目共用 dev server 时会互相 404）。
 */
function serveDeployContents(): Plugin {
  return {
    name: 'serve-deploy-contents',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        if (!ASSET_RE.test(url)) return next()

        const referer = req.headers.referer ?? ''
        const preferredPkg = MPA_ENTRIES.find((e) => referer.includes(`/${e}/`)) ?? ''

        const pkgs = fs.readdirSync(DEPLOY_DIR, { withFileTypes: true })
        const sorted = pkgs
          .filter((d) => d.isDirectory())
          .sort((a, b) => (a.name === preferredPkg ? -1 : b.name === preferredPkg ? 1 : 0))

        for (const pkg of sorted) {
          const file = path.join(DEPLOY_DIR, pkg.name, 'contents', url)
          if (fs.existsSync(file)) {
            sendFileWithRange(req, res, file)
            return
          }
        }

        // fallback：共享素材目录（deploy/shared/contents/）
        const sharedFile = path.join(DEPLOY_DIR, 'shared', 'contents', url)
        if (fs.existsSync(sharedFile)) {
          sendFileWithRange(req, res, sharedFile)
          return
        }
        next()
      })
    }
  }
}

export default defineConfig(({ command }) => ({
  root: resolve(__dirname, 'src'),
  base: './',
  publicDir: false,
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@shared/styles/tokens" as t;
          @use "@shared/styles/design" as d;
          @use '@shared/styles/transitions' as fx;
        `
      }
    }
  },
  plugins: [vue(), ...(command === 'serve' ? [mpaTrailingSlash(), serveDeployContents()] : [])],
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: '0.0.0.0',
    hmr: { protocol: 'ws', host: '0.0.0.0', port: DEV_PORT, clientPort: DEV_PORT }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        'baima-yushui-leaders': resolve(__dirname, 'src/baima-yushui-leaders/index.html'),
        'baima-milestone': resolve(__dirname, 'src/baima-milestone/index.html'),
        'baima-duowei': resolve(__dirname, 'src/baima-duowei/index.html'),
        'baima-research': resolve(__dirname, 'src/baima-research/index.html'),
        'baima-zhineng': resolve(__dirname, 'src/baima-zhineng/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@baima-yushui': resolve(__dirname, 'src/baima-yushui-leaders'),
      '@baima-milestone': resolve(__dirname, 'src/baima-milestone'),
      '@baima-duowei': resolve(__dirname, 'src/baima-duowei'),
      '@baima-research': resolve(__dirname, 'src/baima-research'),
      '@baima-zhineng': resolve(__dirname, 'src/baima-zhineng'),
      '@assets': resolve(__dirname, 'deploy/baima-yushui-leaders/contents')
    }
  }
}))
