'use client'
import * as React from 'react'
import { supabase } from '../../../../../servicios/clienteSupabase'

// Modo Competencia — Rebanada 1: HANDSHAKE + ACUERDO del reto, sincronizado por Supabase Realtime.
// Canal PROPIO (`${sala}:retos`, aparte del de movimiento) para no mezclar el tráfico de posiciones con
// el del reto. La `sala` es la MISMA instancia sharded que eligió useMultijugador → solo retas a quien
// comparte tu sala (escala igual que el mundo). Cada evento va DIRIGIDO a un jugador (campo `para` = su
// miId) y el receptor ignora lo que no es para él. self:false → no me llegan mis propios eventos. Es
// efímero (sin tabla): si recargas, el reto se pierde — suficiente para acordar el duelo en vivo. El DUELO
// en sí (tocar/puntaje/ganador) es la Rebanada 2; aquí paramos cuando AMBOS marcan "Listo".

export type EstadoReto = 'libre' | 'invitando' | 'invitado' | 'negociando'

export interface CancionReto { id: string; titulo: string; autor: string; slug: string | null; seccionId?: string | null; seccionNombre?: string; tonalidad?: string | null }
export interface MensajeChat { de: 'yo' | 'el'; texto: string; t: number }
export interface Oponente { id: string; nombre: string }

interface PayloadBase { tipo: string; de: string; deNombre?: string; para?: string; [k: string]: any }

