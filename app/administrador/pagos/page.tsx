import type { Metadata } from 'next'
import Pagos from '@/Paginas/administrador/Pagos/Pagos'

export const metadata: Metadata = {
  title: 'Pagos | Administración | Academia Vallenata Online',
}

export default function AdminPagosRoute() {
  return <Pagos />
}
