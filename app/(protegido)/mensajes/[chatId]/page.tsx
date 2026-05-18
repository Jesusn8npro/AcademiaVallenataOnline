import type { Metadata } from 'next'
import MensajesPage from '@/Paginas/Mensajes/MensajesPage'

// Ruta protegida (tras login): metadata mínima, sin foco SEO.
// MensajesPage lee `chatId` vía useParams() (capa @/compat/router), igual que
// en el react-router original: una sola página sirve /mensajes y /mensajes/:chatId.
export const metadata: Metadata = {
  title: 'Mensajes | Academia Vallenata Online',
  description: 'Tus conversaciones privadas con la comunidad de la Academia Vallenata Online.',
}

export default function MensajesChatRoute() {
  return <MensajesPage />
}