export function useReto(miId: string, miNombre: string, sala: string | null) {
  const [estado, setEstado] = React.useState<EstadoReto>('libre')
  const [oponente, setOponente] = React.useState<Oponente | null>(null)
  const [cancion, setCancion] = React.useState<CancionReto | null>(null)
  const [chat, setChat] = React.useState<MensajeChat[]>([])
  const [miListo, setMiListo] = React.useState(false)
  const [suListo, setSuListo] = React.useState(false)
  const [aviso, setAviso] = React.useState<string | null>(null) // p.ej. "X rechazó el reto"
  // --- Duelo (Rebanada 2) ---
  const [soyRetador, setSoyRetador] = React.useState(false) // true = yo invité → toco PRIMERO
  const [dueloIniciado, setDueloIniciado] = React.useState(false)
  const [miPuntaje, setMiPuntaje] = React.useState<number | null>(null)
  const [rivalPuntaje, setRivalPuntaje] = React.useState<number | null>(null)

  const chRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Espejo del estado para los handlers del canal (que se registran una sola vez).
  const estadoRef = React.useRef(estado)
  const oponenteRef = React.useRef(oponente)
  React.useEffect(() => { estadoRef.current = estado }, [estado])
  React.useEffect(() => { oponenteRef.current = oponente }, [oponente])

  const reset = React.useCallback(() => {
    setEstado('libre'); setOponente(null); setCancion(null); setChat([]); setMiListo(false); setSuListo(false)
    setSoyRetador(false); setDueloIniciado(false); setMiPuntaje(null); setRivalPuntaje(null)
  }, [])
  // Espejo de soyRetador para los handlers del canal.
  const soyRetadorRef = React.useRef(soyRetador)
  React.useEffect(() => { soyRetadorRef.current = soyRetador }, [soyRetador])

  const enviar = React.useCallback((payload: PayloadBase) => {
    // httpSend (REST): entrega fiable de los eventos del reto (invitar/aceptar/chat/etc.) sin depender de
    // que el canal esté unido y sin el warning de send→REST. Son eventos puntuales (no saturan).
    chRef.current?.httpSend('reto', payload).catch(() => {})
  }, [])

  React.useEffect(() => {
    if (!sala) return // aún sin instancia resuelta (useMultijugador todavía elige) → no abrir canal
    const ch = supabase.channel(`${sala}:retos`, { config: { broadcast: { self: false } } })
    chRef.current = ch

    ch.on('broadcast', { event: 'reto' }, ({ payload }: { payload: PayloadBase }) => {
      if (!payload || payload.para !== miId) return
      const est = estadoRef.current
      const op = oponenteRef.current
      switch (payload.tipo) {
        case 'invitar':
          // Solo acepto invitaciones si estoy libre; si estoy ocupado, rechazo automáticamente.
          if (est === 'libre') {
            setOponente({ id: payload.de, nombre: payload.deNombre || 'Jugador' })
            setEstado('invitado')
          } else {
            ch.httpSend('reto', { tipo: 'rechazar', de: miId, para: payload.de }).catch(() => {})
          }
          break
        case 'aceptar':
          if (est === 'invitando' && op && payload.de === op.id) setEstado('negociando')
          break
        case 'rechazar':
          if (op && payload.de === op.id) { setAviso((op.nombre || 'El jugador') + ' rechazó el reto'); reset() }
          break
        case 'cancelar':
          if (op && payload.de === op.id) { setAviso((op.nombre || 'El jugador') + ' canceló el reto'); reset() }
          break
        case 'chat':
          if (op && payload.de === op.id) setChat((c) => [...c, { de: 'el', texto: String(payload.texto || ''), t: Date.now() }])
          break
        case 'cancion':
          if (op && payload.de === op.id) { setCancion(payload.cancion || null); setMiListo(false); setSuListo(false) }
          break
        case 'listo':
          if (op && payload.de === op.id) setSuListo(!!payload.valor)
          break
        case 'duelo-inicio':
          if (op && payload.de === op.id) setDueloIniciado(true)
          break
        case 'resultado':
          if (op && payload.de === op.id) setRivalPuntaje(typeof payload.puntos === 'number' ? payload.puntos : 0)
          break
        case 'revancha':
          // El rival pidió revancha → reseteamos los puntajes (mismo oponente/canción/sección) y
          // vuelve a arrancar el duelo desde el turno 1. Idempotente (si ambos piden, da igual).
          if (op && payload.de === op.id) { setMiPuntaje(null); setRivalPuntaje(null); setDueloIniciado(true) }
          break
      }
    })
    ch.subscribe() // suscripción WebSocket para RECIBIR; emitir va por httpSend (REST)
    return () => { chRef.current = null; supabase.removeChannel(ch) }
  }, [miId, reset, sala])

  // --- API pública ---
  const invitar = React.useCallback((idObjetivo: string, nombreObjetivo: string) => {
    if (estadoRef.current !== 'libre') return
    setOponente({ id: idObjetivo, nombre: nombreObjetivo }); setEstado('invitando'); setSoyRetador(true)
    enviar({ tipo: 'invitar', de: miId, deNombre: miNombre, para: idObjetivo })
  }, [enviar, miId, miNombre])

  const aceptar = React.useCallback(() => {
    const op = oponenteRef.current
    if (estadoRef.current !== 'invitado' || !op) return
    setEstado('negociando'); setSoyRetador(false)
    enviar({ tipo: 'aceptar', de: miId, deNombre: miNombre, para: op.id })
  }, [enviar, miId, miNombre])

  const rechazar = React.useCallback(() => {
    const op = oponenteRef.current
    if (op) enviar({ tipo: 'rechazar', de: miId, para: op.id })
    reset()
  }, [enviar, miId, reset])

  const cancelar = React.useCallback(() => {
    const op = oponenteRef.current
    if (op) enviar({ tipo: 'cancelar', de: miId, para: op.id })
    reset()
  }, [enviar, miId, reset])

  const enviarChat = React.useCallback((texto: string) => {
    const op = oponenteRef.current
    const t = texto.trim()
    if (!t || !op) return
    setChat((c) => [...c, { de: 'yo', texto: t, t: Date.now() }])
    enviar({ tipo: 'chat', de: miId, para: op.id, texto: t })
  }, [enviar, miId])

  // Proponer/acordar canción: ambos comparten la MISMA; al cambiarla se resetean los "listo".
  const proponerCancion = React.useCallback((c: CancionReto) => {
    const op = oponenteRef.current
    if (!op) return
    setCancion(c); setMiListo(false); setSuListo(false)
    enviar({ tipo: 'cancion', de: miId, para: op.id, cancion: c })
  }, [enviar, miId])

  const marcarListo = React.useCallback((v: boolean) => {
    const op = oponenteRef.current
    if (!op) return
    setMiListo(v)
    enviar({ tipo: 'listo', de: miId, para: op.id, valor: v })
  }, [enviar, miId])

  const ambosListos = miListo && suListo && !!cancion
  const limpiarAviso = React.useCallback(() => setAviso(null), [])

  // Empezar el duelo (lo dispara el RETADOR cuando ambos están listos).
  const empezarDuelo = React.useCallback(() => {
    const op = oponenteRef.current
    if (!op || !soyRetadorRef.current) return
    setDueloIniciado(true)
    enviar({ tipo: 'duelo-inicio', de: miId, para: op.id })
  }, [enviar, miId])

  // Reportar MI puntaje al terminar mi turno → el rival lo recibe; el turno avanza solo (derivado).
  const reportarPuntaje = React.useCallback((puntos: number) => {
    const op = oponenteRef.current
    setMiPuntaje(puntos)
    if (op) enviar({ tipo: 'resultado', de: miId, para: op.id, puntos })
  }, [enviar, miId])

  // Revancha: resetea puntajes (mismo oponente/canción/sección) y reinicia el duelo desde el turno 1.
  const revancha = React.useCallback(() => {
    const op = oponenteRef.current
    if (!op) return
    setMiPuntaje(null); setRivalPuntaje(null); setDueloIniciado(true)
    enviar({ tipo: 'revancha', de: miId, para: op.id })
  }, [enviar, miId])

  // --- Derivaciones del turno (deterministas a partir de los 2 puntajes) ---
  // Turno 1 = retador; turno 2 = retado. Se calcula igual en ambos clientes.
  const retadorPuntaje = soyRetador ? miPuntaje : rivalPuntaje
  const retadoPuntaje = soyRetador ? rivalPuntaje : miPuntaje
  let turno: 'retador' | 'retado' | null = null
  if (dueloIniciado) {
    if (retadorPuntaje === null) turno = 'retador'
    else if (retadoPuntaje === null) turno = 'retado'
    else turno = null
  }
  const meTocaJugar = dueloIniciado && miPuntaje === null && (
    (turno === 'retador' && soyRetador) || (turno === 'retado' && !soyRetador)
  )
  const terminado = dueloIniciado && miPuntaje !== null && rivalPuntaje !== null
  const ganador: 'yo' | 'rival' | 'empate' | null = !terminado ? null
    : (miPuntaje! > rivalPuntaje! ? 'yo' : miPuntaje! < rivalPuntaje! ? 'rival' : 'empate')

  return {
    estado, oponente, cancion, chat, miListo, suListo, ambosListos, aviso, limpiarAviso,
    invitar, aceptar, rechazar, cancelar, enviarChat, proponerCancion, marcarListo,
    soyRetador, dueloIniciado, miPuntaje, rivalPuntaje, turno, meTocaJugar, terminado, ganador,
    empezarDuelo, reportarPuntaje, revancha,
  }
}
