import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Locally, specs read E2E_API_KEY from .env.local; in CI it's already in the environment.
// loadEnvFile never overrides variables that are already set, so CI values win.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // CI uploads playwright-report/ on failure, so it needs the html reporter there.
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CI runs `npm run build` first, then serves the production build.
    command: isCI ? 'npm run start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
