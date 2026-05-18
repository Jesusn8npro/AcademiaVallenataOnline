'use client'

import dynamic from 'next/dynamic'

// Acordeón Funcional V1: @react-three/fiber + drei + three.
// OBLIGATORIO client-only con ssr:false (patrón app/[[...slug]]/client.tsx).
const AcordeonFuncionalV1 = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pruebas3D/AcordeonFuncionalV1'),
  { ssr: false },
)

export function AcordeonFuncionalV1Client() {
  return <AcordeonFuncionalV1 />
}
