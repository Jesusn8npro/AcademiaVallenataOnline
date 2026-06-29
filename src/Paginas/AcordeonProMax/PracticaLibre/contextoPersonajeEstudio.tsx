'use client'
import * as React from 'react'
import * as THREE from 'three'
import { PERSONAJES } from './personajes'
import type { PasoSecuencia } from './animaciones'
import { ESCENARIO_DEFAULT, ESCENARIOS_GLB } from './Componentes/visor/escenarios'
import { TOMA_DEFAULT } from './Componentes/visor/camaras'
import { RIGHT_SUF, NOTA_BOTON, keyDeId, BOTON_DEDO } from './Componentes/visor/mapas'
import { subscribirNotas } from '../../../Core/audio/emisorNotasAcordeon'
import { esUsuarioPremium } from '../../../config/limitesPlan'
import { useUsuario } from '../../../contextos/UsuarioContext'
import { cargarPosicionesEscenario, guardarPosicionEscenario, type PosEscenario } from './Servicios/servicioEscenarioPos'
import { cargarPosesDedos, guardarPoseDedo as guardarPoseDedoDB, borrarPoseDedo as borrarPoseDedoDB, type PoseDedo, type HuesosPose } from './Servicios/servicioPosesDedos'
import {
  leerPersonaje3DLocal,
  guardarPersonaje3DLocal,
  cargarPersonaje3DDB,
  guardarPersonaje3DDB,
  type Personaje3DGuardado,
} from './Servicios/servicioPersonaje3D'
import { listarPresets, type PresetAcordeon } from './Servicios/servicioPresetsAcordeon'

// Estado compartido de la pestaña Personaje 3D: lo consume el visor (centro, vista limpia) y el
// panel de la derecha (selector de personaje + skins + bailes + fuelle). Así los controles viven
// en el panel lateral como Sonido/FX/Modelos y no tapan al personaje.
interface PersonajeEstudioCtx {
  personajeId: string
  setPersonajeId: (id: string) => void
  skin: string
  setSkin: (s: string) => void
  // Diseños guardados del usuario (presets) → aparecen como "modelos" extra en el selector de acordeón.
  presetsAcordeon: PresetAcordeon[]
  baile: string | null
  setBaile: (b: string | null) => void
  escenarioId: string
  setEscenarioId: (id: string) => void
  tomaCamara: string
  setTomaCamara: (id: string) => void
  directorAuto: boolean
  setDirectorAuto: (v: boolean) => void
  secuencia: PasoSecuencia[]
  setSecuencia: React.Dispatch<React.SetStateAction<PasoSecuencia[]>>
  secuenciaActiva: boolean
  setSecuenciaActiva: (v: boolean) => void
  premium: boolean
  esAdmin: boolean
  abierto: boolean
  fuelleAbiertoRef: React.MutableRefObject<boolean>
  setFuelle: (v: boolean) => void
  // Posición MANUAL del fuelle (caja de bajos) por slider: 0 = abierto, 1 = cerrado al límite. Cuando
  // no se está tocando ni manteniendo "Cerrar fuelle", el fuelle reposa en esta posición → el usuario
  // mueve la caja a donde quiera y la mano sigue pegada (mismo mecanismo seguro del cierre).
  fuellePos: number
  fuellePosRef: React.MutableRefObject<number>
  setFuellePos: (v: number) => void
  // Posición fija del personaje por escenario (editor admin). posEscenario = config efectiva (override
  // guardado o default del código); setPosLocal = edición en vivo; guardarPos = persistir en Supabase.
  posEscenario: (id: string) => PosEscenario | null
  setPosLocal: (id: string, patch: Partial<PosEscenario>) => void
  guardarPos: (id: string) => Promise<{ ok: boolean; error?: string }>
  guardandoPos: boolean
  posCargado: boolean // true cuando ya se cargaron las posiciones guardadas (evita el "salto" inicial)

