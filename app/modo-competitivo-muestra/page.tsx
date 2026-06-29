'use client'
import * as React from 'react'
import dynamic from 'next/dynamic'
import CuerpoAcordeon from '../../src/Core/componentes/CuerpoAcordeon'
import PuenteNotas from '../../src/Paginas/AcordeonProMax/Componentes/PuenteNotas'
import { usePosicionProMax } from '../../src/Paginas/AcordeonProMax/Hooks/usePosicionProMax'
import { TONALIDADES } from '../../src/Core/acordeon/notasAcordeonDiatonico'
import { TICKS_VIAJE } from '../../src/Paginas/AcordeonProMax/TiposProMax'
import type { CancionHeroConTonalidad } from '../../src/Paginas/AcordeonProMax/TiposProMax'
import '../../src/Paginas/AcordeonProMax/Modos/ModoCompetitivo.css'

// ──────────────────────────────────────────────────────────────────────────────
// PÁGINA DE MUESTRA — "Modo Competitivo" (Imágenes ↔ Acordeón 3D)
// Prueba pisar-y-viajar: al pisar un botón del MAESTRO, una guía viaja al MISMO botón
// del ALUMNO. Valida que las posiciones de los botones 3D son exactas (la nota sale
// justo del botón pisado), sin depender de canciones pregrabadas. Con un toggle alternamos
// entre acordeones de IMAGEN (posiciones por DOM) y 3D (posiciones por proyección).
// ──────────────────────────────────────────────────────────────────────────────

// Acordeón 3D (three.js) — sólo se carga al activar el modo 3D.
const VisorAcordeon3D = dynamic(
  () => import('../../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="acordeon-3d-juego-cargando">Cargando acordeón 3D…</div> }
)

const NOOP_STR: (id: string) => void = () => {}
const NOOP_MALLAS: (p: any) => void = () => {}
const MODO_VISTA: any = 'cifrado'

// Pieles distintas para diferenciar Maestro y Alumno (mismas que la versión real del juego).
const SKIN_MAESTRO = '3'
const SKIN_ALUMNO = '5'

// strip dirección → clave espacial del botón (idéntico a keyDeId del visor 3D): el PuenteNotas
// pregunta por "1-5-halar" y el visor reporta posiciones por "1-5" / "bajo-1-3".
function claveBoton(idBoton: string): string {
  let s = idBoton
  let bajo = false
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5) }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '')
  return bajo ? `bajo-${s}` : s
}

// Tonalidad por defecto = configuración de botones (filas + bajos). No necesita la lógica completa.
const config: any = (TONALIDADES as any)['F-Bb-Eb'] || Object.values(TONALIDADES)[0]

const RESOLUCION = 192
const BPM = 70

const CANCION_BASE: Omit<CancionHeroConTonalidad, 'secuencia'> = {
  titulo: 'Prueba pisar-y-viajar',
  autor: 'Demo',
  bpm: BPM,
  resolucion: RESOLUCION,
  dificultad: 'basico',
  tipo: 'secuencia',
}

// Tamaños/posiciones del acordeón de imagen (mismas vars del duelo → mismo tamaño que el juego).
const AJUSTES: any = {
  tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
  x: 'var(--duelo-acordeon-x, 50%)',
  y: 'var(--duelo-acordeon-y, 50%)',
  pitosBotonTamano: '4.4vh',
  pitosFuenteTamano: '1.6vh',
  bajosBotonTamano: '4.2vh',
  bajosFuenteTamano: '1.3vh',
  teclasLeft: '5.05%',
  teclasTop: '13%',
  bajosLeft: '82.5%',
  bajosTop: '28%',
  mapeoPersonalizado: {},
}

interface NotaViva {
  id: string
  tick: number
  botonId: string
  duracion: number
  fuelle: 'abriendo' | 'cerrando'
}

