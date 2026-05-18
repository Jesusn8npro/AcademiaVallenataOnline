import type { Metadata } from 'next'
import CuponesAdmin from '@/Paginas/administrador/cupones/CuponesAdmin'

export const metadata: Metadata = {
  title: 'Cupones | Administración | Academia Vallenata Online',
}

export default function AdminCuponesRoute() {
  return <CuponesAdmin />
}
