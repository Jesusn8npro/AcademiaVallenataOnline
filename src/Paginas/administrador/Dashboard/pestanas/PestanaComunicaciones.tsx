import React from 'react'
import { Mail, MessageCircle, Bell, TrendingUp, Users, RefreshCw, Download, Plus, Eye, MessageSquare } from 'lucide-react'
import './PestanaComunicaciones.css'
import { usePestanaComunicaciones } from './usePestanaComunicaciones'
import ModalNuevaCampana from './ModalNuevaCampana'

const PestanaComunicaciones: React.FC = () => {
    const {
        cargando, modalNuevaCampaña, setModalNuevaCampaña,
        campañas, setCampañas, usuariosDisponibles,
        estadisticasComunicacion, cargarDatosComunicacion,
        exportarListaUsuarios, obtenerIconoTipo, obtenerColorEstado, formatearFecha
    } = usePestanaComunicaciones()

    return (
        <div className="pc-container">
            <div className="pc-header">
                <div className="pc-header-content">
                    <div className="pc-header-text">
                        <h2>📢 Comunicaciones</h2>
                        <p>Gestiona emails, WhatsApp y notificaciones para tus estudiantes</p>
                    </div>
                    <button className="pc-btn-new-campaign" onClick={() => setModalNuevaCampaña(true)}>
                        <Plus size={16} />
                        Nueva Campaña
                    </button>
                </div>
            </div>

            <div className="pc-stats-grid">
                <div className="pc-stat-card">
                    <TrendingUp className="pc-stat-icon" style={{ color: '#a78bfa' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.totalCampañas}</div>
                        <div className="pc-stat-label">Total Campañas</div>
                    </div>
                </div>
                <div className="pc-stat-card">
                    <Mail className="pc-stat-icon" style={{ color: '#3b82f6' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.emailsEnviados}</div>
                        <div className="pc-stat-label">Emails Enviados</div>
                    </div>
                </div>
                <div className="pc-stat-card">
                    <MessageCircle className="pc-stat-icon" style={{ color: '#22c55e' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.whatsappsEnviados}</div>
                        <div className="pc-stat-label">WhatsApps Enviados</div>
                    </div>
                </div>
                <div className="pc-stat-card">
                    <Bell className="pc-stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.notificacionesEnviadas}</div>
                        <div className="pc-stat-label">Notificaciones</div>
                    </div>
                </div>
                <div className="pc-stat-card">
                    <Eye className="pc-stat-icon" style={{ color: '#60a5fa' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.tasaAperturaPromedio.toFixed(1)}%</div>
                        <div className="pc-stat-label">Tasa Apertura</div>
                    </div>
                </div>
                <div className="pc-stat-card">
                    <MessageSquare className="pc-stat-icon" style={{ color: '#8b5cf6' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.tasaRespuestaPromedio.toFixed(1)}%</div>
                        <div className="pc-stat-label">Tasa Respuesta</div>
                    </div>
                </div>
            </div>

            <div className="pc-content-grid">
                <div className="pc-campaigns-section">
                    <div className="pc-campaigns-header">
                        <h3>📋 Campañas Recientes</h3>
                        <button className="pc-btn-update" onClick={cargarDatosComunicacion} disabled={cargando}>
                            <RefreshCw size={14} className={cargando ? 'pc-spinning' : ''} style={{ marginRight: '0.5rem' }} />
                            Actualizar
                        </button>
                    </div>
                    {cargando ? (
                        <div className="pc-loading"><div className="pc-spinner"></div><p>Cargando campañas...</p></div>
                    ) : campañas.length === 0 ? (
                        <div className="pc-empty-state">📢 No hay campañas aún. ¡Crea tu primera campaña!</div>
                    ) : (
                        <div className="pc-campaigns-list">
                            {campañas.map((campaña) => (
                                <div key={campaña.id} className="pc-campaign-card">
                                    <div className="pc-campaign-header">
                                        <div className="pc-campaign-title">
                                            {obtenerIconoTipo(campaña.tipo)} {campaña.titulo}
                                        </div>
                                        <div className="pc-campaign-status" style={{ backgroundColor: `${obtenerColorEstado(campaña.estado)}20`, color: obtenerColorEstado(campaña.estado) }}>
                                            {campaña.estado}
                                        </div>
                                    </div>
                                    <div className="pc-campaign-info">
                                        <div className="pc-info-item">
                                            <span className="pc-info-label">Destinatarios:</span>
                                            <span className="pc-info-value">{campaña.destinatarios}</span>
                                        </div>
                                        <div className="pc-info-item">
                                            <span className="pc-info-label">Creada:</span>
                                            <span className="pc-info-value">{formatearFecha(campaña.fecha_creacion)}</span>
                                        </div>
                                        {campaña.fecha_enviada && (
                                            <div className="pc-info-item">
                                                <span className="pc-info-label">Enviada:</span>
                                                <span className="pc-info-value">{formatearFecha(campaña.fecha_enviada)}</span>
                                            </div>
                                        )}
                                        {campaña.fecha_programada && (
                                            <div className="pc-info-item">
                                                <span className="pc-info-label">Programada:</span>
                                                <span className="pc-info-value">{formatearFecha(campaña.fecha_programada)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {(campaña.tasa_apertura || campaña.tasa_respuesta) && (
                                        <div className="pc-campaign-metrics">
                                            {campaña.tasa_apertura && (
                                                <div className="pc-metric-item">
                                                    <span className="pc-metric-value">{campaña.tasa_apertura.toFixed(1)}%</span>
                                                    <span className="pc-metric-label">Apertura</span>
                                                </div>
                                            )}
                                            {campaña.tasa_respuesta && (
                                                <div className="pc-metric-item">
                                                    <span className="pc-metric-value">{campaña.tasa_respuesta.toFixed(1)}%</span>
                                                    <span className="pc-metric-label">Respuesta</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pc-actions-section">
                    <h3>⚡ Acciones Rápidas</h3>
                    <div className="pc-actions-list">
                        <button className="pc-action-card" onClick={() => setModalNuevaCampaña(true)}>
                            <Mail className="pc-action-icon" style={{ color: '#3b82f6' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Email Masivo</div>
                                <div className="pc-action-desc">Enviar email a todos los estudiantes</div>
                            </div>
                        </button>
                        <button className="pc-action-card" onClick={() => setModalNuevaCampaña(true)}>
                            <MessageCircle className="pc-action-icon" style={{ color: '#22c55e' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">WhatsApp Masivo</div>
                                <div className="pc-action-desc">Enviar mensaje por WhatsApp</div>
                            </div>
                        </button>
                        <button className="pc-action-card" onClick={() => setModalNuevaCampaña(true)}>
                            <Users className="pc-action-icon" style={{ color: '#f59e0b' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Reactivar Inactivos</div>
                                <div className="pc-action-desc">Contactar usuarios inactivos</div>
                            </div>
                        </button>
                        <button className="pc-action-card" onClick={exportarListaUsuarios}>
                            <Download className="pc-action-icon" style={{ color: '#8b5cf6' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Exportar Contactos</div>
                                <div className="pc-action-desc">Descargar lista de usuarios</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {modalNuevaCampaña && (
                <ModalNuevaCampana
                    usuariosDisponibles={usuariosDisponibles}
                    onCreada={(c) => setCampañas(prev => [c, ...prev])}
                    onCerrar={() => setModalNuevaCampaña(false)}
                />
            )}
        </div>
    )
}

export default PestanaComunicaciones
