import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  base: '/',
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
          // (@react-three, @splinetool, @supabase) van ANTES que los
          // matchers genéricos de react para evitar capturas indebidas.

          if (/[\\/]node_modules[\\/]@react-three[\\/]/.test(id)) return 'three-vendor';
          if (/[\\/]node_modules[\\/]@splinetool[\\/]/.test(id)) return 'three-vendor';
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three-vendor';

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
});
