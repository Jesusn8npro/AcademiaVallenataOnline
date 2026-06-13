'use client'
import * as React from 'react'
import dynamic from 'next/dynamic'
import '../../src/Paginas/AcordeonProMax/PracticaLibre/EstudioPracticaLibre.css'
const V = dynamic(
  () => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div>Cargando…</div> },
)
export default function P() {
  const fuelleCerrandoRef = React.useRef(false)
  const [piezas, setPiezas] = React.useState<string[]>([])
  const [cerrando, setCerrando] = React.useState(false)
  return (
    <div style={{ width: '100vw', height: '100vh', padding: 24, background: '#0b0e16', color: '#fff' }}>
      <button
        onPointerDown={() => { fuelleCerrandoRef.current = true; setCerrando(true) }}
        onPointerUp={() => { fuelleCerrandoRef.current = false; setCerrando(false) }}
        style={{ position: 'absolute', zIndex: 10, padding: 8 }}
      >{cerrando ? 'CERRANDO fuelle' : 'Mantener para cerrar fuelle'}</button>
      <V
        materialPorMesh={{}}
        piezaSeleccionada={null}
        onClickPieza={() => {}}
        onMallasDetectadas={(p) => setPiezas(p.map((x) => x.nombre))}
        fuelleCerrandoRef={fuelleCerrandoRef}
        animShapeKey={null}
        animProgramatica={null}
        pulseEpoch={null}
      />
      <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, opacity: 0.6 }}>
        {piezas.length} piezas detectadas
      </div>
    </div>
  )
}
