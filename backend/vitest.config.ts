import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: {
      minThreads: 1,
      maxThreads: 1,
    },
    hookTimeout: 30000,
  },
})
