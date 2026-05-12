import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registramos el SW manualmente desde src/registerSW.ts
      injectRegister: null,
      includeAssets: ['offline.html', 'favicon.png', 'iconos-pwa/*.svg'],
      manifest: {
        name: 'Academia Vallenata Online',
        short_name: 'Academia Vallenata',
        description: 'Aprende acordeón vallenato online con la mejor academia virtual',
        start_url: '/',
        // display: 'browser' evita que Chrome ofrezca "Instalar/Abrir en aplicación"
        // en la omnibox. La APP nativa se distribuye via Capacitor (APK), no via PWA.
        // El service worker sigue activo para cache offline.
        display: 'browser',
        orientation: 'landscape',
        theme_color: '#8b5cf6',
        background_color: '#1f2937',
        icons: [
          { src: '/iconos-pwa/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/iconos-pwa/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,webp,svg,ico,woff,woff2}'],
        // Excluir assets pesados del precache; se sirven por runtimeCaching.
        // Audio (mp3) y modelos3d quedan fuera del precache porque pesan demasiado.
        globIgnores: [
          '**/audio/**',
          '**/modelos3d/**',
          '**/*.mp3',
          '**/*.wav',
          '**/*.glb',
          '**/*.gltf',
          '**/*.obj'
        ],
        // El chunk `vendor` pesa ~4.2 MB (incluye three/@react-three tras
        // unificar chunks para evitar TDZ circular). Permitimos 5 MB de margen.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/modelos3d/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'modelos3d-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      // Capacitor empaqueta assets sin SW; deshabilitar PWA en ese build evita SW colgado.
      disable: mode === 'capacitor'
    })
  ],
  base: mode === 'capacitor' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$lib/services': path.resolve(__dirname, './src/servicios'),
      '$lib/utils': path.resolve(__dirname, './src/utilidades'),
      '$lib/supabase': path.resolve(__dirname, './src/servicios'),
      '$lib/stores': path.resolve(__dirname, './src/stores'),
      '$lib/types': path.resolve(__dirname, './src/tipos'),
      '$lib': path.resolve(__dirname, './src'),
      '$servicios': path.resolve(__dirname, './src/servicios'),
      '$componentes': path.resolve(__dirname, './src/componentes'),
      '$Paginas': path.resolve(__dirname, './src/Paginas'),
      '$utilidades': path.resolve(__dirname, './src/utilidades'),
      '$stores': path.resolve(__dirname, './src/stores')
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Solo se separan en chunks dedicados los paquetes GRANDES y
          // BIEN AISLADOS. Paquetes con deps tejidas con utilidades
          // compartidas (recharts, framer-motion, react-player) se dejan
          // en `vendor` para evitar circular chunks que rompen la
          // inicialización en runtime ("Cannot set properties of
          // undefined", "X is not a function").
          //
          // Las reglas evalúan en orden — los scoped packages
          // (@supabase) van ANTES que los matchers genéricos de react
          // para evitar capturas indebidas.

          // NOTA: three / @react-three / @splinetool quedan en `vendor`.
          // Separarlos en `three-vendor` causaba ciclo
          // "three-vendor -> vendor -> three-vendor" porque deps en
          // vendor (framer-motion, meshline) tocan three. El ciclo
          // producia TDZ en runtime ("Cannot access 'bp' before
          // initialization") y pantalla blanca en produccion.

          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
            return 'react-vendor';
          }

          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return 'supabase-vendor';

          if (/[\\/]node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(id)) {
            return 'i18n-vendor';
          }

          return 'vendor';
        },
      }
    }
  }
}));
