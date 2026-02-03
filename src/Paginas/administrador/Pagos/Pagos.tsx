import React, { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/supabaseCliente';
import './Pagos.css';

interface Pago {
    id: string;
    ref_payco: string;
    usuario_id: string;
    curso_id?: string;
    tutorial_id?: string;
    nombre_producto: string;
    valor: number;
    estado: string;
    metodo_pago?: string;
    created_at: string;
    perfiles?: {
        nombre: string;
        apellido: string;
        correo_electronico: string;
    };
    cursos?: {
        titulo: string;
    };
    tutoriales?: {
        titulo: string;
    };
}

const Pagos: React.FC = () => {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [buscarRef, setBuscarRef] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [vistaActual, setVistaActual] = useState<'tabla' | 'cards'>('tabla');
    const [confirmando, setConfirmando] = useState<Record<string, boolean>>({});
    const [mensajesConfirmacion, setMensajesConfirmacion] = useState<Record<string, string>>({});

    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        aceptada: 0,
        pendiente: 0,
        rechazada: 0,
        fallida: 0,
        valorTotal: 0
    });

    useEffect(() => {
        if (window.innerWidth < 768) {
            setVistaActual('cards');
        }

        const handleResize = () => {
            if (window.innerWidth < 768 && vistaActual === 'tabla') {
                setVistaActual('cards');
            }
        };

        window.addEventListener('resize', handleResize);
        cargarPagos();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const cargarPagos = async () => {
        setCargando(true);
        try {
            const { data: todosPagos, error } = await supabase
                .from('pagos_epayco')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            let pagosFiltrados = todosPagos || [];

            if (filtroEstado !== 'todos') {
                pagosFiltrados = pagosFiltrados.filter((pago: Pago) => pago.estado === filtroEstado);
            }

            if (buscarRef.trim()) {
                const busqueda = buscarRef.trim().toLowerCase();
                pagosFiltrados = pagosFiltrados.filter((pago: Pago) =>
                    pago.ref_payco?.toLowerCase().includes(busqueda)
                );
            }

            // Enriquecer con datos relacionados
            const pagosEnriquecidos = [];
            for (const pago of pagosFiltrados) {
                const pagoEnriquecido = { ...pago };

                if (pago.usuario_id) {
                    try {
                        const { data: usuario } = await supabase
                            .from('perfiles')
                            .select('nombre, apellido, correo_electronico')
                            .eq('id', pago.usuario_id)
                            .single();
                        if (usuario) pagoEnriquecido.perfiles = usuario;
                    } catch (error) {
                        console.log('Error obteniendo usuario:', error);
                    }
                }

                if (pago.curso_id) {
                    try {
                        const { data: curso } = await supabase
                            .from('cursos')
                            .select('titulo')
                            .eq('id', pago.curso_id)
                            .single();
                        if (curso) pagoEnriquecido.cursos = curso;
                    } catch (error) {
                        console.log('Error obteniendo curso:', error);
                    }
                }

                if (pago.tutorial_id) {
                    try {
                        const { data: tutorial } = await supabase
                            .from('tutoriales')
                            .select('titulo')
                            .eq('id', pago.tutorial_id)
                            .single();
                        if (tutorial) pagoEnriquecido.tutoriales = tutorial;
                    } catch (error) {
                        console.log('Error obteniendo tutorial:', error);
                    }
                }

                pagosEnriquecidos.push(pagoEnriquecido);
            }

            setPagos(pagosEnriquecidos);
            calcularEstadisticas(pagosEnriquecidos);

        } catch (error) {
            console.error('Error cargando pagos:', error);
            setPagos([]);
        } finally {
            setCargando(false);
        }
    };

    const calcularEstadisticas = (pagosData: Pago[]) => {
        setEstadisticas({
            total: pagosData.length,
            aceptada: pagosData.filter(p => p.estado === 'aceptada').length,
            pendiente: pagosData.filter(p => p.estado === 'pendiente').length,
            rechazada: pagosData.filter(p => p.estado === 'rechazada').length,
            fallida: pagosData.filter(p => p.estado === 'fallida').length,
            valorTotal: pagosData.reduce((sum, p) => sum + (parseFloat(p.valor.toString()) || 0), 0)
        });
    };

    const confirmarPagoManualmente = async (refPayco: string) => {
        setConfirmando(prev => ({ ...prev, [refPayco]: true }));
        setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: 'Confirmando...' }));

        try {
            const response = await fetch('/api/pagos/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ref_payco: refPayco,
                    forzar_confirmacion: true
                })
            });

            const resultado = await response.json();

            if (resultado.success) {
                setMensajesConfirmacion(prev => ({
                    ...prev,
                    [refPayco]: resultado.estado_nuevo === 'aceptada'
                        ? '✅ Pago confirmado e inscripción procesada'
                        : `✅ Estado: ${resultado.estado_nuevo}`
                }));
                await cargarPagos();
            } else {
                setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: `❌ Error: ${resultado.error}` }));
            }
        } catch (error) {
            setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: '❌ Error de conexión' }));
        } finally {
            setConfirmando(prev => ({ ...prev, [refPayco]: false }));
            setTimeout(() => {
                setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: '' }));
            }, 5000);
        }
    };

    const cambiarEstadoPago = async (refPayco: string, nuevoEstado: string) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) return;

        try {
            const { error } = await supabase
                .from('pagos_epayco')
                .update({
                    estado: nuevoEstado,
                    updated_at: new Date().toISOString()
                })
                .eq('ref_payco', refPayco);

            if (error) throw error;

            if (nuevoEstado === 'aceptada') {
                await inscribirUsuarioManual(refPayco);
            }

            await cargarPagos();
            alert(`Estado cambiado a "${nuevoEstado}" exitosamente`);

        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error al cambiar el estado');
        }
    };

    const inscribirUsuarioManual = async (refPayco: string) => {
        try {
            const { data: pago } = await supabase
                .from('pagos_epayco')
                .select('*')
                .eq('ref_payco', refPayco)
                .single();

            if (!pago) return;

            if (pago.curso_id) {
                await supabase
                    .from('inscripciones')
                    .upsert({
                        usuario_id: pago.usuario_id,
                        curso_id: pago.curso_id,
                        fecha_inscripcion: new Date().toISOString(),
                        completado: false,
                        progreso: 0,
                        tipo_acceso: 'pagado',
                        pago_id: pago.id
                    }, { onConflict: 'usuario_id,curso_id' });
            }

            if (pago.tutorial_id) {
                await supabase
                    .from('progreso_tutorial')
                    .upsert({
                        usuario_id: pago.usuario_id,
                        tutorial_id: pago.tutorial_id,
                        completado: false,
                        ultimo_acceso: new Date().toISOString(),
                        tiempo_visto: 0,
                        fecha_inicio: new Date().toISOString()
                    }, { onConflict: 'usuario_id,tutorial_id' });
            }
        } catch (error) {
            console.error('Error inscribiendo usuario:', error);
        }
    };

    const resetearFiltros = () => {
        setFiltroEstado('todos');
        setBuscarRef('');
        cargarPagos();
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearValor = (valor: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    };

    const obtenerClaseBadgeEstado = (estado: string) => {
        const clases = {
            'aceptada': 'academia-badge-aceptada',
            'rechazada': 'academia-badge-rechazada',
            'pendiente': 'academia-badge-pendiente',
            'fallida': 'academia-badge-fallida',
            'cancelada': 'academia-badge-cancelada'
        };
        return `academia-badge ${clases[estado as keyof typeof clases] || 'academia-badge-cancelada'}`;
    };

    const obtenerIconoEstado = (estado: string) => {
        const iconos = {
            'aceptada': '✅',
            'rechazada': '❌',
            'pendiente': '⏳',
            'fallida': '💥',
            'cancelada': '🚫'
        };
        return iconos[estado as keyof typeof iconos] || '❓';
    };

    const truncarReferencia = (ref: string) => {
        if (!ref) return '';
        return ref.length > 20 ? `${ref.substring(0, 10)}...${ref.substring(ref.length - 6)}` : ref;
    };

    return (
        <div className="academia-pagos-container">
            {/* Header Principal */}
            <div className="academia-pagos-header-bg">
                <div className="academia-pagos-header-content">
                    <div className="academia-pagos-header-flex">
                        <div className="academia-pagos-titulo-container">
                            <h1 className="academia-pagos-titulo">
                                <div className="academia-pagos-icono-titulo">
                                    <span className="academia-pagos-icono-emoji">💳</span>
                                </div>
                                <span>Administración de Pagos</span>
                            </h1>
                            <p className="academia-pagos-subtitulo">Gestiona y monitorea todas las transacciones de ePayco</p>
                        </div>

                        {/* Controles de Vista */}
                        <div className="academia-pagos-controles">
                            <div className="academia-pagos-switch-vista">
                                <button
                                    onClick={() => setVistaActual('tabla')}
                                    className={`academia-pagos-btn-vista ${vistaActual === 'tabla' ? 'activo' : 'inactivo'}`}
                                >
                                    📊 Tabla
                                </button>
                                <button
                                    onClick={() => setVistaActual('cards')}
                                    className={`academia-pagos-btn-vista ${vistaActual === 'cards' ? 'activo' : 'inactivo'}`}
                                >
                                    🃏 Cards
                                </button>
                            </div>

                            <button
                                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                                className="academia-pagos-btn-filtros"
                            >
                                <span>🔍</span>
                                <span className="academia-pagos-texto-filtros">Filtros</span>
                                <span className={`academia-pagos-flecha ${mostrarFiltros ? 'rotar' : ''}`}>▼</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="academia-pagos-contenido">
                {/* Estadísticas */}
                <div className="academia-pagos-grid-stats">
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div>
                                <p className="academia-pagos-stat-label">Total Pagos</p>
                                <p className="academia-pagos-stat-valor">{estadisticas.total}</p>
                            </div>
                            <div className="academia-pagos-stat-icono-container academia-bg-blue">
                                <span>📊</span>
                            </div>
                        </div>
                    </div>

                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div>
                                <p className="academia-pagos-stat-label">Aceptados</p>
                                <p className="academia-pagos-stat-valor academia-stat-aceptada">{estadisticas.aceptada}</p>
                            </div>
                            <div className="academia-pagos-stat-icono-container academia-bg-emerald">
                                <span>✅</span>
                            </div>
                        </div>
                    </div>

                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div>
                                <p className="academia-pagos-stat-label">Pendientes</p>
                                <p className="academia-pagos-stat-valor academia-stat-pendiente">{estadisticas.pendiente}</p>
                            </div>
                            <div className="academia-pagos-stat-icono-container academia-bg-amber">
                                <span>⏳</span>
                            </div>
                        </div>
                    </div>

                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div>
                                <p className="academia-pagos-stat-label">Rechazados</p>
                                <p className="academia-pagos-stat-valor academia-stat-rechazada">{estadisticas.rechazada}</p>
                            </div>
                            <div className="academia-pagos-stat-icono-container academia-bg-red">
                                <span>❌</span>
                            </div>
                        </div>
                    </div>

                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div>
                                <p className="academia-pagos-stat-label">Valor Total</p>
                                <p className="academia-pagos-stat-valor">{formatearValor(estadisticas.valorTotal)}</p>
                            </div>
                            <div className="academia-pagos-stat-icono-container academia-bg-green">
                                <span>💰</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel de Filtros */}
                {mostrarFiltros && (
                    <div className="academia-pagos-panel-filtros">
                        <div className="academia-pagos-grid-filtros">
                            <div>
                                <label className="academia-pagos-label-filtro">Estado</label>
                                <select
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                    className="academia-pagos-select"
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="aceptada">Aceptada</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="rechazada">Rechazada</option>
                                    <option value="fallida">Fallida</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>

                            <div>
                                <label className="academia-pagos-label-filtro">Buscar Referencia</label>
                                <input
                                    type="text"
                                    value={buscarRef}
                                    onChange={(e) => setBuscarRef(e.target.value)}
                                    placeholder="Ingresa referencia..."
                                    className="academia-pagos-input"
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    onClick={cargarPagos}
                                    className="academia-pagos-btn-accion academia-btn-azul"
                                >
                                    🔍 Aplicar Filtros
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    onClick={resetearFiltros}
                                    className="academia-pagos-btn-accion academia-btn-gris"
                                >
                                    🔄 Resetear
                                </button>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={cargarPagos}
                                className="academia-pagos-btn-accion academia-btn-esmeralda"
                                style={{ width: 'auto' }}
                            >
                                <span>📋</span> Ver Todos
                            </button>
                        </div>
                    </div>
                )}

                {/* Contenido Principal */}
                {cargando ? (
                    <div className="academia-pagos-mensaje-estado">
                        <div className="academia-spinner"></div>
                        <p style={{ color: '#4b5563', fontSize: '1.rem' }}>Cargando pagos...</p>
                    </div>
                ) : pagos.length === 0 ? (
                    <div className="academia-pagos-mensaje-estado">
                        <div className="academia-pagos-emoji-vacio">😕</div>
                        <h3 className="academia-pagos-titulo-vacio">No se encontraron pagos</h3>
                        <p className="academia-pagos-texto-vacio">Esto puede deberse a filtros muy restrictivos o problemas de conexión</p>
                        <button
                            onClick={cargarPagos}
                            className="academia-pagos-btn-accion academia-btn-azul"
                            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                        >
                            🔄 Intentar Recargar
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Vista de Tabla */}
                        {vistaActual === 'tabla' && (
                            <>
                                {/* Mensaje para móviles */}
                                <div className="academia-pagos-tabla-movil-aviso">
                                    <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>📱</div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>Vista optimizada para móvil</h3>
                                    <p style={{ color: '#1d4ed8', marginBottom: '1rem' }}>La vista de tabla está optimizada para pantallas más grandes. En móviles recomendamos usar la vista de tarjetas para una mejor experiencia.</p>
                                    <button
                                        onClick={() => setVistaActual('cards')}
                                        className="academia-pagos-btn-accion academia-btn-azul"
                                        style={{ width: 'auto' }}
                                    >
                                        🃏 Cambiar a Cards
                                    </button>
                                </div>

                                {/* Tabla para desktop */}
                                <div className="academia-pagos-tabla-container">
                                    <div className="academia-pagos-table-wrapper">
                                        <table className="academia-pagos-table">
                                            <thead>
                                                <tr>
                                                    <th className="academia-pagos-th">Referencia</th>
                                                    <th className="academia-pagos-th">Usuario</th>
                                                    <th className="academia-pagos-th">Producto</th>
                                                    <th className="academia-pagos-th">Valor</th>
                                                    <th className="academia-pagos-th">Estado</th>
                                                    <th className="academia-pagos-th">Fecha</th>
                                                    <th className="academia-pagos-th">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagos.map((pago) => (
                                                    <tr key={pago.id} className="academia-pagos-tr">
                                                        <td className="academia-pagos-td">
                                                            <div className="academia-pagos-ref">{truncarReferencia(pago.ref_payco)}</div>
                                                            {pago.metodo_pago && (
                                                                <div className="academia-pagos-metodo">{pago.metodo_pago}</div>
                                                            )}
                                                        </td>
                                                        <td className="academia-pagos-td">
                                                            <div className="academia-pagos-usuario-flex">
                                                                <div className="academia-pagos-avatar">
                                                                    {pago.perfiles?.nombre?.charAt(0) || '?'}
                                                                </div>
                                                                <div className="academia-pagos-usuario-info">
                                                                    <div className="academia-pagos-nombre">
                                                                        {pago.perfiles?.nombre || 'Sin nombre'} {pago.perfiles?.apellido || ''}
                                                                    </div>
                                                                    <div className="academia-pagos-email">{pago.perfiles?.correo_electronico || 'Sin email'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="academia-pagos-td">
                                                            <div className="academia-pagos-producto">{pago.nombre_producto}</div>
                                                            {pago.cursos?.titulo && (
                                                                <div className="academia-pagos-subproducto academia-text-blue">📚 {pago.cursos.titulo}</div>
                                                            )}
                                                            {pago.tutoriales?.titulo && (
                                                                <div className="academia-pagos-subproducto academia-text-green">🎥 {pago.tutoriales.titulo}</div>
                                                            )}
                                                        </td>
                                                        <td className="academia-pagos-td">
                                                            <div className="academia-pagos-valor">{formatearValor(pago.valor)}</div>
                                                        </td>
                                                        <td className="academia-pagos-td">
                                                            <span className={obtenerClaseBadgeEstado(pago.estado)}>
                                                                {obtenerIconoEstado(pago.estado)} <span style={{ marginLeft: '0.25rem' }}>{pago.estado}</span>
                                                            </span>
                                                        </td>
                                                        <td className="academia-pagos-td" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                            {formatearFecha(pago.created_at)}
                                                        </td>
                                                        <td className="academia-pagos-td">
                                                            <div className="academia-pagos-acciones-flex">
                                                                <div className="academia-pagos-btn-row">
                                                                    <button
                                                                        onClick={() => cambiarEstadoPago(pago.ref_payco, 'aceptada')}
                                                                        className="academia-btn-mini academia-btn-mini-emerald"
                                                                        title="Aceptar pago"
                                                                    >
                                                                        ✅
                                                                    </button>
                                                                    <button
                                                                        onClick={() => cambiarEstadoPago(pago.ref_payco, 'rechazada')}
                                                                        className="academia-btn-mini academia-btn-mini-red"
                                                                        title="Rechazar pago"
                                                                    >
                                                                        ❌
                                                                    </button>
                                                                    <button
                                                                        onClick={() => cambiarEstadoPago(pago.ref_payco, 'pendiente')}
                                                                        className="academia-btn-mini academia-btn-mini-amber"
                                                                        title="Marcar pendiente"
                                                                    >
                                                                        ⏳
                                                                    </button>
                                                                </div>
                                                                <div>
                                                                    <button
                                                                        className="academia-btn-confirmar"
                                                                        onClick={() => confirmarPagoManualmente(pago.ref_payco)}
                                                                        disabled={confirmando[pago.ref_payco] || pago.estado === 'aceptada'}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                                                                        {confirmando[pago.ref_payco] ? '...' : (pago.estado === 'aceptada' ? 'Confirmado' : 'Confirmar')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {mensajesConfirmacion[pago.ref_payco] && (
                                                                <div className={`academia-mensaje-confirmacion ${mensajesConfirmacion[pago.ref_payco].includes('✅') ? 'academia-msg-exito' : 'academia-msg-error'}`}>
                                                                    {mensajesConfirmacion[pago.ref_payco]}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Vista de Cards */}
                        {vistaActual === 'cards' && (
                            <div className="academia-pagos-grid-cards">
                                {pagos.map((pago) => (
                                    <div key={pago.id} className="academia-pago-card">
                                        {/* Header del Card */}
                                        <div className="academia-card-header">
                                            <div className="academia-pagos-usuario-flex">
                                                <div className="academia-pagos-avatar">
                                                    {pago.perfiles?.nombre?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="academia-pagos-nombre">
                                                        {pago.perfiles?.nombre || 'Sin nombre'} {pago.perfiles?.apellido || ''}
                                                    </div>
                                                    <div className="academia-pagos-email">{pago.perfiles?.correo_electronico || 'Sin email'}</div>
                                                </div>
                                            </div>
                                            <span className={obtenerClaseBadgeEstado(pago.estado)}>
                                                {obtenerIconoEstado(pago.estado)} {pago.estado}
                                            </span>
                                        </div>

                                        {/* Información del Pago */}
                                        <div className="academia-card-info">
                                            <div className="academia-info-bloque">
                                                <p>Referencia</p>
                                                <p className="academia-pagos-ref">{truncarReferencia(pago.ref_payco)}</p>
                                            </div>
                                            <div className="academia-info-bloque">
                                                <p>Producto</p>
                                                <p>{pago.nombre_producto}</p>
                                                {pago.cursos?.titulo && (
                                                    <p className="academia-pagos-subproducto academia-text-blue">📚 {pago.cursos.titulo}</p>
                                                )}
                                                {pago.tutoriales?.titulo && (
                                                    <p className="academia-pagos-subproducto academia-text-green">🎥 {pago.tutoriales.titulo}</p>
                                                )}
                                            </div>
                                            <div className="academia-card-footer" style={{ borderTop: 'none', padding: 0, display: 'flex', justifyContent: 'space-between' }}>
                                                <div className="academia-info-bloque">
                                                    <p>Valor</p>
                                                    <p className="academia-pagos-valor">{formatearValor(pago.valor)}</p>
                                                </div>
                                                <div className="academia-info-bloque" style={{ textAlign: 'right' }}>
                                                    <p>Fecha</p>
                                                    <p>{formatearFecha(pago.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="academia-card-footer">
                                            <div className="academia-card-acciones">
                                                <button
                                                    onClick={() => cambiarEstadoPago(pago.ref_payco, 'aceptada')}
                                                    className="academia-btn-card academia-btn-mini-emerald"
                                                >
                                                    ✅ Aceptar
                                                </button>
                                                <button
                                                    onClick={() => cambiarEstadoPago(pago.ref_payco, 'rechazada')}
                                                    className="academia-btn-card academia-btn-mini-red"
                                                >
                                                    ❌ Rechazar
                                                </button>
                                            </div>
                                            <div>
                                                <button
                                                    className="academia-btn-card-confirmar"
                                                    onClick={() => confirmarPagoManualmente(pago.ref_payco)}
                                                    disabled={confirmando[pago.ref_payco] || pago.estado === 'aceptada'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                                                    {confirmando[pago.ref_payco] ? '...' : (pago.estado === 'aceptada' ? 'Confirmado' : 'Confirmar Manual')}
                                                </button>
                                            </div>
                                            {mensajesConfirmacion[pago.ref_payco] && (
                                                <div className={`academia-mensaje-confirmacion ${mensajesConfirmacion[pago.ref_payco].includes('✅') ? 'academia-msg-exito' : 'academia-msg-error'}`} style={{ textAlign: 'center' }}>
                                                    {mensajesConfirmacion[pago.ref_payco]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Pagos;
