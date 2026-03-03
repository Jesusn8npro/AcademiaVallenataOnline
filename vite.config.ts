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
    sourcemap: false, // 100% false, no exponer mapas
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ['react', 'react-dom', 'react-router-dom'],
          vendor_supabase: ['@supabase/supabase-js'],
          vendor_ui: ['framer-motion', 'lucide-react']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar todos los console.log automáticamente
        drop_debugger: false, // DEBE SER FALSO para que nuestro antiHackerLoop con debugger funcione
        passes: 2
      },
      format: {
        comments: false, // Borrar todos los comentarios, licencias se mantendrán aparte si procede
      }
    }
  }
})
