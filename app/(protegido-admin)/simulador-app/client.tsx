'use client'

import dynamic from 'next/dynamic'

// Simulador App: acordeón interactivo con AudioEnginePro + framer-motion +
// grabación. Client-only con ssr:false (patrón app/[[...slug]]/client.tsx).
const SimuladorApp = dynamic(
  () => import('@/Paginas/SimuladorApp/SimuladorApp'),
  { ssr: false },
)

export function SimuladorAppClient() {
  return <SimuladorApp />
}