  // ─── Editor de POSES DE DEDOS por botón (admin, gizmo) ───────────────────────────────────────────
  // El admin posa la mano/dedos sobre cada botón con el gizmo y la guarda en Supabase → al pisar ese
  // botón el personaje reproduce la pose EXACTA (sin IK, instantáneo). huesos = sufijo→quat local.
  posesDedos: Record<string, PoseDedo>                                  // botón→pose (lista del panel)
  posesDedosRef: React.MutableRefObject<Record<string, HuesosPose>>     // botón→huesos (lo lee el frame)
  dedosBotonRef: React.MutableRefObject<Record<string, string>>         // botón→dedo asignado (lo usa el IK)
  guiaPorBotonRef: React.MutableRefObject<Record<string, HuesosPose>>   // botón→pose de brazo heredada (guía)
  guiaAnclaRef: React.MutableRefObject<Record<string, string>>          // botón→botón ANCLA de donde salió la guía (para reubicar)
  posesListaRef: React.MutableRefObject<{ key: string; btns: string[] }[]> // poses parseadas (matching de acordes)
  dedoSel: string                                                       // dedo a asignar al botón en edición
  setDedoSel: (d: string) => void
  adminPoseRef: React.MutableRefObject<HuesosPose | null>               // pose activa ahora (la setea la suscripción)
  editandoDedos: boolean
  editandoDedosRef: React.MutableRefObject<boolean>
  setEditandoDedos: (v: boolean) => void
  huesoSelDedo: string                                                  // sufijo del hueso a mover con el gizmo
  setHuesoSelDedo: (s: string) => void
  botonPoseObjetivo: string | null                                      // último botón de melodía pisado (el que se edita)
  bonesDedosRef: React.MutableRefObject<Record<string, THREE.Object3D>> // huesos vivos del brazo derecho (los registra el visor)
  edicionPoseRef: React.MutableRefObject<HuesosPose>                    // pose congelada mientras editas (la reaplica el frame)
  botonEditandoRef: React.MutableRefObject<string[]>                   // botones (acorde) que se iluminan/editan (lo lee el frame)
  guardarPoseDedo: (nombre: string) => Promise<{ ok: boolean; error?: string }>
  borrarPoseDedo: (boton: string) => Promise<{ ok: boolean; error?: string }>
  seleccionarObjetivo: (key: string) => void                            // re-editar una pose guardada (clic en la lista)
  limpiarSeleccion: () => void                                          // vaciar el acorde en edición y empezar otro
  guardandoDedos: boolean
  // Portapapeles de poses: copia la pose (dedos) de un botón y la pega en otro (otra hilera) → reusar
  // la misma "lógica de dedos" en varios botones; luego se afina cada uno.
  hayPortapapeles: boolean
  copiarPose: () => boolean
  pegarPose: () => Promise<{ ok: boolean; error?: string }>
  // Editar más cómodo: guarda el estado antes de mover (gizmo), deshace el último, o re-acomoda el dedo
  // seleccionado automáticamente (borra sus ajustes → el IK lo recoloca sobre el botón).
  marcarHistorial: () => void
  deshacer: () => void
  acomodarDedo: () => void
}

// Config por defecto (del código) de un escenario .glb, como PosEscenario; null si no es .glb.
function posPorDefecto(id: string): PosEscenario | null {
  const d = ESCENARIOS_GLB[id]
  if (!d) return null
  return { x: d.offset[0], y: d.offset[1], z: d.offset[2], rotY: d.rotY, escala: d.escala, autoPiso: d.autoPiso }
}

const Ctx = React.createContext<PersonajeEstudioCtx | null>(null)

export function usePersonajeEstudio(): PersonajeEstudioCtx {
  const c = React.useContext(Ctx)
  if (!c) throw new Error('usePersonajeEstudio debe usarse dentro de PersonajeEstudioProvider')
  return c
}

