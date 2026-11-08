import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3000', rewrite: (path) => path.replace(/^\/api(?=\/|$)/, '') } } },
  resolve: {
    alias: {
      '@': '/src',
      '@byted-tiktok/live-platform-common': '/src/shared/live-platform-common.ts',
    },
  },
});
