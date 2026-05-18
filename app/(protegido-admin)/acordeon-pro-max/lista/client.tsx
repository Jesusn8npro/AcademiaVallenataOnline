'use client'

import dynamic from 'next/dynamic'
import CargandoRuta from '@/componentes/common/CargandoRuta'

// 3D/audio pesado: client-only con ssr: false, loading: CargandoRuta (patrón app/[[...slug]]/client.tsx).
const ListaCancionesProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/ListaCancionesProMax'),
  { ssr: false, loading: CargandoRuta },
)

export function ListaCancionesProMaxClient() {
  return <ListaCancionesProMax />
}
