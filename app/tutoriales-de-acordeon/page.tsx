import type { Metadata } from 'next'
import Cursos from '@/Paginas/Cursos/Cursos'

export const metadata: Metadata = {
  title: 'Tutoriales de Acordeón Vallenato | Academia Vallenata Online',
  description:
    'Explora el catálogo completo de tutoriales y cursos de acordeón vallenato. Aprende canciones paso a paso por nivel con los mejores maestros de Colombia.',
  alternates: { canonical: 'https://academiavallenata.online/tutoriales-de-acordeon' },
  openGraph: {
    title: 'Tutoriales de Acordeón Vallenato | Academia Vallenata Online',
    description:
      'Explora el catálogo completo de tutoriales y cursos de acordeón vallenato. Aprende canciones paso a paso por nivel.',
    url: 'https://academiavallenata.online/tutoriales-de-acordeon',
    type: 'website',
  },
}

export default function TutorialesDeAcordeonPage() {
  return <Cursos />
}
