import type { Metadata } from 'next'
import RankingPage from '@/Paginas/Ranking/RankingPage'

// Ruta protegida (tras login): metadata mínima, sin foco SEO.
export const metadata: Metadata = {
  title: 'Ranking | Academia Vallenata Online',
  description: 'Tabla de posiciones de estudiantes de la Academia Vallenata Online.',
}

export default function RankingRoute() {
  return <RankingPage />
}
