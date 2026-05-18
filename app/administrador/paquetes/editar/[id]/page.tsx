// EditarPaquete lee `id` vía useParams() (capa @/compat/router), igual que en
// el react-router original (path="/administrador/paquetes/editar/:id").
import type { Metadata } from 'next'
import EditarPaquete from '@/Paginas/administrador/paquetes/editar/EditarPaquete'

export const metadata: Metadata = {
  title: 'Editar Paquete | Administración | Academia Vallenata Online',
}

export default function AdminEditarPaqueteRoute() {
  return <EditarPaquete />
}
