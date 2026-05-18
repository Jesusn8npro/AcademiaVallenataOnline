import type { Metadata } from 'next'
import MisCursos from '@/Paginas/Perfil/MisCursos'

export const metadata: Metadata = {
  title: 'Mis Cursos | Academia Vallenata Online',
}

export default function MisCursosRoute() {
  return <MisCursos />
}
