import type { Metadata } from 'next'
import Paquetes from '@/Paginas/Paquetes/Paquetes'

export const metadata: Metadata = {
  title: 'Paquetes de Tutoriales Vallenatos | Ahorra Aprendiendo Acordeón',
  description:
    'Compra paquetes de canciones y tutoriales de acordeón a precios especiales. Packs por nivel y por ritmo vallenato para aprender de forma organizada.',
  alternates: { canonical: 'https://academiavallenata.online/paquetes' },
  openGraph: {
    title: 'Paquetes de Tutoriales Vallenatos | Academia Vallenata Online',
    description:
      'Paquetes de tutoriales de acordeón a precios especiales. Aprende vallenato de forma organizada y ahorra.',
    url: 'https://academiavallenata.online/paquetes',
    type: 'website',
  },
}

export default function PaquetesPage() {
  return <Paquetes />
}
