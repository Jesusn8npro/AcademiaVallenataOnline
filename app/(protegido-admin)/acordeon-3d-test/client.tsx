'use client'

import dynamic from 'next/dynamic'

// Acordeón Diapasón 3D: @react-three/fiber + drei + three + GLB.
// OBLIGATORIO client-only con ssr:false (patrón app/[[...slug]]/client.tsx).
const AcordeonDiapason3D = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pruebas3D/AcordeonDiapason3D'),
  { ssr: false },
)

export function AcordeonDiapason3DClient() {
  return <AcordeonDiapason3D />
}
