import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './idiomas/configuracionIdiomas'; // Importar configuración de idiomas
import App from './App.tsx'

// ⚠️ NOTA: La seguridad se inicializa en App.tsx DESPUÉS del montaje
// para evitar conflictos con React DOM

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
