'use client'
import * as React from 'react'
import { PERSONAJES } from './personajes'
import type { PasoSecuencia } from './animaciones'
import { ESCENARIO_DEFAULT } from './Componentes/visor/escenarios'
import { TOMA_DEFAULT } from './Componentes/visor/camaras'
import { esUsuarioPremium } from '../../../config/limitesPlan'
import { useUsuario } from '../../../contextos/UsuarioContext'

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
  const [personajeId, setPersonajeId] = React.useState(PERSONAJES[0].id)
  const [skin, setSkin] = React.useState('original')
  const [baile, setBaile] = React.useState<string | null>(null)
  const [escenarioId, setEscenarioId] = React.useState(ESCENARIO_DEFAULT)
  const [tomaCamara, setTomaCamara] = React.useState(TOMA_DEFAULT)
  const [directorAuto, setDirectorAuto] = React.useState(false)
  const [secuencia, setSecuencia] = React.useState<PasoSecuencia[]>([])
  const [secuenciaActiva, setSecuenciaActiva] = React.useState(false)
  const [abierto, setAbierto] = React.useState(false)
  const fuelleAbiertoRef = React.useRef(false)

  const { usuario, esAdmin } = useUsuario()
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
