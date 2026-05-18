import type { Metadata } from 'next'
import Notificaciones from '@/Paginas/Notificaciones/Notificaciones'

// Ruta NO protegida. Metadata mínima (contenido personal, sin foco SEO).
export const metadata: Metadata = {
  title: 'Notificaciones | Academia Vallenata Online',
  description: 'Tus notificaciones de la Academia Vallenata Online.',
}

export default function NotificacionesRoute() {
  return <Notificaciones />
}
