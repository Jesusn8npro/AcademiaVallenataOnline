import type { Metadata } from 'next'
import MisValidaciones from '@/Paginas/Perfil/MisValidaciones'

export const metadata: Metadata = {
  title: 'Mis Evaluaciones | Academia Vallenata Online',
}

export default function MisValidacionesRoute() {
  return <MisValidaciones />
}
