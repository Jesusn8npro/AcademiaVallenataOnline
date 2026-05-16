import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mensajeriaService } from '../../servicios/mensajeriaService'
import type { Mensaje } from '../../servicios/mensajeriaService'
import BurbujaMensaje from './BurbujaMensaje'
import EntradaMensaje from './EntradaMensaje'

interface Props {
  chat: any
  usuarioActual: any
  onRegresar?: () => void
}

// Quita el cache-buster ?t=... para permitir cache HTTP del navegador.
const URL_ESTABLE = (u?: string | null) => (u || '').split('?')[0]

function fechaSeparador(iso: string): string {
  try {
    const d = new Date(iso)
    const ahora = new Date()
    if (d.toDateString() === ahora.toDateString()) return 'Hoy'
    const ayer = new Date(ahora); ayer.setDate(ahora.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    const diffDias = (ahora.getTime() - d.getTime()) / 86400000
    if (diffDias < 7) return d.toLocaleDateString('es-ES', { weekday: 'long' })
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default function ChatVista({ chat, usuarioActual, onRegresar }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [respuesta, setRespuesta] = useState<Mensaje | null>(null)
  const [conexion, setConexion] = useState('SUBSCRIBED')
  const [errorEnvio, setErrorEnvio] = useState('')
  const [escribiendo, setEscribiendo] = useState<{ usuario_id: string; typing: boolean }[]>([])
  const fin = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const estaAlFondo = useCallback(() => {
    const el = areaRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  const scrollAlFondo = useCallback((forzar = false) => {
    if (forzar || estaAlFondo()) {
      setTimeout(() => fin.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [estaAlFondo])

  const nombreEscribiendo = useMemo(() => {
    const activos = escribiendo.filter(p => p.typing)
    if (activos.length === 0) return null
    const partner = (chat.miembros || []).find((m: any) => m.usuario_id === activos[0].usuario_id)
    const nombre = partner?.usuario?.nombre_completo?.split(' ')[0] || 'Alguien'
    return nombre
  }, [escribiendo, chat.miembros])

  const onTyping = useCallback((escribiendo: boolean) => {
    if (!usuarioActual?.id) return
    mensajeriaService.trackTyping(chat.id, usuarioActual.id, escribiendo)
    if (escribiendo) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        mensajeriaService.trackTyping(chat.id, usuarioActual.id, false)
      }, 1000)
    }
  }, [chat.id, usuarioActual?.id])

  const otro = useMemo(() => {
    if (!chat || !usuarioActual) return null
    if (chat.es_grupal) return {
      nombre: chat.nombre || 'Grupo',
      avatar: chat.imagen_url || '/images/default-group.png',
      estado: `${(chat.miembros || []).length} miembros`,
      enLinea: false,
    }
    const partner = (chat.miembros || []).find((m: any) => m.usuario_id !== usuarioActual.id)
    return {
      nombre: partner?.usuario?.nombre_completo || 'Usuario',
      avatar: URL_ESTABLE(partner?.usuario?.url_foto_perfil) || '/images/default-user.png',
      estado: partner?.usuario?.en_linea ? 'En línea' : 'Desconectado',
      enLinea: !!partner?.usuario?.en_linea,
    }
  }, [chat, usuarioActual])

  // Map de miembros del chat por usuario_id para hidratar avatar/nombre en mensajes realtime
  // (el payload de postgres_changes NO trae el JOIN con perfiles).
  const miembrosPorId = React.useMemo(() => {
    const map = new Map<string, any>()
    ;(chat?.miembros || []).forEach((m: any) => {
      if (m.usuario_id && m.usuario) map.set(m.usuario_id, m.usuario)
    })
    return map
  }, [chat])

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      const { mensajes: msgs, error } = await mensajeriaService.obtenerMensajes(chat.id)
      if (!activo) return
      if (error) setError(error); else setMensajes(msgs || [])
      setCargando(false)
      scrollAlFondo(true)
    }
    cargar()

    mensajeriaService.suscribirseAChat(chat.id, {
      onNuevoMensaje: (raw: any) => {
        if (!activo) return
        const usuarioInfo = miembrosPorId.get(raw.usuario_id) || raw.usuario || null
        const mensaje: Mensaje = {
          ...raw,
          usuario: usuarioInfo,
          es_mio: raw.usuario_id === usuarioActual?.id,
          reacciones: [], lecturas: [],
          leido_por_mi: raw.usuario_id === usuarioActual?.id,
        }
        setMensajes(prev => prev.some(m => m.id === mensaje.id) ? prev : [...prev, mensaje])
        scrollAlFondo()
      },
      onConexionCambiada: (s: string) => { if (activo) setConexion(s) },
      onPresenceCambiada: (presences) => { if (activo) setEscribiendo(presences) }
    })

    mensajeriaService.marcarMensajesComoLeidos(chat.id).catch(() => {})

    return () => {
      activo = false
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      mensajeriaService.desuscribirseDeChat(chat.id).catch(() => {})
    }
  }, [chat.id, usuarioActual?.id, miembrosPorId, scrollAlFondo])

  const enviar = async (contenido: string) => {
    setErrorEnvio('')
    mensajeriaService.trackTyping(chat.id, usuarioActual?.id, false)
    const { mensaje, error } = await mensajeriaService.enviarMensaje({ chat_id: chat.id, contenido })
    if (error) { setErrorEnvio(error); return }
    if (mensaje) {
      const opt: Mensaje = { ...(mensaje as any), es_mio: true, reacciones: [], lecturas: [], leido_por_mi: true }
      setMensajes(prev => prev.some(m => m.id === opt.id) ? prev : [...prev, opt])
      scrollAlFondo(true)
    }
    setRespuesta(null)
  }

  // Mensajes con separadores de fecha
  const items = useMemo(() => {
    const out: Array<{ tipo: 'sep' | 'msg'; data: any; key: string }> = []
    let ultimaFecha = ''
    for (const m of mensajes) {
      const f = fechaSeparador(m.creado_en)
      if (f !== ultimaFecha) { out.push({ tipo: 'sep', data: f, key: `sep-${f}-${m.id}` }); ultimaFecha = f }
      out.push({ tipo: 'msg', data: m, key: m.id })
    }
    return out
  }, [mensajes])

  return (
    <div className="msg_chat_view">
      <header className="msg_chat_header">
        <div className="msg_chat_header_left">
          {onRegresar && (
            <button className="msg_btn_icon" onClick={onRegresar} aria-label="Volver">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {otro && (
            <>
              <img src={otro.avatar} alt={otro.nombre} className="msg_chat_header_avatar"
                loading="eager" decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }} />
              <div>
                <div className="msg_chat_header_name">{otro.nombre}</div>
                <div className={`msg_chat_header_status ${otro.enLinea ? 'is-online' : ''}`}>{otro.estado}</div>
              </div>
            </>
          )}
        </div>
        <div className={`msg_live ${conexion === 'SUBSCRIBED' ? 'is-on' : ''}`}>
          <div className="msg_live_dot" />
          <span className="msg_live_text">{conexion === 'SUBSCRIBED' ? 'En vivo' : 'Conectando'}</span>
        </div>
      </header>

      <div className="msg_area" ref={areaRef}>
        {cargando ? (
          <div className="msg_loading"><div className="msg_spinner" /><p>Cargando mensajes...</p></div>
        ) : error ? (
          <div className="msg_error">{error}</div>
        ) : mensajes.length === 0 ? (
          <div className="msg_no_msgs">
            <div style={{ fontSize: 56, marginBottom: 12 }}>👋</div>
            <p style={{ margin: 0, maxWidth: 320 }}>Aún no hay mensajes. ¡Sé el primero en saludar!</p>
          </div>
        ) : items.map((it) => {
          if (it.tipo === 'sep') return <div key={it.key} className="msg_date_sep"><span>{it.data}</span></div>
          const m = it.data as Mensaje
          const idx = mensajes.findIndex(x => x.id === m.id)
          return (
            <BurbujaMensaje
              key={it.key}
              mensaje={m}
              chatEsGrupal={chat.es_grupal}
              mensajeAnterior={idx > 0 ? mensajes[idx - 1] : undefined}
              mensajeSiguiente={idx < mensajes.length - 1 ? mensajes[idx + 1] : undefined}
              onResponder={() => setRespuesta(m)}
            />
          )
        })}
        <div ref={fin} />
      </div>

      <div className="msg_input_section">
        {respuesta && (
          <div className="msg_reply_preview">
            <div className="msg_reply_content">
              <strong>Respondiendo a {respuesta.usuario?.nombre_completo || 'Usuario'}</strong>
              <p>{respuesta.contenido}</p>
            </div>
            <button className="msg_reply_close" onClick={() => setRespuesta(null)} aria-label="Cancelar respuesta">✕</button>
          </div>
        )}
        {nombreEscribiendo && (
          <div className="msg_typing">
            <span className="msg_typing_name">{nombreEscribiendo}</span>
            <span> está escribiendo</span>
            <span className="msg_typing_dots"><span /><span /><span /></span>
          </div>
        )}
        {errorEnvio && <div className="msg_send_error">{errorEnvio}</div>}
        <EntradaMensaje onEnviar={enviar} onTyping={onTyping} />
      </div>
    </div>
  )
}
