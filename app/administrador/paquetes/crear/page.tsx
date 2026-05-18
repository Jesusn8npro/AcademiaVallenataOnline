import type { Metadata } from 'next'
import CrearPaquete from '@/Paginas/administrador/paquetes/crear/CrearPaquete'

export const metadata: Metadata = {
  title: 'Crear Paquete | Administración | Academia Vallenata Online',
}

export default function AdminCrearPaqueteRoute() {
  return <CrearPaquete />
}
