'use client';

import * as React from 'react'
import { Link } from '@/compat/router';
import { useAdminNotificaciones } from './useAdminNotificaciones';
import './AdminNotificaciones.css';

const AdminNotificaciones: React.FC = () => {
    const {
        vista, setVista,
        cargando, mensaje, tipoMensaje, estadisticas,
        pedirConfirmacionLimpiar,
        enviadas, cargandoEnviadas, cargarEnviadas,
        grupoAEliminar, solicitarEliminarGrupo, cancelarEliminarGrupo, confirmarEliminarGrupo,
        detalle, cargandoDetalle, verDestinatarios, cerrarDetalle,
        formManual, setFormManual,
        enviarNotificacionManual,
        solicitarLimpiarExpiradas, cancelarLimpiarExpiradas, confirmarLimpiarExpiradas,
        cargarEstadisticas
    } = useAdminNotificaciones();

    const tabs: { id: typeof vista; label: string; icono: string }[] = [
        { id: 'enviadas', label: 'Enviadas', icono: '📋' },
        { id: 'crear', label: 'Crear notificación', icono: '✍️' },
        { id: 'estadisticas', label: 'Estadísticas', icono: '📊' },
    ];

    // Filtro de envíos: individual (1 usuario) vs masivo (a varios/todos) + búsqueda.
    const [filtro, setFiltro] = React.useState<'todas' | 'masivas' | 'individuales'>('todas');
    const [busqueda, setBusqueda] = React.useState('');
    const totalMasivas = enviadas.filter((n) => Number(n.total) > 1).length;
    const totalIndividuales = enviadas.filter((n) => Number(n.total) === 1).length;
    const enviadasFiltradas = enviadas.filter((n) => {
        const total = Number(n.total);
        if (filtro === 'masivas' && total <= 1) return false;
        if (filtro === 'individuales' && total !== 1) return false;
        const q = busqueda.trim().toLowerCase();
        if (q && !(`${n.titulo || ''} ${n.mensaje || ''} ${n.tipo || ''}`.toLowerCase().includes(q))) return false;
        return true;
    });

    return (
        <div className="academia-panel-notificaciones">
            <div className="academia-np-inner">
                <div className="academia-header-panel">
                    <h1><span className="academia-icono">🔔</span> Notificaciones</h1>
                    <p className="academia-descripcion">Crea, revisa y administra las notificaciones de la plataforma</p>
                </div>

                {mensaje && (
                    <div className={`academia-mensaje-panel academia-${tipoMensaje}`}>{mensaje}</div>
                )}

                {/* Navegación por pestañas */}
                <div className="academia-tabs">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            className={`academia-tab ${vista === t.id ? 'activo' : ''}`}
                            onClick={() => setVista(t.id)}
                        >
                            <span>{t.icono}</span> {t.label}
                            {t.id === 'enviadas' && enviadas.length > 0 && (
                                <span className="academia-tab-contador">{enviadas.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ===== ENVIADAS ===== */}
                {vista === 'enviadas' && (
                    <div className="academia-seccion">
                        <div className="academia-enviadas-header">
                            <div>
                                <h2>📋 Notificaciones enviadas</h2>
                                <p className="academia-descripcion academia-sub">
                                    Cada fila es un envío. Toca una para ver <strong>a quién</strong> se le envió, o elimínala de <strong>todos</strong> los usuarios.
                                </p>
                            </div>
                            <button className="academia-btn-mini" onClick={cargarEnviadas} disabled={cargandoEnviadas}>
                                🔄 Actualizar
                            </button>
                        </div>

                        {!cargandoEnviadas && enviadas.length > 0 && (
                            <div className="academia-filtros-barra">
                                <div className="academia-filtros">
                                    <button className={`academia-filtro-btn ${filtro === 'todas' ? 'activo' : ''}`} onClick={() => setFiltro('todas')}>
                                        Todas <span>{enviadas.length}</span>
                                    </button>
                                    <button className={`academia-filtro-btn ${filtro === 'masivas' ? 'activo' : ''}`} onClick={() => setFiltro('masivas')}>
                                        📢 A todos <span>{totalMasivas}</span>
                                    </button>
                                    <button className={`academia-filtro-btn ${filtro === 'individuales' ? 'activo' : ''}`} onClick={() => setFiltro('individuales')}>
                                        👤 Individuales <span>{totalIndividuales}</span>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="academia-buscador"
                                    placeholder="🔎 Buscar por título o mensaje…"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>
                        )}

                        {cargandoEnviadas ? (
                            <p className="academia-vacio-txt">Cargando…</p>
                        ) : enviadas.length === 0 ? (
                            <div className="academia-vacio">
                                <span className="academia-vacio-ico">🔔</span>
                                <p>Aún no se han enviado notificaciones.</p>
                                <button className="academia-boton-enviar academia-btn-inline" onClick={() => setVista('crear')}>✍️ Crear la primera</button>
                            </div>
                        ) : enviadasFiltradas.length === 0 ? (
                            <p className="academia-vacio-txt">No hay notificaciones que coincidan con el filtro.</p>
                        ) : (
                            <div className="academia-enviadas-lista">
                                {enviadasFiltradas.map((n) => (
                                    <div key={n.grupo} className="academia-enviada-item">
                                        <div
                                            className="academia-enviada-info academia-enviada-clic"
                                            onClick={() => verDestinatarios(n.grupo, n.titulo || n.tipo)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && verDestinatarios(n.grupo, n.titulo || n.tipo)}
                                            title="Ver a quién se le envió"
                                        >
                                            <div className="academia-enviada-top">
                                                <span className="academia-enviada-icono">{n.icono || '🔔'}</span>
                                                <strong>{n.titulo || n.tipo}</strong>
                                                <span className="academia-enviada-badge">{n.total} {Number(n.total) === 1 ? 'usuario' : 'usuarios'}</span>
                                            </div>
                                            {n.mensaje && <p className="academia-enviada-mensaje">{n.mensaje}</p>}
                                            <span className="academia-enviada-meta">
                                                {new Date(n.fecha).toLocaleString('es-CO')} · {n.leidas}/{n.total} leídas · 👁️ ver destinatarios
                                            </span>
                                        </div>
                                        <button
                                            className="academia-boton-eliminar-grupo"
                                            onClick={() => solicitarEliminarGrupo(n.grupo, n.titulo || n.tipo, Number(n.total))}
                                            disabled={cargando}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== CREAR ===== */}
                {vista === 'crear' && (
                    <div className="academia-seccion academia-seccion-form">
                        <h2>✍️ Crear notificación</h2>
                        <p className="academia-descripcion academia-sub">
                            Déjala sin “Usuario ID” para enviarla a <strong>todos</strong> los usuarios, o pon un ID para enviarla a uno solo.
                        </p>
                        <div className="academia-formulario">
                            <div className="academia-campo">
                                <label htmlFor="tipo">Tipo de notificación</label>
                                <select id="tipo" value={formManual.tipo} onChange={(e) => setFormManual({ ...formManual, tipo: e.target.value as any })}>
                                    <option value="nuevo_curso">🎓 Nuevo Curso</option>
                                    <option value="nuevo_tutorial">📹 Nuevo Tutorial</option>
                                    <option value="nueva_actualizacion_plataforma">🚀 Actualización</option>
                                    <option value="promocion_especial">🎁 Promoción</option>
                                    <option value="bienvenida_usuario">👋 Bienvenida</option>
                                </select>
                            </div>
                            <div className="academia-campo">
                                <label htmlFor="mensaje">Mensaje</label>
                                <textarea id="mensaje" value={formManual.mensaje} onChange={(e) => setFormManual({ ...formManual, mensaje: e.target.value })} placeholder="Escribe el mensaje de la notificación..." rows={4}></textarea>
                            </div>
                            <div className="academia-campo-grid">
                                <div className="academia-campo">
                                    <label htmlFor="url">URL de acción (opcional)</label>
                                    <input id="url" type="text" value={formManual.url_accion} onChange={(e) => setFormManual({ ...formManual, url_accion: e.target.value })} placeholder="/cursos, /blog/articulo-1, etc." />
                                </div>
                                <div className="academia-campo">
                                    <label htmlFor="usuario">Usuario ID (opcional)</label>
                                    <input id="usuario" type="text" value={formManual.usuario_id} onChange={(e) => setFormManual({ ...formManual, usuario_id: e.target.value })} placeholder="Vacío = enviar a todos" />
                                </div>
                            </div>
                            <button className="academia-boton-enviar" onClick={enviarNotificacionManual} disabled={cargando}>
                                {cargando ? '⏳ Enviando...' : '📤 Enviar notificación'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== ESTADÍSTICAS ===== */}
                {vista === 'estadisticas' && (
                    <>
                        {estadisticas ? (
                            <div className="academia-seccion">
                                <h2>📊 Estadísticas</h2>
                                <div className="academia-stats-grid">
                                    <div className="academia-stat-card"><div className="academia-numero">{estadisticas.total}</div><div className="academia-label">Total</div></div>
                                    <div className="academia-stat-card"><div className="academia-numero">{estadisticas.no_leidas}</div><div className="academia-label">Sin leer</div></div>
                                    <div className="academia-stat-card"><div className="academia-numero">{estadisticas.leidas}</div><div className="academia-label">Leídas</div></div>
                                    <div className="academia-stat-card"><div className="academia-numero">{estadisticas.ultimos_30_dias}</div><div className="academia-label">Últimos 30 días</div></div>
                                </div>
                                <div className="academia-stats-details">
                                    <div className="academia-stat-section">
                                        <h3>Por categoría</h3>
                                        {Object.entries(estadisticas.por_categoria || {}).map(([categoria, cantidad]) => (
                                            <div key={categoria} className="academia-stat-item"><span>{categoria}</span><span>{cantidad as React.ReactNode}</span></div>
                                        ))}
                                    </div>
                                    <div className="academia-stat-section">
                                        <h3>Por prioridad</h3>
                                        {Object.entries(estadisticas.por_prioridad || {}).map(([prioridad, cantidad]) => (
                                            <div key={prioridad} className="academia-stat-item"><span>{prioridad}</span><span>{cantidad as React.ReactNode}</span></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="academia-seccion"><p className="academia-vacio-txt">Cargando estadísticas…</p></div>
                        )}

                        <div className="academia-seccion">
                            <h2>🛠️ Herramientas</h2>
                            {pedirConfirmacionLimpiar && (
                                <div className="academia-aviso-limpiar">
                                    <p>¿Eliminar todas las notificaciones expiradas?</p>
                                    <div className="academia-aviso-acciones">
                                        <button onClick={confirmarLimpiarExpiradas} className="academia-modal-btn-eliminar">Confirmar</button>
                                        <button onClick={cancelarLimpiarExpiradas} className="academia-modal-btn-cancelar">Cancelar</button>
                                    </div>
                                </div>
                            )}
                            <div className="academia-herramientas">
                                <button className="academia-boton-herramienta academia-limpiar" onClick={solicitarLimpiarExpiradas} disabled={cargando}>
                                    🧹 Limpiar expiradas
                                </button>
                                <button className="academia-boton-herramienta academia-actualizar" onClick={cargarEstadisticas} disabled={cargando}>
                                    🔄 Actualizar estadísticas
                                </button>
                                <Link to="/notificaciones" className="academia-boton-herramienta academia-ver">
                                    👀 Ver mis notificaciones
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ===== Modales ===== */}
            {grupoAEliminar && (
                <div className="academia-modal-fondo" onClick={cancelarEliminarGrupo}>
                    <div className="academia-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>🗑️ Eliminar notificación</h3>
                        <p>
                            ¿Eliminar la notificación <strong>“{grupoAEliminar.titulo}”</strong> de los{' '}
                            <strong>{grupoAEliminar.total}</strong> {grupoAEliminar.total === 1 ? 'usuario' : 'usuarios'} que la recibieron?
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="academia-modal-acciones">
                            <button className="academia-modal-btn-cancelar" onClick={cancelarEliminarGrupo}>Cancelar</button>
                            <button className="academia-modal-btn-eliminar" onClick={confirmarEliminarGrupo} disabled={cargando}>
                                {cargando ? 'Eliminando…' : 'Sí, eliminar de todos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detalle && (
                <div className="academia-modal-fondo" onClick={cerrarDetalle}>
                    <div className="academia-modal academia-modal-detalle" onClick={(e) => e.stopPropagation()}>
                        <div className="academia-modal-detalle-header">
                            <h3>👥 Destinatarios</h3>
                            <button className="academia-modal-cerrar" onClick={cerrarDetalle} aria-label="Cerrar">✕</button>
                        </div>
                        <p className="academia-modal-detalle-sub">“{detalle.titulo}” — {detalle.destinatarios.length} {detalle.destinatarios.length === 1 ? 'usuario' : 'usuarios'}</p>
                        {cargandoDetalle ? (
                            <p className="academia-vacio-txt">Cargando…</p>
                        ) : (
                            <div className="academia-destinatarios-lista">
                                {detalle.destinatarios.map((d) => (
                                    <div key={d.usuario_id} className="academia-destinatario">
                                        <div className="academia-destinatario-info">
                                            <strong>{d.nombre || 'Sin nombre'}</strong>
                                            <span>{d.correo || d.usuario_id}</span>
                                        </div>
                                        <span className={`academia-destinatario-estado ${d.leida ? 'leida' : 'no-leida'}`}>
                                            {d.leida ? '✓ Leída' : '• Sin leer'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificaciones;
