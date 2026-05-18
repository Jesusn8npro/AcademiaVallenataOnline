'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// Simulador 3D/audio pesado: client-only con ssr: false, loading: CargandoRuta (patrón
// app/[[...slug]]/client.tsx). Sirve para /acordeon y /acordeon/[slug];
// el slug lo lee internamente el hook useAcordeonProMaxSimulador via
// useParams de @/compat/router.
const AcordeonProMaxSimulador = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/AcordeonProMaxSimulador'),
  { ssr: false, loading: CargandoRuta },
)

export function AcordeonProMaxSimuladorClient() {
  return <AcordeonProMaxSimulador />
}
