import type { Metadata } from 'next'
import PaquetesAdmin from '@/Paginas/administrador/paquetes/PaquetesAdmin'

export const metadata: Metadata = {
  title: 'Paquetes | Administración | Academia Vallenata Online',
}

export default function AdminPaquetesRoute() {
  return <PaquetesAdmin />
}
