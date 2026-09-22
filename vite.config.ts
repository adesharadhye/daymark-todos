// Build two HTML documents and proxy development API requests to Express.
// Import the required exports from vite.
import { defineConfig } from 'vite';
// Import the required exports from @vitejs/plugin-react.
import react from '@vitejs/plugin-react';
// Import the required exports from node:path.
import { resolve } from 'node:path';

// Export the tool configuration with typed option validation.
export default defineConfig({
  // Specify the browser source directory.
  root: 'client',
  // Specify the multiple-page application mode.
  appType: 'mpa',
  // Specify the Vite plugins.
  plugins: [react()],
  // Specify the HTTP listener or server settings.
  server: {
    // Specify the listening port.
    port: 5173,
    // Specify whether to fail if the dev port is occupied.
    strictPort: true,
    // Specify the development API forwarding rule.
    proxy: { '/api': 'http://127.0.0.1:3001' },
    // Close the current block or object.
  },
  // Specify the production build options.
  build: {
    // Specify the build output directory.
    outDir: '../dist/client',
    // Specify whether the browser output is cleared before building.
    emptyOutDir: true,
    // Specify the bundler options.
    rollupOptions: {
      // Specify the validated input fields.
      input: {
        // Specify list.
        list: resolve(import.meta.dirname, 'client/index.html'),
        // Specify the current task object.
        todo: resolve(import.meta.dirname, 'client/todo.html'),
        // Close the current block or object.
      },
      // Close the current block or object.
    },
    // Close the current block or object.
  },
  // Close the current block or object.
});
