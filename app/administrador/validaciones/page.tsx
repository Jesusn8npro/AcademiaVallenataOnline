import type { Metadata } from 'next'
import ValidacionesAdmin from '@/Paginas/administrador/Validaciones/ValidacionesAdmin'

export const metadata: Metadata = {
  title: 'Validaciones | Administración | Academia Vallenata Online',
}

export default function AdminValidacionesRoute() {
  return <ValidacionesAdmin />
}
