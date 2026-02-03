import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Config updated to trigger restart
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Ocultar código fuente en producción
    chunkSizeWarningLimit: 1000,
  }
})
