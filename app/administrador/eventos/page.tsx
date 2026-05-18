import type { Metadata } from 'next'
import EventosAdmin from '@/Paginas/administrador/eventos/EventosAdmin'

export const metadata: Metadata = {
  title: 'Eventos | Administración | Academia Vallenata Online',
}

export default function AdminEventosRoute() {
  return <EventosAdmin />
}
