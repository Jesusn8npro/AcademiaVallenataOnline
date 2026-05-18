import type { Metadata } from 'next'
import MisGrabaciones from '@/Paginas/Perfil/MisGrabaciones'

export const metadata: Metadata = {
  title: 'Mis Grabaciones | Academia Vallenata Online',
}

export default function MisGrabacionesRoute() {
  return <MisGrabaciones />
}
