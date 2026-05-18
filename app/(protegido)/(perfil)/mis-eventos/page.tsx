import type { Metadata } from 'next'
import MisEventos from '@/Paginas/Perfil/MisEventos'

export const metadata: Metadata = {
  title: 'Mis Eventos | Academia Vallenata Online',
}

export default function MisEventosRoute() {
  return <MisEventos />
}
