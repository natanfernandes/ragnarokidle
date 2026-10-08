import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverUrl = process.env.GAME_SERVER_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/game': { target: serverUrl, ws: true },
      '/health': serverUrl,
      '/assets/render': serverUrl,
    },
  },
});
