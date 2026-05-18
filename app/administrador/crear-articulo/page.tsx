// CreadorArticulos sirve tanto creación (/administrador/crear-articulo) como
// edición (/administrador/blog/editar/:slug). Lee `slug` vía useParams() de la
// capa @/compat/router; aquí (sin slug) entra en modo creación.
import type { Metadata } from 'next'
import CreadorArticulos from '@/Paginas/administrador/blog/CreadorArticulos'

export const metadata: Metadata = {
  title: 'Crear Artículo | Administración | Academia Vallenata Online',
}

export default function AdminCrearArticuloRoute() {
  return <CreadorArticulos />
}
