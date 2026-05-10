import React, { useEffect, useRef, useState } from 'react'
import { mensajeriaService } from '../../servicios/mensajeriaService'
import { supabase } from '../../servicios/clienteSupabase'
import type { Mensaje } from '../../servicios/mensajeriaService'
import BurbujaMensaje from './BurbujaMensaje'
import EntradaMensaje from './EntradaMensaje'
import './mensajes-v2.css'

interface Props {
  chat: any
  usuarioActual: any
  onRegresar?: () => void
}

function fechaSeparador(iso: string): string {
  try {
    const d = new Date(iso)
    const ahora = new Date()
    const sameDay = d.toDateString() === ahora.toDateString()
    if (sameDay) return 'Hoy'
    const ayer = new Date(ahora); ayer.setDate(ahora.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    const diff = (ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 7) return d.toLocaleDateString('es-ES', { weekday: 'long' })
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default function ChatVista({ chat, usuarioActual, onRegresar }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensajeEnRespuesta, setMensajeEnRespuesta] = useState<Mensaje | null>(null)
  const [estadoConexion, setEstadoConexion] = useState('SUBSCRIBED')
  const [errorEnvio, setErrorEnvio] = useState('')
  const contenedorMensajes = useRef<HTMLDivElement>(null)
  const mensajesEndRef = useRef<HTMLDivElement>(null)

  const otroUsuario = React.useMemo(() => {
    if (!chat || !usuarioActual) return null
    if (chat.es_grupal) {
      return {
        nombre: chat.nombre || 'Grupo',
        avatar: chat.imagen_url || '/images/default-group.png',
        estado: `${(chat.miembros || []).length} miembros`,
        enLinea: false,
      }
    }
    const partner = (chat.miembros || []).find((m: any) => m.usuario_id !== usuarioActual.id)
    return {
      nombre: partner?.usuario?.nombre_completo || 'Usuario',
      avatar: partner?.usuario?.url_foto_perfil || '/images/default-user.png',
      estado: partner?.usuario?.en_linea ? 'En línea' : 'Desconectado',
      enLinea: !!partner?.usuario?.en_linea,
    }
  }, [chat, usuarioActual])

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      setCargando(true)
      const { mensajes: msgs, error } = await mensajeriaService.obtenerMensajes(chat.id)
      if (!activo) return
      if (error) setError(error)
      else setMensajes(msgs || [])
      setCargando(false)
      scrollToBottom()
    }

    cargar()

    mensajeriaService.suscribirseAChat(chat.id, {
      onNuevoMensaje: (nuevoMensajeBase: any) => {
        if (!activo) return
        // Marcar es_mio en cliente
        const mensaje: Mensaje = {
          ...nuevoMensajeBase,
          es_mio: nuevoMensajeBase.usuario_id === usuarioActual?.id,
          reacciones: [],
          lecturas: [],
          leido_por_mi: nuevoMensajeBase.usuario_id === usuarioActual?.id,
        }
        setMensajes(prev => {
          if (prev.some(m => m.id === mensaje.id)) return prev
          return [...prev, mensaje]
        })
        scrollToBottom()
      },
      onConexionCambiada: (status: string) => {
        if (activo) setEstadoConexion(status)
      }
    })

    // Marcar como leídos al abrir
    mensajeriaService.marcarMensajesComoLeidos(chat.id).catch(() => {})

    return () => {
      activo = false
      mensajeriaService.desuscribirseDeChat(chat.id).catch(() => {})
    }
  }, [chat.id, usuarioActual?.id])

  const scrollToBottom = () => {
    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  const handleEnviar = async (contenido: string) => {
    setErrorEnvio('')
    const { mensaje, error } = await mensajeriaService.enviarMensaje({ chat_id: chat.id, contenido })
    if (error) {
      setErrorEnvio(error || 'Error enviando mensaje')
      return
    }
    if (mensaje) {
      // Inserción optimista (la suscripción también puede insertarlo, dedup por id)
      const optimista: Mensaje = {
        ...(mensaje as any),
        es_mio: true,
        reacciones: [],
        lecturas: [],
        leido_por_mi: true,
      }
      setMensajes(prev => prev.some(m => m.id === optimista.id) ? prev : [...prev, optimista])
      scrollToBottom()
    }
  }

  const enviarMensaje = async (contenido: string) => {
    await handleEnviar(contenido)
    setMensajeEnRespuesta(null)
  }

  const cancelarRespuesta = () => setMensajeEnRespuesta(null)
  const responderMensaje = (msg: Mensaje) => setMensajeEnRespuesta(msg)

  // Agrupar mensajes por fecha (para separadores)
  const mensajesConSeparadores = React.useMemo(() => {
    const out: { tipo: 'separador' | 'msg'; data: any; key: string }[] = []
    let ultimaFecha = ''
    for (const m of mensajes) {
      const fecha = fechaSeparador(m.creado_en)
      if (fecha !== ultimaFecha) {
        out.push({ tipo: 'separador', data: fecha, key: `sep-${fecha}-${m.id}` })
        ultimaFecha = fecha
      }
      out.push({ tipo: 'msg', data: m, key: m.id })
    }
    return out
  }, [mensajes])

  return (
    <div className="msg_chat_view">
      {!chat ? null : (
        <div className="msg_main_container">
          <div className="msg_chat_area">
            {/* Header */}
            <div className="msg_header">
              <div className="msg_header_user_info">
                {onRegresar && (
                  <button className="btn-regresar" onClick={onRegresar} title="Volver" aria-label="Volver a la lista">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {otroUsuario && (
                  <>
                    <div className="avatar-container">
                      <img
                        src={otroUsuario.avatar}
                        alt={otroUsuario.nombre}
                        className="msg_avatar_user"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }}
                      />
                      {otroUsuario.enLinea && <div className="indicador-online" />}
                    </div>
                    <div className="info-texto">
                      <div className="msg_username">{otroUsuario.nombre}</div>
                      <div className={`msg_user_status ${otroUsuario.enLinea ? 'msg_online' : ''}`}>
                        {otroUsuario.estado}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="msg_header_right_section">
                <div className={`indicador-conexion ${estadoConexion === 'SUBSCRIBED' ? 'conectado' : ''}`}>
                  <div className="punto-verde-vivo" />
                  <span className="texto-estado">{estadoConexion === 'SUBSCRIBED' ? 'En vivo' : 'Conectando'}</span>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="msg_messages_area" ref={contenedorMensajes}>
              {cargando ? (
                <div className="cargando">
                  <div className="spinner" />
                  <p>Cargando mensajes...</p>
                </div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : mensajes.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8696a0', textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>👋</div>
                  <p style={{ margin: 0, fontSize: '0.95rem', maxWidth: 320 }}>
                    Aún no hay mensajes. ¡Sé el primero en saludar!
                  </p>
                </div>
              ) : (
                mensajesConSeparadores.map((item, index) => {
                  if (item.tipo === 'separador') {
                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '14px 0 10px',
                        }}
                      >
                        <span style={{
                          background: 'rgba(225, 245, 254, 0.92)',
                          color: '#54656f',
                          padding: '4px 12px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          boxShadow: '0 1px 1px rgba(11, 20, 26, 0.05)',
                          textTransform: 'capitalize',
                        }}>
                          {item.data}
                        </span>
                      </div>
                    )
                  }
                  const m = item.data as Mensaje
                  // Buscar previo y siguiente entre mensajes (no separadores)
                  const idxMsg = mensajes.findIndex(mm => mm.id === m.id)
                  const previo = idxMsg > 0 ? mensajes[idxMsg - 1] : undefined
                  const siguiente = idxMsg < mensajes.length - 1 ? mensajes[idxMsg + 1] : undefined
                  return (
                    <BurbujaMensaje
                      key={item.key}
                      mensaje={m}
                      chatEsGrupal={chat.es_grupal}
                      mensajeAnterior={previo}
                      mensajeSiguiente={siguiente}
                      onResponder={() => responderMensaje(m)}
                    />
                  )
                })
              )}
              <div ref={mensajesEndRef} />
            </div>

            {/* Input */}
            <div className="msg_input_section">
              {mensajeEnRespuesta && (
                <div className="respuesta-preview">
                  <div className="respuesta-contenido">
                    <strong>Respondiendo a {mensajeEnRespuesta.usuario?.nombre_completo || 'Usuario'}</strong>
                    <p>{mensajeEnRespuesta.contenido}</p>
                  </div>
                  <button className="btn-cancelar" onClick={cancelarRespuesta} aria-label="Cancelar respuesta">✕</button>
                </div>
              )}

              {errorEnvio && (
                <div style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  marginBottom: 6,
                }}>
                  {errorEnvio}
                </div>
              )}

              <div className="msg_input_container">
                <EntradaMensaje onEnviar={enviarMensaje} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
