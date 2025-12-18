import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './idiomas/configuracionIdiomas'; // Importar configuración de idiomas
import App from './App.tsx'
import { inicializarSeguridadConsola, bloquearDevTools } from './hooks/useSeguridadConsola'

// ⚠️ SEGURIDAD: Inicializar protección ANTES de renderizar la app
// Esto deshabilita console.log en producción y bloquea DevTools
inicializarSeguridadConsola();
bloquearDevTools();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
