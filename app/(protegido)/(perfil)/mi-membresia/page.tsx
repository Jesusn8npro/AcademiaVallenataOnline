import type { Metadata } from 'next'
import MiMembresia from '@/Paginas/Perfil/MiMembresia'

export const metadata: Metadata = {
  title: 'Mi Membresía | Academia Vallenata Online',
}

export default function MiMembresiaRoute() {
  return <MiMembresia />
}
