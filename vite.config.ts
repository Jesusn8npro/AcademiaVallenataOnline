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
    obfuscator({
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: false, // Desactivado para que el build no se cuelgue
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      },
      include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      exclude: [/node_modules/],
    }),
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
      }
    }
  }
})
