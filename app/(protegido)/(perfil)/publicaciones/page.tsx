import type { Metadata } from 'next'
import MisPublicaciones from '@/Paginas/Perfil/MisPublicaciones'

export const metadata: Metadata = {
  title: 'Mis Publicaciones | Academia Vallenata Online',
}

export default function MisPublicacionesRoute() {
  return <MisPublicaciones />
}
