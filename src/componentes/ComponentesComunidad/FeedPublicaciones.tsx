'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ModalReplayGrabacionHero from '../../Paginas/Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero';
import { useFeedPublicacion } from './Hooks/useFeedPublicacion';
import type { Usuario } from '../../Paginas/Comunidad/tipos';
import './FeedPublicaciones.css';
import ContenidoPublicacion from './ContenidoPublicacion';

interface FeedPublicacionesProps {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  url_foto_perfil?: string;
  usuario_slug?: string;
  fecha: string;
  titulo?: string;
  contenido: string;
  url_imagen?: string;
  url_video?: string;
  url_gif?: string;
  tipo: string;
  encuesta?: unknown;
  me_gusta: string[];
  total_comentarios: number;
  total_compartidos: number;
  usuario: Usuario | null;
  onEliminar?: (id: string) => void;
}

const FeedPublicaciones: React.FC<FeedPublicacionesProps> = ({
  id,
  usuario_id,
  usuario_nombre,
  url_foto_perfil,
  usuario_slug,
  fecha,
  titulo,
  contenido,
  url_imagen,
  url_video,
  url_gif,
  tipo,
  encuesta,
  me_gusta,
  total_comentarios,
  total_compartidos,
  usuario,
  onEliminar,
}) => {
  const {
    contadorComentarios, meGusta, cargandoMeGusta,
    mostrarComentarios, comentarios, cargandoLista,
    enfoqueAutomaticoComentario, nuevoComentario,
    cargandoComentario, mostrarMenu, eliminando, grabacionHero,
    cargandoGrabacionHero, mostrarReplayHero, yaDioMeGusta, esDuenioOAdmin,
    pedirConfirmacionEliminar, errorEliminar,
    respondiendo, textoRespuesta, cargandoRespuesta,
    setMostrarMenu, setMostrarReplayHero, setEnfoqueAutomaticoComentario,
    setNuevoComentario, setTextoRespuesta,
    alternarMeGusta, alternarComentarios, enviarComentario,
    enviarRespuesta, iniciarRespuesta, cancelarRespuesta,
    alternarRespuestasComentario,
    menuComentarioId, setMenuComentarioId, eliminarComentario,
    manejarEliminar, cancelarEliminar, ejecutarEliminar, formatearFecha,
  } = useFeedPublicacion({ id, me_gusta, total_comentarios, usuario_id, tipo, encuesta, usuario, onEliminar });

  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const enc = encuesta as Record<string, unknown> | undefined;

  return (
    <article className="feed-publicaciones-tarjeta" id={`publicacion-${id}`}>
      <header className="feed-publicaciones-encabezado">
        <div className="feed-publicaciones-info-usuario">
          <div className="feed-publicaciones-contenedor-avatar">
            <div className="feed-publicaciones-contenedor-boton-avatar">
              <Image
                src={url_foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario_nombre)}&background=667eea&color=fff`}
                alt={usuario_nombre}
                className="feed-publicaciones-avatar"
                width={48}
                height={48}
                unoptimized={false}
              />
            </div>
            <div className="feed-publicaciones-indicador-estado"></div>
          </div>
          <div className="feed-publicaciones-detalles-usuario">
            <button
              className="feed-publicaciones-boton-nombre-usuario feed-publicaciones-clickeable"
              aria-label={`Ver perfil de ${usuario_nombre}`}
            >
              <h3 className="feed-publicaciones-nombre-usuario">{usuario_nombre}</h3>
            </button>
            <div className="feed-publicaciones-metadatos-publicacion">
              <time className="feed-publicaciones-fecha-publicacion">{formatearFecha(fecha)}</time>
              <span className="feed-publicaciones-separador">·</span>
              <span className="feed-publicaciones-visibilidad-publicacion" title="Público">
                <svg className="feed-publicaciones-icono-publico" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Público
              </span>
            </div>
          </div>
        </div>
        <div className="feed-publicaciones-acciones-encabezado">
          <div className="feed-publicaciones-contenedor-menu">
            <button
              className={`feed-publicaciones-boton-menu ${mostrarMenu ? 'activo' : ''}`}
              title="Más opciones"
              aria-label="Opciones de publicación"
              onClick={() => setMostrarMenu(!mostrarMenu)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {mostrarMenu && (
              <>
                <div className="feed-publicaciones-menu-overlay" onClick={() => setMostrarMenu(false)}></div>
                <div className="feed-publicaciones-menu-dropdown">
                  {esDuenioOAdmin && (
                    <button className="feed-publicaciones-opcion-menu eliminar" onClick={manejarEliminar} disabled={eliminando}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                      {eliminando ? 'Eliminando...' : 'Eliminar publicación'}
                    </button>
                  )}
                  <button className="feed-publicaciones-opcion-menu" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/comunidad#publicacion-${id}`);
                    setEnlaceCopiado(true);
                    setTimeout(() => setEnlaceCopiado(false), 2000);
                    setMostrarMenu(false);
                  }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                    {enlaceCopiado ? '¡Copiado!' : 'Copiar enlace'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {pedirConfirmacionEliminar && (
        <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '0.5rem', padding: '0.75rem 1rem', margin: '0.5rem 0', fontSize: '0.875rem' }}>
          <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Eliminar esta publicación? Esta acción no se puede deshacer.</p>
          {errorEliminar && <p style={{ margin: '0 0 0.5rem', color: '#e53e3e' }}>{errorEliminar}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={ejecutarEliminar} disabled={eliminando} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button onClick={cancelarEliminar} disabled={eliminando} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ContenidoPublicacion
        tipo={tipo}
        titulo={titulo}
        contenido={contenido}
        url_imagen={url_imagen}
        url_video={url_video}
        url_gif={url_gif}
        enc={enc}
        grabacionHero={grabacionHero}
        cargandoGrabacionHero={cargandoGrabacionHero}
        setMostrarReplayHero={setMostrarReplayHero}
      />

      <div className="feed-publicaciones-barra-estadisticas">
        <div className="feed-pub-stat-izq">
          {meGusta.length > 0 && (
            <>
              <span className="feed-pub-stat-thumb">👍</span>
              <span className="feed-pub-stat-num">{meGusta.length}</span>
            </>
          )}
        </div>
        <div className="feed-pub-stat-der">
          {contadorComentarios > 0 && (
            <button className="feed-publicaciones-boton-contador-comentarios" onClick={alternarComentarios}>
              {contadorComentarios} {contadorComentarios === 1 ? 'comentario' : 'comentarios'}
            </button>
          )}
        </div>
      </div>

      <div className="feed-publicaciones-barra-acciones">
        <button
          className={`feed-pub-btn-accion${yaDioMeGusta ? ' activo' : ''}`}
          onClick={alternarMeGusta}
          disabled={cargandoMeGusta}
          aria-label={yaDioMeGusta ? 'Quitar me gusta' : 'Me gusta'}
        >
          <svg className="feed-pub-btn-ico" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span>{yaDioMeGusta ? 'Te gusta' : 'Me gusta'}</span>
          {cargandoMeGusta && <div className="feed-publicaciones-indicador-carga" />}
        </button>
        <div className="feed-pub-btn-sep" />
        <button
          className="feed-pub-btn-accion"
          onClick={alternarComentarios}
          aria-label="Comentar publicación"
        >
          <svg className="feed-pub-btn-ico" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.89 2 2 2h14l4 4-.01-18z" />
          </svg>
          <span>Comentar</span>
        </button>
        <div className="feed-pub-btn-sep" />
        <button className="feed-pub-btn-accion" aria-label="Compartir publicación">
          <svg className="feed-pub-btn-ico" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
          <span>Compartir</span>
        </button>
      </div>

      {mostrarComentarios && (
        <div className="feed-publicaciones-seccion-comentarios">

          {/* Lista de comentarios con respuestas */}
          {cargandoLista ? (
            <div className="feed-pub-coms-cargando">
              <div className="feed-pub-coms-spinner" />
              <span>Cargando comentarios...</span>
            </div>
          ) : comentarios.length > 0 ? (
            <div className="feed-pub-coms-lista">
              {comentarios.map((com) => {
                const avatarCom = com.usuario_avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(com.usuario_nombre || 'U')}&background=667eea&color=fff&size=64`;
                const numRespuestas = com.respuestas?.length || 0;
                const esDuenioCom = !!(usuario && usuario.id === com.usuario_id);
                return (
                  <div key={com.id} className="feed-pub-com-hilo">
                    <div className="feed-pub-com-item">
                      <Image src={avatarCom} alt={com.usuario_nombre || 'Usuario'}
                        className="feed-pub-com-avatar" width={36} height={36}
                        unoptimized={!!com.usuario_avatar} />
                      <div className="feed-pub-com-cuerpo">
                        <div className="feed-pub-com-burbuja-wrap">
                          <div className="feed-pub-com-burbuja">
                            <span className="feed-pub-com-autor">{com.usuario_nombre || 'Usuario'}</span>
                            <p className="feed-pub-com-texto">{com.comentario || ''}</p>
                          </div>
                          {esDuenioCom && (
                            <div className="feed-pub-com-menu-wrap">
                              <button className="feed-pub-com-menu-dots"
                                onClick={() => setMenuComentarioId(menuComentarioId === com.id ? null : com.id)}
                                aria-label="Opciones del comentario">
                                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                  <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
                                </svg>
                              </button>
                              {menuComentarioId === com.id && (
                                <>
                                  <div className="feed-pub-com-menu-overlay" onClick={() => setMenuComentarioId(null)} />
                                  <div className="feed-pub-com-menu-dropdown">
                                    <button className="feed-pub-com-menu-opcion eliminar"
                                      onClick={() => eliminarComentario(com.id)}>
                                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                      </svg>
                                      Eliminar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="feed-pub-com-acciones">
                          {usuario && (
                            <button className="feed-pub-com-btn-responder"
                              onClick={() => respondiendo === com.id ? cancelarRespuesta() : iniciarRespuesta(com.id, com.usuario_nombre || 'Usuario')}>
                              {respondiendo === com.id ? 'Cancelar' : 'Responder'}
                            </button>
                          )}
                          <span className="feed-pub-com-sep">·</span>
                          <time className="feed-pub-com-tiempo">{formatearFecha(com.fecha_creacion)}</time>
                        </div>
                      </div>
                    </div>

                    {respondiendo === com.id && (
                      <div className="feed-pub-reply-form">
                        <Image
                          src={usuario?.url_foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'U')}&background=764ba2&color=fff&size=64`}
                          alt="Tu avatar" className="feed-pub-com-avatar reply" width={28} height={28}
                          unoptimized={!!usuario?.url_foto_perfil} />
                        <div className="feed-pub-reply-input-wrap">
                          <input
                            type="text"
                            className="feed-pub-reply-input"
                            placeholder={`Responder a ${com.usuario_nombre || 'Usuario'}...`}
                            value={textoRespuesta}
                            onChange={(e) => setTextoRespuesta(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarRespuesta(com.id)}
                            autoFocus
                            maxLength={500}
                          />
                          <button
                            className={`feed-publicaciones-boton-enviar-comentario ${textoRespuesta.trim() ? 'activo' : ''}`}
                            onClick={() => enviarRespuesta(com.id)}
                            disabled={!textoRespuesta.trim() || cargandoRespuesta}
                            aria-label="Enviar respuesta"
                          >
                            {cargandoRespuesta ? (
                              <div className="feed-publicaciones-indicador-carga" />
                            ) : (
                              <svg className="feed-publicaciones-icono-enviar" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {numRespuestas > 0 && (
                      <button className="feed-pub-coms-ver-respuestas"
                        onClick={() => alternarRespuestasComentario(com.id)}>
                        <span className="feed-pub-ver-linea" />
                        {com.mostrarRespuestas
                          ? 'Ocultar respuestas'
                          : `Ver ${numRespuestas} ${numRespuestas === 1 ? 'respuesta' : 'respuestas'}`}
                      </button>
                    )}

                    {com.mostrarRespuestas && numRespuestas > 0 && (
                      <div className="feed-pub-coms-respuestas">
                        {com.respuestas.map((rep: any) => {
                          const avatarRep = rep.usuario_avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.usuario_nombre || 'U')}&background=764ba2&color=fff&size=64`;
                          const esDuenioRep = !!(usuario && usuario.id === rep.usuario_id);
                          return (
                            <div key={rep.id} className="feed-pub-com-item respuesta">
                              <Image src={avatarRep} alt={rep.usuario_nombre || 'Usuario'}
                                className="feed-pub-com-avatar reply" width={28} height={28}
                                unoptimized={!!rep.usuario_avatar} />
                              <div className="feed-pub-com-cuerpo">
                                <div className="feed-pub-com-burbuja-wrap">
                                  <div className="feed-pub-com-burbuja reply">
                                    <span className="feed-pub-com-autor">{rep.usuario_nombre || 'Usuario'}</span>
                                    <p className="feed-pub-com-texto">{rep.comentario || ''}</p>
                                  </div>
                                  {esDuenioRep && (
                                    <div className="feed-pub-com-menu-wrap">
                                      <button className="feed-pub-com-menu-dots"
                                        onClick={() => setMenuComentarioId(menuComentarioId === rep.id ? null : rep.id)}
                                        aria-label="Opciones del comentario">
                                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                          <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
                                        </svg>
                                      </button>
                                      {menuComentarioId === rep.id && (
                                        <>
                                          <div className="feed-pub-com-menu-overlay" onClick={() => setMenuComentarioId(null)} />
                                          <div className="feed-pub-com-menu-dropdown">
                                            <button className="feed-pub-com-menu-opcion eliminar"
                                              onClick={() => eliminarComentario(rep.id, com.id)}>
                                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                              </svg>
                                              Eliminar
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="feed-pub-com-acciones">
                                  {usuario && (
                                    <button className="feed-pub-com-btn-responder"
                                      onClick={() => respondiendo === com.id ? cancelarRespuesta() : iniciarRespuesta(com.id, rep.usuario_nombre || 'Usuario')}>
                                      Responder
                                    </button>
                                  )}
                                  <span className="feed-pub-com-sep">·</span>
                                  <time className="feed-pub-com-tiempo">{formatearFecha(rep.fecha_creacion)}</time>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="feed-pub-coms-vacio">
              <span className="feed-pub-coms-vacio-emoji">💬</span>
              <p>Sé el primero en comentar</p>
            </div>
          )}

          {/* Formulario comentario nuevo */}
          <div className="feed-publicaciones-formulario-comentario">
            <Image
              src={usuario?.url_foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'U')}&background=667eea&color=fff&size=64`}
              alt="Tu avatar" className="feed-publicaciones-avatar-usuario-actual"
              width={36} height={36} unoptimized={!!usuario?.url_foto_perfil} />
            <div className="feed-publicaciones-contenedor-input-comentario">
              <input
                type="text"
                placeholder={usuario ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarComentario()}
                className="feed-publicaciones-input-comentario"
                autoFocus={enfoqueAutomaticoComentario}
                onFocus={() => setEnfoqueAutomaticoComentario(false)}
                maxLength={500}
                disabled={!usuario}
              />
              <button
                className={`feed-publicaciones-boton-enviar-comentario ${nuevoComentario.trim() ? 'activo' : ''}`}
                onClick={enviarComentario}
                disabled={!nuevoComentario.trim() || cargandoComentario || !usuario}
                aria-label="Enviar comentario"
              >
                {cargandoComentario ? (
                  <div className="feed-publicaciones-indicador-carga" />
                ) : (
                  <svg className="feed-publicaciones-icono-enviar" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarReplayHero && grabacionHero && (
        <ModalReplayGrabacionHero
          abierta={mostrarReplayHero}
          grabacion={grabacionHero}
          onCerrar={() => setMostrarReplayHero(false)}
        />
      )}
    </article>
  );
};

export default FeedPublicaciones;
