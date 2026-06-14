import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Allow Vite requests coming from your ngrok URL (used for sharing the dev server).
    allowedHosts: ['3d69-2a06-c701-7603-5d00-5116-9112-a451-92c2.ngrok-free.app'],
    proxy: {
      // In dev, proxy /api to the local Express server so CORS is not needed.
      '/api': 'http://localhost:5000',
    },
  },
  // In production, set VITE_API_BASE_URL=<API Gateway URL> before building.
  // Leave unset for local dev — the proxy above handles /api calls.
});

