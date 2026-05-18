'use client'

import dynamic from 'next/dynamic'

// Simulador 3D/audio pesado: client-only con ssr:false (patrón
// app/[[...slug]]/client.tsx). Sirve para /acordeon y /acordeon/[slug];
// el slug lo lee internamente el hook useAcordeonProMaxSimulador via
// useParams de @/compat/router.
const AcordeonProMaxSimulador = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/AcordeonProMaxSimulador'),
  { ssr: false },
)

export function AcordeonProMaxSimuladorClient() {
  return <AcordeonProMaxSimulador />
}
