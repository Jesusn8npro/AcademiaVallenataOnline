'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Grabador V2: audio engine + captura en vivo. Client-only con ssr: false, loading: CargandoRuta
// (patrón app/[[...slug]]/client.tsx).
const PaginaGrabadorV2 = dynamic(
  () => import('@/Paginas/AcordeonProMax/GrabadorV2/PaginaGrabadorV2'),
  { ssr: false, loading: CargandoRuta },
)

export function PaginaGrabadorV2Client() {
  return <PaginaGrabadorV2 />
}
