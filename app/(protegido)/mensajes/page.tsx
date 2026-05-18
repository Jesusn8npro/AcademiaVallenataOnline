import type { Metadata } from 'next'
import MensajesPage from '@/Paginas/Mensajes/MensajesPage'

// Ruta protegida (tras login): metadata mínima, sin foco SEO.
export const metadata: Metadata = {
  title: 'Mensajes | Academia Vallenata Online',
  description: 'Tus conversaciones privadas con la comunidad de la Academia Vallenata Online.',
}

export default function MensajesRoute() {
  return <MensajesPage />
}
