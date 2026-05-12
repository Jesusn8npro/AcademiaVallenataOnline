import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { beasties } from 'vite-plugin-beasties';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Inline critical CSS necesario para el render inicial + defer del resto.
    // Mata el render-blocking de index.css (~80KB gzip / 2.5s en mobile 3G).
    // No corre en build de Capacitor (la app nativa no necesita esto).
    ...(mode !== 'capacitor' ? [beasties({
      options: {
        preload: 'swap',
        pruneSource: false,
        inlineFonts: true
      }
    })] : []),
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
        // Precache SOLO el app shell (JS/CSS/HTML + iconos + fuentes). Las imagenes
        // (banners, fotos de cursos, etc.) NO van al precache porque inflarian la
        // instalacion inicial del SW a 13+ MB. Se sirven por runtimeCaching (CacheFirst
        // 30 dias) — primera visita las descarga, las siguientes desde el SW.
        globPatterns: ['**/*.{js,css,html,woff,woff2,ico}', '**/iconos-pwa/**'],
        // Defensa adicional: si algun bundle iberico se cuela, igual lo ignoramos.
        globIgnores: [
          '**/audio/**',
          '**/modelos3d/**',
          '**/*.mp3',
          '**/*.wav',
          '**/*.glb',
          '**/*.gltf',
          '**/*.obj',
          // Chunks pesados que SOLO se usan en rutas lazy. Excluirlos del precache
          // ahorra ~1.2 MB en la instalacion del SW. Se sirven por runtimeCaching
          // cuando el usuario navega a Simulador/AcordeonProMax/3D.
          '**/static/viz-vendor*',
          '**/static/charts-vendor*',
          '**/static/anim-vendor*',
          '**/static/utils-vendor*',
          '**/static/capacitor-vendor*'
        ],
        // Runtime cache para los chunks lazy excluidos del precache.
        // Primera vez = network, siguientes = SW (offline-capable).
        // El chunk `vendor` pesa ~4.2 MB (incluye three/@react-three tras
        // unificar chunks para evitar TDZ circular). Permitimos 5 MB de margen.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Chunks lazy excluidos del precache (viz/charts/anim).
            // StaleWhileRevalidate: la 1a vez = network, las siguientes = SW.
            urlPattern: ({ url }) => /\/static\/(viz|charts|anim|utils|capacitor)-vendor.*\.js$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lazy-vendor-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
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
    // Filtra <link rel="modulepreload"> de chunks que SOLO se usan en rutas lazy.
    // Sin esto, el browser pre-descarga viz-vendor (~932KB), anim-vendor (~40KB),
    // charts-vendor (~213KB) al cargar Home — total ~1.2MB innecesarios en mobile 3G.
    modulePreload: {
      resolveDependencies: (_filename, deps) => deps.filter(d => !/(viz|anim|charts|utils|capacitor)-vendor/.test(d))
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Las reglas evalúan en orden — los scoped packages
          // (@supabase) van ANTES que los matchers genéricos de react
          // para evitar capturas indebidas.
          //
          // viz-vendor agrupa three + @react-three + @splinetool +
          // meshline porque meshline `import * as THREE from 'three'` —
          // separarlos crea ciclo "viz -> vendor -> viz" y TDZ en runtime.
          // framer-motion y recharts NO importan three (verificado), van
          // en chunks independientes y solo se descargan en rutas lazy.

          // viz-vendor incluye three + ecosystem (drei + sus deps transitivas que
          // tocan three). Sin esto, deps como camera-controls/maath/three-mesh-bvh
          // caen en `vendor` y crean ciclo "vendor -> viz-vendor", forzando el
          // browser a descargar viz-vendor (~250KB gzip) al cargar Home.
          if (/[\\/]node_modules[\\/](three|@react-three|@splinetool|meshline|camera-controls|maath|three-mesh-bvh|three-stdlib|troika-three-text|troika-three-utils|troika-worker-utils|@monogrid|stats-gl|stats\.js|suspend-react|detect-gpu|glsl-noise|tunnel-rat|hls\.js|@use-gesture|zustand|@mediapipe)[\\/]/.test(id)) {
            return 'viz-vendor';
          }

          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) return 'anim-vendor';

          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) return 'charts-vendor';

          // lucide-react se usa en 100+ archivos (mayoria lazy). Si queda en
          // `vendor`, Rollup mete todos los iconos posibles ahi por heuristica
          // de shared chunks (~70KB extra en el critical path). Separarlo lo
          // hace lazy: solo se carga cuando algun componente renderiza un icono.
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'icons-vendor';

          // Paquetes grandes que solo se usan en rutas/features lazy.
          // Sacarlos de `vendor` reduce el critical path en mobile 3G.
          if (/[\\/]node_modules[\\/](howler|react-dropzone|react-international-phone|date-fns)[\\/]/.test(id)) {
            return 'utils-vendor';
          }

          // @capacitor solo se ejecuta en build mobile (Capacitor.isNativePlatform).
          // En web siempre es no-op pero se descarga. Separarlo evita ~50KB en web.
          if (/[\\/]node_modules[\\/]@capacitor[\\/]/.test(id)) return 'capacitor-vendor';

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
