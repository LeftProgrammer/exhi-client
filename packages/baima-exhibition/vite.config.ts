import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * 项目包 Vite 配置（白马展厅）。
 *
 * 关键约定：
 *  - root 指向 src/，每个一级子目录是一块屏的多页面入口
 *  - base: './' → 产物用相对路径，被 exhi-pkg:// 协议透明加载
 *  - build.outDir 输出到 dist/，pkg-cli 会把 dist/ 内容拷到最终项目包的 contents/
 *  - dev server 监听 5174（Runtime 的 protocol.ts 已配代理到此端口）
 *
 * 加新屏的步骤：
 *  1) src/<screen-id>/index.html + main.ts + App.vue
 *  2) 在下面 rollupOptions.input 加一行
 *  3) scenes.json 引用 contents/<screen-id>/index.html
 */
export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: './',
  plugins: [vue()],
  server: {
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    // HMR 客户端注入到页面时，告诉它直连 vite dev server 拿热更新
    // 否则它会从 location.host (exhi-pkg://pkg) 推断 → ws://pkg/ 连不上
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5174,
      clientPort: 5174
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        // 每加一块屏，复制一行
        hello: resolve(__dirname, 'src/hello/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@assets': resolve(__dirname, 'contents')
    }
  }
})
