import type { Metadata } from 'next'
import PagoExitoso from '@/Paginas/Pagos/PagoExitoso/PagoExitoso'

export const metadata: Metadata = {
  title: 'Confirmación de Pago | Academia Vallenata Online',
  description:
    'Estado de tu compra en Academia Vallenata Online. Verificamos tu transacción y activamos tu acceso al contenido adquirido.',
  robots: { index: false, follow: false },
}

export default function PagoExitosoPage() {
  return <PagoExitoso />
}
