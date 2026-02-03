import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
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
                    fecha_inscripcion,
                    perfiles:usuario_id (
                        id,
                        nombre_completo,
                        correo_electronico,
                        url_foto_perfil
                    )
                `)
                .eq(foreignKey, itemId)
                .order('fecha_inscripcion', { ascending: false });

            if (error) throw error;
            setInscritos(data as any || []);
        } catch (error) {
            console.error('Error al cargar inscritos:', error);
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

            // Filtrar los que ya están inscritos
            const inscritosIds = inscritos.map(i => i.usuario_id);
            const filtrados = (data || []).filter(u => !inscritosIds.includes(u.id));

            setResultadosBusqueda(filtrados);
        } catch (error) {
            console.error('Error buscando usuarios:', error);
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
        } catch (error) {
            console.error('Error al inscribir:', error);
            alert('No se pudo inscribir al usuario');
        } finally {
            setProcesandoId(null);
        }
    };

    const eliminarInscripcion = async (inscripcion: Inscripcion) => {
        if (!window.confirm(`¿Quitar el acceso a ${inscripcion.perfiles.nombre_completo}?`)) return;

        try {
            setProcesandoId(inscripcion.id);
            const { error } = await supabase
                .from('inscripciones')
                .delete()
                .eq('id', inscripcion.id);

            if (error) throw error;

            await cargarInscritos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error al eliminar:', error);
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

                <div className="modal-inscripciones-body">
                    {/* Columna Izquierda: Lista de Inscritos */}
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
