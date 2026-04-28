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

          // Reglas EXCLUSIVAS por path exacto del paquete para evitar
          // que substrings genéricas (ej: "react" matcheando "@react-three")
          // crucen chunks y generen circular dependencies.
          // Las reglas evalúan en orden — la primera que matchea gana,
          // por eso los scoped packages (@react-three, @splinetool) van
          // ANTES que el matcher genérico de react.

          if (/[\\/]node_modules[\\/]@react-three[\\/]/.test(id)) return 'three-vendor';
          if (/[\\/]node_modules[\\/]@splinetool[\\/]/.test(id)) return 'three-vendor';
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three-vendor';

          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
            return 'react-vendor';
          }

          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) return 'animation-vendor';
          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return 'supabase-vendor';
          if (/[\\/]node_modules[\\/](recharts|d3-[a-z]+)[\\/]/.test(id)) return 'charts-vendor';
          if (/[\\/]node_modules[\\/](howler|react-player)[\\/]/.test(id)) return 'media-vendor';
          if (/[\\/]node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(id)) {
            return 'i18n-vendor';
          }

          return 'vendor';
        },
      }
    }
  }
});
