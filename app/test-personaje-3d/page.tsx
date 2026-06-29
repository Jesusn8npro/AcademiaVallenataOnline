'use client'
import dynamic from 'next/dynamic'
// /test-personaje-3d — Pelao + acordeon horneados JUNTOS (cuerpo skinned + fuelle por morph),
// un solo recorrido cerrado<->abierto escrubado por arrastre. Sin IK/welds en la web.
const V = dynamic(() => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/VisorPelaoFuelleLibre'), { ssr: false, loading: () => <div>Cargando…</div> })
export default function P() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0b0e16' }}><V /></div>
  )
}
