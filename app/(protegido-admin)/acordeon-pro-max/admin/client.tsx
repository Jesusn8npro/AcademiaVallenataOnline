'use client'

import dynamic from 'next/dynamic'

// Grabador V2: audio engine + captura en vivo. Client-only con ssr:false
// (patrón app/[[...slug]]/client.tsx).
const PaginaGrabadorV2 = dynamic(
  () => import('@/Paginas/AcordeonProMax/GrabadorV2/PaginaGrabadorV2'),
  { ssr: false },
)

export function PaginaGrabadorV2Client() {
  return <PaginaGrabadorV2 />
}
