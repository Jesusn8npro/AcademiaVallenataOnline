import React, { useEffect, useRef, useState } from 'react'
import { mensajeriaService } from '../../servicios/mensajeriaService'
import { supabase } from '../../servicios/supabaseCliente'
import type { Mensaje } from '../../servicios/mensajeriaService'
import BurbujaMensaje from './BurbujaMensaje'
import EntradaMensaje from './EntradaMensaje'
import './mensajes.css'

interface Props {
  chat: any
  usuarioActual: any
  onRegresar?: () => void
}

export default function ChatVista({ chat, usuarioActual, onRegresar }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensajeEnRespuesta, setMensajeEnRespuesta] = useState<Mensaje | null>(null)
  const [mostrarInfoPanel, setMostrarInfoPanel] = useState(false)
  const [estadoConexion, setEstadoConexion] = useState('SUBSCRIBED')
  const [modoOscuro] = useState(false)

  const contenedorMensajes = useRef<HTMLDivElement>(null)
  const mensajesEndRef = useRef<HTMLDivElement>(null)

  // Info del otro usuario (para el header)
  const otroUsuario = React.useMemo(() => {
    if (!chat || !usuarioActual) return null
    if (chat.es_grupal) {
      return {
        nombre: chat.nombre || 'Grupo',
        avatar: chat.imagen_url || '/images/default-group.png',
        estado: `${(chat.miembros || []).length} miembros`
      }
    }
    const partner = (chat.miembros || []).find((m: any) => m.usuario_id !== usuarioActual.id)
    return {
      nombre: partner?.usuario?.nombre_completo || 'Usuario',
      avatar: partner?.usuario?.url_foto_perfil || '/images/default-user.png',
      estado: partner?.usuario?.en_linea ? 'En línea' : 'Desconectado'
    }
  }, [chat, usuarioActual])

  // Cargar mensajes y suscripciones
  useEffect(() => {
    let sub: any

    const cargar = async () => {
      setCargando(true)
      const { mensajes: msgs, error } = await mensajeriaService.obtenerMensajes(chat.id)
      if (error) setError(error)
      else setMensajes(msgs || [])
      setCargando(false)
      scrollToBottom()
    }

    cargar()

    // Suscripción Realtime
    sub = mensajeriaService.suscribirseAChat(chat.id, (nuevoMensaje) => {
      setMensajes(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === nuevoMensaje.id)) return prev
        return [...prev, nuevoMensaje]
      })
      scrollToBottom()
    })

    return () => {
      if (sub) supabase.removeChannel(sub)
    }
  }, [chat.id])

  const scrollToBottom = () => {
    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleEnviar = async (contenido: string) => {
    const { mensaje, error } = await mensajeriaService.enviarMensaje({
      chat_id: chat.id,
      contenido
    })

    if (error) {
      alert('Error enviando mensaje: ' + error)
    } else if (mensaje) {
      scrollToBottom()
    }
  }

  const navegarAlPerfilUsuario = () => console.log('Navegar al perfil de usuario');
  const alternarInfoPanel = () => setMostrarInfoPanel(prev => !prev);
  const responderMensaje = (msg: Mensaje) => setMensajeEnRespuesta(msg);
  const cancelarRespuesta = () => setMensajeEnRespuesta(null);
  const enviarMensaje = async (contenido: string) => {
    await handleEnviar(contenido);
    setMensajeEnRespuesta(null);
  };

  return (
    <div className={`msg_chat_view ${modoOscuro ? 'dark' : ''} ${mostrarInfoPanel ? 'panel-abierto' : ''}`}>
      {!chat ? (
        <div className="estado-vacio">
          <div className="icono-chat">💬</div>
          <h3>Selecciona un chat</h3>
          <p>Elige una conversación para comenzar a chatear</p>
        </div>
      ) : (
        <div className="msg_main_container">
          <div className="msg_chat_area">
            <div className="msg_header">

              {/* Sección Izquierda: Usuario + Volver */}
              <div className="msg_header_user_info">
                {/* Botón Regresar: Siempre visible y blanco */}
                {onRegresar && (
                  <button className="btn-regresar" onClick={onRegresar} title="Volver" style={{ marginRight: '8px' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {otroUsuario && (
                  <>
                    <button className="avatar-container btn-perfil" onClick={navegarAlPerfilUsuario} title={`Ver perfil de ${otroUsuario.nombre}`}>
                      {/* Avatar con fallback */}
                      <img
                        src={otroUsuario.avatar || '/images/default-user.png'}
                        alt={otroUsuario.nombre}
                        className="msg_avatar_user"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-user.png';
                        }}
                      />
                      {otroUsuario.estado === 'En línea' && <div className="indicador-online"></div>}
                    </button>

                    <div className="info-texto">
                      <button className="msg_username boton-nombre-perfil" onClick={navegarAlPerfilUsuario} title={`Ver perfil de ${otroUsuario.nombre}`}>
                        {otroUsuario.nombre}
                      </button>
                      <p className={`msg_user_status ${otroUsuario.estado === 'En línea' ? 'msg_online' : ''}`}>
                        {otroUsuario.estado}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Sección Derecha: Estado + Acciones */}
              <div className="msg_header_right_section">
                <div className={`indicador-conexion ${estadoConexion === 'SUBSCRIBED' ? 'conectado' : ''}`}>
                  {estadoConexion === 'SUBSCRIBED' ? (
                    <>
                      <div className="punto-verde-vivo"></div>
                      <span className="texto-estado">En vivo</span>
                    </>
                  ) : (
                    <span className="texto-estado">Conectando...</span>
                  )}
                </div>

                <div className="acciones-header">
                  <button
                    className="btn-info"
                    onClick={alternarInfoPanel}
                    title="Información del chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="msg_messages_area mensajes-scroll" ref={contenedorMensajes}>
              {cargando ? (
                <div className="cargando">
                  <div className="spinner"></div>
                  <p>Cargando mensajes...</p>
                </div>
              ) : error ? (
                <div className="error">
                  <p>❌ {error}</p>
                </div>
              ) : (
                mensajes.map((mensaje, index) => (
                  <BurbujaMensaje
                    key={mensaje.id}
                    mensaje={mensaje}
                    chatEsGrupal={chat.es_grupal} // Pass correctly
                    mensajeAnterior={index > 0 ? mensajes[index - 1] : undefined}
                    mensajeSiguiente={index < mensajes.length - 1 ? mensajes[index + 1] : undefined}
                    onResponder={() => responderMensaje(mensaje)}
                  />
                ))
              )}
              <div ref={mensajesEndRef} />
            </div>

            <div className="msg_input_section">
              {mensajeEnRespuesta && (
                <div className="respuesta-preview">
                  <div className="respuesta-contenido">
                    <strong>Respondiendo a {mensajeEnRespuesta.usuario?.nombre_completo}</strong>
                    <p>{mensajeEnRespuesta.contenido}</p>
                  </div>
                  <button className="btn-cancelar" onClick={cancelarRespuesta}>✕</button>
                </div>
              )}

              <div className="msg_input_container">
                <EntradaMensaje chat={chat} mensajeEnRespuesta={mensajeEnRespuesta} onEnviar={enviarMensaje} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
