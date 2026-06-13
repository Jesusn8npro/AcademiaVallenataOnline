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

// Sandbox del MUNDO responsivo. En PANTALLA ANGOSTA (móvil) el panel del acordeón es un CAJÓN que
// sale/entra (no aplasta el mundo). Por defecto NO inmersivo (se ve el menú de la app); P oculta la
// interfaz, F pantalla completa. Botón "Panel" para mostrar/ocultar el panel cuantas veces quieras.
export default function P() {
  const [inmersivo, setInmersivo] = React.useState(false)
  const [panel, setPanel] = React.useState(true)
  const [compacto, setCompacto] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const f = () => { const c = window.innerWidth < 820; setCompacto(c); setPanel(!c) }
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const pantallaCompleta = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return
      if (e.key.toLowerCase() === 'p') setInmersivo((v) => !v)
      if (e.key.toLowerCase() === 'f') pantallaCompleta()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [pantallaCompleta])

  const cont: React.CSSProperties = inmersivo
    ? { position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', background: '#0b0e16', overflow: 'hidden' }
    : { position: 'relative', width: '100%', height: '100dvh', display: 'flex', background: '#0b0e16', overflow: 'hidden' }

  const aside: React.CSSProperties = compacto
    ? { position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(88%, 360px)', overflowY: 'auto', background: '#0b0e16', borderLeft: '1px solid #1c2230', padding: 12, transform: panel ? 'translateX(0)' : 'translateX(101%)', transition: 'transform .25s ease', zIndex: 40, boxShadow: panel ? '-12px 0 30px rgba(0,0,0,.4)' : 'none' }
    : { width: panel ? 330 : 0, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', borderLeft: panel ? '1px solid #1c2230' : 'none', padding: panel ? 12 : 0, background: '#0b0e16', transition: 'width .2s ease' }

  const btn: React.CSSProperties = { padding: '6px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: 'rgba(0,0,0,.6)', color: '#fff', fontFamily: 'system-ui, sans-serif' }

  return (
    <PersonajeEstudioProvider>
      <div ref={ref} style={cont}>
        <Mundo compacto={compacto} />
        <aside style={aside}>
          <SeccionPLPersonaje />
        </aside>

        {/* Controles de página: panel + interfaz + pantalla completa */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 60, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" style={{ ...btn, background: panel ? '#ff7a18' : 'rgba(0,0,0,.6)' }} onClick={() => setPanel((p) => !p)}>
            {panel ? '✕ Panel' : '☰ Panel'}
          </button>
          <button type="button" style={btn} onClick={() => setInmersivo((v) => !v)}>{inmersivo ? '🙈 Interfaz' : '🧹 Pantalla'} <b>(P)</b></button>
          <button type="button" style={btn} onClick={pantallaCompleta}>⛶ <b>(F)</b></button>
        </div>
      </div>
    </PersonajeEstudioProvider>
  )
}
