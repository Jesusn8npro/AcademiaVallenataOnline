'use client'
import dynamic from 'next/dynamic'
import '../../src/Paginas/AcordeonProMax/PracticaLibre/EstudioPracticaLibre.css'
const V = dynamic(() => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/VisorPersonaje3D'), { ssr: false, loading: () => <div>Cargando…</div> })
export default function P() {
  return <div style={{ width: '100vw', height: '100vh', padding: 24, background: '#0b0e16' }}><V /></div>
}
