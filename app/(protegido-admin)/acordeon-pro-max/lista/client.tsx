'use client'

import dynamic from 'next/dynamic'

// 3D/audio pesado: client-only con ssr:false (patrón app/[[...slug]]/client.tsx).
const ListaCancionesProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/ListaCancionesProMax'),
  { ssr: false },
)

export function ListaCancionesProMaxClient() {
  return <ListaCancionesProMax />
}
