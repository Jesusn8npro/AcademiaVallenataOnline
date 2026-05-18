import type { Metadata } from 'next'
import NuestraAcademia from '@/Paginas/NuestraAcademia/NuestraAcademia'

export const metadata: Metadata = {
  title: 'Nuestra Academia | Academia Vallenata Online',
  description:
    'Conoce la historia de Academia Vallenata Online y al maestro Jesús González. 15 años formando acordeoneros con la metodología más efectiva para aprender desde casa.',
  alternates: { canonical: 'https://academiavallenata.online/nuestra-academia' },
  openGraph: {
    title: 'Nuestra Academia | Academia Vallenata Online',
    description:
      'Conoce la historia de Academia Vallenata Online y al maestro Jesús González. 15 años formando acordeoneros auténticos.',
    url: 'https://academiavallenata.online/nuestra-academia',
    type: 'website',
  },
}

export default function NuestraAcademiaPage() {
  return <NuestraAcademia />
}
