import React from 'react'
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
                    <img src={obtenerAvatar(comentario)} alt="avatar" className="avatar" />
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
                        <img src={obtenerAvatar({ perfiles: usuarioActual } as any)} alt="avatar" className="avatar-small" />
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
                ) : error ? (
                    <p className="comentarios-error">{error}</p>
                ) : comentariosPrincipales.length === 0 ? (
                    <p className="comentarios-empty">No hay comentarios aún.</p>
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

            {usuarioActual && (
                <form onSubmit={(e) => { e.preventDefault(); agregarComentario() }} className="comentario-form-bar">
                    <img
                        src={obtenerAvatar({ perfiles: usuarioActual } as any)}
                        alt="avatar"
                        className="comentario-form-avatar"
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
