import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.types.ts', 'src/server.ts'],
    },
    // Each test file gets its own isolated worker
    pool: 'forks',
    // Increase timeout for integration tests
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
