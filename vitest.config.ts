// Run backend tests in Node while keeping browser tests in their separate Playwright suite.
// Import the required exports from vitest/config.
import { defineConfig } from 'vitest/config';

// Export the tool configuration with typed option validation.
export default defineConfig({
  // Specify test.
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  // Close the current block or object.
});
