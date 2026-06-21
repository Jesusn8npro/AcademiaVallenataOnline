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
  mira: number             // yaw (mundo) hacia donde mira (cámara) → head-look del avatar remoto
}

export interface RemotoEntry {
  target: EstadoJugador
  visto: number
}

const HZ_MS = 60      // cada cuánto emito mi estado (~16Hz; más bajo = menos latencia, más mensajes)
// Sin recibir nada de un remoto → desconectado. Generoso (6s) para que el lag o una pestaña en
// segundo plano (que throttlea el emisor a ~1s) NO haga desaparecer a los demás jugadores.
const TIMEOUT_MS = 6000

// --- SHARDING (escala para el lanzamiento) ---
// Una sola sala global = fan-out N²: cada uno emite su estado/notas a TODOS → con cientos de jugadores
// se revienta el tope de mensajes/seg del plan Realtime. Solución: UN MISMO mundo partido en instancias
// (`mundo-1`, `-2`…) con un tope de ocupantes. El escenario NO entra en el nombre de la sala (es solo el
// fondo visual local de cada quien); todos comparten el mismo mundo lógico, como antes.
//
// Entrada OPTIMISTA (sin latencia): entro de una a `mundo-1` y empiezo a sincronizar al instante. Presence
// solo se usa para CUPO: cada quien ordena las claves de presencia (= miId de todos) y si mi posición en
// ese orden cae más allá del cupo, migro a la siguiente instancia. Es un cap DISTRIBUIDO (todos calculan
// lo mismo, sin servidor) y auto-sanable. Con poca gente todos caben en `mundo-1` y se ven entre sí.
const CAP_INSTANCIA = 20        // tope de jugadores por instancia
const MAX_INSTANCIAS = 50       // 50 × 20 = 1000 jugadores en el mundo

import type { TonoResuelto } from '../../../../../Core/audio/emisorNotasAcordeon'
export type NotaRemotaCb = (idBoton: string, accion: 'down' | 'up', deId: string, tono?: TonoResuelto) => void

