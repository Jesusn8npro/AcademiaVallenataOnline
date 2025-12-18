import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import './ModalVisorImagenPerfil.css'

interface Props {
  abierto: boolean
  imagenUrl: string
  imagenId: string | null
  tipoImagen: 'avatar' | 'portada' | null
  usuarioPropietario: { id: string; nombre: string; avatar: string }
  onCerrar: () => void
}

interface Comentario {
  id: string
  usuario_id: string
  usuario_nombre: string
  usuario_avatar: string
  comentario: string
  fecha_creacion: string
  comentario_padre_id: string | null
}

interface Like {
  id: string
  usuario_id: string
}

export default function ModalVisorImagenPerfil({
  abierto,
  imagenUrl: imagenUrlInicial,
  imagenId: imagenIdInicial,
  tipoImagen,
  usuarioPropietario,
  onCerrar
}: Props) {
  // Estado de navegación
  const [todasLasImagenes, setTodasLasImagenes] = useState<any[]>([])
  const [indiceImagenActual, setIndiceImagenActual] = useState(0)
  const [imagenId, setImagenId] = useState<string | null>(imagenIdInicial)
  const [imagenUrl, setImagenUrl] = useState<string>(imagenUrlInicial)
  const [cargandoImagenes, setCargandoImagenes] = useState(false)

  // Estado de usuario actual
  const [usuarioActual, setUsuarioActual] = useState<any>(null)

  // Estado de likes y comentarios
  const [likes, setLikes] = useState<Like[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [totalLikes, setTotalLikes] = useState(0)
  const [yaLikee, setYaLikee] = useState(false)
  const [cargandoLikes, setCargandoLikes] = useState(false)
  const [cargandoComentarios, setCargandoComentarios] = useState(false)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [dandoLike, setDandoLike] = useState(false)

  // Estado UI
  const modalRef = useRef<HTMLDivElement>(null)
  const comentarioInputRef = useRef<HTMLTextAreaElement>(null)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuestaTexto, setRespuestaTexto] = useState('')

  // Efecto para cargar usuario actual
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Obtener datos adicionales del perfil si es necesario
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setUsuarioActual({
          id: user.id,
          nombre: perfil?.nombre_completo || user.email?.split('@')[0] || 'Usuario',
          url_foto_perfil: perfil?.url_foto_perfil || ''
        })
      }
    }
    obtenerUsuario()
  }, [])

  // Efecto para bloquear scroll del body y ocultar menú inferior
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-visor-abierto')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-visor-abierto')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-visor-abierto')
    }
  }, [abierto])

  // Cargar todas las imágenes al abrir
  useEffect(() => {
    if (abierto && usuarioPropietario.id && tipoImagen) {
      cargarTodasLasImagenes()
    }
  }, [abierto, usuarioPropietario.id, tipoImagen])

  // Actualizar imagen actual si cambian las props iniciales
  useEffect(() => {
    if (imagenIdInicial) setImagenId(imagenIdInicial)
    if (imagenUrlInicial) setImagenUrl(imagenUrlInicial)
  }, [imagenIdInicial, imagenUrlInicial])

  // Cargar likes y comentarios cuando cambia la imagen
  useEffect(() => {
    if (abierto && imagenId) {
      cargarLikes()
      cargarComentarios()
    }
  }, [abierto, imagenId])

  // Manejar teclado
  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      if (!abierto) return

      if (e.key === 'Escape') {
        onCerrar()
      } else if (e.key === 'ArrowLeft') {
        navegarImagenAnterior()
      } else if (e.key === 'ArrowRight') {
        navegarImagenSiguiente()
      }
    }

    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [abierto, indiceImagenActual, todasLasImagenes])

  const cargarTodasLasImagenes = async () => {
    if (!usuarioPropietario.id || !tipoImagen) return
    setCargandoImagenes(true)

    try {
      const { data: imagenesData, error } = await supabase
        .from('usuario_imagenes')
        .select('*')
        .eq('usuario_id', usuarioPropietario.id)
        .eq('tipo', tipoImagen)
        .order('fecha_subida', { ascending: false })

      if (error) throw error

      const imagenes = imagenesData || []
      setTodasLasImagenes(imagenes)

      // Encontrar índice actual
      if (imagenId) {
        const indice = imagenes.findIndex((img: any) => img.id === imagenId)
        setIndiceImagenActual(indice >= 0 ? indice : 0)
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error)
    } finally {
      setCargandoImagenes(false)
    }
  }

  const cargarLikes = async () => {
    if (!imagenId) return
    setCargandoLikes(true)

    try {
      const { data: likesData, error } = await supabase
        .from('usuario_imagenes_likes')
        .select('*')
        .eq('imagen_id', imagenId)

      if (error) throw error

      const likes = likesData || []
      setLikes(likes)
      setTotalLikes(likes.length)
      setYaLikee(usuarioActual ? likes.some((like: Like) => like.usuario_id === usuarioActual.id) : false)
    } catch (error) {
      console.error('Error cargando likes:', error)
    } finally {
      setCargandoLikes(false)
    }
  }

  const cargarComentarios = async () => {
    if (!imagenId) return
    setCargandoComentarios(true)

    try {
      const { data: comentariosData, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .select('*')
        .eq('imagen_id', imagenId)
        .order('fecha_creacion', { ascending: true })

      if (error) throw error
      setComentarios(comentariosData || [])
    } catch (error) {
      console.error('Error cargando comentarios:', error)
    } finally {
      setCargandoComentarios(false)
    }
  }

  const toggleLike = async () => {
    if (!usuarioActual || !imagenId || dandoLike) return
    setDandoLike(true)

    try {
      if (yaLikee) {
        const { error } = await supabase
          .from('usuario_imagenes_likes')
          .delete()
          .eq('imagen_id', imagenId)
          .eq('usuario_id', usuarioActual.id)

        if (error) throw error

        setTotalLikes(prev => prev - 1)
        setYaLikee(false)
      } else {
        const { error } = await supabase
          .from('usuario_imagenes_likes')
          .insert({
            imagen_id: imagenId,
            usuario_id: usuarioActual.id,
            fecha_creacion: new Date().toISOString()
          })

        if (error) throw error

        setTotalLikes(prev => prev + 1)
        setYaLikee(true)
      }
    } catch (error) {
      console.error('Error al dar/quitar like:', error)
    } finally {
      setDandoLike(false)
    }
  }

  const enviarComentario = async () => {
    if (!usuarioActual || !imagenId || !nuevoComentario.trim() || enviandoComentario) return
    setEnviandoComentario(true)

    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre,
          usuario_avatar: usuarioActual.url_foto_perfil,
          comentario: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: null
        })
        .select()
        .single()

      if (error) throw error

      setComentarios(prev => [...prev, data])
      setNuevoComentario('')
      comentarioInputRef.current?.focus()
    } catch (error) {
      console.error('Error enviando comentario:', error)
    } finally {
      setEnviandoComentario(false)
    }
  }

  const responderComentario = async () => {
    if (!usuarioActual || !imagenId || !respuestaTexto.trim() || !respondiendo || enviandoComentario) return
    setEnviandoComentario(true)

    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre,
          usuario_avatar: usuarioActual.url_foto_perfil,
          comentario: respuestaTexto.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: respondiendo
        })
        .select()
        .single()

      if (error) throw error

      setComentarios(prev => [...prev, data])
      setRespuestaTexto('')
      setRespondiendo(null)
    } catch (error) {
      console.error('Error enviando respuesta:', error)
    } finally {
      setEnviandoComentario(false)
    }
  }

  const navegarImagenAnterior = () => {
    if (indiceImagenActual > 0) {
      const nuevoIndice = indiceImagenActual - 1
      setIndiceImagenActual(nuevoIndice)
      const imagen = todasLasImagenes[nuevoIndice]
      setImagenId(imagen.id)
      setImagenUrl(imagen.url_imagen)
    }
  }

  const navegarImagenSiguiente = () => {
    if (indiceImagenActual < todasLasImagenes.length - 1) {
      const nuevoIndice = indiceImagenActual + 1
      setIndiceImagenActual(nuevoIndice)
      const imagen = todasLasImagenes[nuevoIndice]
      setImagenId(imagen.id)
      setImagenUrl(imagen.url_imagen)
    }
  }

  const formatearFecha = (fecha: string) => {
    const ahora = new Date()
    const fechaComentario = new Date(fecha)
    const diffMs = ahora.getTime() - fechaComentario.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMins / 60)
    const diffDias = Math.floor(diffHoras / 24)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHoras < 24) return `${diffHoras}h`
    if (diffDias < 7) return `${diffDias}d`
    return fechaComentario.toLocaleDateString()
  }

  const manejarTeclaEnter = (e: React.KeyboardEvent, esRespuesta: boolean) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (esRespuesta) {
        responderComentario()
      } else {
        enviarComentario()
      }
    }
  }

  if (!abierto) return null

  const comentariosPrincipales = comentarios.filter(c => !c.comentario_padre_id)
  const obtenerRespuestas = (id: string) => comentarios.filter(c => c.comentario_padre_id === id)

  return (
    <div
      className="visor-imagen-overlay"
      ref={modalRef}
      onClick={(e) => e.target === modalRef.current && onCerrar()}
      role="dialog"
      aria-modal="true"
    >
      <div className="visor-imagen-container">
        <button className="visor-imagen-btn-cerrar" onClick={onCerrar} aria-label="Cerrar">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="visor-imagen-content">
          <div className="visor-imagen-area">
            <img src={imagenUrl} alt="Imagen de perfil" className="visor-imagen-principal" />

            {todasLasImagenes.length > 1 && (
              <>
                <button
                  className={`visor-imagen-nav visor-imagen-nav-prev ${indiceImagenActual === 0 ? 'disabled' : ''}`}
                  onClick={navegarImagenAnterior}
                  disabled={indiceImagenActual === 0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  className={`visor-imagen-nav visor-imagen-nav-next ${indiceImagenActual === todasLasImagenes.length - 1 ? 'disabled' : ''}`}
                  onClick={navegarImagenSiguiente}
                  disabled={indiceImagenActual === todasLasImagenes.length - 1}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                <div className="visor-imagen-indicador">
                  {indiceImagenActual + 1} de {todasLasImagenes.length} fotos
                </div>
              </>
            )}
          </div>

          <div className="visor-imagen-panel">
            <div className="visor-imagen-header">
              <img
                src={usuarioPropietario.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                alt="Avatar"
                className="visor-imagen-avatar"
              />
              <div className="visor-imagen-info">
                <h3 className="visor-imagen-nombre">{usuarioPropietario.nombre}</h3>
                <p className="visor-imagen-tipo">
                  {tipoImagen === 'avatar' ? 'Foto de perfil' : tipoImagen === 'portada' ? 'Foto de portada' : 'Imagen'}
                </p>
              </div>
            </div>

            <div className="visor-imagen-acciones">
              <button
                className={`visor-imagen-btn-like ${yaLikee ? 'activo' : ''} ${dandoLike ? 'cargando' : ''}`}
                onClick={toggleLike}
                disabled={!usuarioActual || dandoLike}
              >
                <svg width="20" height="20" fill={yaLikee ? "#e74c3c" : "none"} stroke={yaLikee ? "#e74c3c" : "currentColor"} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Me gusta
              </button>

              <button
                className="visor-imagen-btn-comentar"
                onClick={() => comentarioInputRef.current?.focus()}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comentar
              </button>
            </div>

            {totalLikes > 0 && (
              <div className="visor-imagen-likes">
                <span className="visor-imagen-emoji">❤️</span>
                <span className="visor-imagen-likes-texto">
                  {totalLikes === 1 ? '1 persona le gusta esto' : `${totalLikes} personas les gusta esto`}
                </span>
              </div>
            )}

            <div className="visor-imagen-comentarios">
              {cargandoComentarios ? (
                <div className="visor-imagen-loading">
                  <div className="visor-imagen-spinner"></div>
                  <span>Cargando comentarios...</span>
                </div>
              ) : (
                <div className="visor-imagen-lista">
                  {comentariosPrincipales.map(comentario => (
                    <div key={comentario.id} className="visor-imagen-comentario">
                      <img
                        src={comentario.usuario_avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                        alt="Avatar"
                        className="visor-imagen-comentario-avatar"
                      />
                      <div className="visor-imagen-comentario-contenido">
                        <div className="visor-imagen-comentario-burbuja">
                          <strong className="visor-imagen-comentario-nombre">{comentario.usuario_nombre}</strong>
                          <p className="visor-imagen-comentario-texto">{comentario.comentario}</p>
                        </div>
                        <div className="visor-imagen-comentario-acciones">
                          <span className="visor-imagen-comentario-tiempo">{formatearFecha(comentario.fecha_creacion)}</span>
                          <button
                            className="visor-imagen-btn-responder"
                            onClick={() => {
                              setRespondiendo(comentario.id)
                              setRespuestaTexto('')
                            }}
                          >
                            Responder
                          </button>
                        </div>

                        {obtenerRespuestas(comentario.id).map(respuesta => (
                          <div key={respuesta.id} className="visor-imagen-respuesta">
                            <img
                              src={respuesta.usuario_avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                              alt="Avatar"
                              className="avatar-respuesta"
                            />
                            <div className="visor-imagen-respuesta-contenido">
                              <div className="visor-imagen-respuesta-burbuja">
                                <strong className="nombre-comentarista">{respuesta.usuario_nombre}</strong>
                                <p className="texto-comentario">{respuesta.comentario}</p>
                              </div>
                              <span className="tiempo-comentario">{formatearFecha(respuesta.fecha_creacion)}</span>
                            </div>
                          </div>
                        ))}

                        {respondiendo === comentario.id && (
                          <div className="visor-imagen-input-respuesta">
                            <img
                              src={usuarioActual?.url_foto_perfil || 'https://randomuser.me/api/portraits/women/44.jpg'}
                              alt="Tu avatar"
                              className="avatar-respuesta"
                            />
                            <div className="visor-imagen-input-container-respuesta">
                              <textarea
                                value={respuestaTexto}
                                onChange={(e) => setRespuestaTexto(e.target.value)}
                                placeholder="Escribe una respuesta..."
                                className="visor-imagen-textarea-respuesta"
                                onKeyDown={(e) => manejarTeclaEnter(e, true)}
                                rows={1}
                                autoFocus
                              ></textarea>
                              <div className="visor-imagen-botones-respuesta">
                                <button
                                  className="visor-imagen-btn-cancelar-respuesta"
                                  onClick={() => {
                                    setRespondiendo(null)
                                    setRespuestaTexto('')
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="visor-imagen-btn-enviar-respuesta"
                                  onClick={responderComentario}
                                  disabled={!respuestaTexto.trim() || enviandoComentario}
                                >
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {comentarios.length === 0 && (
                    <div className="visor-imagen-sin-comentarios">
                      <p>Sé el primero en comentar esta foto</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {usuarioActual ? (
              <div className="visor-imagen-input-comentario">
                <img
                  src={usuarioActual.url_foto_perfil || 'https://randomuser.me/api/portraits/women/44.jpg'}
                  alt="Tu avatar"
                  className="visor-imagen-input-avatar"
                />
                <div className="visor-imagen-input-container">
                  <textarea
                    ref={comentarioInputRef}
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="visor-imagen-textarea-comentario"
                    onKeyDown={(e) => manejarTeclaEnter(e, false)}
                    rows={1}
                  ></textarea>
                  <button
                    className="visor-imagen-btn-enviar"
                    onClick={enviarComentario}
                    disabled={!nuevoComentario.trim() || enviandoComentario}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="visor-imagen-login-requerido">
                <p>Inicia sesión para comentar y dar me gusta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
