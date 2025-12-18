import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './idiomas/configuracionIdiomas'; // Importar configuración de idiomas
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
