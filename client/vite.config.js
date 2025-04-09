import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stdLibBrowser from 'vite-plugin-node-stdlib-browser';

export default defineConfig({
  plugins: [
    react(),
    stdLibBrowser(),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  server: {
    port: 5174,
  },
});
