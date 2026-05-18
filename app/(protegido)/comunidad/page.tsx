import type { Metadata } from 'next'
import ComunidadPage from '@/Paginas/Comunidad/ComunidadPage'

// Ruta protegida (tras login): metadata mínima, sin foco SEO.
export const metadata: Metadata = {
  title: 'Comunidad | Academia Vallenata Online',
  description: 'Comparte tu progreso y conecta con la comunidad de estudiantes de acordeón vallenato.',
}

export default function ComunidadRoute() {
  return <ComunidadPage />
}
