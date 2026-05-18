import type { Metadata } from 'next'
import Home from '@/Paginas/Inicio/Home'

export const metadata: Metadata = {
  title: 'Academia Vallenata Online - Aprende Acordeón desde Cero | Simulador Gaming',
  description:
    'La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de 5,000+ estudiantes y clases en vivo. Toca tu primera canción en 7 días.',
  alternates: { canonical: 'https://academiavallenata.online/' },
  openGraph: {
    title: 'Academia Vallenata Online - Aprende Acordeón desde Cero',
    description:
      'La Academia #1 de Acordeón Vallenato online. Simulador gaming único y comunidad de 5,000+ estudiantes. Toca tu primera canción en 7 días.',
    url: 'https://academiavallenata.online/',
    type: 'website',
  },
}

export default function HomePage() {
  return <Home />
}
