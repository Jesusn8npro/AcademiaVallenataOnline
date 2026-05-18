'use client'

import dynamic from 'next/dynamic'

// 3D/audio pesado (three.js + howler + AudioEngine): DEBE cargar client-only.
// ssr:false desactiva el prerender (mismo patrón que app/[[...slug]]/client.tsx).
const HomeProMax = dynamic(
  () => import('@/Paginas/AcordeonProMax/Pantallas/HomeProMax'),
  { ssr: false },
)

export function HomeProMaxClient() {
  return <HomeProMax />
}
