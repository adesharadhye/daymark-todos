// Start a dedicated test server and database so browser tests cannot touch personal tasks.
// Import the required exports from @playwright/test.
import { defineConfig, devices } from '@playwright/test';
// Import the required exports from node:path.
import { resolve } from 'node:path';

// Never connect browser tests to a developer's running server or personal tasks.
// Calculate or store the browser test server URL.
const baseURL = 'http://127.0.0.1:3101';
// Calculate or store the database file location.
const databasePath = resolve('.local', `e2e-${process.pid}-${Date.now()}.sqlite`);

// Export the tool configuration with typed option validation.
export default defineConfig({
  // Specify the folder containing browser tests.
  testDir: './tests/e2e',
  // Specify whether tests may run in parallel.
  fullyParallel: false,
  // Specify the number of browser-test workers.
  workers: 1,
  // Specify whether focused tests are forbidden in CI.
  forbidOnly: !!process.env.CI,
  // Specify the retry count.
  retries: process.env.CI ? 1 : 0,
  // Specify the configured test reports.
  reporter: [['list'], ['html', { open: 'never' }]],
  // Specify use.
  use: {
    // Supply the browser test server URL to the enclosing expression.
    baseURL,
    // Specify an optional installed browser channel.
    channel: process.env.PLAYWRIGHT_CHANNEL,
    // Specify the browser window dimensions.
    viewport: { width: 1440, height: 1000 },
    // Specify the browser timezone.
    timezoneId: 'Asia/Kolkata',
    // Specify when diagnostic traces are retained.
    trace: 'retain-on-failure',
    // Specify when failure screenshots are captured.
    screenshot: 'only-on-failure',
    // Close the current block or object.
  },
  // Specify projects.
  projects: [
    // Begin this object of related settings or sample task fields.
    {
      // Specify the displayed name.
      name: 'chromium',
      // Specify use.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
      // Close the current block or object.
    },
    // Finish the array of values.
  ],
  // Specify the isolated server launched for browser tests.
  webServer: {
    // Specify the command used to start the built server.
    command: 'node dist/server/index.js',
    // Specify the requested URL.
    url: `${baseURL}/api/health`,
    // Specify whether an existing server may be reused.
    reuseExistingServer: false,
    // Specify environment settings for the test server.
    env: { PORT: '3101', HOST: '127.0.0.1', DATABASE_PATH: databasePath },
    // Specify the startup time limit in milliseconds.
    timeout: 30_000,
    // Close the current block or object.
  },
  // Close the current block or object.
});
