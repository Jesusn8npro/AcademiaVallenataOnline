import type { Metadata } from 'next'
import MisValidaciones from '@/Paginas/Perfil/MisValidaciones'

export const metadata: Metadata = {
  title: 'Mis Evaluaciones | Academia Vallenata Online',
}

// Misma vista que /mis-validaciones (alias en el react-router original).
export default function MisEvaluacionesRoute() {
  return <MisValidaciones />
}
