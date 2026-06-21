'use client'
import * as React from 'react'
import dynamic from 'next/dynamic'
import { PersonajeEstudioProvider } from '../../src/Paginas/AcordeonProMax/PracticaLibre/contextoPersonajeEstudio'
import SeccionPLPersonaje from '../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/SeccionPLPersonaje'
// Catálogo de escenarios + vistas: archivo LIVIANO (solo datos), NO arrastra three.js → seguro importarlo
// estático en la página (el Mundo pesado sigue siendo dynamic).
import { ESCENARIOS_MUNDO, ESCENARIO_MUNDO_DEFAULT, escenarioMundoPorId, VISTAS } from '../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/mundo/escenariosMundo'
import '../../src/Paginas/AcordeonProMax/PracticaLibre/EstudioPracticaLibre.css'
// (El CSS del simulador del duelo se importa en ./layout.tsx — server component, carga fiable por ruta.)

// Fallback del import dinámico = MISMA pantalla que el overlay "Cargando mundo abierto" de MundoPoC, a
// pantalla completa (flex:1) → la carga se ve como UNA sola pantalla limpia (sin el flash negro/layout roto
// previo) que transiciona sin costuras al overlay interno y luego al mundo.
function CargandoMundo() {
  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, background: 'radial-gradient(ellipse at center, #1a2740 0%, #0a0e1a 78%)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes mundoSpin{to{transform:rotate(360deg)}}@keyframes mundoPulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
      <div style={{ width: 62, height: 62, borderRadius: '50%', border: '4px solid rgba(255,255,255,.14)', borderTopColor: '#ff7a18', animation: 'mundoSpin .9s linear infinite' }} />
      <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, letterSpacing: '.5px' }}>🌍 Cargando mundo abierto</div>
      <div style={{ fontSize: 14, opacity: .85, animation: 'mundoPulse 1.5s ease-in-out infinite' }}>¡Prepárate para disfrutar!</div>
    </div>
  )
}

const Mundo = dynamic(
  () => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/mundo/MundoPoC'),
  { ssr: false, loading: () => <CargandoMundo /> },
)

