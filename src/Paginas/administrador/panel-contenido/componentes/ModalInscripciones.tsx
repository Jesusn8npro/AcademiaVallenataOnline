import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/clienteSupabase';
import './ModalInscripciones.css';

interface Usuario {
    id: string;
    nombre_completo: string;
    correo_electronico: string;
    url_foto_perfil?: string;
}

interface Inscripcion {
    id: string;
    usuario_id: string;
    perfiles: Usuario;
    fecha_inscripcion: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemTitulo: string;
    itemTipo: 'curso' | 'tutorial';
    onUpdate?: () => void;
}

const ModalInscripciones: React.FC<Props> = ({ isOpen, onClose, itemId, itemTitulo, itemTipo, onUpdate }) => {
    const [inscritos, setInscritos] = useState<Inscripcion[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(false);
    const [buscando, setBuscando] = useState(false);
    const [procesandoId, setProcesandoId] = useState<string | null>(null);
    const [errorInscripcion, setErrorInscripcion] = useState('');
    const [confirmandoQuitarId, setConfirmandoQuitarId] = useState<Inscripcion | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-inscripciones-open');
        } else {
            document.body.classList.remove('modal-inscripciones-open');
        }
        return () => {
            document.body.classList.remove('modal-inscripciones-open');
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && itemId) {
            cargarInscritos();
        }
    }, [isOpen, itemId]);

    const cargarInscritos = async () => {
        try {
            setCargando(true);
            const foreignKey = itemTipo === 'curso' ? 'curso_id' : 'tutorial_id';

            const { data, error } = await supabase
                .from('inscripciones')
                .select(`
                    id,
                    usuario_id,
                    fecha_inscripcion
                `)
                .eq(foreignKey, itemId)
                .order('fecha_inscripcion', { ascending: false });

            if (error) throw error;

            const usuarioIds = Array.from(new Set(((data || []) as any[]).map((i: any) => i.usuario_id).filter(Boolean)));
            let perfilesMap: Record<string, any> = {};
            if (usuarioIds.length > 0) {
                const { data: perfiles } = await supabase.rpc('admin_listar_perfiles_con_pii', { p_ids: usuarioIds });
                if (Array.isArray(perfiles)) {
                    perfilesMap = Object.fromEntries(perfiles.map((p: any) => [p.id, { id: p.id, nombre_completo: p.nombre_completo, correo_electronico: p.correo_electronico, url_foto_perfil: p.url_foto_perfil }]));
                }
            }

            const enriquecidos = ((data || []) as any[]).map((i: any) => ({ ...i, perfiles: perfilesMap[i.usuario_id] || null }));
            setInscritos(enriquecidos as any);
        } catch {
            // error no fatal
        } finally {
            setCargando(false);
        }
    };

    const buscarUsuarios = async (v: string) => {
        setBusqueda(v);
        if (v.length < 3) {
            setResultadosBusqueda([]);
            return;
        }

        try {
            setBuscando(true);
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre_completo, correo_electronico, url_foto_perfil')
                .or(`nombre_completo.ilike.%${v}%,correo_electronico.ilike.%${v}%`)
                .eq('eliminado', false)
                .limit(5);

            if (error) throw error;

            const inscritosIds = inscritos.map(i => i.usuario_id);
            const filtrados = (data || []).filter(u => !inscritosIds.includes(u.id));

            setResultadosBusqueda(filtrados);
        } catch {
            // error no fatal
        } finally {
            setBuscando(false);
        }
    };

    const inscribirUsuario = async (usuario: Usuario) => {
        try {
            setProcesandoId(usuario.id);
            const foreignKey = itemTipo === 'curso' ? 'curso_id' : 'tutorial_id';

            const { error } = await supabase
                .from('inscripciones')
                .insert({
                    usuario_id: usuario.id,
                    [foreignKey]: itemId,
                    fecha_inscripcion: new Date().toISOString(),
                    estado: 'activo',
                    porcentaje_completado: 0,
                    completado: false
                });

            if (error) throw error;

            setBusqueda('');
            setResultadosBusqueda([]);
            await cargarInscritos();
            if (onUpdate) onUpdate();
        } catch {
            setErrorInscripcion('No se pudo inscribir al usuario.');
        } finally {
            setProcesandoId(null);
        }
    };

    const eliminarInscripcion = (inscripcion: Inscripcion) => {
        setConfirmandoQuitarId(inscripcion);
    };

    const confirmarEliminarInscripcion = async () => {
        if (!confirmandoQuitarId) return;
        const inscripcion = confirmandoQuitarId;
        setConfirmandoQuitarId(null);
        try {
            setProcesandoId(inscripcion.id);
            const { error } = await supabase.from('inscripciones').delete().eq('id', inscripcion.id);
            if (error) throw error;
            await cargarInscritos();
            if (onUpdate) onUpdate();
        } catch {
            setErrorInscripcion('Error al eliminar la inscripción.');
        } finally {
            setProcesandoId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-inscripciones-overlay" onClick={onClose}>
            <div className="modal-inscripciones-content" onClick={e => e.stopPropagation()}>
                <header className="modal-inscripciones-header">
                    <div className="header-text">
                        <h2>Gestión de Estudiantes</h2>
                        <p>{itemTipo === 'curso' ? '📚' : '🎥'} {itemTitulo}</p>
                    </div>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </header>

                {errorInscripcion && (
                    <div style={{ background: '#fff5f5', color: '#c53030', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>{errorInscripcion}</div>
                )}
                {confirmandoQuitarId && (
                    <div style={{ background: '#fff5f5', border: '1px solid #fc8181', padding: '0.75rem 1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Quitar el acceso a {confirmandoQuitarId.perfiles.nombre_completo}?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={confirmarEliminarInscripcion} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Confirmar</button>
                            <button onClick={() => setConfirmandoQuitarId(null)} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                )}
                <div className="modal-inscripciones-body">
                    <div className="columna-inscritos">
                        <div className="columna-header">
                            <h3>Estudiantes Inscritos ({inscritos.length})</h3>
                        </div>
                        <div className="lista-scroll">
                            {cargando ? (
                                <div className="loading-state">Cargando estudiantes...</div>
                            ) : inscritos.length === 0 ? (
                                <div className="empty-state">No hay estudiantes inscritos todavía.</div>
                            ) : (
                                inscritos.map(inscripcion => (
                                    <div key={inscripcion.id} className="usuario-card">
                                        <div className="usuario-avatar">
                                            {inscripcion.perfiles.url_foto_perfil ? (
                                                <img src={inscripcion.perfiles.url_foto_perfil} alt="" />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {inscripcion.perfiles.nombre_completo.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="usuario-info">
                                            <span className="nombre">{inscripcion.perfiles.nombre_completo}</span>
                                            <span className="email">{inscripcion.perfiles.correo_electronico}</span>
                                        </div>
                                        <button
                                            className="btn-remove"
                                            onClick={() => eliminarInscripcion(inscripcion)}
                                            disabled={procesandoId === inscripcion.id}
                                        >
                                            {procesandoId === inscripcion.id ? '...' : 'Borrar'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Buscador para agregar */}
                    <div className="columna-agregar">
                        <div className="columna-header">
                            <h3>Inscribir Nuevo Estudiante</h3>
                        </div>
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                value={busqueda}
                                onChange={e => buscarUsuarios(e.target.value)}
                            />
                            {buscando && <div className="search-spinner"></div>}
                        </div>

                        <div className="resultados-busqueda">
                            {busqueda.length > 0 && busqueda.length < 3 && (
                                <p className="hint">Escribe al menos 3 caracteres...</p>
                            )}
                            {resultadosBusqueda.length > 0 ? (
                                resultadosBusqueda.map(usuario => (
                                    <div key={usuario.id} className="usuario-resultado">
                                        <div className="usuario-avatar mini">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt="" />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {usuario.nombre_completo.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="usuario-info">
                                            <span className="nombre">{usuario.nombre_completo}</span>
                                            <span className="email">{usuario.correo_electronico}</span>
                                        </div>
                                        <button
                                            className="btn-add"
                                            onClick={() => inscribirUsuario(usuario)}
                                            disabled={procesandoId === usuario.id}
                                        >
                                            {procesandoId === usuario.id ? '...' : '+ Inscribir'}
                                        </button>
                                    </div>
                                ))
                            ) : busqueda.length >= 3 && !buscando && (
                                <p className="no-results">No se encontraron usuarios disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="modal-inscripciones-footer">
                    <button className="btn-finalizar" onClick={onClose}>Finalizar Gestión</button>
                </footer>
            </div>
        </div>
    );
};

export default ModalInscripciones;
