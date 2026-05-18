'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Acordeón Funcional V1: @react-three/fiber + drei + three.
// OBLIGATORIO client-only con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const AcordeonFuncionalV1 = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pruebas3D/AcordeonFuncionalV1'),
  { ssr: false, loading: CargandoRuta },
)

export function AcordeonFuncionalV1Client() {
  return <AcordeonFuncionalV1 />
}
