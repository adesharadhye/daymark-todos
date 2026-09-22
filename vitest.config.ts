// Run backend tests in Node while keeping browser tests in their separate Playwright suite.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
