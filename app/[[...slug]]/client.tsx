'use client'

import dynamic from 'next/dynamic'

// La app React actual (react-router + Supabase + three.js + audio) corre
// 100% en cliente durante la Etapa A de la migración. ssr:false desactiva
// el prerender desde App hacia abajo.
const App = dynamic(() => import('./AppEntry'), { ssr: false })

export function ClientOnly() {
  return <App />
}
