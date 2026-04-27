import React from 'react';
import { usePagos, formatearValor } from './usePagos';
import ContenidoPagos from './ContenidoPagos';
import './Pagos.css';

const Pagos: React.FC = () => {
    const {
        pagos, cargando, filtroEstado, setFiltroEstado, buscarRef, setBuscarRef,
        mostrarFiltros, setMostrarFiltros, vistaActual, setVistaActual,
        confirmando, mensajesConfirmacion, estadisticas,
        mensajeAccion, confirmarCambioEstado, cancelarCambioEstado,
        pedirConfirmacionSincronizar,
        cargarPagos, confirmarPagoManualmente, solicitarCambioEstado, ejecutarCambioEstado,
        resetearFiltros, solicitarSincronizar, cancelarSincronizar, ejecutarSincronizar
    } = usePagos();

    return (
        <div className="academia-pagos-container">
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
                        <div className="academia-pagos-controles">
                            <div className="academia-pagos-switch-vista">
                                <button onClick={() => setVistaActual('tabla')} className={`academia-pagos-btn-vista ${vistaActual === 'tabla' ? 'activo' : 'inactivo'}`}>📊 Tabla</button>
                                <button onClick={() => setVistaActual('cards')} className={`academia-pagos-btn-vista ${vistaActual === 'cards' ? 'activo' : 'inactivo'}`}>🃏 Cards</button>
                            </div>
                            <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className="academia-pagos-btn-filtros">
                                <span>🔍</span>
                                <span className="academia-pagos-texto-filtros">Filtros</span>
                                <span className={`academia-pagos-flecha ${mostrarFiltros ? 'rotar' : ''}`}>▼</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="academia-pagos-contenido">
                {mensajeAccion && (
                    <div style={{ background: mensajeAccion.tipo === 'exito' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${mensajeAccion.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`, color: mensajeAccion.tipo === 'exito' ? '#166534' : '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        {mensajeAccion.texto}
                    </div>
                )}

                {confirmarCambioEstado && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#92400e' }}>¿Cambiar el estado a "{confirmarCambioEstado.nuevoEstado}"?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={ejecutarCambioEstado} style={{ padding: '0.3rem 0.75rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Confirmar</button>
                            <button onClick={cancelarCambioEstado} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                )}

                {pedirConfirmacionSincronizar && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#5b21b6' }}>¿Sincronizar pagos pendientes con ePayco? Esto puede tomar unos minutos.</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={ejecutarSincronizar} style={{ padding: '0.3rem 0.75rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Sincronizar</button>
                            <button onClick={cancelarSincronizar} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="academia-pagos-grid-stats">
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div><p className="academia-pagos-stat-label">Total Pagos</p><p className="academia-pagos-stat-valor">{estadisticas.total}</p></div>
                            <div className="academia-pagos-stat-icono-container academia-bg-blue"><span>📊</span></div>
                        </div>
                    </div>
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div><p className="academia-pagos-stat-label">Aceptados</p><p className="academia-pagos-stat-valor academia-stat-aceptada">{estadisticas.aceptada}</p></div>
                            <div className="academia-pagos-stat-icono-container academia-bg-emerald"><span>✅</span></div>
                        </div>
                    </div>
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div><p className="academia-pagos-stat-label">Pendientes</p><p className="academia-pagos-stat-valor academia-stat-pendiente">{estadisticas.pendiente}</p></div>
                            <div className="academia-pagos-stat-icono-container academia-bg-amber"><span>⏳</span></div>
                        </div>
                    </div>
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div><p className="academia-pagos-stat-label">Rechazados</p><p className="academia-pagos-stat-valor academia-stat-rechazada">{estadisticas.rechazada}</p></div>
                            <div className="academia-pagos-stat-icono-container academia-bg-red"><span>❌</span></div>
                        </div>
                    </div>
                    <div className="academia-pagos-card-stat">
                        <div className="academia-pagos-stat-flex">
                            <div><p className="academia-pagos-stat-label">Valor Total</p><p className="academia-pagos-stat-valor">{formatearValor(estadisticas.valorTotal)}</p></div>
                            <div className="academia-pagos-stat-icono-container academia-bg-green"><span>💰</span></div>
                        </div>
                    </div>
                </div>

                {mostrarFiltros && (
                    <div className="academia-pagos-panel-filtros">
                        <div className="academia-pagos-grid-filtros">
                            <div>
                                <label className="academia-pagos-label-filtro">Estado</label>
                                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="academia-pagos-select">
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
                                <input type="text" value={buscarRef} onChange={(e) => setBuscarRef(e.target.value)} placeholder="Ingresa referencia..." className="academia-pagos-input" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={cargarPagos} className="academia-pagos-btn-accion academia-btn-azul">🔍 Aplicar Filtros</button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={resetearFiltros} className="academia-pagos-btn-accion academia-btn-gris">🔄 Resetear</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button onClick={cargarPagos} className="academia-pagos-btn-accion academia-btn-esmeralda" style={{ width: 'auto' }}><span>📋</span> Ver Todos</button>
                            <button onClick={solicitarSincronizar} className="academia-pagos-btn-accion academia-btn-purpura" style={{ width: 'auto' }} disabled={cargando}><span>🔄</span> Sincronizar Pendientes con ePayco</button>
                        </div>
                    </div>
                )}

                <ContenidoPagos
                    pagos={pagos}
                    cargando={cargando}
                    vistaActual={vistaActual}
                    setVistaActual={setVistaActual}
                    confirmando={confirmando}
                    mensajesConfirmacion={mensajesConfirmacion}
                    onConfirmar={confirmarPagoManualmente}
                    onCambiarEstado={solicitarCambioEstado}
                    cargarPagos={cargarPagos}
                />
            </div>
        </div>
    );
};

export default Pagos;
