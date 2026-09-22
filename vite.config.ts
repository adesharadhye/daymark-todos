// Build two HTML documents and proxy development API requests to Express.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Export the tool configuration with typed option validation.
export default defineConfig({
  root: 'client',
  appType: 'mpa',
  // Specify the Vite plugins.
  plugins: [react()],
  server: {
    port: 5173,
    // Specify whether to fail if the dev port is occupied.
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  // Specify the production build options.
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    // Specify the bundler options.
    rollupOptions: {
      input: {
        list: resolve(import.meta.dirname, 'client/index.html'),
        // Specify the current task object.
        todo: resolve(import.meta.dirname, 'client/todo.html'),
      },
    },
  },
});
