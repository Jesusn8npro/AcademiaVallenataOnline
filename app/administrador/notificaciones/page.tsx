import type { Metadata } from 'next'
import AdminNotificaciones from '@/Paginas/administrador/notificaciones/AdminNotificaciones'

export const metadata: Metadata = {
  title: 'Notificaciones | Administración | Academia Vallenata Online',
}

export default function AdminNotificacionesRoute() {
  return <AdminNotificaciones />
}
