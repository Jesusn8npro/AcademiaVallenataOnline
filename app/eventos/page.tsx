import type { Metadata } from 'next'
import Eventos from '@/Paginas/Eventos/Eventos'

export const metadata: Metadata = {
  title: 'Eventos en Vivo de Acordeón Vallenato | Academia Vallenata Online',
  description:
    'Participa en masterclasses exclusivas, workshops interactivos y conciertos en vivo de acordeón vallenato. Aprende directamente con los mejores maestros.',
  alternates: { canonical: 'https://academiavallenata.online/eventos' },
  openGraph: {
    title: 'Eventos en Vivo de Acordeón Vallenato | Academia Vallenata Online',
    description:
      'Masterclasses, workshops y conciertos en vivo de acordeón vallenato con los mejores maestros.',
    url: 'https://academiavallenata.online/eventos',
    type: 'website',
  },
}

export default function EventosPage() {
  return <Eventos />
}
