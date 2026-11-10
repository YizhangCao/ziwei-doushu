import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Standalone rather than mergeConfig(base): mergeConfig concatenates `include`,
// which would also pull the unit tests into this run.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // All files share one test database, so run them one at a time.
    fileParallelism: false,
  },
});
