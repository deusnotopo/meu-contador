import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      // Dev-only CSP — allows Google Auth, Firebase Analytics, and Vite HMR
      'Content-Security-Policy': [
        "default-src 'self'",
        // React HMR + Google Identity Services + GTM Analytics
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        // API + WS + all Firebase/Google domains
        "connect-src 'self' http://localhost:3000 ws://localhost:5173 wss://localhost:5173 " +
          "https://firebase.googleapis.com " +
          "https://firebaseinstallations.googleapis.com " +
          "https://identitytoolkit.googleapis.com " +
          "https://securetoken.googleapis.com " +
          "https://firebaseapp.com " +
          "https://*.firebaseio.com " +
          "https://www.googletagmanager.com " +
          "https://www.google-analytics.com " +
          "https://region1.google-analytics.com",
        // Google Auth popup + Firebase Auth iframe
        "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
        "worker-src 'self' blob:",
      ].join('; '),
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
