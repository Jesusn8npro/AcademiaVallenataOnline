'use client'

import dynamic from 'next/dynamic'

// Configuración PRO MAX (depende de browser APIs/estado del simulador).
// Client-only con ssr:false (patrón app/[[...slug]]/client.tsx).
const ConfiguracionProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/ConfiguracionProMax'),
  { ssr: false },
)

export function ConfiguracionProMaxClient() {
  return <ConfiguracionProMax />
}
