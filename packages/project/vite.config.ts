import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig(({ command }) => ({
  root: resolve(__dirname, 'src'),
  base: './',
  publicDir: command === 'serve' ? resolve(__dirname, 'contents') : false,
  plugins: [vue()],
  server: {
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    hmr: { protocol: 'ws', host: '127.0.0.1', port: 5174, clientPort: 5174 }
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
      '@assets': resolve(__dirname, 'contents')
    }
  }
}))
