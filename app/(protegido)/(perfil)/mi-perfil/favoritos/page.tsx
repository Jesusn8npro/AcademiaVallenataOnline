import type { Metadata } from 'next'
import MisFavoritos from '@/Paginas/Perfil/MisFavoritos'

export const metadata: Metadata = {
  title: 'Guardados | Academia Vallenata Online',
}

export default function MisFavoritosRoute() {
  return <MisFavoritos />
}
