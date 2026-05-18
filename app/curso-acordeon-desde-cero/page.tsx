import type { Metadata } from 'next'
import CursoAcordeonDesdeCero from '@/Paginas/Cursos/CursoAcordeonDesdeCero'

export const metadata: Metadata = {
  title: 'Curso de Acordeón Desde Cero | Academia Vallenata Online',
  description:
    '¡Deja de soñar y empieza a tocar! El único curso paso a paso que te lleva de cero a tocar acordeón vallenato como un profesional, con el maestro Jesús González.',
  alternates: { canonical: 'https://academiavallenata.online/curso-acordeon-desde-cero' },
  openGraph: {
    title: 'Curso de Acordeón Desde Cero | Academia Vallenata Online',
    description:
      'El único curso paso a paso que te lleva de cero a tocar acordeón vallenato como un profesional, con el maestro Jesús González.',
    url: 'https://academiavallenata.online/curso-acordeon-desde-cero',
    type: 'website',
  },
}

export default function CursoAcordeonDesdeCeroPage() {
  return <CursoAcordeonDesdeCero />
}
