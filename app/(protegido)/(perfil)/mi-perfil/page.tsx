import type { Metadata } from 'next'
import MiPerfil from '@/Paginas/Perfil/MiPerfil'

export const metadata: Metadata = {
  title: 'Mi Perfil | Academia Vallenata Online',
}

export default function MiPerfilRoute() {
  return <MiPerfil />
}
