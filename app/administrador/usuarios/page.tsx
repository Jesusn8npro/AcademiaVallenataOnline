import type { Metadata } from 'next'
import GestionUsuarios from '@/Paginas/administrador/Usuarios/GestionUsuarios'

export const metadata: Metadata = {
  title: 'Usuarios | Administración | Academia Vallenata Online',
}

export default function AdminUsuariosRoute() {
  return <GestionUsuarios />
}
