import React, { useState, useEffect } from 'react';
import { servicioSeguridad } from '../../../../servicios/servicioSeguridad';
import { RefreshCw, Clock, Globe, BarChart2, Users, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import './AnalyticsGeograficos.css';

interface AnalyticsData {
    total_paises: number;
    total_ciudades: number;
    distribucion_por_pais: { pais: string; usuarios: number; porcentaje: number }[];
    ubicaciones_activas_simultaneas: number;
    alertas_seguridad_hoy: number;
    conexiones_sospechosas: number;
    patrones_horarios: { zona_horaria: string; usuarios_activos: number }[];
}

const AnalyticsGeograficos: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        total_paises: 0,
        total_ciudades: 0,
        distribucion_por_pais: [],
        ubicaciones_activas_simultaneas: 0,
        alertas_seguridad_hoy: 0,
        conexiones_sospechosas: 0,
        patrones_horarios: []
    });
    const [cargando, setCargando] = useState(true);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
    const [datosMapaMundial, setDatosMapaMundial] = useState<any[]>([]);

    useEffect(() => {
        cargarAnalytics();
        const interval = setInterval(cargarAnalytics, 5 * 60 * 1000); // 5 min
        return () => clearInterval(interval);
    }, []);

    const cargarAnalytics = async () => {
        try {
            setCargando(true);
            const [analyticsData, datosMapa] = await Promise.all([
                servicioSeguridad.obtenerAnalyticsGeograficos(),
                servicioSeguridad.obtenerDatosMapaMundial()
            ]);

            setAnalytics(analyticsData);
            setDatosMapaMundial(datosMapa);
            setUltimaActualizacion(new Date());
        } catch (error) {
            console.error('Error cargando analytics:', error);
        } finally {
            setCargando(false);
        }
    };

    const obtenerColorPorcentaje = (porcentaje: number) => {
        if (porcentaje >= 50) return '#dc2626'; // Rojo
        if (porcentaje >= 20) return '#ea580c'; // Naranja
        if (porcentaje >= 10) return '#d97706'; // Amarillo
        return '#16a34a'; // Verde
    };

    const obtenerEmojiBandera = (pais: string) => {
        const banderas: { [key: string]: string } = {
            'Colombia': '🇨🇴', 'México': '🇲🇽', 'Argentina': '🇦🇷', 'España': '🇪🇸',
            'Estados Unidos': '🇺🇸', 'Brasil': '🇧🇷', 'Perú': '🇵🇪', 'Chile': '🇨🇱',
            'Venezuela': '🇻🇪', 'Ecuador': '🇪🇨'
        };
        return banderas[pais] || '🌍';
    };

    return (
        <div className="analytics-geograficos-widget">
            <div className="widget-header-analytics">
                <div className="titulo-seccion">
                    <h3>📊 Analytics Geográficos</h3>
                    <p>Distribución global de usuarios en tiempo real</p>
                </div>
                <button className="btn-actualizar-analytics" onClick={cargarAnalytics} disabled={cargando}>
                    <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
                    {cargando ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            {ultimaActualizacion && (
                <div className="ultima-actualizacion-bar">
                    <Clock size={14} />
                    <span>Última actualización: {ultimaActualizacion.toLocaleTimeString()}</span>
                </div>
            )}

            <div className="analytics-contenido">
                {cargando && !ultimaActualizacion ? (
                    <div className="loading-state">
                        <div className="spinner-widget"></div>
                        <p>Analizando distribución geográfica...</p>
                    </div>
                ) : (
                    <>
                        {/* MÉTRICAS PRINCIPALES */}
                        <div className="metricas-principales">
                            <div className="metrica-card-analytics">
                                <div className="metrica-icon">🌍</div>
                                <div className="metrica-info">
                                    <div className="metrica-valor">{analytics.total_paises}</div>
                                    <div className="metrica-label">Países</div>
                                </div>
                            </div>
                            <div className="metrica-card-analytics">
                                <div className="metrica-icon">🏙️</div>
                                <div className="metrica-info">
                                    <div className="metrica-valor">{analytics.total_ciudades}</div>
                                    <div className="metrica-label">Ciudades</div>
                                </div>
                            </div>
                            <div className="metrica-card-analytics">
                                <div className="metrica-icon">👥</div>
                                <div className="metrica-info">
                                    <div className="metrica-valor">{analytics.ubicaciones_activas_simultaneas}</div>
                                    <div className="metrica-label">Usuarios Activos</div>
                                </div>
                            </div>
                            <div className={`metrica-card-analytics ${analytics.alertas_seguridad_hoy > 0 ? 'alerta-activa' : ''}`}>
                                <div className="metrica-icon">🚨</div>
                                <div className="metrica-info">
                                    <div className="metrica-valor">{analytics.alertas_seguridad_hoy}</div>
                                    <div className="metrica-label">Alertas Hoy</div>
                                </div>
                            </div>
                        </div>

                        <div className="analytics-grid">
                            {/* DISTRIBUCIÓN POR PAÍSES */}
                            <div className="seccion-analytics">
                                <h4><Globe size={18} /> Distribución por Países</h4>
                                {analytics.distribucion_por_pais.length > 0 ? (
                                    <div className="paises-lista">
                                        {analytics.distribucion_por_pais.map((pais, idx) => (
                                            <div key={idx} className="pais-item-analytics">
                                                <div className="pais-info">
                                                    <span className="bandera">{obtenerEmojiBandera(pais.pais)}</span>
                                                    <span className="nombre-pais">{pais.pais}</span>
                                                </div>
                                                <div className="pais-estadisticas">
                                                    <div className="barra-progreso">
                                                        <div
                                                            className="progreso"
                                                            style={{
                                                                width: `${pais.porcentaje}%`,
                                                                backgroundColor: obtenerColorPorcentaje(pais.porcentaje)
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="pais-numeros">
                                                        <span className="usuarios">{pais.usuarios} usuarios</span>
                                                        <span
                                                            className="porcentaje"
                                                            style={{ color: obtenerColorPorcentaje(pais.porcentaje) }}
                                                        >
                                                            {pais.porcentaje}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-datos">
                                        <p>No hay datos de distribución</p>
                                    </div>
                                )}
                            </div>

                            {/* PATRONES HORARIOS */}
                            <div className="seccion-analytics">
                                <h4><Clock size={18} /> Patrones por Zona Horaria</h4>
                                {analytics.patrones_horarios.length > 0 ? (
                                    <div className="zonas-lista">
                                        {analytics.patrones_horarios.slice(0, 8).map((zona, idx) => (
                                            <div key={idx} className="zona-item-analytics">
                                                <div className="zona-info">
                                                    <span className="zona-nombre">{zona.zona_horaria}</span>
                                                </div>
                                                <div className="zona-estadisticas">
                                                    <div className="usuarios-zona">
                                                        <Users size={14} />
                                                        <span>{zona.usuarios_activos}</span>
                                                    </div>
                                                    <span className="badge-zona">Zona activa</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-datos">
                                        <p>No hay datos patrones</p>
                                    </div>
                                )}
                            </div>

                            {/* MAPA VISUAL SIMPLE */}
                            <div className="seccion-analytics mapa-seccion">
                                <h4><BarChart2 size={18} /> Ubicaciones Activas</h4>
                                {datosMapaMundial.length > 0 ? (
                                    <div className="mapa-simple">
                                        <div className="mapa-puntos">
                                            {datosMapaMundial.slice(0, 10).map((ubi, i) => (
                                                <div key={i} className="punto-mapa">
                                                    <div className="punto-info">
                                                        <div
                                                            className="punto-circulo"
                                                            style={{
                                                                width: Math.min(ubi.usuarios * 8 + 12, 32),
                                                                height: Math.min(ubi.usuarios * 8 + 12, 32)
                                                            }}
                                                        >
                                                            {ubi.usuarios}
                                                        </div>
                                                        <div className="punto-detalles">
                                                            <strong>{ubi.ciudad}</strong>
                                                            <span>{ubi.pais}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-datos">
                                        <p>No hay ubicaciones activas</p>
                                    </div>
                                )}
                            </div>

                            {/* SEGURIDAD RESUMEN */}
                            <div className="seccion-analytics seguridad-resumen">
                                <h4><Shield size={18} /> Resumen de Seguridad</h4>
                                <div className="seguridad-metricas">
                                    <div className="seguridad-item">
                                        <div className={`seguridad-icon ${analytics.alertas_seguridad_hoy > 0 ? 'alerta' : ''}`}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="seguridad-info">
                                            <div className="seguridad-valor">{analytics.alertas_seguridad_hoy}</div>
                                            <div className="seguridad-label">Alertas Hoy</div>
                                        </div>
                                    </div>
                                    <div className="seguridad-item">
                                        <div className="seguridad-icon bueno">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div className="seguridad-info">
                                            <div className="seguridad-valor">
                                                {analytics.ubicaciones_activas_simultaneas}
                                            </div>
                                            <div className="seguridad-label">Conexiones Seguras</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsGeograficos;
