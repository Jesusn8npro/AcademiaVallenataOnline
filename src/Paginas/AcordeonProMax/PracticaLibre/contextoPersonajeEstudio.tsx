'use client'
import * as React from 'react'
import { PERSONAJES } from './personajes'
import type { PasoSecuencia } from './animaciones'
import { ESCENARIO_DEFAULT } from './Componentes/visor/escenarios'
import { TOMA_DEFAULT } from './Componentes/visor/camaras'
import { esUsuarioPremium } from '../../../config/limitesPlan'
import { useUsuario } from '../../../contextos/UsuarioContext'
import {
  leerPersonaje3DLocal,
  guardarPersonaje3DLocal,
  cargarPersonaje3DDB,
  guardarPersonaje3DDB,
  type Personaje3DGuardado,
} from './Servicios/servicioPersonaje3D'

// Estado compartido de la pestaña Personaje 3D: lo consume el visor (centro, vista limpia) y el
// panel de la derecha (selector de personaje + skins + bailes + fuelle). Así los controles viven
// en el panel lateral como Sonido/FX/Modelos y no tapan al personaje.
interface PersonajeEstudioCtx {
  personajeId: string
  setPersonajeId: (id: string) => void
  skin: string
  setSkin: (s: string) => void
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
  abierto: boolean
  fuelleAbiertoRef: React.MutableRefObject<boolean>
  setFuelle: (v: boolean) => void
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
    const aplicar = (d: Personaje3DGuardado) => {
      if (d.personajeId && PERSONAJES.some((p) => p.id === d.personajeId)) setPersonajeId(d.personajeId)
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

  const [premiumReal, setPremiumReal] = React.useState(false)
  React.useEffect(() => {
    let vivo = true
    esUsuarioPremium(usuario?.id).then((v) => { if (vivo) setPremiumReal(v) })
    return () => { vivo = false }
  }, [usuario?.id])
  const premium = esAdmin || premiumReal

  const setFuelle = React.useCallback((v: boolean) => { fuelleAbiertoRef.current = v; setAbierto(v) }, [])

  const value = React.useMemo<PersonajeEstudioCtx>(() => ({
    personajeId, setPersonajeId, skin, setSkin, baile, setBaile, escenarioId, setEscenarioId,
    tomaCamara, setTomaCamara, directorAuto, setDirectorAuto, secuencia, setSecuencia, secuenciaActiva, setSecuenciaActiva,
    premium, abierto, fuelleAbiertoRef, setFuelle,
  }), [personajeId, skin, baile, escenarioId, tomaCamara, directorAuto, secuencia, secuenciaActiva, premium, abierto, setFuelle])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
