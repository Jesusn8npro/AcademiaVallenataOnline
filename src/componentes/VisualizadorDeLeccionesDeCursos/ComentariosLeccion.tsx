'use client';

import * as React from 'react'
import Image from 'next/image'
import './ComentariosLeccion.css'
import { useComentariosLeccion } from './useComentariosLeccion'
import type { Comentario } from './useComentariosLeccion'

interface ComentariosLeccionProps {
    leccionId: string
    usuarioActual?: any
    tipo?: 'leccion' | 'clase'
}

const ComentariosLeccion: React.FC<ComentariosLeccionProps> = ({
    leccionId,
    usuarioActual = null,
    tipo = 'clase'
}) => {
    const {
        nuevoComentario, cargando, error,
        respuestas, mostrandoFormRespuesta, likeCargando, comentariosMostrados,
        comentariosPrincipales, respuestasPorComentario,
        setNuevoComentario, setMostrandoFormRespuesta, setRespuestas, setComentariosMostrados,
        agregarComentario, responderComentario, darLike,
        obtenerAvatar, obtenerNombre, formatearFecha,
    } = useComentariosLeccion({ leccionId, usuarioActual, tipo })

    function renderComentario(comentario: Comentario, nivel: number = 0) {
        const respuestasDeEste = respuestasPorComentario[comentario.id] || []

        return (
            <li key={comentario.id} className={`comentario-item ${nivel > 0 ? 'respuesta-item' : ''}`}>
                <div className="comentario-header">
                    <Image src={obtenerAvatar(comentario)} alt="avatar" className="avatar" width={40} height={40} />
                    <span className="nombre">{obtenerNombre(comentario)}</span>
                    <span className="fecha">{formatearFecha(comentario.fecha_creacion)}</span>
                </div>
                <div className="comentario-contenido">{comentario.contenido}</div>
                <div className="comentario-acciones">
                    <button
                        className="like-btn"
                        onClick={() => darLike(comentario.id, comentario.likes)}
                        disabled={likeCargando[comentario.id]}
                        type="button"
                    >
                        ❤️ {comentario.likes > 0 && comentario.likes}
                    </button>
                    {usuarioActual && nivel < 3 && (
                        <button
                            className="responder-btn"
                            onClick={() => setMostrandoFormRespuesta({ ...mostrandoFormRespuesta, [comentario.id]: !mostrandoFormRespuesta[comentario.id] })}
                            type="button"
                        >
                            Responder
                        </button>
                    )}
                </div>

                {mostrandoFormRespuesta[comentario.id] && usuarioActual && (
                    <div className="respuesta-form">
                        <Image src={obtenerAvatar({ perfiles: usuarioActual } as any)} alt="avatar" className="avatar-small" width={32} height={32} />
                        <input
                            type="text"
                            placeholder="Escribe tu respuesta..."
                            value={respuestas[comentario.id] || ''}
                            onChange={(e) => setRespuestas({ ...respuestas, [comentario.id]: e.target.value })}
                            maxLength={500}
                        />
                        <button
                            onClick={() => responderComentario(comentario.id)}
                            disabled={cargando || !respuestas[comentario.id]?.trim()}
                            type="button"
                        >
                            Enviar
                        </button>
                    </div>
                )}

                {respuestasDeEste.length > 0 && (
                    <ul className="respuestas-lista">
                        {respuestasDeEste.map(respuesta => renderComentario(respuesta, nivel + 1))}
                    </ul>
                )}
            </li>
        )
    }

    return (
        <div className="comentarios-leccion-box">
            <div className="comentarios-header">
                <span className="comentarios-count">{comentariosPrincipales.length} comentarios</span>
            </div>

            <div className="comentarios-lista-box">
                {cargando && comentariosPrincipales.length === 0 ? (
                    <p className="comentarios-loading">Cargando comentarios...</p>
                ) : comentariosPrincipales.length === 0 ? (
                    <p className="comentarios-empty">No hay comentarios aún. ¡Sé el primero!</p>
                ) : (
                    <>
                        <ul className="comentarios-lista">
                            {comentariosPrincipales.slice(0, comentariosMostrados).map(c => renderComentario(c))}
                        </ul>
                        {comentariosPrincipales.length > comentariosMostrados && (
                            <button
                                className="comentarios-ver-mas"
                                onClick={() => setComentariosMostrados(comentariosMostrados + 5)}
                                type="button"
                            >
                                Ver más comentarios
                            </button>
                        )}
                    </>
                )}
            </div>

            {error && <p className="comentarios-error" style={{ margin: '0 1rem 0.5rem', fontSize: '0.85rem' }}>{error}</p>}

            {!usuarioActual && (
                <div className="comentario-login-aviso">
                    <span>¿Quieres comentar?</span>
                    <a href="/login" className="comentario-login-btn">Iniciar sesión</a>
                </div>
            )}

            {usuarioActual && (
                <form onSubmit={(e) => { e.preventDefault(); agregarComentario() }} className="comentario-form-bar">
                    <Image
                        src={obtenerAvatar({ perfiles: usuarioActual } as any)}
                        alt="avatar"
                        className="comentario-form-avatar"
                        width={40}
                        height={40}
                    />
                    <input
                        className="comentario-form-input"
                        type="text"
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        placeholder="Agregar comentario..."
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={cargando || !nuevoComentario.trim()}
                        className="comentario-form-btn"
                    >
                        Enviar
                    </button>
                </form>
            )}
        </div>
    )
}

export default ComentariosLeccion
