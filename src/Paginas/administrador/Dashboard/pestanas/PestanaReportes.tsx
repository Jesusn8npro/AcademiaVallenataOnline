import React from 'react'
import {
    TrendingUp, CheckCircle, DollarSign, RefreshCw,
    FileText, MessageCircle, Target, Clock, GraduationCap
} from 'lucide-react'
import './PestanaReportes.css'
import { usePestanaReportes } from './usePestanaReportes'

const AnalyticsPaginasVisitadas = () => (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: '2rem', color: 'white' }}>
        <h3>📊 Analytics de Páginas Visitadas</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Gráfico de visitas por página (Componente en desarrollo)</p>
    </div>
)

const PestanaReportes: React.FC = () => {
    const {
        cargandoReporte, reportesSemana, reporteMetricas,
        cargarReportes, exportarReporteCSV, exportarReportePDF,
        compartirReporteWhatsApp, obtenerColorMetrica
    } = usePestanaReportes()

    return (
        <div className="prp-container">
            <div className="prp-header">
                <h2>📊 Reportes & Analytics</h2>
                <p>Análisis profundo del rendimiento y métricas de negocio</p>
            </div>

            <div className="prp-metrics-grid">
                <div className="prp-metric-card">
                    <TrendingUp className="prp-metric-icon" />
                    <div className="prp-metric-info">
                        <div className="prp-metric-number" style={{ color: obtenerColorMetrica(reporteMetricas.crecimientoUsuarios) }}>
                            {reporteMetricas.crecimientoUsuarios > 0 ? '+' : ''}{reporteMetricas.crecimientoUsuarios}%
                        </div>
                        <div className="prp-metric-label">Crecimiento Usuarios</div>
                        <div className="prp-metric-period">Últimos 30 días</div>
                    </div>
                </div>
                <div className="prp-metric-card">
                    <CheckCircle className="prp-metric-icon" />
                    <div className="prp-metric-info">
                        <div className="prp-metric-number" style={{ color: obtenerColorMetrica(reporteMetricas.tasaCompletitud, false) }}>
                            {reporteMetricas.tasaCompletitud}%
                        </div>
                        <div className="prp-metric-label">Tasa Completitud</div>
                        <div className="prp-metric-period">Cursos finalizados</div>
                    </div>
                </div>
                <div className="prp-metric-card">
                    <DollarSign className="prp-metric-icon" style={{ color: '#10b981' }} />
                    <div className="prp-metric-info">
                        <div className="prp-metric-number" style={{ color: '#10b981' }}>
                            ${reporteMetricas.ingresosPotenciales.toLocaleString()}
                        </div>
                        <div className="prp-metric-label">Ingresos Potenciales</div>
                        <div className="prp-metric-period">Estimación mensual</div>
                    </div>
                </div>
                <div className="prp-metric-card">
                    <RefreshCw className="prp-metric-icon" />
                    <div className="prp-metric-info">
                        <div className="prp-metric-number" style={{ color: obtenerColorMetrica(reporteMetricas.retenciionPromedio, false) }}>
                            {reporteMetricas.retenciionPromedio}%
                        </div>
                        <div className="prp-metric-label">Retención</div>
                        <div className="prp-metric-period">Últimos 30 días</div>
                    </div>
                </div>
            </div>

            <div className="prp-content-grid">
                <div className="prp-analytics-section" style={{ gridColumn: '1 / -1' }}>
                    <AnalyticsPaginasVisitadas />
                </div>

                <div className="prp-weekly-section" style={{ gridColumn: '1 / 2' }}>
                    <div className="prp-section-header">
                        <h3>📅 Reporte Semanal</h3>
                        <div className="prp-actions-group">
                            <button className="prp-btn-export csv" onClick={exportarReporteCSV}>
                                <FileText size={14} /> CSV
                            </button>
                            <button className="prp-btn-export pdf" onClick={exportarReportePDF}>
                                <FileText size={14} /> TXT
                            </button>
                            <button className="prp-btn-export whatsapp" onClick={compartirReporteWhatsApp}>
                                <MessageCircle size={14} /> WhatsApp
                            </button>
                        </div>
                    </div>
                    {cargandoReporte ? (
                        <div className="prp-loading"><div className="prp-spinner"></div><p>Generando reporte...</p></div>
                    ) : (
                        <div className="prp-table-container">
                            <div className="prp-table-header">
                                <div>Fecha</div>
                                <div>Usuarios Activos</div>
                                <div>Nuevos Registros</div>
                                <div>Tiempo Promedio</div>
                                <div>Engagement</div>
                            </div>
                            {reportesSemana.map((dia, idx) => (
                                <div key={idx} className="prp-table-row">
                                    <div className="prp-date">{dia.fechaFormateada}</div>
                                    <div className="prp-active-users"><span className="prp-badge active">{dia.usuariosActivos}</span></div>
                                    <div className="prp-new-users"><span className="prp-badge new">{dia.nuevosRegistros}</span></div>
                                    <div className="prp-time">{dia.tiempoPromedio}m</div>
                                    <div className="prp-engagement">
                                        <div className="prp-progress-bar">
                                            <div className="prp-progress-fill" style={{ width: `${Math.min(dia.engagement, 100)}%` }}></div>
                                        </div>
                                        <span className="prp-engagement-text">{dia.engagement}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="prp-insights-section" style={{ gridColumn: '2 / 3' }}>
                    <h3 className="prp-insights-h3">💡 Insights & Recomendaciones</h3>
                    <div className="prp-insights-list">
                        <div className="prp-insight-item">
                            <Target className="prp-insight-icon" style={{ color: '#fbbf24' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Curso Más Popular</div>
                                <div className="prp-insight-desc">{reporteMetricas.cursosPopulares}</div>
                                <div className="prp-insight-action">Promocionar cursos similares</div>
                            </div>
                        </div>
                        <div className="prp-insight-item">
                            <Clock className="prp-insight-icon" style={{ color: '#60a5fa' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Mejor Día de Actividad</div>
                                <div className="prp-insight-desc">
                                    {reportesSemana.length > 0
                                        ? reportesSemana.reduce((m, a) => a.usuariosActivos > m.usuariosActivos ? a : m, reportesSemana[0]).fechaFormateada
                                        : 'N/A'}
                                </div>
                                <div className="prp-insight-action">Enfocar contenido nuevo en este día</div>
                            </div>
                        </div>
                        <div className="prp-insight-item">
                            <TrendingUp className="prp-insight-icon" style={{ color: '#10b981' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Oportunidad de Crecimiento</div>
                                <div className="prp-insight-desc">{reporteMetricas.crecimientoUsuarios > 0 ? 'Tendencia positiva' : 'Necesita atención'}</div>
                                <div className="prp-insight-action">
                                    {reporteMetricas.crecimientoUsuarios > 0 ? 'Escalar estrategias actuales' : 'Implementar campañas de marketing'}
                                </div>
                            </div>
                        </div>
                        <div className="prp-insight-item">
                            <GraduationCap className="prp-insight-icon" style={{ color: '#8b5cf6' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Retención de Estudiantes</div>
                                <div className="prp-insight-desc">{reporteMetricas.retenciionPromedio}% estudiantes activos</div>
                                <div className="prp-insight-action">
                                    {reporteMetricas.retenciionPromedio < 30 ? 'Implementar programa de re-engagement' : 'Mantener estrategias actuales'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PestanaReportes
