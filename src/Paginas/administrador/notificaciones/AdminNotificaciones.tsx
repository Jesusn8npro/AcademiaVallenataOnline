import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminNotificaciones } from './useAdminNotificaciones';
import './AdminNotificaciones.css';

const AdminNotificaciones: React.FC = () => {
    const {
        cargando, mensaje, tipoMensaje, estadisticas,
        pedirConfirmacionLimpiar,
        formManual, setFormManual,
        formCurso, setFormCurso,
        formTutorial, setFormTutorial,
        formPago, setFormPago,
        formPromocion, setFormPromocion,
        enviarNotificacionManual,
        probarNuevoCurso, probarNuevoTutorial, probarPagoAprobado, probarPromocionEspecial,
        solicitarLimpiarExpiradas, cancelarLimpiarExpiradas, confirmarLimpiarExpiradas,
        cargarEstadisticas
    } = useAdminNotificaciones();

    return (
        <div className="academia-panel-notificaciones">
            <div className="academia-header-panel">
                <h1><span className="academia-icono">🔔</span> Panel de Gestión de Notificaciones</h1>
                <p className="academia-descripcion">Gestiona y prueba el sistema de notificaciones de la plataforma</p>
            </div>

            {mensaje && (
                <div className={`academia-mensaje-panel academia-${tipoMensaje}`}>{mensaje}</div>
            )}

            {pedirConfirmacionLimpiar && (
                <div style={{ background: '#fff5f5', border: '1px solid #fc8181', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Eliminar todas las notificaciones expiradas?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={confirmarLimpiarExpiradas} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Confirmar</button>
                        <button onClick={cancelarLimpiarExpiradas} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {estadisticas && (
                <div className="academia-seccion-estadisticas">
                    <h2>📊 Estadísticas de Notificaciones</h2>
                    <div className="academia-stats-grid">
                        <div className="academia-stat-card"><div className="academia-numero">{estadisticas.total}</div><div className="academia-label">Total</div></div>
                        <div className="academia-stat-card"><div className="academia-numero">{estadisticas.no_leidas}</div><div className="academia-label">Sin leer</div></div>
                        <div className="academia-stat-card"><div className="academia-numero">{estadisticas.leidas}</div><div className="academia-label">Leídas</div></div>
                        <div className="academia-stat-card"><div className="academia-numero">{estadisticas.ultimos_30_dias}</div><div className="academia-label">Últimos 30 días</div></div>
                    </div>
                    <div className="academia-stats-details">
                        <div className="academia-stat-section">
                            <h3>Por Categoría</h3>
                            {Object.entries(estadisticas.por_categoria).map(([categoria, cantidad]) => (
                                <div key={categoria} className="academia-stat-item"><span>{categoria}</span><span>{cantidad as React.ReactNode}</span></div>
                            ))}
                        </div>
                        <div className="academia-stat-section">
                            <h3>Por Prioridad</h3>
                            {Object.entries(estadisticas.por_prioridad).map(([prioridad, cantidad]) => (
                                <div key={prioridad} className="academia-stat-item"><span>{prioridad}</span><span>{cantidad as React.ReactNode}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="academia-contenido-panel">
                <div className="academia-seccion">
                    <h2>✍️ Crear Notificación Manual</h2>
                    <div className="academia-formulario">
                        <div className="academia-campo">
                            <label htmlFor="tipo">Tipo de Notificación:</label>
                            <select id="tipo" value={formManual.tipo} onChange={(e) => setFormManual({ ...formManual, tipo: e.target.value as any })}>
                                <option value="nuevo_curso">🎓 Nuevo Curso</option>
                                <option value="nuevo_tutorial">📹 Nuevo Tutorial</option>
                                <option value="nueva_actualizacion_plataforma">🚀 Actualización</option>
                                <option value="promocion_especial">🎁 Promoción</option>
                                <option value="bienvenida_usuario">👋 Bienvenida</option>
                            </select>
                        </div>
                        <div className="academia-campo">
                            <label htmlFor="mensaje">Mensaje:</label>
                            <textarea id="mensaje" value={formManual.mensaje} onChange={(e) => setFormManual({ ...formManual, mensaje: e.target.value })} placeholder="Escribe el mensaje de la notificación..." rows={3}></textarea>
                        </div>
                        <div className="academia-campo">
                            <label htmlFor="url">URL de Acción (opcional):</label>
                            <input id="url" type="text" value={formManual.url_accion} onChange={(e) => setFormManual({ ...formManual, url_accion: e.target.value })} placeholder="/cursos, /blog/articulo-1, etc." />
                        </div>
                        <div className="academia-campo">
                            <label htmlFor="usuario">Usuario ID específico (opcional):</label>
                            <input id="usuario" type="text" value={formManual.usuario_id} onChange={(e) => setFormManual({ ...formManual, usuario_id: e.target.value })} placeholder="Dejar vacío para enviar a todos" />
                        </div>
                        <button className="academia-boton-enviar" onClick={enviarNotificacionManual} disabled={cargando}>
                            {cargando ? '⏳ Enviando...' : '📤 Enviar Notificación'}
                        </button>
                    </div>
                </div>

                <div className="academia-seccion">
                    <h2>🧪 Pruebas de Notificaciones Automáticas</h2>
                    <div className="academia-pruebas-grid">
                        <div className="academia-prueba-card">
                            <h3>🎓 Nuevo Curso</h3>
                            <div className="academia-formulario-mini">
                                <input type="text" value={formCurso.titulo} onChange={(e) => setFormCurso({ ...formCurso, titulo: e.target.value })} placeholder="Título del curso" />
                                <input type="text" value={formCurso.descripcion} onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })} placeholder="Descripción" />
                                <button className="academia-boton-prueba" onClick={probarNuevoCurso} disabled={cargando}>Probar</button>
                            </div>
                        </div>
                        <div className="academia-prueba-card">
                            <h3>📹 Nuevo Tutorial</h3>
                            <div className="academia-formulario-mini">
                                <input type="text" value={formTutorial.titulo} onChange={(e) => setFormTutorial({ ...formTutorial, titulo: e.target.value })} placeholder="Título del tutorial" />
                                <input type="text" value={formTutorial.descripcion} onChange={(e) => setFormTutorial({ ...formTutorial, descripcion: e.target.value })} placeholder="Descripción" />
                                <button className="academia-boton-prueba" onClick={probarNuevoTutorial} disabled={cargando}>Probar</button>
                            </div>
                        </div>
                        <div className="academia-prueba-card">
                            <h3>✅ Pago Aprobado</h3>
                            <div className="academia-formulario-mini">
                                <input type="text" value={formPago.usuario_id} onChange={(e) => setFormPago({ ...formPago, usuario_id: e.target.value })} placeholder="ID del usuario" />
                                <input type="number" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: Number(e.target.value) })} placeholder="Monto" />
                                <input type="text" value={formPago.curso_titulo} onChange={(e) => setFormPago({ ...formPago, curso_titulo: e.target.value })} placeholder="Título del curso (opcional)" />
                                <button className="academia-boton-prueba" onClick={probarPagoAprobado} disabled={cargando}>Probar</button>
                            </div>
                        </div>
                        <div className="academia-prueba-card">
                            <h3>🎁 Promoción Especial</h3>
                            <div className="academia-formulario-mini">
                                <input type="text" value={formPromocion.titulo} onChange={(e) => setFormPromocion({ ...formPromocion, titulo: e.target.value })} placeholder="Título de la promoción" />
                                <input type="text" value={formPromocion.descripcion} onChange={(e) => setFormPromocion({ ...formPromocion, descripcion: e.target.value })} placeholder="Descripción" />
                                <input type="text" value={formPromocion.codigo} onChange={(e) => setFormPromocion({ ...formPromocion, codigo: e.target.value })} placeholder="Código de descuento" />
                                <input type="date" value={formPromocion.fecha_limite} onChange={(e) => setFormPromocion({ ...formPromocion, fecha_limite: e.target.value })} />
                                <button className="academia-boton-prueba" onClick={probarPromocionEspecial} disabled={cargando}>Probar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="academia-seccion">
                    <h2>🛠️ Herramientas de Gestión</h2>
                    <div className="academia-herramientas">
                        <button className="academia-boton-herramienta academia-limpiar" onClick={solicitarLimpiarExpiradas} disabled={cargando}>
                            🧹 Limpiar Notificaciones Expiradas
                        </button>
                        <button className="academia-boton-herramienta academia-actualizar" onClick={cargarEstadisticas} disabled={cargando}>
                            🔄 Actualizar Estadísticas
                        </button>
                        <Link to="/notificaciones" className="academia-boton-herramienta academia-ver">
                            👀 Ver Mis Notificaciones
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificaciones;
