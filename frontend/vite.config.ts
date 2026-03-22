import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow Vite requests coming from your ngrok URL (used for sharing the dev server).
    allowedHosts: ['3d69-2a06-c701-7603-5d00-5116-9112-a451-92c2.ngrok-free.app'],
    proxy: {
      // Let the frontend call the backend without CORS friction in development.
      '/api': 'http://localhost:4000'
    }
  }
});

