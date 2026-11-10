import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit layer (tests/unit). The integration layer extends this in vitest.integration.config.ts.
export default defineConfig({
  resolve: {
    // Mirror tsconfig.json "paths" so tests import exactly like app code.
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
});
