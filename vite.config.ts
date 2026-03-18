import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import path from 'path'
import obfuscator from 'rollup-plugin-obfuscator'

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
    {
      ...obfuscator({
        global: false, // Falso para no ofuscar dependencias npm
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
        options: {
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false, // CRÍTICO: Quitado porque bloquea el renderizado de la página (ya tenemos el propio en useSeguridadConsola)
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: false,
          renameGlobals: false,
          rotateStringArray: false, // Mejorar velocidad de carga
          selfDefending: false, // CRÍTICO: Esto causaba el pantallazo blanco al entrar en conflicto con el minificador de Vite
          shuffleStringArray: false, // Mejorar velocidad de carga
          splitStrings: false,
          stringArray: false, // Mejorar velocidad de carga del cliente
          unicodeEscapeSequence: false
        }
      }),
      apply: 'build'
    }
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
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor_core';
            if (id.includes('supabase')) return 'vendor_db';
            if (id.includes('framer-motion') || id.includes('lucide')) return 'vendor_ui';
            return 'vendor_libs';
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: false,
        passes: 1 // Reducido de 2 a 1 para ahorrar RAM y CPU en el build
      },
      format: {
        comments: false,
      }
    }
  }
})
