import React from 'react'
import { Rocket, Clock, Save, Database, PieChart, Download, Upload, Power, Trash2 } from 'lucide-react'
import './PestanaConfiguracion.css'
import { usePestanaConfiguracion } from './usePestanaConfiguracion'

const PestanaConfiguracion: React.FC = () => {
    const {
        configuracion, estadisticasSistema, configuracionCambiada, guardandoConfiguracion,
        confirmacion, feedbackMsg, feedbackTipo,
        handleChange, guardarConfiguracion, ejecutarBackupManual, limpiarCacheSistema,
        exportarConfiguracion, importarConfiguracion, reiniciarSistema,
        ejecutarConfirmacion, cancelarConfirmacion, clearFeedback
    } = usePestanaConfiguracion()

    return (
        <div className="pcfg-container">
            <div className="pcfg-header">
                <h2>⚙️ Configuración del Sistema</h2>
                <p>Parámetros generales y configuración de la academia</p>
            </div>

            {feedbackMsg && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', background: feedbackTipo === 'error' ? '#fee2e2' : '#d1fae5', color: feedbackTipo === 'error' ? '#b91c1c' : '#065f46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{feedbackMsg}</span>
                    <button onClick={clearFeedback} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
            )}

            {confirmacion && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelarConfirmacion}>
                    <div style={{ background: '#1e293b', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.5)', color: 'white' }} onClick={e => e.stopPropagation()}>
                        <p style={{ marginBottom: '1rem' }}>⚠️ {confirmacion.texto}</p>
                        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={cancelarConfirmacion} style={{ padding: '.5rem 1rem', borderRadius: 8, border: '1px solid #475569', background: 'transparent', color: 'white', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={ejecutarConfirmacion} style={{ padding: '.5rem 1rem', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pcfg-status-grid">
                <div className="pcfg-status-card">
                    <Rocket className="pcfg-status-icon" style={{ color: '#8b5cf6' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">v{estadisticasSistema.versionSistema}</div>
                        <div className="pcfg-status-label">Versión Sistema</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Clock className="pcfg-status-icon" style={{ color: '#3b82f6' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.tiempoOperacion}</div>
                        <div className="pcfg-status-label">Tiempo Operación</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Save className="pcfg-status-icon" style={{ color: '#10b981' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.ultimoBackup}</div>
                        <div className="pcfg-status-label">Último Backup</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Database className="pcfg-status-icon" style={{ color: '#f59e0b' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.espacioUsado}%</div>
                        <div className="pcfg-status-label">Uso del Sistema</div>
                    </div>
                </div>
            </div>

            <div className="pcfg-content-grid">
                <div className="pcfg-general-section">
                    <div className="pcfg-section-header">
                        <h3>🏫 Configuración General</h3>
                        <div className="pcfg-actions-group">
                            <button className="pcfg-btn-action" onClick={exportarConfiguracion}>
                                <Download size={14} style={{ marginRight: '0.5rem' }} />Exportar
                            </button>
                            <button className="pcfg-btn-action" onClick={importarConfiguracion}>
                                <Upload size={14} style={{ marginRight: '0.5rem' }} />Importar
                            </button>
                            <button className={`pcfg-btn-save ${configuracionCambiada ? 'pcfg-changed' : ''}`}
                                disabled={!configuracionCambiada || guardandoConfiguracion}
                                onClick={guardarConfiguracion}>
                                <Save size={14} className={guardandoConfiguracion ? 'pcfg-spin' : ''} style={{ marginRight: '0.5rem' }} />
                                {guardandoConfiguracion ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    <div className="pcfg-form">
                        <div className="pcfg-form-group">
                            <h4>📋 Información Básica</h4>
                            <div className="pcfg-input-group">
                                <label htmlFor="nombreAcademia">Nombre de la Academia</label>
                                <input id="nombreAcademia" type="text" className="pcfg-input"
                                    value={configuracion.nombreAcademia}
                                    onChange={(e) => handleChange('nombreAcademia', e.target.value)}
                                    placeholder="Academia Vallenata Online" />
                            </div>
                            <div className="pcfg-input-group">
                                <label htmlFor="emailContacto">Email de Contacto</label>
                                <input id="emailContacto" type="email" className="pcfg-input"
                                    value={configuracion.emailContacto}
                                    onChange={(e) => handleChange('emailContacto', e.target.value)}
                                    placeholder="contacto@academiavallenata.com" />
                            </div>
                            <div className="pcfg-input-group">
                                <label htmlFor="whatsappContacto">WhatsApp de Contacto</label>
                                <input id="whatsappContacto" type="text" className="pcfg-input"
                                    value={configuracion.whatsappContacto}
                                    onChange={(e) => handleChange('whatsappContacto', e.target.value)}
                                    placeholder="+57 300 123 4567" />
                            </div>
                        </div>

                        <div className="pcfg-form-group">
                            <h4>⚙️ Sistema</h4>
                            <div className="pcfg-toggle">
                                <label>
                                    <input type="checkbox" checked={configuracion.mantenimientoActivo}
                                        onChange={(e) => handleChange('mantenimientoActivo', e.target.checked)} />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Modo Mantenimiento</span>
                                </label>
                                <p className="pcfg-toggle-desc">Bloquea el acceso temporal al sitio</p>
                            </div>
                            <div className="pcfg-toggle">
                                <label>
                                    <input type="checkbox" checked={configuracion.registroAbierto}
                                        onChange={(e) => handleChange('registroAbierto', e.target.checked)} />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Registro Abierto</span>
                                </label>
                                <p className="pcfg-toggle-desc">Permite nuevos registros de usuarios</p>
                            </div>
                            <div className="pcfg-input-group">
                                <label htmlFor="limiteUsuarios">Límite de Usuarios</label>
                                <input id="limiteUsuarios" type="number" className="pcfg-input"
                                    value={configuracion.limiteUsuarios}
                                    onChange={(e) => handleChange('limiteUsuarios', parseInt(e.target.value))}
                                    min={10} max={10000} />
                            </div>
                            <div className="pcfg-input-group">
                                <label htmlFor="duracionSesion">Duración de Sesión (minutos)</label>
                                <input id="duracionSesion" type="number" className="pcfg-input"
                                    value={configuracion.duracionSesion}
                                    onChange={(e) => handleChange('duracionSesion', parseInt(e.target.value))}
                                    min={30} max={480} />
                            </div>
                        </div>

                        <div className="pcfg-form-group">
                            <h4>🔧 Configuración Avanzada</h4>
                            <div className="pcfg-toggle">
                                <label>
                                    <input type="checkbox" checked={configuracion.backupAutomatico}
                                        onChange={(e) => handleChange('backupAutomatico', e.target.checked)} />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Backup Automático</span>
                                </label>
                                <p className="pcfg-toggle-desc">Backup diario automático de datos</p>
                            </div>
                            <div className="pcfg-toggle">
                                <label>
                                    <input type="checkbox" checked={configuracion.notificacionesEmail}
                                        onChange={(e) => handleChange('notificacionesEmail', e.target.checked)} />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Notificaciones Email</span>
                                </label>
                                <p className="pcfg-toggle-desc">Envío automático de notificaciones</p>
                            </div>
                            <div className="pcfg-toggle">
                                <label>
                                    <input type="checkbox" checked={configuracion.modoDesarrollo}
                                        onChange={(e) => handleChange('modoDesarrollo', e.target.checked)} />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Modo Desarrollo</span>
                                </label>
                                <p className="pcfg-toggle-desc">Habilita logs detallados</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pcfg-tools-section">
                    <h3>🔧 Herramientas del Sistema</h3>
                    <div className="pcfg-tools-list">
                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">💾 Backup Manual</div>
                                <div className="pcfg-tool-desc">Crear respaldo de la base de datos</div>
                            </div>
                            <button className="pcfg-btn-tool" onClick={ejecutarBackupManual}>
                                <Database size={14} style={{ marginRight: '0.5rem' }} />Ejecutar Backup
                            </button>
                        </div>
                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">🗑️ Limpiar Caché</div>
                                <div className="pcfg-tool-desc">Eliminar archivos temporales del sistema</div>
                            </div>
                            <button className="pcfg-btn-tool" onClick={limpiarCacheSistema}>
                                <Trash2 size={14} style={{ marginRight: '0.5rem' }} />Limpiar Caché
                            </button>
                        </div>
                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">📊 Estadísticas DB</div>
                                <div className="pcfg-tool-desc">Ver uso detallado de la base de datos</div>
                            </div>
                            <button className="pcfg-btn-tool">
                                <PieChart size={14} style={{ marginRight: '0.5rem' }} />Ver Estadísticas
                            </button>
                        </div>
                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">🔄 Reiniciar Sistema</div>
                                <div className="pcfg-tool-desc">Reinicio suave del sistema</div>
                            </div>
                            <button className="pcfg-btn-tool restart" onClick={reiniciarSistema}>
                                <Power size={14} style={{ marginRight: '0.5rem' }} />Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PestanaConfiguracion
