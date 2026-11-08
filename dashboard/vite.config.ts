import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@byted-tiktok/live-platform-common': '/src/shared/live-platform-common.ts',
    },
  },
});
