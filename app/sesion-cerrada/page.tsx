import type { Metadata } from 'next'
import CierreSesion from '@/Paginas/CierreSesion/CierreSesion'

export const metadata: Metadata = {
  title: 'Sesión Cerrada | Academia Vallenata Online',
  description:
    'Tu sesión se cerró correctamente y tu progreso fue guardado. Vuelve a iniciar sesión cuando quieras para seguir aprendiendo acordeón vallenato.',
  alternates: { canonical: 'https://academiavallenata.online/sesion-cerrada' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sesión Cerrada | Academia Vallenata Online',
    description:
      'Tu sesión se cerró correctamente y tu progreso fue guardado. Vuelve cuando quieras.',
    url: 'https://academiavallenata.online/sesion-cerrada',
    type: 'website',
  },
}

export default function SesionCerradaPage() {
  return <CierreSesion />
}
