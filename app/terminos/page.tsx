import type { Metadata } from 'next'
import Terminos from '@/Paginas/Legales/Terminos'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Academia Vallenata Online',
  description:
    'Términos y condiciones de uso de Academia Vallenata Online. Conoce las reglas, pagos, reembolsos y condiciones para el uso de nuestra plataforma educativa.',
  alternates: { canonical: 'https://academiavallenata.online/terminos' },
  openGraph: {
    title: 'Términos y Condiciones | Academia Vallenata Online',
    description:
      'Términos y condiciones de uso de Academia Vallenata Online. Reglas, pagos, reembolsos y condiciones de la plataforma.',
    url: 'https://academiavallenata.online/terminos',
    type: 'website',
  },
}

export default function TerminosPage() {
  return <Terminos />
}
