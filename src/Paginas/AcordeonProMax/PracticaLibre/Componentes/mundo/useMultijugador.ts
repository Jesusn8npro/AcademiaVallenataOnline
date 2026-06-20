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

const SALA = 'mundo-bosque'
const HZ_MS = 60      // cada cuánto emito mi estado (~16Hz; más bajo = menos latencia, más mensajes)
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
      const target: EstadoJugador = { x: payload.x, z: payload.z, ry: payload.ry, personajeId: payload.personajeId, anim: payload.anim ?? null, nombre: payload.nombre ?? '', tocando: !!payload.tocando, mira: typeof payload.mira === 'number' ? payload.mira : payload.ry }
      const ex = remotosRef.current.get(id)
      if (ex) { ex.target = target; ex.visto = performance.now() }
      else {
        remotosRef.current.set(id, { target, visto: performance.now() })
        setRemotos(Array.from(remotosRef.current.keys()))
      }
    })

    // Suscripción WebSocket. RECIBIR a los demás va por aquí. Para EMITIR:
    //  - ESTADO (posición, ~16Hz): httpSend (REST) → no satura cuando hay muchos quietos.
    //  - NOTAS (en vivo, sensibles a latencia/orden): WebSocket send una vez UNIDO (ver más abajo).
    // unido = el canal terminó el JOIN; antes de eso ch.send() caería a REST igual → por eso lo gateamos.
    let unido = false
    ch.subscribe((status) => { unido = status === 'SUBSCRIBED' })

    // EMITIR mi estado: SOLO cuando CAMBIA (me muevo/giro/animo) + heartbeat cada 2s (< TIMEOUT_MS). Así se
    // ve EN VIVO al moverse pero con 50 personas QUIETAS casi no hay solicitudes (lo que saturaba antes era
    // mandar a 16Hz SIEMPRE aunque nadie se moviera; ahora quieto ≈ 1 envío cada 2s).
    //
    // POR WEBSOCKET (ch.send), no REST (httpSend): el WS es push, baja latencia y en orden → la POSICIÓN del
    // remoto llega EN VIVO y el avatar se ve caminando de verdad (con httpSend/REST la posición llegaba tarde y
    // a saltos mientras la animación de caminata sí corría → parecía "flotar"/deslizarse). La saturación que
    // antes obligó a REST era por emitir a 16Hz SIEMPRE; con "solo al cambiar" la cola WS se mantiene chica y no
    // satura. httpSend queda SOLO como respaldo mientras el canal aún no termina el JOIN (primer instante).
    let ultimaFirma = ''
    let ultimoEnvio = 0
    const emisor = setInterval(() => {
      const s = estadoLocalRef.current
      const ahora = performance.now()
      // Firma con resolución perceptible (1 cm / ~0.01 rad): por debajo no vale la pena emitir.
      const firma = `${s.x.toFixed(2)},${s.z.toFixed(2)},${s.ry.toFixed(2)},${s.anim},${s.tocando ? 1 : 0},${s.mira.toFixed(2)}`
      if (firma !== ultimaFirma || ahora - ultimoEnvio > 2000) {
        const payload = { id: miId, ...s }
        if (unido) ch.send({ type: 'broadcast', event: 'estado', payload }).catch(() => {})
        else ch.httpSend('estado', payload).catch(() => {})
        ultimaFirma = firma
        ultimoEnvio = ahora
      }
    }, HZ_MS)

    // Reenviar MIS notas (cuando toco una canción) para que los demás puedan oírlas. Mandamos 'down'
    // Y 'up': así el oyente suelta la nota EXACTO cuando yo la solté → suena fluido, sin notas pegadas.
    // En 'down' va el TONO ya resuelto (muestra + semitonos) → el oyente lo reproduce IDÉNTICO.
    //
    // EMISIÓN POR WEBSOCKET (no REST): una sola conexión persistente → llega EN VIVO y EN ORDEN. Antes iba
    // por httpSend (REST = un POST por nota): en una red con REST lento, TUS notas llegaban tarde/desordenadas
    // al otro (sonaban mal / pegadas) aunque tú sí oyeras las suyas (esas las RECIBES por WS, que es push).
    // El WS sí preserva orden y latencia baja para eventos sueltos como las notas (no saturan como el estado).
    // Mientras el canal aún no está UNIDO (primer instante tras entrar), cae a httpSend como respaldo.
    const offNotas = subscribirNotas((e) => {
      // El envío NO debe bloquear el camino de la nota (audio + hit del simulador): ch.send es no-bloqueante
      // (encola en el WS) y el audio local ya sonó antes de este callback.
      const payload = { id: miId, idBoton: e.idBoton, accion: e.accion, tono: e.accion === 'down' ? e.tono : undefined }
      if (unido) ch.send({ type: 'broadcast', event: 'nota', payload }).catch(() => {})
      else queueMicrotask(() => { ch.httpSend('nota', payload).catch(() => {}) })
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
