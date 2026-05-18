// Ruta protegida por admin (ProteccionAdmin via layout del grupo). Tras
// login, sin foco SEO. El componente 3D/audio se monta client-only con
// dynamic(..,{ssr: false, loading: CargandoRuta}) en ./client.
import type { Metadata } from 'next'
import { HomeProMaxClient } from './client'

export const metadata: Metadata = {
  title: 'Acordeón PRO MAX | Academia Vallenata Online',
}

export default function AcordeonProMaxRoute() {
  return <HomeProMaxClient />
}
