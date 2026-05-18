import type { Metadata } from 'next'
import PagoError from '@/Paginas/Pagos/PagoError/PagoError'

export const metadata: Metadata = {
  title: 'Pago No Procesado | Academia Vallenata Online',
  description:
    'Tu pago no pudo ser procesado correctamente. Revisa los detalles del error e intenta de nuevo o contacta a nuestro equipo de soporte.',
  robots: { index: false, follow: false },
}

export default function PagoErrorPage() {
  return <PagoError />
}
