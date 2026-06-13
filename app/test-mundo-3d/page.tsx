'use client'
import * as React from 'react'
import dynamic from 'next/dynamic'
import { PersonajeEstudioProvider } from '../../src/Paginas/AcordeonProMax/PracticaLibre/contextoPersonajeEstudio'
import SeccionPLPersonaje from '../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/SeccionPLPersonaje'
import '../../src/Paginas/AcordeonProMax/PracticaLibre/EstudioPracticaLibre.css'

const Mundo = dynamic(
  () => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/mundo/MundoPoC'),
  { ssr: false, loading: () => <div style={{ padding: 24, color: '#fff' }}>Cargando…</div> },
)

// Sandbox del MUNDO con todas las opciones de Acordeón ProMax al lado. Modo INMERSIVO (por defecto):
// el contenedor se vuelve un overlay fijo que cubre el sidebar/menú del admin (que tapaban la vista).
// Botón/tecla P = mostrar/ocultar esa interfaz. Botón/tecla F = pantalla completa real del navegador.
export default function P() {
  const [inmersivo, setInmersivo] = React.useState(true)
  const ref = React.useRef<HTMLDivElement>(null)

  const pantallaCompleta = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'p') setInmersivo((v) => !v)
      if (k === 'f') pantallaCompleta()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [pantallaCompleta])

  const cont: React.CSSProperties = inmersivo
    ? { position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', background: '#0b0e16' }
    : { position: 'relative', height: '100vh', display: 'flex', background: '#0b0e16' }

  const btn: React.CSSProperties = { padding: '6px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: 'rgba(0,0,0,.55)', color: '#fff', fontFamily: 'system-ui, sans-serif' }

  return (
    <PersonajeEstudioProvider>
      <div ref={ref} style={cont}>
        <Mundo />
        <aside style={{ width: 330, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid #1c2230', padding: 12, background: '#0b0e16' }}>
          <SeccionPLPersonaje />
        </aside>

        {/* Controles de la página: ocultar interfaz admin + pantalla completa */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100000, display: 'flex', gap: 6 }}>
          <button type="button" style={btn} onClick={() => setInmersivo((v) => !v)}>
            {inmersivo ? '🙈 Mostrar interfaz' : '🧹 Ocultar interfaz'} <b>(P)</b>
          </button>
          <button type="button" style={btn} onClick={pantallaCompleta}>⛶ Pantalla completa <b>(F)</b></button>
        </div>
      </div>
    </PersonajeEstudioProvider>
  )
}
