import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'runtime/shared'),
      '@main': resolve(__dirname, 'runtime/main'),
      '@renderer': resolve(__dirname, 'runtime/renderer/src')
    }
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['runtime/**/*.ts'],
      exclude: ['runtime/**/index.ts', 'runtime/**/*.d.ts']
    }
  }
})
