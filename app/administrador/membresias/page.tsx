import type { Metadata } from 'next'
import MembresiasAdmin from '@/Paginas/administrador/Membresias/MembresiasAdmin'

export const metadata: Metadata = {
  title: 'Membresías | Administración | Academia Vallenata Online',
}

export default function AdminMembresiasRoute() {
  return <MembresiasAdmin />
}
