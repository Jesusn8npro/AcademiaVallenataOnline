import type { Metadata } from 'next'
import Privacidad from '@/Paginas/Legales/Privacidad'

export const metadata: Metadata = {
  title: 'Políticas de Privacidad | Academia Vallenata Online',
  description:
    'Políticas de privacidad y protección de datos de Academia Vallenata Online. Conoce cómo recopilamos, usamos y protegemos tu información personal.',
  alternates: { canonical: 'https://academiavallenata.online/privacidad' },
  openGraph: {
    title: 'Políticas de Privacidad | Academia Vallenata Online',
    description:
      'Políticas de privacidad y protección de datos de Academia Vallenata Online. Cómo protegemos tu información personal.',
    url: 'https://academiavallenata.online/privacidad',
    type: 'website',
  },
}

export default function PrivacidadPage() {
  return <Privacidad />
}
