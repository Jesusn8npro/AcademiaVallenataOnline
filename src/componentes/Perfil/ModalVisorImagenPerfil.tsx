import React from 'react'
import './ModalVisorImagenPerfil.css'
import { useModalVisorImagenPerfil } from './useModalVisorImagenPerfil'
import type { Comentario } from './useModalVisorImagenPerfil'

interface Props {
  abierto: boolean
  imagenUrl: string
  imagenId: string | null
  tipoImagen: 'avatar' | 'portada' | null
  usuarioPropietario: { id: string; nombre: string; avatar: string }
  onCerrar: () => void
}

export default function ModalVisorImagenPerfil(props: Props) {
  const {
    todasLasImagenes, indiceImagenActual, imagenUrl, cargandoComentarios,
    usuarioActual, comentarios, nuevoComentario, totalLikes, yaLikee,
    enviandoComentario, dandoLike, respondiendo, respuestaTexto,
    comentariosPrincipales,
    modalRef, comentarioInputRef,
    setNuevoComentario, setRespondiendo, setRespuestaTexto,
    toggleLike, enviarComentario, responderComentario,
    navegarImagenAnterior, navegarImagenSiguiente,
    formatearFecha, manejarTeclaEnter
  } = useModalVisorImagenPerfil(props)

  const obtenerRespuestas = (id: string) => comentarios.filter((c: Comentario) => c.comentario_padre_id === id)

  if (!props.abierto) return null

  return (
    <div
      className="visor-imagen-overlay"
      ref={modalRef}
      onClick={(e) => e.target === modalRef.current && props.onCerrar()}
      role="dialog"
      aria-modal="true"
    >
      <div className="visor-imagen-container">
        <button className="visor-imagen-btn-cerrar" onClick={props.onCerrar} aria-label="Cerrar">
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
                <div className="visor-imagen-indicador">{indiceImagenActual + 1} de {todasLasImagenes.length} fotos</div>
              </>
            )}
          </div>

          <div className="visor-imagen-panel">
            <div className="visor-imagen-header">
              <img
                src={props.usuarioPropietario.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                alt="Avatar"
                className="visor-imagen-avatar"
              />
              <div className="visor-imagen-info">
                <h3 className="visor-imagen-nombre">{props.usuarioPropietario.nombre}</h3>
                <p className="visor-imagen-tipo">
                  {props.tipoImagen === 'avatar' ? 'Foto de perfil' : props.tipoImagen === 'portada' ? 'Foto de portada' : 'Imagen'}
                </p>
              </div>
            </div>

            <div className="visor-imagen-acciones">
              <button
                className={`visor-imagen-btn-like ${yaLikee ? 'activo' : ''} ${dandoLike ? 'cargando' : ''}`}
                onClick={toggleLike}
                disabled={!usuarioActual || dandoLike}
              >
                <svg width="20" height="20" fill={yaLikee ? '#e74c3c' : 'none'} stroke={yaLikee ? '#e74c3c' : 'currentColor'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Me gusta
              </button>
              <button className="visor-imagen-btn-comentar" onClick={() => comentarioInputRef.current?.focus()}>
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
                  {comentariosPrincipales.map((comentario: Comentario) => (
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
                            onClick={() => { setRespondiendo(comentario.id); setRespuestaTexto('') }}
                          >
                            Responder
                          </button>
                        </div>

                        {obtenerRespuestas(comentario.id).map((respuesta: Comentario) => (
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
                                  onClick={() => { setRespondiendo(null); setRespuestaTexto('') }}
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
