import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { NuevoObjetivo, ObjetivoAdmin } from '../../../../lib/services/servicioObjetivos';

interface Props {
    alCerrar: () => void;
    alGuardar: (objetivo: NuevoObjetivo | Partial<ObjetivoAdmin>) => Promise<void>;
    alEliminar?: (id: string) => Promise<void>;
    objetivoExistente?: ObjetivoAdmin | null;
}

const ModalObjetivo: React.FC<Props> = ({ alCerrar, alGuardar, alEliminar, objetivoExistente }) => {
    const [cargando, setCargando] = useState(false);
    const [datos, setDatos] = useState<NuevoObjetivo>({
        titulo: '',
        descripcion: '',
        categoria: 'General',
        estado: 'pendiente',
        prioridad: 'media',
        fecha_limite: null,
        creado_por: null
    });

    useEffect(() => {
        if (objetivoExistente) {
            setDatos({
                titulo: objetivoExistente.titulo,
                descripcion: objetivoExistente.descripcion || '',
                categoria: objetivoExistente.categoria,
                estado: objetivoExistente.estado,
                prioridad: objetivoExistente.prioridad,
                fecha_limite: objetivoExistente.fecha_limite,
                creado_por: objetivoExistente.creado_por
            });
        }
    }, [objetivoExistente]);

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!datos.titulo.trim()) return;

        setCargando(true);
        try {
            if (objetivoExistente) {
                await alGuardar({ ...datos, id: objetivoExistente.id });
            } else {
                await alGuardar(datos);
            }
            alCerrar();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el objetivo');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={alCerrar}>
            <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                <div className="columna-header" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                        {objetivoExistente ? 'Editar Objetivo' : 'Nuevo Objetivo'}
                    </h2>
                    <button onClick={alCerrar} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={manejarEnvio}>
                    <div className="form-grupo">
                        <label className="form-label">Título del Objetivo</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={datos.titulo}
                            onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
                            placeholder="Ej: Rediseñar simulador"
                        />
                    </div>

                    <div className="form-grupo">
                        <label className="form-label">Descripción Detallada</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            value={datos.descripcion || ''}
                            onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                            placeholder="Escribe aquí los detalles y pasos a seguir..."
                            style={{ resize: 'vertical', minHeight: '100px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-grupo">
                            <label className="form-label">Prioridad</label>
                            <select
                                className="form-select"
                                value={datos.prioridad}
                                onChange={(e) => setDatos({ ...datos, prioridad: e.target.value as any })}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="baja">🔵 Baja</option>
                                <option value="media">🟠 Media</option>
                                <option value="alta">🔴 Alta</option>
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label className="form-label">Categoría</label>
                            <input
                                type="text"
                                className="form-input"
                                value={datos.categoria}
                                onChange={(e) => setDatos({ ...datos, categoria: e.target.value })}
                                placeholder="Ej: Desarrollo"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-grupo">
                            <label className="form-label">Estado Actual</label>
                            <select
                                className="form-select"
                                value={datos.estado}
                                onChange={(e) => setDatos({ ...datos, estado: e.target.value as any })}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="pendiente">⏳ Pendiente</option>
                                <option value="en_progreso">🚀 En Progreso</option>
                                <option value="completado">✅ Completado</option>
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label className="form-label">Fecha Límite</label>
                            <input
                                type="date"
                                className="form-input"
                                value={datos.fecha_limite || ''}
                                onChange={(e) => setDatos({ ...datos, fecha_limite: e.target.value || null })}
                            />
                        </div>
                    </div>

                    <div className="form-acciones" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {objetivoExistente && alEliminar ? (
                            <button
                                type="button"
                                className="btn-secundario"
                                onClick={() => alEliminar(objetivoExistente.id)}
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            >
                                <Trash2 size={18} /> Eliminar
                            </button>
                        ) : <div />}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className="btn-secundario" onClick={alCerrar}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-crear" disabled={cargando}>
                                {cargando ? 'Guardando...' : <><Save size={18} /> {objetivoExistente ? 'Actualizar Cambios' : 'Guardar Objetivo'}</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalObjetivo;
