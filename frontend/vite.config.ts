import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'wasm-cache-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.wasm')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      }
    },
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Meu Contador - Gestão Financeira com IA',
        short_name: 'Meu Contador',
        description: 'O Super App Financeiro que organiza suas contas com inteligência artificial.',
        theme_color: '#4f46e5',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
        ],
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Dashboard do Meu Contador'
          }
        ],
        categories: ['finance', 'productivity'],
        lang: 'pt-BR'
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3000000 // 3MB
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'react-router-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — smallest possible initial load
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation lib — large, only needed after hydration
          'vendor-motion': ['framer-motion'],
          // Charts — loaded only in analytics/dashboard views
          'vendor-charts': ['recharts'],
          // PDF export — loaded only when user clicks export
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // Firebase — optional, loaded only for push/auth
          'vendor-firebase': [
            'firebase/app', 'firebase/auth', 'firebase/firestore',
            'firebase/storage', 'firebase/analytics',
            'firebase/messaging', 'firebase/functions',
          ],
          // Lucide icons — large icon set
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
