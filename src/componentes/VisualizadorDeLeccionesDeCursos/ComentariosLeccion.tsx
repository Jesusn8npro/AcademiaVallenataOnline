import React, { useState, useEffect } from 'react'
import './ComentariosLeccion.css'
import { supabase } from '../../lib/supabase/clienteSupabase'

interface ComentariosLeccionProps {
    leccionId: string
    usuarioActual?: any
    tipo?: 'leccion' | 'clase'
}

interface Comentario {
    id: string
    contenido: string
    fecha_creacion: string
    usuario_id: string
    respuesta_a: string | null
    likes: number
    perfiles: {
        nombre_usuario: string
        nombre_completo: string
        url_foto_perfil: string
    }
}

const ComentariosLeccion: React.FC<ComentariosLeccionProps> = ({
    leccionId,
    usuarioActual = null,
    tipo = 'clase'
}) => {
    const [comentarios, setComentarios] = useState<Comentario[]>([])
    const [nuevoComentario, setNuevoComentario] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [respuestas, setRespuestas] = useState<Record<string, string>>({})
    const [mostrandoFormRespuesta, setMostrandoFormRespuesta] = useState<Record<string, boolean>>({})
    const [likeCargando, setLikeCargando] = useState<Record<string, boolean>>({})
    const [comentariosMostrados, setComentariosMostrados] = useState(5)

    useEffect(() => {
        if (leccionId) {
            cargarComentarios()
        }
    }, [leccionId])

    async function cargarComentarios() {
        setCargando(true)
        setError('')

        const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones'
        const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id'

        const { data, error: err } = await supabase
            .from(tabla)
            .select(`
                id,
                contenido,
                fecha_creacion,
                usuario_id,
                respuesta_a,
                likes,
                perfiles:usuario_id (
                    nombre_usuario,
                    nombre_completo,
                    url_foto_perfil
                )
            `)
            .eq(campoId, leccionId)
            .order('fecha_creacion', { ascending: false })

        if (err) {
            setError(err.message || 'Error al cargar comentarios')
            setComentarios([])
        } else {
            setComentarios(data || [])
        }

        setCargando(false)
    }

    async function agregarComentario() {
        if (!nuevoComentario.trim()) return

        setCargando(true)
        setError('')

        if (!leccionId || typeof leccionId !== 'string' || leccionId.length < 10) {
            setError('ID de lección inválido.')
            setCargando(false)
            return
        }

        if (!usuarioActual || !usuarioActual.id || typeof usuarioActual.id !== 'string' || usuarioActual.id.length < 10) {
            setError('Usuario no válido. Debes iniciar sesión.')
            setCargando(false)
            return
        }

        const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones'
        const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id'

        const { error: err } = await supabase
            .from(tabla)
            .insert({
                [campoId]: leccionId,
                usuario_id: usuarioActual.id,
                contenido: nuevoComentario,
                respuesta_a: null
            })

        if (err) {
            setError(err.message || 'Error agregando comentario')
        } else {
            setNuevoComentario('')
            await cargarComentarios()
        }

        setCargando(false)
    }

    async function responderComentario(parentId: string) {
        const textoRespuesta = respuestas[parentId]?.trim()
        if (!textoRespuesta) return

        setMostrandoFormRespuesta({ ...mostrandoFormRespuesta, [parentId]: false })
        setCargando(true)
        setError('')

        const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones'
        const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id'

        const { error: err } = await supabase
            .from(tabla)
            .insert({
                [campoId]: leccionId,
                usuario_id: usuarioActual.id,
                contenido: textoRespuesta,
                respuesta_a: parentId
            })

        if (err) {
            setError(err.message || 'Error agregando respuesta')
        } else {
            setRespuestas({ ...respuestas, [parentId]: '' })
            await cargarComentarios()
        }

        setCargando(false)
    }

    async function darLike(comentarioId: string, likesActuales: number) {
        setLikeCargando({ ...likeCargando, [comentarioId]: true })

        const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones'

        const { error: err } = await supabase
            .from(tabla)
            .update({ likes: likesActuales + 1 })
            .eq('id', comentarioId)

        setLikeCargando({ ...likeCargando, [comentarioId]: false })

        if (err) {
            setError(err.message || 'Error al dar like')
        } else {
            await cargarComentarios()
        }
    }

    const comentariosPrincipales = comentarios.filter(c => !c.respuesta_a)
    const respuestasPorComentario: Record<string, Comentario[]> = {}

    comentarios.forEach(c => {
        if (c.respuesta_a) {
            if (!respuestasPorComentario[c.respuesta_a]) {
                respuestasPorComentario[c.respuesta_a] = []
            }
            respuestasPorComentario[c.respuesta_a].push(c)
        }
    })

    function obtenerAvatar(comentario: Comentario) {
        if (comentario.perfiles?.url_foto_perfil) {
            return comentario.perfiles.url_foto_perfil
        }
        const nombre = comentario.perfiles?.nombre_completo || comentario.perfiles?.nombre_usuario || 'Usuario'
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=667eea&color=fff`
    }

    function obtenerNombre(comentario: Comentario) {
        return comentario.perfiles?.nombre_completo || comentario.perfiles?.nombre_usuario || 'Usuario'
    }

    function formatearFecha(fecha: string) {
        const date = new Date(fecha)
        const ahora = new Date()
        const diff = ahora.getTime() - date.getTime()
        const minutos = Math.floor(diff / 60000)
        const horas = Math.floor(diff / 3600000)
        const dias = Math.floor(diff / 86400000)

        if (minutos < 1) return 'Ahora'
        if (minutos < 60) return `Hace ${minutos}m`
        if (horas < 24) return `Hace ${horas}h`
        if (dias < 7) return `Hace ${dias}d`
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

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
                <span className="comentarios-count">{comentarios.length} comentarios</span>
            </div>

            <div className="comentarios-lista-box">
                {cargando && comentarios.length === 0 ? (
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
