// Start a dedicated test server and database so browser tests cannot touch personal tasks.
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const baseURL = 'http://127.0.0.1:3101';
// Calculate or store the database file location.
const databasePath = resolve('.local', `e2e-${process.pid}-${Date.now()}.sqlite`);

export default defineConfig({
  testDir: './tests/e2e',
  // Specify whether tests may run in parallel.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Specify the retry count.
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // Specify an optional installed browser channel.
    channel: process.env.PLAYWRIGHT_CHANNEL,
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Kolkata',
    // Specify when diagnostic traces are retained.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Specify projects.
  projects: [
    {
      name: 'chromium',
      // Specify use.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  // Specify the isolated server launched for browser tests.
  webServer: {
    command: 'node dist/server/index.js',
    url: `${baseURL}/api/health`,
    // Specify whether an existing server may be reused.
    reuseExistingServer: false,
    env: { PORT: '3101', HOST: '127.0.0.1', DATABASE_PATH: databasePath },
    timeout: 30_000,
  },
});
