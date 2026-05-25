import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'

// 与 runtime/main/protocol.ts 的 DEV_CONTENT_URL 保持一致
const DEV_PORT = 5174

const DEPLOY_DIR = resolve(__dirname, 'deploy')
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|ico|woff2?)$/i
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
  '.woff2': 'font/woff2'
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
        const pkgs = fs.readdirSync(DEPLOY_DIR, { withFileTypes: true })
        for (const pkg of pkgs) {
          if (!pkg.isDirectory()) continue
          const file = path.join(DEPLOY_DIR, pkg.name, 'contents', url)
          if (fs.existsSync(file)) {
            const ext = path.extname(file).toLowerCase()
            res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
            res.setHeader('Content-Length', fs.statSync(file).size)
            fs.createReadStream(file).pipe(res)
            return
          }
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
  plugins: [vue(), ...(command === 'serve' ? [serveDeployContents()] : [])],
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: '127.0.0.1',
    hmr: { protocol: 'ws', host: '127.0.0.1', port: DEV_PORT, clientPort: DEV_PORT }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        'baima-yushui-leaders': resolve(__dirname, 'src/baima-yushui-leaders/index.html'),
        'baima-milestone': resolve(__dirname, 'src/baima-milestone/index.html'),
        'baima-duowei': resolve(__dirname, 'src/baima-duowei/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@baima-yushui': resolve(__dirname, 'src/baima-yushui-leaders'),
      '@baima-milestone': resolve(__dirname, 'src/baima-milestone'),
      '@baima-duowei': resolve(__dirname, 'src/baima-duowei'),
      '@assets': resolve(__dirname, 'deploy/baima-yushui-leaders/contents')
    }
  }
}))
