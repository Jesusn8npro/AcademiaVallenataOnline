import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionesService, type Notificacion, type EstadisticasNotificaciones } from '../../servicios/notificacionesService';
import './Notificaciones.css';

const categorias = [
    { valor: 'todas', nombre: 'Todas las categorías', icono: '📋' },
    { valor: 'contenido', nombre: 'Contenido Educativo', icono: '🎓' },
    { valor: 'pago', nombre: 'Pagos y Transacciones', icono: '💳' },
    { valor: 'comunidad', nombre: 'Comunidad', icono: '👥' },
    { valor: 'progreso', nombre: 'Progreso', icono: '📈' },
    { valor: 'sistema', nombre: 'Sistema', icono: '⚙️' },
    { valor: 'promocion', nombre: 'Promociones', icono: '🎁' }
];

const Notificaciones: React.FC = () => {
    const navigate = useNavigate();

    // Estado principal
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [notificacionesFiltradas, setNotificacionesFiltradas] = useState<Notificacion[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroLeida, setFiltroLeida] = useState('todas');
    const [busqueda, setBusqueda] = useState('');

    // UI
    const [vistaActual, setVistaActual] = useState<'lista' | 'estadisticas'>('lista');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        cargarNotificaciones();
        cargarEstadisticas();

        // Suscribirse a notificaciones en tiempo real
        notificacionesService.suscribirseANotificaciones((nuevaNotificacion: Notificacion) => {
            setNotificaciones(prev => [nuevaNotificacion, ...prev]);
            cargarEstadisticas(); // Actualizar estadísticas
        });

        // Suscribirse al contador en tiempo real
        notificacionesService.suscribirseAContador(() => {
            cargarEstadisticas();
        });

        return () => {
            notificacionesService.desuscribirseDeNotificaciones();
        };
    }, []);

    // Efecto para aplicar filtros cuando cambia notificaciones o filtros
    useEffect(() => {
        aplicarFiltros();
    }, [notificaciones, filtroCategoria, filtroLeida, busqueda]);

    const cargarNotificaciones = async () => {
        setCargando(true);
        setError('');

        const { notificaciones: data, error: errorNotif } = await notificacionesService.obtenerNotificaciones({
            limite: 100
        });

        if (errorNotif) {
            setError(`Error al cargar notificaciones: ${errorNotif}`);
        } else {
            setNotificaciones(data);
        }

        setCargando(false);
    };

    const cargarEstadisticas = async () => {
        const { estadisticas: data, error: errorEst } = await notificacionesService.obtenerEstadisticas();

        if (!errorEst) {
            setEstadisticas(data);
        }
    };

    const aplicarFiltros = () => {
        const filtradas = notificaciones.filter(notif => {
            // Filtro por categoría
            if (filtroCategoria !== 'todas' && notif.categoria !== filtroCategoria) {
                return false;
            }

            // Filtro por estado de lectura
            if (filtroLeida === 'leidas' && !notif.leida) return false;
            if (filtroLeida === 'no_leidas' && notif.leida) return false;

            // Filtro por búsqueda
            if (busqueda) {
                const termino = busqueda.toLowerCase();
                return (
                    notif.titulo.toLowerCase().includes(termino) ||
                    notif.mensaje.toLowerCase().includes(termino)
                );
            }

            return true;
        });
        setNotificacionesFiltradas(filtradas);
    };

    const marcarComoLeida = async (notificacion: Notificacion) => {
        if (notificacion.leida) return;

        const { exito } = await notificacionesService.marcarComoLeida([notificacion.id]);

        if (exito) {
            setNotificaciones(prev => prev.map(n =>
                n.id === notificacion.id ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n
            ));
            cargarEstadisticas();
        }
    };

    const marcarTodasComoLeidas = async () => {
        if (!window.confirm('¿Estás seguro de marcar todas las notificaciones como leídas?')) {
            return;
        }

        const { exito } = await notificacionesService.marcarTodasComoLeidas();

        if (exito) {
            setNotificaciones(prev => prev.map(n => ({
                ...n,
                leida: true,
                fecha_lectura: new Date().toISOString()
            })));
            cargarEstadisticas();
        }
    };

    const archivarNotificacion = async (notificacion: Notificacion) => {
        if (!window.confirm('¿Estás seguro de archivar esta notificación?')) {
            return;
        }

        const { exito } = await notificacionesService.archivarNotificacion(notificacion.id);

        if (exito) {
            setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id));
            cargarEstadisticas();
        }
    };

    const manejarClicNotificacion = async (notificacion: Notificacion) => {
        await marcarComoLeida(notificacion);

        if (notificacion.url_accion) {
            navigate(notificacion.url_accion);
        }
    };

    const obtenerDescripcionCategoria = (categoria: string): string => {
        const cat = categorias.find(c => c.valor === categoria);
        return cat ? cat.nombre : categoria;
    };

    return (
        <div className="academia-contenedor-notificaciones">
            {/* 🔝 Header Mejorado */}
            <div className="academia-header-notificaciones">
                <div className="academia-titulo-seccion-notif">
                    <div className="academia-icono-principal">
                        <div className="academia-icono-campana">🔔</div>
                        {estadisticas && estadisticas.no_leidas > 0 && (
                            <div className="academia-badge-contador-header">{estadisticas.no_leidas}</div>
                        )}
                    </div>
                    <div className="academia-info-header">
                        <h1>Centro de Notificaciones</h1>
                        <p className="academia-subtitulo">
                            {estadisticas ? (
                                <>
                                    {estadisticas.total} notificaciones totales •
                                    <span className="academia-highlight"> {estadisticas.no_leidas} pendientes</span> •
                                    Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </>
                            ) : (
                                'Mantente al día con todas las novedades de tu academia'
                            )}
                        </p>
                    </div>
                </div>

                {/* 📊 Estadísticas rápidas */}
                {estadisticas && (
                    <div className="academia-estadisticas-rapidas">
                        <div className="academia-stat-card">
                            <div className="academia-stat-icono">📋</div>
                            <div className="academia-stat-info">
                                <span className="academia-numero">{estadisticas.total}</span>
                                <span className="academia-label">Total</span>
                            </div>
                        </div>
                        <div className="academia-stat-card academia-destacado">
                            <div className="academia-stat-icono">🔴</div>
                            <div className="academia-stat-info">
                                <span className="academia-numero">{estadisticas.no_leidas}</span>
                                <span className="academia-label">Sin leer</span>
                            </div>
                        </div>
                        <div className="academia-stat-card academia-exito">
                            <div className="academia-stat-icono">✅</div>
                            <div className="academia-stat-info">
                                <span className="academia-numero">{estadisticas.total - estadisticas.no_leidas}</span>
                                <span className="academia-label">Leídas</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🎛️ Controles */}
                <div className="academia-controles-header">
                    <button
                        className={`academia-boton-vista ${vistaActual === 'lista' ? 'academia-activo' : ''}`}
                        onClick={() => setVistaActual('lista')}
                    >
                        <span className="academia-icono">📋</span>
                        Lista
                    </button>

                    <button
                        className={`academia-boton-vista ${vistaActual === 'estadisticas' ? 'academia-activo' : ''}`}
                        onClick={() => setVistaActual('estadisticas')}
                    >
                        <span className="academia-icono">📊</span>
                        Estadísticas
                    </button>

                    <button
                        className={`academia-boton-filtros ${mostrarFiltros ? 'academia-activo' : ''}`}
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                        <span className="academia-icono">🔍</span>
                        Filtros
                    </button>

                    {estadisticas && estadisticas.no_leidas > 0 && (
                        <button className="academia-boton-marcar-todas" onClick={marcarTodasComoLeidas}>
                            <span className="academia-icono">✅</span>
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {/* 🔍 Panel de filtros */}
            {mostrarFiltros && (
                <div className="academia-panel-filtros">
                    <div className="academia-filtros-grid">
                        <div className="academia-filtro-busqueda">
                            <label htmlFor="busqueda">Buscar notificaciones:</label>
                            <input
                                id="busqueda"
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por título o mensaje..."
                                className="academia-campo-busqueda"
                            />
                        </div>

                        <div className="academia-filtro-categoria">
                            <label htmlFor="categoria">Categoría:</label>
                            <select
                                id="categoria"
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="academia-selector-categoria"
                            >
                                {categorias.map(categoria => (
                                    <option key={categoria.valor} value={categoria.valor}>
                                        {categoria.icono} {categoria.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="academia-filtro-estado">
                            <label htmlFor="estado">Estado:</label>
                            <select
                                id="estado"
                                value={filtroLeida}
                                onChange={(e) => setFiltroLeida(e.target.value)}
                                className="academia-selector-estado"
                            >
                                <option value="todas">📬 Todas</option>
                                <option value="no_leidas">🔴 Sin leer</option>
                                <option value="leidas">✅ Leídas</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* 📊 Vista de estadísticas */}
            {vistaActual === 'estadisticas' && estadisticas && (
                <div className="academia-vista-estadisticas">
                    <div className="academia-estadisticas-grid">
                        <div className="academia-tarjeta-estadistica">
                            <h3>📊 Resumen General</h3>
                            <div className="academia-stats-grid">
                                <div className="academia-stat-item">
                                    <span className="academia-numero-grande">{estadisticas.total}</span>
                                    <span className="academia-descripcion">Total de notificaciones</span>
                                </div>
                                <div className="academia-stat-item">
                                    <span className="academia-numero-grande academia-destacado">{estadisticas.no_leidas}</span>
                                    <span className="academia-descripcion">Sin leer</span>
                                </div>
                                <div className="academia-stat-item">
                                    <span className="academia-numero-grande">{estadisticas.total - estadisticas.no_leidas}</span>
                                    <span className="academia-descripcion">Leídas</span>
                                </div>
                            </div>
                        </div>

                        <div className="academia-tarjeta-estadistica">
                            <h3>📂 Por Categoría</h3>
                            <div className="academia-lista-categorias">
                                {Object.entries(estadisticas.por_categoria).map(([categoria, cantidad]) => (
                                    <div key={categoria} className="academia-item-categoria">
                                        <span className="academia-nombre-categoria">
                                            {categorias.find(c => c.valor === categoria)?.icono || '📋'}
                                            {' '}{obtenerDescripcionCategoria(categoria)}
                                        </span>
                                        <span className="academia-cantidad-categoria">{cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="academia-tarjeta-estadistica">
                            <h3>⚡ Por Prioridad</h3>
                            <div className="academia-lista-prioridades">
                                {Object.entries(estadisticas.por_prioridad).map(([prioridad, cantidad]) => (
                                    <div key={prioridad} className={`academia-item-prioridad academia-${prioridad}`}>
                                        <span className="academia-nombre-prioridad">
                                            {prioridad === 'alta' ? '🔴' : prioridad === 'normal' ? '🟡' : '🟢'}
                                            {' '}{prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                                        </span>
                                        <span className="academia-cantidad-prioridad">{cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📋 Vista de lista */}
            {vistaActual === 'lista' && (
                <div className="academia-vista-lista">
                    {cargando ? (
                        <div className="academia-cargando">
                            <div className="academia-spinner"></div>
                            <p>Cargando notificaciones...</p>
                        </div>
                    ) : error ? (
                        <div className="academia-error-mensaje">
                            <span className="academia-icono-error">❌</span>
                            <p>{error}</p>
                            <button className="academia-boton-reintentar" onClick={cargarNotificaciones}>
                                Reintentar
                            </button>
                        </div>
                    ) : notificacionesFiltradas.length === 0 ? (
                        <div className="academia-sin-notificaciones">
                            <span className="academia-icono-vacio">📭</span>
                            <h3>No hay notificaciones</h3>
                            <p>
                                {busqueda || filtroCategoria !== 'todas' || filtroLeida !== 'todas'
                                    ? 'No se encontraron notificaciones con los filtros aplicados.'
                                    : '¡Estás al día! No tienes notificaciones nuevas.'}
                            </p>
                        </div>
                    ) : (
                        <div className="academia-lista-notificaciones">
                            {notificacionesFiltradas.map(notificacion => (
                                <div
                                    key={notificacion.id}
                                    className={`academia-tarjeta-notificacion 
                                        ${!notificacion.leida ? 'academia-no-leida' : ''} 
                                        ${notificacion.prioridad === 'alta' ? 'academia-prioridad-alta' : ''} 
                                        ${notificacion.url_accion ? 'academia-clickeable' : ''}`
                                    }
                                    onClick={() => manejarClicNotificacion(notificacion)}
                                >
                                    <div
                                        className="academia-icono-categoria"
                                        style={{ backgroundColor: notificacionesService.obtenerColorPorCategoria(notificacion.categoria) }}
                                    >
                                        {notificacion.icono || notificacionesService.obtenerIconoPorTipo(notificacion.tipo)}
                                    </div>

                                    <div className="academia-contenido-notificacion">
                                        <div className="academia-header-notificacion">
                                            <h4 className="academia-titulo-notificacion">{notificacion.titulo}</h4>
                                            <div className="academia-metadatos">
                                                <span className="academia-categoria">{obtenerDescripcionCategoria(notificacion.categoria)}</span>
                                                <span className="academia-tiempo">{notificacionesService.formatearTiempoTranscurrido(notificacion.fecha_creacion as string)}</span>
                                            </div>
                                        </div>

                                        <p className="academia-mensaje-notificacion">{notificacion.mensaje}</p>

                                        {notificacion.url_accion && (
                                            <span className="academia-enlace-accion">👉 Hacer clic para ver más</span>
                                        )}
                                    </div>

                                    <div className="academia-acciones-notificacion">
                                        {!notificacion.leida && (
                                            <button
                                                className="academia-boton-accion academia-marcar-leida"
                                                onClick={(e) => { e.stopPropagation(); marcarComoLeida(notificacion); }}
                                                title="Marcar como leída"
                                            >
                                                ✅
                                            </button>
                                        )}

                                        <button
                                            className="academia-boton-accion academia-archivar"
                                            onClick={(e) => { e.stopPropagation(); archivarNotificacion(notificacion); }}
                                            title="Archivar notificación"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    {!notificacion.leida && (
                                        <div className="academia-indicador-no-leida"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notificaciones;
