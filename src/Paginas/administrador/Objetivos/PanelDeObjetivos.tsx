import React, { useState, useEffect } from 'react';
import { Plus, Layout, Loader2, Calendar, CheckCircle2, ListTodo, PlayCircle } from 'lucide-react';
import { servicioObjetivos } from '../../../lib/services/servicioObjetivos';
import type { ObjetivoAdmin, NuevoObjetivo } from '../../../lib/services/servicioObjetivos';
import { useUsuario } from '../../../contextos/UsuarioContext';
import TarjetaObjetivo from './Componentes/TarjetaObjetivo';
import ModalObjetivo from './Componentes/ModalObjetivo';
import './PanelDeObjetivos.css';

const PanelDeObjetivos: React.FC = () => {
    const { usuario } = useUsuario();
    const [objetivos, setObjetivos] = useState<ObjetivoAdmin[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [objetivoEnEdicion, setObjetivoEnEdicion] = useState<ObjetivoAdmin | null>(null);

    useEffect(() => {
        cargarObjetivos();
    }, []);

    const cargarObjetivos = async () => {
        try {
            setCargando(true);
            const data = await servicioObjetivos.obtenerObjetivos();
            setObjetivos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    const manejarGuardar = async (datos: NuevoObjetivo | Partial<ObjetivoAdmin>) => {
        try {
            if ('id' in datos && datos.id) {
                const id = datos.id;
                const cuerpo = { ...datos };
                delete (cuerpo as any).id;
                const actualizado = await servicioObjetivos.actualizarObjetivo(id, cuerpo);
                setObjetivos(objetivos.map(o => o.id === id ? actualizado : o));
            } else {
                const objetivoConUsuario = { ...(datos as NuevoObjetivo), creado_por: usuario?.id || null };
                const guardado = await servicioObjetivos.crearObjetivo(objetivoConUsuario);
                setObjetivos([guardado, ...objetivos]);
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
        cerrarModal();
    };

    const eliminarObjetivo = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este objetivo definitivamente?')) return;
        try {
            await servicioObjetivos.eliminarObjetivo(id);
            setObjetivos(objetivos.filter(o => o.id !== id));
            cerrarModal();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const cambiarEstado = async (id: string, nuevoEstado: ObjetivoAdmin['estado']) => {
        const anteriores = [...objetivos];
        setObjetivos(objetivos.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));

        try {
            await servicioObjetivos.actualizarObjetivo(id, { estado: nuevoEstado });
        } catch (error) {
            setObjetivos(anteriores);
            alert('Error al mover el objetivo');
        }
    };

    const manejarDrop = (e: React.DragEvent, nuevoEstado: ObjetivoAdmin['estado']) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('objetivoId');
        if (id) {
            cambiarEstado(id, nuevoEstado);
        }
    };

    const permitirDrop = (e: React.DragEvent) => e.preventDefault();

    const abrirModalParaCrear = () => {
        setObjetivoEnEdicion(null);
        setMostrarModal(true);
    };

    const abrirModalParaEditar = (objetivo: ObjetivoAdmin) => {
        setObjetivoEnEdicion(objetivo);
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setObjetivoEnEdicion(null);
    };

    const columnas: { id: ObjetivoAdmin['estado']; titulo: string; color: string; icono: any }[] = [
        { id: 'pendiente', titulo: 'Por Hacer', color: '#f59e0b', icono: ListTodo },
        { id: 'en_progreso', titulo: 'En Progreso', color: '#3b82f6', icono: PlayCircle },
        { id: 'completado', titulo: 'Finalizado', color: '#10b981', icono: CheckCircle2 }
    ];

    return (
        <div className="trello-contenedor">
            <header className="trello-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px' }}>
                        <Layout className="text-blue-500" size={32} />
                    </div>
                    <div>
                        <h1 className="trello-titulo">Objetivos de la Academia</h1>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                            Gestiona y organiza el crecimiento de la plataforma.
                        </p>
                    </div>
                </div>
                <button className="btn-crear" onClick={abrirModalParaCrear}>
                    <Plus size={20} /> Nuevo Objetivo
                </button>
            </header>

            {cargando ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Loader2 className="animate-spin text-blue-500" size={56} style={{ margin: '0 auto 20px' }} />
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 500 }}>Estamos preparando tu tablero...</p>
                    </div>
                </div>
            ) : (
                <div className="trello-tablero">
                    {columnas.map(col => (
                        <div
                            key={col.id}
                            className="trello-columna"
                            onDragOver={permitirDrop}
                            onDrop={(e) => manejarDrop(e, col.id)}
                        >
                            <div className="columna-header" style={{ borderBottom: `2px solid ${col.color}40`, paddingBottom: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <col.icono size={20} style={{ color: col.color }} />
                                    <span className="columna-titulo" style={{ color: '#f8fafc' }}>{col.titulo}</span>
                                </div>
                                <span className="conteo-badge" style={{ background: col.color + '20', color: col.color, border: `1px solid ${col.color}40` }}>
                                    {objetivos.filter(o => o.estado === col.id).length}
                                </span>
                            </div>

                            <div className="lista-tarjetas">
                                {objetivos
                                    .filter(o => o.estado === col.id)
                                    .map(obj => (
                                        <TarjetaObjetivo
                                            key={obj.id}
                                            objetivo={obj}
                                            alHacerClic={abrirModalParaEditar}
                                        />
                                    ))}
                                {objetivos.filter(o => o.estado === col.id).length === 0 && (
                                    <div style={{
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        border: '2px dashed rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        color: '#475569',
                                        fontSize: '0.9rem',
                                        background: 'rgba(255,255,255,0.02)'
                                    }}>
                                        <Plus size={24} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                        No hay tareas pendientes
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mostrarModal && (
                <ModalObjetivo
                    alCerrar={cerrarModal}
                    alGuardar={manejarGuardar}
                    alEliminar={eliminarObjetivo}
                    objetivoExistente={objetivoEnEdicion}
                />
            )}
        </div>
    );
};

export default PanelDeObjetivos;
