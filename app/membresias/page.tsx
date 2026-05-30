import type { Metadata } from 'next'
import Membresias from '@/Paginas/Membresias/Membresias'

export const metadata: Metadata = {
  title: 'Planes y Membresías | Academia Vallenata Online',
  description:
    'Elige tu plan para aprender acordeón vallenato: desde el simulador básico hasta acceso total a todos los tutoriales y cursos. Prueba 3 días gratis.',
  alternates: { canonical: 'https://academiavallenata.online/membresias' },
  openGraph: {
    title: 'Planes y Membresías | Academia Vallenata Online',
    description:
      'Planes de membresía para aprender acordeón vallenato. Simulador, tutoriales, cursos y más. Empieza con 3 días gratis.',
    url: 'https://academiavallenata.online/membresias',
    type: 'website',
  },
}

export default function MembresiasPage() {
  return <Membresias />
}
