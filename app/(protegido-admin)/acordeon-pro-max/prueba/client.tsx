'use client'

import dynamic from 'next/dynamic'

// Página de prueba sincronización MP3↔notas (audio engine). Client-only
// con ssr:false (patrón app/[[...slug]]/client.tsx).
const AcordeonProMaxPrueba = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/AcordeonProMaxPrueba'),
  { ssr: false },
)

export function AcordeonProMaxPruebaClient() {
  return <AcordeonProMaxPrueba />
}
