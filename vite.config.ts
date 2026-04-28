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
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('three') || id.includes('@react-three') || id.includes('@splinetool')) {
              return 'three-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
            if (id.includes('howler') || id.includes('react-player')) {
              return 'media-vendor';
            }
            if (id.includes('i18next')) {
              return 'i18n-vendor';
            }
            return 'vendor';
          }
        },
      }
    }
  }
});
