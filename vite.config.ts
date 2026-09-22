import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'client',
  appType: 'mpa',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        list: resolve(import.meta.dirname, 'client/index.html'),
        todo: resolve(import.meta.dirname, 'client/todo.html'),
      },
    },
  },
});
