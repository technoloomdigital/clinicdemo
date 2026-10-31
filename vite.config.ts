import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Backend source is developer-only: never let the dev server hand it to a browser.
      fs: {
        deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/**', '**/bun.lock'],
      },
      // Forward API calls to the Express backend (npm run dev:server).
      proxy: {
        '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
  };
});