export function useMultijugador(estadoLocalRef: React.MutableRefObject<EstadoJugador>) {
  const remotosRef = React.useRef<Map<string, RemotoEntry>>(new Map())
  const [remotos, setRemotos] = React.useState<string[]>([])
  // Instancia activa (`mundo-3`) → null el primer instante hasta montar `mundo-1`. El reto usa la MISMA
  // instancia (ver useReto) para que solo retes a quien comparte tu sala.
  const [sala, setSala] = React.useState<string | null>(null)
  const miId = React.useMemo(() => Math.random().toString(36).slice(2, 10), [])
  // Listeners para las notas que tocan los OTROS (las reproduce el motor de audio "oyente").
  const listenersNotas = React.useRef<Set<NotaRemotaCb>>(new Set())
  const suscribirNotasRemotas = React.useCallback((cb: NotaRemotaCb) => {
    listenersNotas.current.add(cb)
    return () => { listenersNotas.current.delete(cb) }
  }, [])

  React.useEffect(() => {
    let cancelado = false
    let chActual: ReturnType<typeof supabase.channel> | null = null
    let forzarEmision = false // al detectar que alguien entró/salió → re-emito mi estado ya (descubrimiento rápido)
    // Cola de notas para emitir SIEMPRE por WebSocket (push, en orden). Si el canal aún no está unido, se
    // encolan y se vuelcan al unir — NUNCA por REST: el REST manda un POST por nota, llegan tarde y
    // desordenadas → se oyen acumuladas y se quedan pegadas (ver [[realtime-send-antes-de-subscribe]]).
    const colaNotas: Array<{ idBoton: string; accion: 'down' | 'up'; tono?: TonoResuelto }> = []

    // Engancha los handlers de broadcast (notas + estado) ANTES de subscribe → el canal recibe desde el 1er instante.
    const engancharHandlers = (ch: ReturnType<typeof supabase.channel>) => {
      // Notas que tocan los demás → avisar a los listeners (audio).
      ch.on('broadcast', { event: 'nota' }, ({ payload }: { payload: any }) => {
        if (!payload || payload.id === miId) return
        listenersNotas.current.forEach((fn) => { try { fn(payload.idBoton, payload.accion, payload.id, payload.tono) } catch {} })
      })
      ch.on('broadcast', { event: 'estado' }, ({ payload }: { payload: any }) => {
        if (!payload || payload.id === miId) return
        const id: string = payload.id
        // SANEAR lo que llega de la red (un cliente custom puede mandar basura/payloads enormes): números
        // finitos y nombre acotado. Evita NaN propagándose por el visor y nombres gigantes en la etiqueta.
        const num = (v: any, def = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : def)
        const target: EstadoJugador = { x: num(payload.x), z: num(payload.z), ry: num(payload.ry), personajeId: typeof payload.personajeId === 'string' ? payload.personajeId : '', anim: typeof payload.anim === 'string' ? payload.anim : null, nombre: String(payload.nombre ?? '').slice(0, 40), tocando: !!payload.tocando, mira: num(payload.mira, num(payload.ry)) }
        const ex = remotosRef.current.get(id)
        if (ex) { ex.target = target; ex.visto = performance.now() }
        else {
          remotosRef.current.set(id, { target, visto: performance.now() })
          setRemotos(Array.from(remotosRef.current.keys()))
        }
      })
    }

    // Monta una instancia (`mundo-N`) ENTRANDO de una (optimista, sin esperar). Presence se usa solo para
    // el CUPO: si mi posición en el orden global de claves cae más allá de CAP, migro a la siguiente. Como
    // todos ordenan igual (por miId), el reparto es consistente sin servidor.
    const montarEn = (n: number) => {
      const nombreSala = `mundo-${n}`
      const ch = supabase.channel(nombreSala, { config: { broadcast: { self: false }, presence: { key: miId } } })
      chActual = ch
      engancharHandlers(ch)

      ch.on('presence', { event: 'sync' }, () => {
        if (cancelado || chActual !== ch) return
        // Alguien entró/salió → re-emito mi estado en el próximo tick para que me vean al instante.
        forzarEmision = true
        // CUPO: orden global estable por clave de presencia (= miId). Si caigo más allá del cupo, migro.
        const claves = Object.keys(ch.presenceState()).sort()
        const idx = claves.indexOf(miId)
        if (idx >= CAP_INSTANCIA && n < MAX_INSTANCIAS) {
          supabase.removeChannel(ch)
          if (chActual === ch) chActual = null
          // Limpio remotos de la sala que dejo (los de la nueva llegarán por broadcast).
          remotosRef.current.clear(); setRemotos([])
          montarEn(n + 1)
        }
      })

      // RECIBIR va por WS; para EMITIR uso ch.send (WebSocket, push + en orden) cuando el canal está 'joined'.
      ch.subscribe((status) => {
        if (status !== 'SUBSCRIBED' || chActual !== ch) return
        ch.track({ t: Date.now() }).catch(() => {})
        // Volcar las notas encoladas mientras no estaba unido (en orden, por WS).
        while (colaNotas.length) { const n = colaNotas.shift()!; ch.send({ type: 'broadcast', event: 'nota', payload: { id: miId, ...n } }).catch(() => {}) }
      })
      if (!cancelado) setSala(nombreSala)
    }

    montarEn(1)

    // EMITIR mi estado: SOLO cuando CAMBIA (me muevo/giro/animo) + heartbeat cada 2s (< TIMEOUT_MS) + cuando
    // entra/sale alguien (forzarEmision). Así se ve EN VIVO al moverse pero con muchos QUIETOS casi no hay
    // solicitudes. Lee `chActual` en cada tick → tras una migración usa el canal nuevo sin recrear el timer.
    let ultimaFirma = ''
    let ultimoEnvio = 0
    const emisor = setInterval(() => {
      const ch = chActual
      if (!ch) return
      const s = estadoLocalRef.current
      const ahora = performance.now()
      // Firma con resolución perceptible (1 cm / ~0.01 rad): por debajo no vale la pena emitir. Incluye
      // personajeId → cambiar de personaje QUIETO se emite al instante (destello en vivo), sin esperar el heartbeat.
      const firma = `${s.x.toFixed(2)},${s.z.toFixed(2)},${s.ry.toFixed(2)},${s.anim},${s.tocando ? 1 : 0},${s.mira.toFixed(2)},${s.personajeId}`
      if (forzarEmision || firma !== ultimaFirma || ahora - ultimoEnvio > 2000) {
        const payload = { id: miId, ...s }
        if (ch.state === 'joined') ch.send({ type: 'broadcast', event: 'estado', payload }).catch(() => {})
        else ch.httpSend('estado', payload).catch(() => {})
        ultimaFirma = firma
        ultimoEnvio = ahora
        forzarEmision = false
      }
    }, HZ_MS)

    // Reenviar MIS notas (cuando toco una canción) para que los demás puedan oírlas. Mandamos 'down' Y 'up':
    // así el oyente suelta la nota EXACTO cuando yo la solté → suena fluido, sin notas pegadas. En 'down' va
    // el TONO ya resuelto (muestra + semitonos) → el oyente lo reproduce IDÉNTICO. SIEMPRE por WS (en orden);
    // si aún no está unido, a la cola (se vuelca al unir) — nunca REST.
    const offNotas = subscribirNotas((e) => {
      const nota = { idBoton: e.idBoton, accion: e.accion, tono: e.accion === 'down' ? e.tono : undefined }
      const ch = chActual
      if (ch && ch.state === 'joined') ch.send({ type: 'broadcast', event: 'nota', payload: { id: miId, ...nota } }).catch(() => {})
      else { colaNotas.push(nota); if (colaNotas.length > 64) colaNotas.shift() } // tope: no crecer sin límite
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
      cancelado = true
      clearInterval(emisor)
      clearInterval(limpiador)
      offNotas()
      if (chActual) supabase.removeChannel(chActual)
      chActual = null
      remotosRef.current.clear()
      setRemotos([])
      setSala(null)
    }
  }, [miId, estadoLocalRef])

  return { remotos, remotosRef, miId, suscribirNotasRemotas, sala }
}
