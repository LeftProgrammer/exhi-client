import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 与 runtime/main/protocol.ts 的 DEV_CONTENT_URL 保持一致
const DEV_PORT = 5174

/**
 * dev 模式下，从 EXHI_DEV_PACKAGE 推算当前项目包的 contents/ 目录。
 * EXHI_DEV_PACKAGE 形如 "project/deploy/baima-milestone"，
 * 去掉开头的 "project/" 得到相对于本文件所在目录（packages/project/）的路径。
 */
function resolveDevPublicDir(): string {
  const pkg = process.env['EXHI_DEV_PACKAGE'] ?? ''
  const rel = pkg.startsWith('project/') ? pkg.slice('project/'.length) : pkg
  if (rel) return resolve(__dirname, rel, 'contents')
  // 未设置时回退（仅兜底，正常情况下两个 dev 脚本都会设置该变量）
  return resolve(__dirname, 'deploy/baima-yushui-leaders/contents')
}

export default defineConfig(({ command }) => ({
  root: resolve(__dirname, 'src'),
  base: './',
  publicDir: command === 'serve' ? resolveDevPublicDir() : false,
  plugins: [vue()],
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
        'baima-milestone': resolve(__dirname, 'src/baima-milestone/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@baima-yushui': resolve(__dirname, 'src/baima-yushui-leaders'),
      '@baima-milestone': resolve(__dirname, 'src/baima-milestone'),
      '@assets': resolve(__dirname, 'deploy/baima-yushui-leaders/contents')
    }
  }
}))
