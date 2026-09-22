import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// Never connect browser tests to a developer's running server or personal tasks.
const baseURL = 'http://127.0.0.1:3101';
const databasePath = resolve('.local', `e2e-${process.pid}-${Date.now()}.sqlite`);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: 'node dist/server/index.js',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    env: { PORT: '3101', HOST: '127.0.0.1', DATABASE_PATH: databasePath },
    timeout: 30_000,
  },
});