export const PersonajeEstudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, esAdmin } = useUsuario()

  const [personajeId, setPersonajeId] = React.useState(PERSONAJES[0].id)
  const [skin, setSkin] = React.useState('original')
  const [baile, setBaile] = React.useState<string | null>(null)
  const [escenarioId, setEscenarioId] = React.useState(ESCENARIO_DEFAULT)
  const [tomaCamara, setTomaCamara] = React.useState(TOMA_DEFAULT)

  // ─── Personaje "fichado" por usuario ────────────────────────────────────────────────────────────
  // La elección (personaje + piel + escenario + baile) es LA MISMA en el estudio, el modo juego, el
  // Mundo 3D y el Simulador App. Hidratación: localStorage primero (instantáneo; cubre anónimos, que
  // SÍ usan el Mundo 3D sin login), y luego la columna perfiles.personaje_3d si hay sesión (gana en
  // multi-dispositivo). Tras hidratar, cada cambio se guarda en localStorage (siempre) + DB (logueado).
  const hidratadoRef = React.useRef(false)
  React.useEffect(() => {
    let vivo = true
    // Al (re)hidratar —incluido el login— bloqueamos el guardado hasta terminar, para no escribir los
    // valores actuales (p.ej. los anónimos) encima del personaje guardado del usuario antes de cargarlo.
    hidratadoRef.current = false
    const aplicar = (d: Personaje3DGuardado) => {
      // Solo aplicar si existe y NO está bloqueado (un id guardado de un personaje retirado cae a Pelao).
      if (d.personajeId && PERSONAJES.some((p) => p.id === d.personajeId && !p.bloqueado)) setPersonajeId(d.personajeId)
      if (d.skin) setSkin(d.skin)
      if (d.escenarioId) setEscenarioId(d.escenarioId)
      if (d.baile !== undefined) setBaile(d.baile ?? null)
    }
    aplicar(leerPersonaje3DLocal())
    const uid = usuario?.id
    if (uid) {
      cargarPersonaje3DDB(uid)
        .then((db) => { if (vivo && db) { aplicar(db); guardarPersonaje3DLocal(db) } })
        .finally(() => { hidratadoRef.current = true })
    } else {
      hidratadoRef.current = true
    }
    return () => { vivo = false }
  }, [usuario?.id])

  React.useEffect(() => {
    if (!hidratadoRef.current) return // no pisar lo guardado con los defaults del primer render
    const data: Personaje3DGuardado = { personajeId, skin, escenarioId, baile }
    guardarPersonaje3DLocal(data)
    const uid = usuario?.id
    if (!uid) return
    const t = setTimeout(() => { void guardarPersonaje3DDB(uid, data) }, 600) // debounce escrituras DB
    return () => clearTimeout(t)
  }, [personajeId, skin, escenarioId, baile, usuario?.id])
  const [directorAuto, setDirectorAuto] = React.useState(false)
  const [secuencia, setSecuencia] = React.useState<PasoSecuencia[]>([])
  const [secuenciaActiva, setSecuenciaActiva] = React.useState(false)
  const [abierto, setAbierto] = React.useState(false)
  const fuelleAbiertoRef = React.useRef(false)
  const [fuellePos, setFuellePosState] = React.useState(0)
  const fuellePosRef = React.useRef(0)

  // Presets (diseños) del usuario para el selector de "modelos" del acordeón. Se recargan al cambiar de
  // usuario y cuando se guarda/borra un preset (evento 'acordeon-presets-cambio' desde la pestaña Acordeón).
  const [presetsAcordeon, setPresetsAcordeon] = React.useState<PresetAcordeon[]>([])
  React.useEffect(() => {
    const uid = usuario?.id
    if (!uid) { setPresetsAcordeon([]); return }
    let vivo = true
    const recargar = () => { listarPresets(uid).then((p) => { if (vivo) setPresetsAcordeon(p) }) }
    recargar()
    // 'storage' = el usuario guardó/borró un diseño en OTRA pestaña del navegador → recargar el selector.
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith('acordeon3d:')) recargar() }
    window.addEventListener('acordeon-presets-cambio', recargar)
    window.addEventListener('storage', onStorage)
    return () => { vivo = false; window.removeEventListener('acordeon-presets-cambio', recargar); window.removeEventListener('storage', onStorage) }
  }, [usuario?.id])

  const [premiumReal, setPremiumReal] = React.useState(false)
  React.useEffect(() => {
    let vivo = true
    esUsuarioPremium(usuario?.id).then((v) => { if (vivo) setPremiumReal(v) })
    return () => { vivo = false }
  }, [usuario?.id])
  const premium = esAdmin || premiumReal

  const setFuelle = React.useCallback((v: boolean) => { fuelleAbiertoRef.current = v; setAbierto(v) }, [])
  const setFuellePos = React.useCallback((v: number) => { fuellePosRef.current = v; setFuellePosState(v) }, [])

  // ─── Posición fija del personaje por escenario (global, editable por admin) ──────────────────────
  const [posOverrides, setPosOverrides] = React.useState<Record<string, PosEscenario>>({})
  const [guardandoPos, setGuardandoPos] = React.useState(false)
  const [posCargado, setPosCargado] = React.useState(false)
  React.useEffect(() => {
    cargarPosicionesEscenario().then(setPosOverrides).finally(() => setPosCargado(true))
  }, [])
  const posEscenario = React.useCallback(
    (id: string): PosEscenario | null => posOverrides[id] ?? posPorDefecto(id),
    [posOverrides],
  )
  const setPosLocal = React.useCallback((id: string, patch: Partial<PosEscenario>) => {
    setPosOverrides((prev) => {
      const base = prev[id] ?? posPorDefecto(id)
      if (!base) return prev
      return { ...prev, [id]: { ...base, ...patch } }
    })
  }, [])
  const guardarPos = React.useCallback(async (id: string) => {
    const p = posOverrides[id] ?? posPorDefecto(id)
    if (!p) return { ok: false, error: 'sin configuración' }
    setGuardandoPos(true)
    const r = await guardarPosicionEscenario(id, p)
    setGuardandoPos(false)
    return r
  }, [posOverrides])

  // ─── Editor de poses de dedos por botón (admin, gizmo) ───────────────────────────────────────────
  const [posesDedos, setPosesDedos] = React.useState<Record<string, PoseDedo>>({})
  const posesDedosRef = React.useRef<Record<string, HuesosPose>>({})
  const dedosBotonRef = React.useRef<Record<string, string>>({})
  // Guía derivada: para cada botón SIN pose propia, la pose de BRAZO del botón guardado más cercano de su
  // misma hilera → el brazo/mano se queda como tus referencias (no se mueve tanto) y el IK afina el dedo.
  const guiaPorBotonRef = React.useRef<Record<string, HuesosPose>>({})
  // Espejo de la guía: botón SIN pose → el botón ANCLA del que heredó la pose. Lo usa el frame para
  // DESLIZAR la mano del ancla al botón pisado (mismo delta mundial) → se acomoda sin deformar.
  const guiaAnclaRef = React.useRef<Record<string, string>>({})
  // Lista parseada de poses guardadas (clave → botones) para el matching de acordes por SUBCONJUNTO: al
  // pisar varios botones, el frame busca la posición guardada (suelta o acorde) que MÁS comparte con lo
  // pisado y la usa de base → conserva la forma; solo agrega el dedo de los botones que faltan.
  const posesListaRef = React.useRef<{ key: string; btns: string[] }[]>([])
  const [dedoSel, setDedoSel] = React.useState('R_Index')
  const dedoSelRef = React.useRef('R_Index')
  const adminPoseRef = React.useRef<HuesosPose | null>(null)
  const [editandoDedos, setEditandoDedosState] = React.useState(false)
  const editandoDedosRef = React.useRef(false)
  const [huesoSelDedo, setHuesoSelDedo] = React.useState('RightHandIndex1')
  const [botonPoseObjetivo, setBotonPoseObjetivo] = React.useState<string | null>(null)
  const bonesDedosRef = React.useRef<Record<string, THREE.Object3D>>({})
  const botonObjetivoRef = React.useRef<string | null>(null)  // espejo de botonPoseObjetivo (para callbacks estables)
  const huesoSelRef = React.useRef('RightHandIndex1')          // espejo de huesoSelDedo
  // Overrides en EDICIÓN (sufijo→quat local): SOLO los huesos que tú ajustaste con el gizmo. Se aplican
  // ENCIMA del auto-acomodo (blend+IK) en el frame. Vacío = la mano se acomoda sola sobre el botón.
  const edicionPoseRef = React.useRef<HuesosPose>({})
  const historialRef = React.useRef<HuesosPose[]>([])          // pila para Deshacer (snapshot antes de cada movida)
  const [guardandoDedos, setGuardandoDedos] = React.useState(false)
  // Al ENTRAR a edición: arranca de la pose GUARDADA del botón (para refinarla) o vacío (auto blend+IK).
  const setEditandoDedos = React.useCallback((v: boolean) => {
    if (v) {
      const target = botonObjetivoRef.current
      editSetRef.current = new Set(target ? target.split('+') : [])   // arranca con lo que tenías pisado
      const saved = target ? posesDedosRef.current[target] : null
      edicionPoseRef.current = saved ? { ...saved } : {}
      historialRef.current = []
    } else {
      editSetRef.current.clear()
    }
    editandoDedosRef.current = v; setEditandoDedosState(v)
  }, [])
  // Limpiar la selección de botones (acorde) para empezar a armar otro desde cero.
  const limpiarSeleccion = React.useCallback(() => {
    editSetRef.current.clear()
    botonEditandoRef.current = []
    botonObjetivoRef.current = null
    setBotonPoseObjetivo(null)
    edicionPoseRef.current = {}
  }, [])
  // Deshacer / auto-acomodar (los pide el panel).
  const marcarHistorial = React.useCallback(() => {
    historialRef.current.push({ ...edicionPoseRef.current })
    if (historialRef.current.length > 30) historialRef.current.shift()
  }, [])
  const deshacer = React.useCallback(() => {
    const prev = historialRef.current.pop()
    edicionPoseRef.current = prev ? { ...prev } : {}
  }, [])
  // Borra los overrides del dedo seleccionado → el IK lo vuelve a acomodar solo sobre el botón.
  const acomodarDedo = React.useCallback(() => {
    marcarHistorial()
    const m = huesoSelRef.current.match(/^(RightHand(?:Thumb|Index|Middle|Ring|Pinky))[123]$/)
    const base = m ? m[1] : huesoSelRef.current
    const ep = { ...edicionPoseRef.current }
    delete ep[base + '1']; delete ep[base + '2']; delete ep[base + '3']; delete ep[base]
    edicionPoseRef.current = ep
  }, [marcarHistorial])

  // Cargar las poses guardadas (Supabase) UNA vez → memoria → aplicación instantánea al pisar.
  React.useEffect(() => {
    cargarPosesDedos().then((m) => {
      setPosesDedos(m)
      const r: Record<string, HuesosPose> = {}
      const d: Record<string, string> = {}
      for (const k in m) { r[k] = m[k].huesos; if (m[k].dedo) d[k] = m[k].dedo! }
      posesDedosRef.current = r
      dedosBotonRef.current = d
    })
  }, [])

  // Rastrear el último botón de MELODÍA pisado → es el que se está editando/posando.
  React.useEffect(() => {
    return subscribirNotas((e) => {
      const b = NOTA_BOTON[keyDeId(e.idBoton)]
      if (!b || !/^Boton_D_/.test(b)) return
      // Set de botones de melodía pisados AHORA → la clave del objetivo es el set ordenado (acorde) o el
      // botón suelto. Al soltar todo, conserva el último objetivo (para poder editarlo tras soltar).
      if (e.accion === 'down') heldRef.current.add(b)
      else heldRef.current.delete(b)
      if (editandoDedosRef.current) {
        // EDITANDO: ACUMULA los botones (no los quita al soltar) → construyes el acorde botón por botón y
        // se quedan marcados. Para empezar de cero, usa "Limpiar selección" en el panel.
        if (e.accion === 'down') {
          editSetRef.current.add(b)
          const clave = [...editSetRef.current].sort().join('+')
          setBotonPoseObjetivo(clave); botonObjetivoRef.current = clave
          botonEditandoRef.current = [...editSetRef.current]
        }
      } else if (heldRef.current.size) {
        // TOCANDO: set EN VIVO (colapsa al soltar) → la pose/acorde que suena ahora.
        const clave = [...heldRef.current].sort().join('+')
        setBotonPoseObjetivo(clave); botonObjetivoRef.current = clave
      }
    })
  }, [])

  // Espejo de huesoSelDedo para los callbacks (acomodarDedo) sin re-crearlos.
  React.useEffect(() => { huesoSelRef.current = huesoSelDedo }, [huesoSelDedo])

  // Dedo a asignar: al cambiar de objetivo, precarga el dedo guardado del primer botón (o BOTON_DEDO).
  React.useEffect(() => {
    if (!botonPoseObjetivo) return
    const first = botonPoseObjetivo.split('+')[0]
    setDedoSel(dedosBotonRef.current[first] || BOTON_DEDO[first] || 'R_Index')
  }, [botonPoseObjetivo])
  React.useEffect(() => { dedoSelRef.current = dedoSel }, [dedoSel])
  // Mientras editas, elegir un dedo lo aplica EN VIVO (el IK acomoda ese dedo sobre el botón ya mismo);
  // se persiste al Guardar.
  React.useEffect(() => {
    if (editandoDedosRef.current && botonObjetivoRef.current) dedosBotonRef.current[botonObjetivoRef.current] = dedoSel
  }, [dedoSel])

  // Recalcular las GUÍAS cuando cambian las poses: cada botón de melodía SIN pose propia hereda la pose
  // COMPLETA del botón guardado más cercano de SU MISMA hilera (afuera 1-10 / medio 11-21 / adentro
  // 22-31). Como esa pose TÚ la posaste sin traspasar, el botón vecino arranca igual de bien (mano
  // afuera) y el IK solo ajusta su dedo al botón exacto. Más anclas guardadas = mejor cobertura.
  React.useEffect(() => {
    const hileraDe = (n: number) => (n <= 10 ? 0 : n <= 21 ? 1 : 2)
    const anclas: { n: number; hil: number; pose: HuesosPose }[] = []
    for (const k in posesDedos) {
      const m = k.match(/^Boton_D_(\d+)$/); if (!m) continue            // ignora claves de acorde (multi-botón)
      const huesos = posesDedos[k].huesos; if (!huesos || !Object.keys(huesos).length) continue
      anclas.push({ n: +m[1], hil: hileraDe(+m[1]), pose: huesos })
    }
    const guia: Record<string, HuesosPose> = {}
    const ancla: Record<string, string> = {}
    for (let n = 1; n <= 31; n++) {
      const b = `Boton_D_${String(n).padStart(2, '0')}`
      const ex = posesDedosRef.current[b]; if (ex && Object.keys(ex).length) continue  // tiene pose propia
      const hil = hileraDe(n)
      let best: { n: number; hil: number; pose: HuesosPose } | null = null, bd = Infinity
      for (const a of anclas) { if (a.hil !== hil) continue; const d = Math.abs(a.n - n); if (d < bd) { bd = d; best = a } }
      if (best) { guia[b] = best.pose; ancla[b] = `Boton_D_${String(best.n).padStart(2, '0')}` }
    }
    guiaPorBotonRef.current = guia
    guiaAnclaRef.current = ancla
    // Lista para el matching de acordes (solo poses con huesos).
    posesListaRef.current = Object.keys(posesDedos)
      .filter((k) => posesDedos[k].huesos && Object.keys(posesDedos[k].huesos).length)
      .map((k) => ({ key: k, btns: k.split('+') }))
  }, [posesDedos])

  const guardarPoseDedo = React.useCallback(async (nombre: string) => {
    const boton = botonPoseObjetivo
    if (!boton) return { ok: false, error: 'pisa primero un botón de melodía' }
    // Snapshot de la pose REAL y VISIBLE: los huesos vivos = auto-acomodo (blend+IK sobre el botón) +
    // tus ajustes del gizmo. Así la pose guardada SÍ queda sobre el botón al reproducirla.
    const huesos: HuesosPose = {}
    for (const suf of RIGHT_SUF) {
      const bn = bonesDedosRef.current[suf]
      if (bn) { const q = bn.quaternion; huesos[suf] = [q.x, q.y, q.z, q.w] }
    }
    const dedo = dedoSelRef.current
    setGuardandoDedos(true)
    const r = await guardarPoseDedoDB(boton, nombre, huesos, dedo)
    setGuardandoDedos(false)
    if (r.ok) {
      setPosesDedos((prev) => ({ ...prev, [boton]: { nombre, huesos, dedo } }))
      posesDedosRef.current = { ...posesDedosRef.current, [boton]: huesos }
      dedosBotonRef.current = { ...dedosBotonRef.current, [boton]: dedo }
    }
    return r
  }, [botonPoseObjetivo])

  const borrarPoseDedo = React.useCallback(async (boton: string) => {
    const r = await borrarPoseDedoDB(boton)
    if (r.ok) {
      setPosesDedos((prev) => { const n = { ...prev }; delete n[boton]; return n })
      const n = { ...posesDedosRef.current }; delete n[boton]; posesDedosRef.current = n
    }
    return r
  }, [])

  // Seleccionar una pose YA GUARDADA (clic en la lista) como objetivo → re-editarla/modificarla. Si ya
  // estás en edición, re-siembra la mano con esa pose para retocarla.
  const seleccionarObjetivo = React.useCallback((key: string) => {
    setBotonPoseObjetivo(key); botonObjetivoRef.current = key
    editSetRef.current = new Set(key.split('+'))
    if (editandoDedosRef.current) {
      const saved = posesDedosRef.current[key]
      edicionPoseRef.current = saved ? { ...saved } : {}
      historialRef.current = []
      botonEditandoRef.current = key.split('+')
    }
  }, [])

  // Botones que se iluminan/editan mientras editas (acorde = varios) → para saber qué configuras. Se
  // mantienen aunque sueltes las teclas (el frame los lee de este ref).
  const heldRef = React.useRef<Set<string>>(new Set())          // botones de melodía pisados ahora (al tocar)
  const editSetRef = React.useRef<Set<string>>(new Set())       // botones ACUMULADOS mientras editas (acorde)
  const botonEditandoRef = React.useRef<string[]>([])
  React.useEffect(() => { botonEditandoRef.current = editandoDedos && botonPoseObjetivo ? botonPoseObjetivo.split('+') : [] }, [editandoDedos, botonPoseObjetivo])

  // Portapapeles de poses (reusar dedos entre botones/hileras).
  const poseClipboardRef = React.useRef<HuesosPose | null>(null)
  const [hayPortapapeles, setHayPortapapeles] = React.useState(false)
  const copiarPose = React.useCallback(() => {
    // Copia la pose en edición (lo que ves) si hay; si no, la guardada del botón objetivo.
    const fuente = (editandoDedosRef.current && Object.keys(edicionPoseRef.current).length)
      ? edicionPoseRef.current
      : (botonPoseObjetivo ? posesDedosRef.current[botonPoseObjetivo] : null)
    if (!fuente || !Object.keys(fuente).length) return false
    poseClipboardRef.current = { ...fuente }
    setHayPortapapeles(true)
    return true
  }, [botonPoseObjetivo])
  const pegarPose = React.useCallback(async () => {
    const boton = botonPoseObjetivo
    const clip = poseClipboardRef.current
    if (!boton) return { ok: false, error: 'pisa el botón destino' }
    if (!clip) return { ok: false, error: 'primero copia una pose' }
    const huesos: HuesosPose = { ...clip }
    edicionPoseRef.current = { ...huesos }                 // que se vea de inmediato si estás editando
    setGuardandoDedos(true)
    const r = await guardarPoseDedoDB(boton, posesDedos[boton]?.nombre || boton, huesos)
    setGuardandoDedos(false)
    if (r.ok) {
      setPosesDedos((prev) => ({ ...prev, [boton]: { nombre: prev[boton]?.nombre || boton, huesos } }))
      posesDedosRef.current = { ...posesDedosRef.current, [boton]: huesos }
    }
    return r
  }, [botonPoseObjetivo, posesDedos])

  const value = React.useMemo<PersonajeEstudioCtx>(() => ({
    personajeId, setPersonajeId, skin, setSkin, presetsAcordeon, baile, setBaile, escenarioId, setEscenarioId,
    tomaCamara, setTomaCamara, directorAuto, setDirectorAuto, secuencia, setSecuencia, secuenciaActiva, setSecuenciaActiva,
    premium, esAdmin, abierto, fuelleAbiertoRef, setFuelle, fuellePos, fuellePosRef, setFuellePos,
    posEscenario, setPosLocal, guardarPos, guardandoPos, posCargado,
    posesDedos, posesDedosRef, dedosBotonRef, guiaPorBotonRef, guiaAnclaRef, posesListaRef, dedoSel, setDedoSel, adminPoseRef, editandoDedos, editandoDedosRef, setEditandoDedos,
    huesoSelDedo, setHuesoSelDedo, botonPoseObjetivo, bonesDedosRef, edicionPoseRef, botonEditandoRef, guardarPoseDedo, borrarPoseDedo, seleccionarObjetivo, limpiarSeleccion, guardandoDedos,
    hayPortapapeles, copiarPose, pegarPose, marcarHistorial, deshacer, acomodarDedo,
  }), [personajeId, skin, presetsAcordeon, baile, escenarioId, tomaCamara, directorAuto, secuencia, secuenciaActiva, premium, esAdmin, abierto, setFuelle, fuellePos, setFuellePos, posEscenario, setPosLocal, guardarPos, guardandoPos, posCargado,
    posesDedos, dedoSel, editandoDedos, setEditandoDedos, huesoSelDedo, botonPoseObjetivo, guardarPoseDedo, borrarPoseDedo, seleccionarObjetivo, limpiarSeleccion, guardandoDedos, hayPortapapeles, copiarPose, pegarPose, marcarHistorial, deshacer, acomodarDedo])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
