import type { Metadata } from 'next'
import Pagina404 from '@/Paginas/404/Pagina404'

export const metadata: Metadata = {
  title: 'Página no encontrada (404) | Academia Vallenata Online',
  description:
    'La página que buscas no existe o fue movida. Explora nuestros cursos de acordeón, tutoriales gratis, el simulador virtual y la comunidad.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <Pagina404 />
}
