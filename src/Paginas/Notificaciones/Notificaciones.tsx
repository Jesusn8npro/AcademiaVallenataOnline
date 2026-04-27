import React from 'react';
import { useNotificaciones, categorias, obtenerDescripcionCategoria } from './useNotificaciones';
import ItemNotificacion from './ItemNotificacion';
import './Notificaciones.css';

const Notificaciones: React.FC = () => {
    const {
        notificacionesFiltradas, estadisticas, cargando, error,
        filtroCategoria, setFiltroCategoria, filtroLeida, setFiltroLeida,
        busqueda, setBusqueda, vistaActual, setVistaActual,
        mostrarFiltros, setMostrarFiltros, confirmacion,
        cargarNotificaciones, marcarComoLeida, marcarTodasComoLeidas,
        archivarNotificacion, manejarClicNotificacion,
        ejecutarConfirmacion, cancelarConfirmacion
    } = useNotificaciones();

    return (
        <div className="academia-contenedor-notificaciones">
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

                <div className="academia-controles-header">
                    <button className={`academia-boton-vista ${vistaActual === 'lista' ? 'academia-activo' : ''}`} onClick={() => setVistaActual('lista')}>
                        <span className="academia-icono">📋</span>Lista
                    </button>
                    <button className={`academia-boton-vista ${vistaActual === 'estadisticas' ? 'academia-activo' : ''}`} onClick={() => setVistaActual('estadisticas')}>
                        <span className="academia-icono">📊</span>Estadísticas
                    </button>
                    <button className={`academia-boton-filtros ${mostrarFiltros ? 'academia-activo' : ''}`} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                        <span className="academia-icono">🔍</span>Filtros
                    </button>
                    {estadisticas && estadisticas.no_leidas > 0 && (
                        <button className="academia-boton-marcar-todas" onClick={marcarTodasComoLeidas}>
                            <span className="academia-icono">✅</span>Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {mostrarFiltros && (
                <div className="academia-panel-filtros">
                    <div className="academia-filtros-grid">
                        <div className="academia-filtro-busqueda">
                            <label htmlFor="busqueda">Buscar notificaciones:</label>
                            <input
                                id="busqueda" type="text" value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por título o mensaje..."
                                className="academia-campo-busqueda"
                            />
                        </div>
                        <div className="academia-filtro-categoria">
                            <label htmlFor="categoria">Categoría:</label>
                            <select id="categoria" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="academia-selector-categoria">
                                {categorias.map(cat => (
                                    <option key={cat.valor} value={cat.valor}>{cat.icono} {cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="academia-filtro-estado">
                            <label htmlFor="estado">Estado:</label>
                            <select id="estado" value={filtroLeida} onChange={(e) => setFiltroLeida(e.target.value)} className="academia-selector-estado">
                                <option value="todas">📬 Todas</option>
                                <option value="no_leidas">🔴 Sin leer</option>
                                <option value="leidas">✅ Leídas</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {vistaActual === 'estadisticas' && estadisticas && (
                <div className="academia-vista-estadisticas">
                    <div className="academia-estadisticas-grid">
                        <div className="academia-tarjeta-estadistica">
                            <h3>📊 Resumen General</h3>
                            <div className="academia-stats-grid">
                                <div className="academia-stat-item"><span className="academia-numero-grande">{estadisticas.total}</span><span className="academia-descripcion">Total de notificaciones</span></div>
                                <div className="academia-stat-item"><span className="academia-numero-grande academia-destacado">{estadisticas.no_leidas}</span><span className="academia-descripcion">Sin leer</span></div>
                                <div className="academia-stat-item"><span className="academia-numero-grande">{estadisticas.total - estadisticas.no_leidas}</span><span className="academia-descripcion">Leídas</span></div>
                            </div>
                        </div>
                        <div className="academia-tarjeta-estadistica">
                            <h3>📂 Por Categoría</h3>
                            <div className="academia-lista-categorias">
                                {Object.entries(estadisticas.por_categoria).map(([categoria, cantidad]) => (
                                    <div key={categoria} className="academia-item-categoria">
                                        <span className="academia-nombre-categoria">
                                            {categorias.find(c => c.valor === categoria)?.icono || '📋'}{' '}{obtenerDescripcionCategoria(categoria)}
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
                                            {prioridad === 'alta' ? '🔴' : prioridad === 'normal' ? '🟡' : '🟢'}{' '}{prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                                        </span>
                                        <span className="academia-cantidad-prioridad">{cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {vistaActual === 'lista' && (
                <div className="academia-vista-lista">
                    {cargando ? (
                        <div className="academia-cargando"><div className="academia-spinner" /><p>Cargando notificaciones...</p></div>
                    ) : error ? (
                        <div className="academia-error-mensaje">
                            <span className="academia-icono-error">❌</span>
                            <p>{error}</p>
                            <button className="academia-boton-reintentar" onClick={cargarNotificaciones}>Reintentar</button>
                        </div>
                    ) : notificacionesFiltradas.length === 0 ? (
                        <div className="academia-sin-notificaciones">
                            <span className="academia-icono-vacio">📭</span>
                            <h3>No hay notificaciones</h3>
                            <p>{busqueda || filtroCategoria !== 'todas' || filtroLeida !== 'todas' ? 'No se encontraron notificaciones con los filtros aplicados.' : '¡Estás al día! No tienes notificaciones nuevas.'}</p>
                        </div>
                    ) : (
                        <div className="academia-lista-notificaciones">
                            {notificacionesFiltradas.map(notificacion => (
                                <ItemNotificacion
                                    key={notificacion.id}
                                    notificacion={notificacion}
                                    onClic={manejarClicNotificacion}
                                    onMarcarLeida={marcarComoLeida}
                                    onArchivar={archivarNotificacion}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {confirmacion && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelarConfirmacion}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
                        <p style={{ marginBottom: '1rem' }}>{confirmacion.texto}</p>
                        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={cancelarConfirmacion} style={{ padding: '.5rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={ejecutarConfirmacion} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notificaciones;
