
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import {
    TrendingUp,
    CheckCircle,
    DollarSign,
    RefreshCw,
    FileText,
    MessageCircle,
    Target,
    Clock,
    GraduationCap
} from 'lucide-react';
import './PestanaReportes.css';

// Placeholder for the Analytics widget if it doesn't exist yet
const AnalyticsPaginasVisitadas = () => (
    <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        marginBottom: '2rem',
        color: 'white'
    }}>
        <h3>📊 Analytics de Páginas Visitadas</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Gráfico de visitas por página (Componente en desarrollo)</p>
    </div>
);

interface ReporteMetricas {
    crecimientoUsuarios: number;
    tasaCompletitud: number;
    ingresosPotenciales: number;
    cursosPopulares: string;
    retenciionPromedio: number;
    satisfaccionGeneral: number;
}

const PestanaReportes: React.FC = () => {
    const [cargandoReporte, setCargandoReporte] = useState(false);
    const [reportesSemana, setReportesSemana] = useState<any[]>([]);
    const [reporteMetricas, setReporteMetricas] = useState<ReporteMetricas>({
        crecimientoUsuarios: 0,
        tasaCompletitud: 0,
        ingresosPotenciales: 0,
        cursosPopulares: '',
        retenciionPromedio: 0,
        satisfaccionGeneral: 0
    });

    useEffect(() => {
        cargarReportes();
    }, []);

    async function cargarReportes() {
        try {
            setCargandoReporte(true);
            console.log('📊 [REPORTES] Generando análisis...');

            await Promise.all([
                calcularMetricasNegocio(),
                generarReporteSemanal()
            ]);

        } catch (error) {
            console.error('❌ [REPORTES] Error:', error);
        } finally {
            setCargandoReporte(false);
        }
    }

    async function calcularMetricasNegocio() {
        try {
            // Crecimiento de usuarios (últimos 30 días vs anterior)
            const hoy = new Date();
            const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
            const hace60Dias = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000);

            const { count: usuariosUltimos30 } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hace30Dias.toISOString())
                .eq('eliminado', false);

            const { count: usuariosAnteriores30 } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hace60Dias.toISOString())
                .lt('created_at', hace30Dias.toISOString())
                .eq('eliminado', false);

            const crecimientoUsuarios = (usuariosAnteriores30 || 0) > 0
                ? Math.round((((usuariosUltimos30 || 0) - (usuariosAnteriores30 || 0)) / (usuariosAnteriores30 || 1)) * 100)
                : 0;

            // Tasa de completitud de cursos
            // Note: 'inscripciones' table might not exist in detailed schema, assuming basic mock or table exists
            // If it errors, we handle it. logic ported from Svelte.
            let tasaCompletitud = 0;
            let cursosPopulares = 'N/A';

            // Checking if we can actually query this. If not, use mocks or empty.
            // Using try-catch for specific queries to be safe.
            try {
                const { data: inscripciones } = await supabase
                    .from('inscripciones')
                    .select('completado');

                tasaCompletitud = inscripciones && inscripciones.length > 0
                    ? Math.round((inscripciones.filter((i: any) => i.completado).length / inscripciones.length) * 100)
                    : 0;
            } catch (e) {
                console.log('Tabla inscripciones no encontrada o vacía, usando 0');
            }

            // Curso más popular
            try {
                const { data: cursosPopularesData } = await supabase
                    .from('inscripciones')
                    .select(`
paquete_id,
    paquetes_tutoriales(titulo)
        `)
                    .limit(100);

                if (cursosPopularesData && cursosPopularesData.length > 0) {
                    const conteo: { [key: string]: number } = {};
                    cursosPopularesData.forEach((i: any) => {
                        const titulo = i.paquetes_tutoriales?.titulo || 'Sin título';
                        conteo[titulo] = (conteo[titulo] || 0) + 1;
                    });

                    const masPopular = Object.entries(conteo).sort(([, a], [, b]) => b - a)[0];
                    cursosPopulares = masPopular ? masPopular[0] : 'N/A';
                }
            } catch (e) {
                console.log('Error calculando populares');
            }

            // Retención
            const { count: totalUsuarios } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('eliminado', false);

            const { count: activosUltimos30 } = await supabase
                .from('sesiones_usuario')
                .select('usuario_id', { count: 'exact', head: true })
                .gte('ultima_actividad', hace30Dias.toISOString());

            const retenciionPromedio = (totalUsuarios || 0) > 0
                ? Math.round(((activosUltimos30 || 0) / (totalUsuarios || 1)) * 100)
                : 0;

            setReporteMetricas({
                crecimientoUsuarios,
                tasaCompletitud,
                ingresosPotenciales: (usuariosUltimos30 || 0) * 50000, // Estimación COP
                cursosPopulares,
                retenciionPromedio,
                satisfaccionGeneral: 85 // Placeholder
            });

        } catch (error) {
            console.error('❌ [REPORTES] Error calculando métricas:', error);
            setReporteMetricas({
                crecimientoUsuarios: 0,
                tasaCompletitud: 0,
                ingresosPotenciales: 0,
                cursosPopulares: 'N/A',
                retenciionPromedio: 0,
                satisfaccionGeneral: 85
            });
        }
    }

    async function generarReporteSemanal() {
        const ultimosSieteDias = [];

        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            const fechaStr = fecha.toISOString().split('T')[0];

            // Usuarios activos del día
            const { count: usuariosActivos } = await supabase
                .from('sesiones_usuario')
                .select('usuario_id', { count: 'exact', head: true })
                .eq('fecha', fechaStr);

            // Nuevos registros del día
            const inicioDelDia = fechaStr + 'T00:00:00.000Z';
            const finDelDia = fechaStr + 'T23:59:59.999Z';

            const { count: nuevosRegistros } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', inicioDelDia)
                .lte('created_at', finDelDia)
                .eq('eliminado', false);

            // Tiempo promedio
            const { data: sesionesDelDia } = await supabase
                .from('sesiones_usuario')
                .select('tiempo_total_minutos')
                .eq('fecha', fechaStr)
                .not('tiempo_total_minutos', 'is', null);

            let tiempoPromedio = 0;
            if (sesionesDelDia && sesionesDelDia.length > 0) {
                const tiempoTotal = sesionesDelDia.reduce((sum: number, s: any) => sum + (s.tiempo_total_minutos || 0), 0);
                tiempoPromedio = Math.round(tiempoTotal / sesionesDelDia.length);
            }

            ultimosSieteDias.push({
                fecha: fechaStr,
                fechaFormateada: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
                usuariosActivos: usuariosActivos || 0,
                nuevosRegistros: nuevosRegistros || 0,
                tiempoPromedio,
                engagement: (usuariosActivos || 0) > 0 ? Math.round((tiempoPromedio / 60) * 100) : 0
            });
        }

        setReportesSemana(ultimosSieteDias);
    }

    function exportarReporteCSV() {
        const headers = ['Fecha', 'Usuarios Activos', 'Nuevos Registros', 'Tiempo Promedio (min)', 'Engagement Score'];
        const rows = reportesSemana.map(dia => [
            dia.fecha,
            dia.usuariosActivos,
            dia.nuevosRegistros,
            dia.tiempoPromedio,
            dia.engagement
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_academia_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function exportarReportePDF() {
        // Generar formato texto (simulando PDF)
        let contenido = 'REPORTE ACADEMIA VALLENATA ONLINE\n';
        contenido += 'Fecha: ' + new Date().toLocaleDateString('es-ES') + '\n\n';

        contenido += '=== METRICAS PRINCIPALES ===\n';
        contenido += '• Crecimiento usuarios: ' + reporteMetricas.crecimientoUsuarios + '%\n';
        contenido += '• Tasa completitud: ' + reporteMetricas.tasaCompletitud + '%\n';
        contenido += '• Retención promedio: ' + reporteMetricas.retenciionPromedio + '%\n';
        contenido += '• Curso más popular: ' + reporteMetricas.cursosPopulares + '\n\n';

        contenido += '=== ACTIVIDAD SEMANAL ===\n';
        reportesSemana.forEach(dia => {
            contenido += dia.fechaFormateada + ': ' + dia.usuariosActivos + ' usuarios activos, ' + dia.nuevosRegistros + ' nuevos registros\n';
        });
        contenido += '\n';

        contenido += '=== RECOMENDACIONES ===\n';
        contenido += '• Enfocar marketing en días de menor actividad\n';
        contenido += '• Promover curso más popular para aumentar retención\n';
        contenido += '• Implementar estrategias para usuarios inactivos\n\n';
        contenido += 'Generado automáticamente por el Panel de Administración';

        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_completo_' + new Date().toISOString().split('T')[0] + '.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    function compartirReporteWhatsApp() {
        const resumen = `🎓 * Reporte Academia Vallenata Online *\n\n` +
            `📈 Crecimiento: ${reporteMetricas.crecimientoUsuarios}%\n` +
            `✅ Completitud: ${reporteMetricas.tasaCompletitud}%\n` +
            `👥 Retención: ${reporteMetricas.retenciionPromedio}%\n` +
            `🔥 Curso popular: ${reporteMetricas.cursosPopulares} \n\n` +
            `Usuarios activos hoy: ${reportesSemana[reportesSemana.length - 1]?.usuariosActivos || 0} `;

        const url = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
        window.open(url, '_blank');
    }

    function obtenerColorMetrica(valor: number, esPositivo: boolean = true): string {
        if (esPositivo) {
            if (valor > 20) return '#10b981'; // Verde
            if (valor > 0) return '#f59e0b';   // Amarillo
            return '#ef4444';                  // Rojo
        } else {
            if (valor < 10) return '#ef4444';  // Rojo
            if (valor < 30) return '#f59e0b';  // Amarillo
            return '#10b981';                  // Verde
        }
    }

    return (
        <div className="prp-container">
            <div className="prp-header">
                <h2>📊 Reportes & Analytics</h2>
                <p>Análisis profundo del rendimiento y métricas de negocio</p>
            </div>

            {/* MÉTRICAS DE NEGOCIO */}
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
                {/* ANALYTICS DE PÁGINAS (Placeholder) */}
                <div className="prp-analytics-section" style={{ gridColumn: '1 / -1' }}>
                    <AnalyticsPaginasVisitadas />
                </div>

                {/* REPORTE SEMANAL */}
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
                        <div className="prp-loading">
                            <div className="prp-spinner"></div>
                            <p>Generando reporte...</p>
                        </div>
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
                                    <div className="prp-active-users">
                                        <span className="prp-badge active">{dia.usuariosActivos}</span>
                                    </div>
                                    <div className="prp-new-users">
                                        <span className="prp-badge new">{dia.nuevosRegistros}</span>
                                    </div>
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

                {/* INSIGHTS Y RECOMENDACIONES */}
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
                                    {reportesSemana.length > 0 ? reportesSemana.reduce((mejor, actual) =>
                                        actual.usuariosActivos > mejor.usuariosActivos ? actual : mejor,
                                        reportesSemana[0]
                                    ).fechaFormateada : 'N/A'}
                                </div>
                                <div className="prp-insight-action">Enfocar contenido nuevo en este día</div>
                            </div>
                        </div>

                        <div className="prp-insight-item">
                            <TrendingUp className="prp-insight-icon" style={{ color: '#10b981' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Oportunidad de Crecimiento</div>
                                <div className="prp-insight-desc">
                                    {reporteMetricas.crecimientoUsuarios > 0 ? 'Tendencia positiva' : 'Necesita atención'}
                                </div>
                                <div className="prp-insight-action">
                                    {reporteMetricas.crecimientoUsuarios > 0
                                        ? 'Escalar estrategias actuales'
                                        : 'Implementar campañas de marketing'}
                                </div>
                            </div>
                        </div>

                        <div className="prp-insight-item">
                            <GraduationCap className="prp-insight-icon" style={{ color: '#8b5cf6' }} />
                            <div className="prp-insight-content">
                                <div className="prp-insight-title">Retención de Estudiantes</div>
                                <div className="prp-insight-desc">{reporteMetricas.retenciionPromedio}% estudiantes activos</div>
                                <div className="prp-insight-action">
                                    {reporteMetricas.retenciionPromedio < 30
                                        ? 'Implementar programa de re-engagement'
                                        : 'Mantener estrategias actuales'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PestanaReportes;
