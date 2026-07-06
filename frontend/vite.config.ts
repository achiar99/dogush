import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/logo.jpg'],
      manifest: {
        name: 'Dogush',
        short_name: 'Dogush',
        description: 'החנות שלך בגוש',
        theme_color: '#1e1e2e',
        background_color: '#fbf7ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/images/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        navigateFallback: undefined,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/api\/(products|categories)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-products',
              expiration: { maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
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

