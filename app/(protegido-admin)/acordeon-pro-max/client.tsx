'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// 3D/audio pesado (three.js + howler + AudioEngine): DEBE cargar client-only.
// ssr: false, loading: CargandoRuta desactiva el prerender (mismo patrón que app/[[...slug]]/client.tsx).
const HomeProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/HomeProMax'),
  { ssr: false, loading: CargandoRuta },
)

export function HomeProMaxClient() {
  return <HomeProMax />
}
