import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import path from 'path'

import obfuscator from 'rollup-plugin-obfuscator';

// Plugin para sincronizar audios automáticamente al detectar cambios en las carpetas de audio
const syncAudioPlugin = () => ({
  name: 'sync-audio-plugin',
  configureServer(server: any) {
    const runSync = () => {
      exec('node scripts/sync-samples.cjs', (err) => {
        if (err) console.error('Error sincronizando audios:', err);
        else console.log('🎵 Audios sincronizados automáticamente');
      });
    };

    // Vigilar cambios en las carpetas de audio
    server.watcher.add(path.resolve(__dirname, 'public/audio/Muestras_Cromaticas/**'));
    server.watcher.on('add', runSync);
    server.watcher.on('unlink', runSync);
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    syncAudioPlugin(),
    // obfuscator({ ... }) // COMENTADO TEMPORALMENTE: Está tumbando el servidor por falta de recursos
  ],
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
  esbuild: {
    drop: ['debugger'], // Solo debuggers, permitimos console para el aviso de seguridad
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 5000, 
    reportCompressedSize: false,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        entryFileNames: `static/js/[hash].js`,
        chunkFileNames: `static/js/[hash].js`,
        assetFileNames: `static/media/[hash].[ext]`,
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'vendor-framer';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/tone') || id.includes('node_modules/standardized-audio-context')) return 'vendor-audio';
        }
      }
    }
  }
})
