import React, { useState, useEffect } from 'react'
import './NotasLeccion.css'
import { supabase } from '../../lib/supabase/clienteSupabase'

interface NotasLeccionProps {
    leccionId: string
    usuarioActual?: any
    tipo?: 'leccion' | 'clase'
}

interface Nota {
    id: string
    contenido: string
    fecha_creacion: string
    fecha_actualizacion: string
    usuario_id: string
    leccion_id: string
    tipo: string
}

const NotasLeccion: React.FC<NotasLeccionProps> = ({
    leccionId,
    usuarioActual = null,
    tipo = 'clase'
}) => {
    const [nuevaNota, setNuevaNota] = useState('')
    const [notas, setNotas] = useState<Nota[]>([])
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [editandoId, setEditandoId] = useState<string | null>(null)
    const [editandoContenido, setEditandoContenido] = useState('')
    const [editandoGuardando, setEditandoGuardando] = useState(false)
    const [eliminandoId, setEliminandoId] = useState<string | null>(null)

    useEffect(() => {
        if (leccionId && usuarioActual?.id) {
            cargarNotas()
        } else {
            setCargando(false)
        }
    }, [leccionId, usuarioActual])

    async function cargarNotas() {
        setCargando(true)
        setError(null)
        setMensaje(null)

        try {
            if (!usuarioActual?.id) {
                setNotas([])
                setCargando(false)
                return
            }

            const { data, error: err } = await supabase
                .from('notas_lecciones')
                .select('*')
                .eq('usuario_id', usuarioActual.id)
                .eq('leccion_id', leccionId)
                .eq('tipo', tipo)
                .order('fecha_creacion', { ascending: false })

            if (err) throw err

            setNotas(data || [])
        } catch (e: any) {
            setError('No se pudieron cargar tus notas. Intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    async function guardarNota() {
        setGuardando(true)
        setError(null)
        setMensaje(null)

        try {
            if (!usuarioActual?.id) throw new Error('Debes iniciar sesión para guardar notas.')
            if (!nuevaNota.trim()) throw new Error('La nota no puede estar vacía.')

            const { error: err } = await supabase
                .from('notas_lecciones')
                .insert({
                    usuario_id: usuarioActual.id,
                    leccion_id: leccionId,
                    tipo,
                    contenido: nuevaNota,
                    fecha_creacion: new Date().toISOString(),
                    fecha_actualizacion: new Date().toISOString()
                })

            if (err) throw err

            setMensaje('¡Nota agregada!')
            setNuevaNota('')
            await cargarNotas()
        } catch (e: any) {
            setError(e.message || 'No se pudo guardar la nota.')
        } finally {
            setGuardando(false)
            setTimeout(() => setMensaje(null), 2000)
        }
    }

    async function guardarEdicionNota() {
        if (!editandoId) return

        setEditandoGuardando(true)
        setError(null)
        setMensaje(null)

        try {
            if (!usuarioActual?.id) throw new Error('Debes iniciar sesión para editar notas.')
            if (!editandoContenido.trim()) throw new Error('La nota no puede estar vacía.')

            const { error: err } = await supabase
                .from('notas_lecciones')
                .update({
                    contenido: editandoContenido,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', editandoId)

            if (err) throw err

            setMensaje('¡Nota actualizada!')
            setEditandoId(null)
            setEditandoContenido('')
            await cargarNotas()
        } catch (e: any) {
            setError(e.message || 'No se pudo editar la nota.')
        } finally {
            setEditandoGuardando(false)
            setTimeout(() => setMensaje(null), 2000)
        }
    }

    async function eliminarNota(id: string) {
        setEliminandoId(id)
        setError(null)
        setMensaje(null)

        try {
            const { error: err } = await supabase
                .from('notas_lecciones')
                .delete()
                .eq('id', id)

            if (err) throw err

            setMensaje('¡Nota eliminada!')
            await cargarNotas()
        } catch (e: any) {
            setError(e.message || 'No se pudo eliminar la nota.')
        } finally {
            setEliminandoId(null)
            setTimeout(() => setMensaje(null), 2000)
        }
    }

    return (
        <div className="notas-leccion-container">
            <h2>Mis notas personales</h2>

            {cargando ? (
                <div className="notas-cargando">Cargando...</div>
            ) : (
                <div className="notas-grid">
                    <div className="notas-edicion">
                        <textarea
                            className="notas-textarea"
                            placeholder="Escribe una nueva nota para esta lección o clase..."
                            value={nuevaNota}
                            onChange={(e) => setNuevaNota(e.target.value)}
                            rows={4}
                            disabled={guardando}
                        />
                        <button
                            className="notas-btn"
                            onClick={guardarNota}
                            disabled={guardando}
                            type="button"
                        >
                            {guardando ? 'Guardando...' : 'Agregar nota'}
                        </button>

                        {mensaje && (
                            <div className="notas-mensaje exito">{mensaje}</div>
                        )}
                        {error && (
                            <div className="notas-mensaje error">{error}</div>
                        )}
                    </div>

                    <div className="notas-preview">
                        <div className="notas-preview-title">Notas guardadas</div>

                        {notas.length === 0 ? (
                            <div className="notas-preview-content">
                                No tienes notas guardadas para esta lección.
                            </div>
                        ) : (
                            <ul className="notas-lista">
                                {notas.map((nota) => (
                                    <li key={nota.id} className="nota-item">
                                        {editandoId === nota.id ? (
                                            <>
                                                <textarea
                                                    className="notas-textarea-edit"
                                                    value={editandoContenido}
                                                    onChange={(e) => setEditandoContenido(e.target.value)}
                                                    rows={3}
                                                    disabled={editandoGuardando}
                                                />
                                                <div className="notas-acciones">
                                                    <button
                                                        className="notas-btn-accion"
                                                        onClick={guardarEdicionNota}
                                                        disabled={editandoGuardando}
                                                        type="button"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        className="notas-btn-accion notas-btn-cancelar"
                                                        onClick={() => {
                                                            setEditandoId(null)
                                                            setEditandoContenido('')
                                                        }}
                                                        disabled={editandoGuardando}
                                                        type="button"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="nota-contenido">{nota.contenido}</div>
                                                <div className="nota-fecha">
                                                    {new Date(nota.fecha_actualizacion).toLocaleString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="notas-acciones">
                                                    <button
                                                        className="notas-btn-accion"
                                                        onClick={() => {
                                                            setEditandoId(nota.id)
                                                            setEditandoContenido(nota.contenido)
                                                        }}
                                                        type="button"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="notas-btn-accion notas-btn-eliminar"
                                                        onClick={() => eliminarNota(nota.id)}
                                                        disabled={eliminandoId === nota.id}
                                                        type="button"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotasLeccion
