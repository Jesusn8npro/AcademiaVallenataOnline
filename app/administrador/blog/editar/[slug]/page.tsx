// CreadorArticulos lee `slug` vía useParams() (capa @/compat/router), igual
// que en el react-router original (path="/administrador/blog/editar/:slug").
import type { Metadata } from 'next'
import CreadorArticulos from '@/Paginas/administrador/blog/CreadorArticulos'

export const metadata: Metadata = {
  title: 'Editar Artículo | Administración | Academia Vallenata Online',
}

export default function AdminEditarArticuloRoute() {
  return <CreadorArticulos />
}
