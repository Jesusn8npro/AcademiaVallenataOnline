'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Acordeón Diapasón 3D: @react-three/fiber + drei + three + GLB.
// OBLIGATORIO client-only con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const AcordeonDiapason3D = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pruebas3D/AcordeonDiapason3D'),
  { ssr: false, loading: CargandoRuta },
)

export function AcordeonDiapason3DClient() {
  return <AcordeonDiapason3D />
}