export default function ModoCompetitivoMuestra() {
  const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax()
  const [tick, setTick] = React.useState(0)
  const [notasVivas, setNotasVivas] = React.useState<NotaViva[]>([])
  const [maestroActivos, setMaestroActivos] = React.useState<Record<string, boolean>>({})
  const [botonesAlumno, setBotonesAlumno] = React.useState<Record<string, boolean>>({})
  const [impactadas, setImpactadas] = React.useState<Set<string>>(new Set())
  const [use3D, setUse3D] = React.useState(false)

  // ── Encuadre del acordeón 3D (valores fijos, afinados en vivo) ──────────────────────
  // Poner en true para volver a mostrar el panel de sliders y reajustar el encuadre.
  const MOSTRAR_CONTROLES = true
  // Rotación TUNEABLE en grados (X/Y/Z). Arranca en la rotación de producción (ENC_ROTACION) para
  // afinar desde ahí. Z = LADEO (roll): bájalo a ~0 para nivelar el acordeón como en la imagen 2D.
  const ROT_BASE: [number, number, number] = [0, 0, 0]
  const [rotX, setRotX] = React.useState(-79)
  const [rotY, setRotY] = React.useState(-4)
  const [rotZ, setRotZ] = React.useState(0)
  // Encuadre AUTO (responsive): fill = fracción del ancho que ocupa; offsetRelX/Y = nudge.
  const [fill, setFill] = React.useState(1.15)
  const [offsetRelX, setOffsetRelX] = React.useState(0.06)
  const [offsetRelY, setOffsetRelY] = React.useState(0)
  // Layout: ancho del recuadro de cada acordeón (%) y separación entre ambos (vw).
  const [ancho, setAncho] = React.useState(48)
  const [sep, setSep] = React.useState(1)
  const [valoresGuardados, setValoresGuardados] = React.useState('')
  // Calibración del mapeo del 3D para que coincida con la convención de la canción.
  const [invFilas, setInvFilas] = React.useState(false)
  const [invCols, setInvCols] = React.useState(false)
  // Navegar (orbitar) el acordeón 3D para explorarlo.
  const [navegar, setNavegar] = React.useState(false)
  const rad = (g: number) => (g * Math.PI) / 180
  const rotacionModelo: [number, number, number] = [ROT_BASE[0] + rad(rotX), ROT_BASE[1] + rad(rotY), ROT_BASE[2] + rad(rotZ)]

  const tickRef = React.useRef(0)

  // Posiciones en pantalla de los botones 3D, proyectadas por cada visor (cámara fija).
  // Reemplazan al cálculo por DOM cuando estamos en modo 3D.
  const posMaestroRef = React.useRef<Record<string, { x: number; y: number }>>({})
  const posAlumnoRef = React.useRef<Record<string, { x: number; y: number }>>({})
  const obtenerPosMaestro3D = React.useCallback((id: string) => posMaestroRef.current[claveBoton(id)] ?? null, [])
  const obtenerPosAlumno3D = React.useCallback((id: string) => posAlumnoRef.current[claveBoton(id)] ?? null, [])
  // Botones OBJETIVO próximos a pisar (clave→proximidad 0..1) → el alumno los ilumina con anticipación.
  const objetivosRef = React.useRef<Record<string, number>>({})
  // El visor exige un ref de fuelle (tecla Q en el estudio); en la muestra el fuelle va cerrado fijo.
  const fuelleDummyRef = React.useRef(false)

  // Reloj MONÓTONO (no reinicia): los ticks crecen siempre, así las notas vivas viajan limpio.
  // Cada frame poda las notas que ya llegaron hace rato.
  React.useEffect(() => {
    let raf = 0
    let prev = performance.now()
    const ticksPorSeg = (BPM * RESOLUCION) / 60
    const loop = (now: number) => {
      const dt = (now - prev) / 1000
      prev = now
      tickRef.current += ticksPorSeg * dt
      setTick(tickRef.current)
      setNotasVivas((prevN) => {
        const vivas = prevN.filter((n) => tickRef.current < n.tick + 60)
        return vivas.length === prevN.length ? prevN : vivas
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // MAESTRO pisa un botón → dispara una guía que viaja al MISMO botón del alumno.
  // La guía nace en el maestro AHORA (tick actual) y llega al alumno tras TICKS_VIAJE.
  const pisarMaestro = React.useCallback((idLogico: string, abajo: boolean) => {
    setMaestroActivos((p) => ({ ...p, [idLogico]: abajo }))
    if (!abajo) return
    const nota: NotaViva = {
      id: `${idLogico}-${Math.round(tickRef.current)}-${Math.random().toString(36).slice(2, 6)}`,
      tick: tickRef.current + TICKS_VIAJE,
      botonId: idLogico,
      duracion: 0,
      fuelle: idLogico.includes('empujar') ? 'cerrando' : 'abriendo',
    }
    setNotasVivas((p) => [...p, nota])
  }, [])

  // ALUMNO pisa → marca el botón y, si hay una guía llegando a ese mismo botón, la acierta.
  const pisarAlumno = React.useCallback((idLogico: string, abajo: boolean) => {
    setBotonesAlumno((p) => ({ ...p, [idLogico]: abajo }))
    if (!abajo) return
    setNotasVivas((vivas) => {
      for (const n of vivas) {
        if (n.botonId === idLogico && Math.abs(tickRef.current - n.tick) < 60) {
          setImpactadas((s) => { const ns = new Set(s); ns.add(`${n.tick}-${n.botonId}`); return ns })
        }
      }
      return vivas
    })
  }, [])

  // Todos los IDs REALES de la canción (melodía + bajos, halar) — un id por botón físico.
  const IDS_PRUEBA = React.useMemo<string[]>(() => [
    ...config.primeraFila, ...config.segundaFila, ...config.terceraFila,
    ...(config.disposicionBajos?.una ?? []), ...(config.disposicionBajos?.dos ?? []),
  ].filter((b: any) => typeof b.id === 'string' && b.id.includes('halar')).map((b: any) => b.id), [])

  // Prueba en LOOP: recorre TODOS los botones con sus IDs reales, sin parar, así se ve que cada
  // nota cae en el botón correcto y si alguno se queda sin nota (id sin mapear en el 3D).
  const [probando, setProbando] = React.useState(false)
  const idxPruebaRef = React.useRef(0)
  React.useEffect(() => {
    if (!probando) return
    const t = setInterval(() => {
      const id = IDS_PRUEBA[idxPruebaRef.current % IDS_PRUEBA.length]
      idxPruebaRef.current++
      setNotasVivas((p) => [...p, {
        id: `loop-${id}-${Date.now()}`,
        tick: tickRef.current + TICKS_VIAJE,
        botonId: id,
        duracion: 0,
        fuelle: 'abriendo' as const,
      }])
    }, 200)
    return () => clearInterval(t)
  }, [probando, IDS_PRUEBA])

  // Cuántos IDs de la canción tienen posición proyectada en el maestro (si < total, falta mapear).
  const mapeados = IDS_PRUEBA.filter((id) => posMaestroRef.current[claveBoton(id)]).length

  const cancion = React.useMemo<CancionHeroConTonalidad>(
    () => ({ ...CANCION_BASE, secuencia: notasVivas }),
    [notasVivas]
  )

  // Botones próximos a pisar en el alumno: para cada nota que llega dentro de la ventana de viaje,
  // proximidad 0 (recién aparece, aviso temprano) → 1 (pisar AHORA). El visor del alumno los ilumina.
  {
    const obj: Record<string, number> = {}
    for (const n of notasVivas) {
      const dt = n.tick - tick
      if (dt > -12 && dt <= TICKS_VIAJE) {
        const prox = Math.max(0, Math.min(1, 1 - dt / TICKS_VIAJE))
        const k = claveBoton(n.botonId)
        if (prox > (obj[k] ?? 0)) obj[k] = prox
      }
    }
    objetivosRef.current = obj
  }

  const volver = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back()
      else window.location.href = '/'
    }
  }

  return (
    <div
      className="competitivo-modo"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #1a1340 0%, #07060f 78%)',
        overflow: 'hidden',
        fontFamily: 'Raleway, system-ui, sans-serif',
      }}
    >
      <button
        type="button"
        onClick={volver}
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 60, padding: '8px 14px',
          borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
          background: '#c0392b', color: '#fff',
        }}
      >
        ← Volver
      </button>

      <button
        type="button"
        onClick={() => setUse3D((v) => !v)}
        style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '14px 28px', fontSize: 16,
          borderRadius: 999, border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 800,
          background: use3D ? 'rgba(99,102,241,0.85)' : 'rgba(20,24,40,0.92)', color: '#fff',
          backdropFilter: 'blur(6px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {use3D ? '🪗 Viendo 3D · cambiar a Imágenes' : '🖼️ Viendo Imágenes · cambiar a 3D'}
      </button>

      <div
        style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, color: '#fff', textAlign: 'center', pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.06em' }}>PRUEBA · Pisar Maestro → Viaja al Alumno</div>
        <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: '0.12em' }}>
          {use3D ? 'Pisa un botón del acordeón 3D del MAESTRO' : 'Pisa un botón del acordeón del MAESTRO'}
        </div>
      </div>

      {use3D && MOSTRAR_CONTROLES && (
        <div
          style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 6,
            background: 'rgba(10,12,24,0.9)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '12px 18px', color: '#fff', fontSize: 13, minWidth: 380,
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            Botones → M: {Object.keys(posMaestroRef.current).length} · A: {Object.keys(posAlumnoRef.current).length} · IDs canción mapeados: {mapeados}/{IDS_PRUEBA.length}
          </div>
          {([
            ['Rot X', rotX, setRotX, -180, 180, 1] as const,
            ['Rot Y', rotY, setRotY, -180, 180, 1] as const,
            ['Rot Z (ladeo)', rotZ, setRotZ, -180, 180, 1] as const,
            ['Fill (tamaño)', fill, setFill, 0.3, 2, 0.01] as const,
            ['Offset X', offsetRelX, setOffsetRelX, -3, 3, 0.01] as const,
            ['Offset Y', offsetRelY, setOffsetRelY, -3, 3, 0.01] as const,
            ['Ancho recuadro', ancho, setAncho, 25, 60, 1] as const,
            ['Separación', sep, setSep, 0, 20, 0.5] as const,
          ]).map(([label, val, set, min, max, step]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 78 }}>{label}: {val}</span>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={(e) => (set as any)(+e.target.value)} style={{ flex: 1 }} />
            </label>
          ))}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <input type="checkbox" checked={invFilas} onChange={(e) => setInvFilas(e.target.checked)} /> Invertir filas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <input type="checkbox" checked={invCols} onChange={(e) => setInvCols(e.target.checked)} /> Invertir columnas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: navegar ? '#34d399' : undefined }}>
              <input type="checkbox" checked={navegar} onChange={(e) => setNavegar(e.target.checked)} /> 🔄 Navegar (rotar)
            </label>
          </div>
          <button
            type="button"
            onClick={() => setProbando((v) => !v)}
            style={{ alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 6, border: 'none', background: probando ? '#dc2626' : '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            {probando ? '⏹ Detener prueba' : '▶ Probar canción (loop, IDs reales)'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const v = `rotX=${rotX} rotY=${rotY} rotZ=${rotZ} fill=${fill} offsetX=${offsetRelX} offsetY=${offsetRelY} ancho=${ancho} sep=${sep} invFilas=${invFilas} invCols=${invCols}`
                setValoresGuardados(v)
                if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(v).catch(() => {})
                // eslint-disable-next-line no-console
                console.log('[ENCUADRE 3D GUARDADO]', v)
              }}
              style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              💾 Guardar
            </button>
            <button
              type="button"
              onClick={() => { setRotX(0); setRotY(0); setRotZ(0); setFill(0.95); setOffsetRelX(0); setOffsetRelY(0); setAncho(48); setSep(1) }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
          {valoresGuardados && (
            <div style={{ marginTop: 4, padding: '6px 8px', background: 'rgba(34,197,94,0.15)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, userSelect: 'all' }}>
              ✅ {valoresGuardados}
            </div>
          )}
        </div>
      )}

      <div className="hero-escenario" style={use3D ? { gap: `${sep}vw` } : undefined}>
        <div className="hero-acordeon-wrap maestro" ref={refMaestro} style={use3D ? { width: `${ancho}%` } : undefined}>
          <span className="hero-acordeon-label">Maestro</span>
          {use3D ? (
            <VisorAcordeon3D
              materialPorMesh={{}}
              piezaSeleccionada={null}
              onClickPieza={NOOP_STR}
              onMallasDetectadas={NOOP_MALLAS}
              fuelleCerrandoRef={fuelleDummyRef}
              animShapeKey={null}
              animProgramatica={null}
              pulseEpoch={null}
              skin={SKIN_MAESTRO}
              fuelleCerradoFijo={false}
              camaraFija
              botonesActivosExternos={maestroActivos}
              direccion="halar"
              rotacionModelo={rotacionModelo}
              fillModelo={fill}
              offsetRelXModelo={offsetRelX}
              offsetRelYModelo={offsetRelY}
              invFilasModelo={invFilas}
              invColsModelo={invCols}
              navegable={navegar}
              onTocarBoton={(id, accion) => pisarMaestro(id, accion === 'down')}
              onPosicionesBotones={(m) => { posMaestroRef.current = m }}
              className="acordeon-3d-juego"
            />
          ) : (
            <CuerpoAcordeon
              imagenFondo={'/Acordeon Jugador.webp'}
              ajustes={AJUSTES}
              direccion="halar"
              configTonalidad={config}
              botonesActivos={maestroActivos}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={MODO_VISTA}
              vistaDoble={false}
              setBotonSeleccionado={NOOP_STR}
              actualizarBotonActivo={(id, accion) => pisarMaestro(id, accion === 'add')}
              listo
            />
          )}
        </div>
        <div className="hero-acordeon-wrap alumno" ref={refAlumno} style={use3D ? { width: `${ancho}%` } : undefined}>
          <span className="hero-acordeon-label">Alumno</span>
          {use3D ? (
            <VisorAcordeon3D
              materialPorMesh={{}}
              piezaSeleccionada={null}
              onClickPieza={NOOP_STR}
              onMallasDetectadas={NOOP_MALLAS}
              fuelleCerrandoRef={fuelleDummyRef}
              animShapeKey={null}
              animProgramatica={null}
              pulseEpoch={null}
              skin={SKIN_ALUMNO}
              fuelleCerradoFijo={false}
              camaraFija
              botonesActivosExternos={botonesAlumno}
              direccion="halar"
              rotacionModelo={rotacionModelo}
              fillModelo={fill}
              offsetRelXModelo={offsetRelX}
              offsetRelYModelo={offsetRelY}
              invFilasModelo={invFilas}
              invColsModelo={invCols}
              navegable={navegar}
              objetivosRef={objetivosRef}
              onTocarBoton={(id, accion) => pisarAlumno(id, accion === 'down')}
              onPosicionesBotones={(m) => { posAlumnoRef.current = m }}
              className="acordeon-3d-juego"
            />
          ) : (
            <CuerpoAcordeon
              imagenFondo={'/Acordeon PRO MAX.webp'}
              ajustes={AJUSTES}
              direccion="halar"
              configTonalidad={config}
              botonesActivos={botonesAlumno}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={MODO_VISTA}
              vistaDoble={false}
              setBotonSeleccionado={NOOP_STR}
              actualizarBotonActivo={(id, accion) => pisarAlumno(id, accion === 'add')}
              listo
            />
          )}
        </div>
      </div>

      <PuenteNotas
        cancion={cancion}
        tickActual={tick}
        obtenerPosicionMaestro={use3D ? obtenerPosMaestro3D : obtenerPosicionMaestro}
        obtenerPosicionAlumno={use3D ? obtenerPosAlumno3D : obtenerPosicionAlumno}
        modoVista={MODO_VISTA}
        configTonalidad={config}
        notasImpactadas={impactadas}
      />
    </div>
  )
}
