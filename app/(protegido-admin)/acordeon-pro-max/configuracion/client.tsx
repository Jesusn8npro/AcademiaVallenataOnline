'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Configuración PRO MAX (depende de browser APIs/estado del simulador).
// Client-only con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const ConfiguracionProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/ConfiguracionProMax'),
  { ssr: false, loading: CargandoRuta },
)

export function ConfiguracionProMaxClient() {
  return <ConfiguracionProMax />
}
