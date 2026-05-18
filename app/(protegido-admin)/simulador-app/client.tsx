'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Simulador App: acordeón interactivo con AudioEnginePro + framer-motion +
// grabación. Client-only con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const SimuladorApp = dynamic(
  () => import('@/Paginas/SimuladorApp/SimuladorApp'),
  { ssr: false, loading: CargandoRuta },
)

export function SimuladorAppClient() {
  return <SimuladorApp />
}
