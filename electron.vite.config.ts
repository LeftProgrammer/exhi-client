import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('runtime/shared'),
        '@main': resolve('runtime/main')
      }
    },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: resolve('runtime/main/index.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('runtime/shared'),
        '@preload': resolve('runtime/preload')
      }
    },
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve('runtime/preload/index.ts')
      }
    }
  },
  renderer: {
    root: resolve('runtime/renderer'),
    plugins: [vue()],
    resolve: {
      alias: {
        '@shared': resolve('runtime/shared'),
        '@renderer': resolve('runtime/renderer/src')
      }
    },
    build: {
      outDir: resolve('out/renderer'),
      rollupOptions: {
        input: resolve('runtime/renderer/index.html')
      }
    },
    server: {
      port: 5173
    }
  }
})