// Sandbox del MUNDO responsivo. Por defecto INMERSIVO (overlay fijo que TAPA sidebar + menú superior +
// menú inferior de la app, en desktop y móvil). Botón "← Volver" para salir. En pantalla angosta el
// panel del acordeón es un CAJÓN que sale/entra (no aplasta el mundo). P alterna la interfaz, F fullscreen.
export default function P() {
  const [inmersivo, setInmersivo] = React.useState(true)
  const [panel, setPanel] = React.useState(true)
  const [compacto, setCompacto] = React.useState(false)
  const [tocando, setTocando] = React.useState(false) // el usuario está tocando en el mundo → vista limpia
  // Escenario + vista del mundo: viven AQUÍ (botones al lado de "Panel"). Se pasan a <Mundo> como props.
  const [escenarioId, setEscenarioId] = React.useState(ESCENARIO_MUNDO_DEFAULT)
  const [vistaModo, setVistaModo] = React.useState('tercera')
  const [menuHud, setMenuHud] = React.useState<'escenarios' | 'vistas' | null>(null)
  const [ayudaAbierta, setAyudaAbierta] = React.useState(false)
  const escenarioDef = escenarioMundoPorId(escenarioId)
  const ref = React.useRef<HTMLDivElement>(null)
  const prevCompactoRef = React.useRef<boolean | null>(null)

  React.useEffect(() => {
    const f = () => {
      const w = window.innerWidth, h = window.innerHeight
      const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      // Compacto = móvil: ancho angosto O un teléfono en HORIZONTAL (su lado corto sigue siendo chico).
      // Antes era solo innerWidth<820 → un teléfono en horizontal (ancho>820) se trataba como desktop y
      // abría el panel de 330px tapando la vista. Con el alto detectamos el horizontal de móvil.
      const c = w < 820 || (touch && Math.min(w, h) < 600)
      setCompacto(c)
      // Solo (des)abrir el panel al CAMBIAR de modo móvil↔desktop. En cada resize NO, porque en móvil la
      // barra del navegador aparece/desaparece y dispara resize → cerraría el panel al hacer scroll, y al
      // rotar reabriría la vista. Esto evita el "se abre el panel al poner horizontal".
      if (prevCompactoRef.current !== c) { setPanel(!c); prevCompactoRef.current = c }
    }
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  // En móvil la interfaz de la app NUNCA debe aparecer: forzamos inmersivo (overlay a pantalla completa).
  React.useEffect(() => { if (compacto) setInmersivo(true) }, [compacto])

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

  // Sin selección de texto (al mantener el dedo no se resalta como si seleccionara texto) ni callout táctil.
  const noSeleccion: React.CSSProperties = { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' as any }
  const cont: React.CSSProperties = inmersivo
    ? { position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', background: '#0b0e16', overflow: 'hidden', ...noSeleccion }
    : { position: 'relative', width: '100%', height: '100dvh', display: 'flex', background: '#0b0e16', overflow: 'hidden', ...noSeleccion }

  const aside: React.CSSProperties = compacto
    ? { position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(88%, 360px)', overflowY: 'auto', background: '#0b0e16', borderLeft: '1px solid #1c2230', padding: 12, transform: panel ? 'translateX(0)' : 'translateX(101%)', transition: 'transform .25s ease', zIndex: 40, boxShadow: panel ? '-12px 0 30px rgba(0,0,0,.4)' : 'none' }
    : { width: panel ? 330 : 0, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', borderLeft: panel ? '1px solid #1c2230' : 'none', padding: panel ? 12 : 0, background: '#0b0e16', transition: 'width .2s ease' }

  const btn: React.CSSProperties = { padding: compacto ? '9px 14px' : '6px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: compacto ? 14 : 13, background: 'rgba(0,0,0,.6)', color: '#fff', fontFamily: 'system-ui, sans-serif', WebkitTapHighlightColor: 'transparent' }
  // Botones PEQUEÑOS (Escenarios/Vistas) al lado de Panel + opciones del dropdown.
  const btnMini: React.CSSProperties = { padding: compacto ? '7px 10px' : '5px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: 'system-ui, sans-serif', WebkitTapHighlightColor: 'transparent' }
  const btnOpt: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontFamily: 'system-ui, sans-serif', WebkitTapHighlightColor: 'transparent' }

  return (
    <PersonajeEstudioProvider>
      <div ref={ref} style={cont}>
        <Mundo
          compacto={compacto}
          onTocandoChange={setTocando}
          escenarioId={escenarioId}
          onEscenarioId={setEscenarioId}
          vistaModo={vistaModo}
          onVistaModo={setVistaModo}
        />
        <aside style={aside}>
          <SeccionPLPersonaje />
        </aside>

        {/* Controles de página: volver + panel + Escenarios + Vistas + interfaz + pantalla completa. Mientras
            se TOCA, se ocultan (excepto Volver) para no incomodar la vista (pedido del usuario). */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 60, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" style={{ ...btn, background: '#c0392b' }} onClick={() => { if (typeof window !== 'undefined') { if (window.history.length > 1) window.history.back(); else window.location.href = '/' } }}>
            ← Volver
          </button>
          {!tocando && (
            <button type="button" style={{ ...btn, background: panel ? '#ff7a18' : 'rgba(0,0,0,.6)' }} onClick={() => setPanel((p) => !p)}>
              {panel ? '✕ Panel' : '☰ Panel'}
            </button>
          )}
          {/* Escenarios + Vistas: botones PEQUEÑOS al lado de Panel; despliegan su menú (no tapan la pantalla). */}
          {!tocando && (
            <>
              <button type="button" style={{ ...btnMini, background: menuHud === 'escenarios' ? '#2e86de' : 'rgba(0,0,0,.6)' }} onClick={() => setMenuHud((m) => (m === 'escenarios' ? null : 'escenarios'))}>🌆 Escenarios</button>
              <button type="button" style={{ ...btnMini, background: menuHud === 'vistas' ? '#ff7a18' : 'rgba(0,0,0,.6)' }} onClick={() => setMenuHud((m) => (m === 'vistas' ? null : 'vistas'))}>👁️ Vistas</button>
              <button type="button" style={{ ...btnMini, background: ayudaAbierta ? '#27ae60' : 'rgba(0,0,0,.6)' }} onClick={() => setAyudaAbierta((v) => !v)}>❓ Ayuda</button>
            </>
          )}
          {/* Interfaz (P) y Pantalla completa (F) SOLO en desktop y SOLO si no estás tocando. En móvil la app
              va siempre inmersiva (sin chrome) y el fullscreen no hace falta → menos botones, vista limpia. */}
          {!compacto && !tocando && <button type="button" style={btn} onClick={() => setInmersivo((v) => !v)}>{inmersivo ? '🙈 Interfaz' : '🧹 Pantalla'} <b>(P)</b></button>}
          {!compacto && !tocando && <button type="button" style={btn} onClick={pantallaCompleta}>⛶ <b>(F)</b></button>}
        </div>

        {/* Menú desplegable de Escenarios / Vistas (debajo de la fila de botones). */}
        {!tocando && menuHud && (
          <div style={{ position: 'absolute', top: compacto ? 56 : 48, left: 10, zIndex: 61, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(8,11,18,.9)', padding: 8, borderRadius: 10, maxWidth: 'min(92vw, 380px)', boxShadow: '0 8px 24px rgba(0,0,0,.45)' }}>
            {menuHud === 'escenarios' ? (
              <>
                {ESCENARIOS_MUNDO.map((e) => (
                  <button key={e.id} type="button" onClick={() => { setEscenarioId(e.id); setMenuHud(null) }} style={{ ...btnOpt, background: escenarioId === e.id ? '#2e86de' : 'rgba(255,255,255,.08)', fontWeight: escenarioId === e.id ? 700 : 400 }}>{e.nombre}</button>
                ))}
                {escenarioDef.credito && <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, width: '100%' }}>Modelo: {escenarioDef.credito}</span>}
              </>
            ) : (
              VISTAS.map((v, i) => (
                <button key={v.id} type="button" onClick={() => { setVistaModo(v.id); setMenuHud(null) }} style={{ ...btnOpt, background: vistaModo === v.id ? '#ff7a18' : 'rgba(255,255,255,.08)', fontWeight: vistaModo === v.id ? 700 : 400 }}>
                  <span style={{ opacity: 0.6, marginRight: 4 }}>{i + 1}</span>{v.nombre}
                </button>
              ))
            )}
          </div>
        )}

        {/* Popup de AYUDA: qué se puede hacer en el mundo. */}
        {ayudaAbierta && (
          <div onClick={() => setAyudaAbierta(false)} style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px, 94vw)', maxHeight: '86vh', overflowY: 'auto', background: 'linear-gradient(#141b2c, #0d1220)', border: '1px solid #2a3346', borderRadius: 16, padding: 20, color: '#fff', fontFamily: 'system-ui, sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🌍 ¿Qué puedes hacer aquí?</h2>
                <button type="button" onClick={() => setAyudaAbierta(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['🎹', 'Tocar el acordeón en vivo', 'Pulsa “Tocar”: suena de verdad y los demás te escuchan.'],
                  ['👥', 'Conocer y tocar con más personas', 'Otros jugadores aparecen en tiempo real en el mismo mundo.'],
                  ['🔊', 'Escuchar a otros', 'Toca (clic/tap) a un jugador para oír lo que está tocando.'],
                  ['⚔️', 'Competir', 'Reta a alguien a un duelo de la misma canción y mira quién gana.'],
                  ['💬', 'Hablar / interactuar', 'Coordina retos con el chat del duelo; muévete y socializa.'],
                  ['🎭', 'Personalizar tu personaje', 'En “Panel”: cambia personaje, piel del acordeón, bailes y escenario.'],
                  ['🏃', 'Explorar', 'Camina con el joystick, corre (doble-tap = fijo), salta y cambia de vista.'],
                ].map(([icono, titulo, desc]) => (
                  <li key={titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, lineHeight: 1.1 }}>{icono}</span>
                    <span>
                      <strong style={{ display: 'block', fontSize: 15 }}>{titulo}</strong>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setAyudaAbierta(false)} style={{ marginTop: 18, width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#ff7a18', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                ¡A disfrutar! 🎶
              </button>
            </div>
          </div>
        )}
      </div>
    </PersonajeEstudioProvider>
  )
}
