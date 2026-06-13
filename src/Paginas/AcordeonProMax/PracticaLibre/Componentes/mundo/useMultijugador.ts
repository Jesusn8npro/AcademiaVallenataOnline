'use client'
import * as React from 'react'
import { supabase } from '../../../../../servicios/clienteSupabase'
import { subscribirNotas } from '../../../../../Core/audio/emisorNotasAcordeon'

// Multijugador en tiempo real (Rebanada 2) vía Supabase Realtime BROADCAST. Cada cliente emite su
// estado (~12 Hz) a la sala; los demás guardan el último target por jugador (en un ref, SIN re-render
// por movimiento → barato) e interpolan en el visor. La lista de ids (para montar/desmontar avatares)
// sí es estado React. Desconexión = "dejó de emitir > TIMEOUT". Broadcast es efímero (sin tabla/RLS);
// para producción se acotaría la sala por auth. self:false → no me llego a mí mismo.

export interface EstadoJugador {
  x: number
  z: number
  ry: number
  personajeId: string      // qué personaje eligió (los remotos lo renderizan)
  anim: string | null      // clip que está reproduciendo ahora ('Caminata' | baile | null) → se replica
  nombre: string           // etiqueta visible sobre el avatar
  tocando: boolean         // está reproduciendo una canción/notas → muestra 🎵
}

export interface RemotoEntry {
  target: EstadoJugador
  visto: number
}

const SALA = 'mundo-bosque'
const HZ_MS = 90      // cada cuánto emito mi estado
// Sin recibir nada de un remoto → desconectado. Generoso (6s) para que el lag o una pestaña en
// segundo plano (que throttlea el emisor a ~1s) NO haga desaparecer a los demás jugadores.
const TIMEOUT_MS = 6000

import type { TonoResuelto } from '../../../../../Core/audio/emisorNotasAcordeon'
export type NotaRemotaCb = (idBoton: string, accion: 'down' | 'up', deId: string, tono?: TonoResuelto) => void

export function useMultijugador(estadoLocalRef: React.MutableRefObject<EstadoJugador>) {
  const remotosRef = React.useRef<Map<string, RemotoEntry>>(new Map())
  const [remotos, setRemotos] = React.useState<string[]>([])
  const miId = React.useMemo(() => Math.random().toString(36).slice(2, 10), [])
  // Listeners para las notas que tocan los OTROS (las reproduce el motor de audio "oyente").
  const listenersNotas = React.useRef<Set<NotaRemotaCb>>(new Set())
  const suscribirNotasRemotas = React.useCallback((cb: NotaRemotaCb) => {
    listenersNotas.current.add(cb)
    return () => { listenersNotas.current.delete(cb) }
  }, [])

  React.useEffect(() => {
    const ch = supabase.channel(SALA, { config: { broadcast: { self: false } } })

    // Notas que tocan los demás → avisar a los listeners (audio).
    ch.on('broadcast', { event: 'nota' }, ({ payload }: { payload: any }) => {
      if (!payload || payload.id === miId) return
      listenersNotas.current.forEach((fn) => { try { fn(payload.idBoton, payload.accion, payload.id, payload.tono) } catch {} })
    })

    ch.on('broadcast', { event: 'estado' }, ({ payload }: { payload: any }) => {
      if (!payload || payload.id === miId) return
      const id: string = payload.id
      const target: EstadoJugador = { x: payload.x, z: payload.z, ry: payload.ry, personajeId: payload.personajeId, anim: payload.anim ?? null, nombre: payload.nombre ?? '', tocando: !!payload.tocando }
      const ex = remotosRef.current.get(id)
      if (ex) { ex.target = target; ex.visto = performance.now() }
      else {
        remotosRef.current.set(id, { target, visto: performance.now() })
        setRemotos(Array.from(remotosRef.current.keys()))
      }
    })

    ch.subscribe()

    // Emisión de mi estado a ritmo fijo.
    const emisor = setInterval(() => {
      const s = estadoLocalRef.current
      ch.send({ type: 'broadcast', event: 'estado', payload: { id: miId, ...s } })
    }, HZ_MS)

    // Reenviar MIS notas (cuando toco una canción) para que los demás puedan oírlas. Mandamos 'down'
    // Y 'up': así el oyente suelta la nota EXACTO cuando yo la solté → suena fluido, sin notas pegadas
    // (antes solo iba 'down' y el oyente la sostenía 1.5 s fijos → se amontonaban). En 'down' va el
    // TONO ya resuelto (muestra + semitonos) → el oyente lo reproduce IDÉNTICO, sin que su propia
    // tonalidad/instrumento le cambie el tono.
    const offNotas = subscribirNotas((e) => {
      ch.send({ type: 'broadcast', event: 'nota', payload: { id: miId, idBoton: e.idBoton, accion: e.accion, tono: e.accion === 'down' ? e.tono : undefined } })
    })

    // Limpieza de remotos que dejaron de emitir (= se fueron).
    const limpiador = setInterval(() => {
      const now = performance.now()
      let cambio = false
      for (const [k, v] of remotosRef.current) {
        if (now - v.visto > TIMEOUT_MS) { remotosRef.current.delete(k); cambio = true }
      }
      if (cambio) setRemotos(Array.from(remotosRef.current.keys()))
    }, 1000)

    return () => {
      clearInterval(emisor)
      clearInterval(limpiador)
      offNotas()
      supabase.removeChannel(ch)
    }
  }, [miId, estadoLocalRef])

  return { remotos, remotosRef, miId, suscribirNotasRemotas }
}
