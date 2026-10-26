import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: { '~': resolve(__dirname, '.') },
  },
  test: {
    include: ['server/__tests__/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['server/__tests__/mcp/global-setup.ts'],
    setupFiles: ['server/__tests__/mcp/env.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
