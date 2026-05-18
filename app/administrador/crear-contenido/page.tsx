import type { Metadata } from 'next'
import CrearContenido from '@/Paginas/administrador/crear-contenido/CrearContenido'

export const metadata: Metadata = {
  title: 'Crear Contenido | Administración | Academia Vallenata Online',
}

export default function AdminCrearContenidoRoute() {
  return <CrearContenido />
}
