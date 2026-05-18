'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Página de prueba sincronización MP3↔notas (audio engine). Client-only
// con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const AcordeonProMaxPrueba = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/AcordeonProMaxPrueba'),
  { ssr: false, loading: CargandoRuta },
)

export function AcordeonProMaxPruebaClient() {
  return <AcordeonProMaxPrueba />
}
