import React, { useState, useEffect } from 'react';
import './PestanaGeolocalizacion.css';
import { Gauge, Shield, PieChart, Users, Play, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../servicios/clienteSupabase';
import { servicioGeolocalizacion } from '../../../../servicios/servicioGeolocalizacion';
import GeolocalizacionUsuarios from './GeolocalizacionUsuarios';
import AnalyticsGeograficos from './AnalyticsGeograficos';
import AlertasSeguridadGeografica from './AlertasSeguridadGeografica';

const PestanaGeolocalizacion = () => {
    const [vistaActiva, setVistaActiva] = useState('overview'); // 'overview', 'alertas', 'analytics', 'usuarios'
    const [ejecutandoTest, setEjecutandoTest] = useState(false);
    const [resultadoTest, setResultadoTest] = useState('');
    const [estadisticasGenerales, setEstadisticasGenerales] = useState({
        totalRegistros: 0,
        usuariosConUbicacion: 0,
        paisesDetectados: 0,
        ubicacionesHoy: 0
    });

    useEffect(() => {
        cargarEstadisticasGenerales();
    }, []);

    const cargarEstadisticasGenerales = async () => {
        try {
            // Conectamos con la tabla real de geolocalización
            const { data: registros, error } = await supabase
                .from('geolocalizacion_usuarios')
                .select('id, usuario_id, pais, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Tabla geolocalizacion_usuarios no encontrada o error de permisos');
            }

            const hoy = new Date().toISOString().split('T')[0];
            const registrosHoy = registros?.filter((r: any) => r.created_at.startsWith(hoy)) || [];
            const usuariosUnicos = new Set(registros?.map((r: any) => r.usuario_id) || []);
            const paisesUnicos = new Set(registros?.map((r: any) => r.pais) || []);

            setEstadisticasGenerales({
                totalRegistros: registros?.length || 0,
                usuariosConUbicacion: usuariosUnicos.size,
                paisesDetectados: paisesUnicos.size,
                ubicacionesHoy: registrosHoy.length
            });

        } catch (error) {
            console.error('Error cargando stats geo:', error);
        }
    };

    const probarRastreoManual = async () => {
        setEjecutandoTest(true);
        setResultadoTest('🔄 Probando rastreo de ubicación con ipapi.co...');

        try {
            console.log('🧪 [TEST] Iniciando prueba manual con ipapi.co...');

            // Usar el servicio profesional portado de Svelte
            const exito = await servicioGeolocalizacion.rastreoCompleto();

            if (exito) {
                setResultadoTest('🎉 ¡ÉXITO! Rastreo de ubicación completado con ipapi.co');
                // Recargar estadísticas después del test exitoso
                setTimeout(cargarEstadisticasGenerales, 1000);
            } else {
                setResultadoTest('❌ Error en el rastreo. Revisa la consola (F12) para más detalles.');
            }
        } catch (error: any) {
            console.error('❌ [TEST] Error en prueba:', error);
            setResultadoTest(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setEjecutandoTest(false);
        }
    };

    return (
        <div className="pestana-geolocalizacion">
            {/* ENCABEZADO PRINCIPAL */}
            <div className="geo-header-main">
                <div className="geo-titulo-principal">
                    <h2>🌍 Geolocalización Avanzada</h2>
                    <p>Ubicaciones y seguridad geográfica - Powered by ipapi.co (30K requests/mes gratis)</p>
                </div>

                {/* ESTADÍSTICAS RÁPIDAS */}
                <div className="geo-stats-grid">
                    <div className="geo-stat-card">
                        <div className="geo-stat-valor">{estadisticasGenerales.totalRegistros}</div>
                        <div className="geo-stat-label">Registros Total</div>
                    </div>
                    <div className="geo-stat-card">
                        <div className="geo-stat-valor">{estadisticasGenerales.usuariosConUbicacion}</div>
                        <div className="geo-stat-label">Usuarios Rastreados</div>
                    </div>
                    <div className="geo-stat-card">
                        <div className="geo-stat-valor">{estadisticasGenerales.paisesDetectados}</div>
                        <div className="geo-stat-label">Países Detectados</div>
                    </div>
                    <div className={`geo-stat-card geo-ubicaciones-hoy ${estadisticasGenerales.ubicacionesHoy > 0 ? 'activo' : ''}`}>
                        <div className="geo-stat-valor">{estadisticasGenerales.ubicacionesHoy}</div>
                        <div className="geo-stat-label">Ubicaciones Hoy</div>
                    </div>
                </div>
            </div>

            {/* NAVEGACIÓN DE PESTAÑAS */}
            <div className="geo-tabs-navegacion">
                <button
                    className={`geo-tab-btn ${vistaActiva === 'overview' ? 'activo' : ''}`}
                    onClick={() => setVistaActiva('overview')}
                >
                    <Gauge className="mr-2" size={20} />
                    Resumen General
                </button>

                <button
                    className={`geo-tab-btn ${vistaActiva === 'alertas' ? 'activo' : ''}`}
                    onClick={() => setVistaActiva('alertas')}
                >
                    <Shield className="mr-2" size={20} />
                    Alertas de Seguridad
                </button>

                <button
                    className={`geo-tab-btn ${vistaActiva === 'analytics' ? 'activo' : ''}`}
                    onClick={() => setVistaActiva('analytics')}
                >
                    <PieChart className="mr-2" size={20} />
                    Analytics Geográficos
                </button>

                <button
                    className={`geo-tab-btn ${vistaActiva === 'usuarios' ? 'activo' : ''}`}
                    onClick={() => setVistaActiva('usuarios')}
                >
                    <Users className="mr-2" size={20} />
                    Gestión de Usuarios
                </button>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="geo-content-area">
                {vistaActiva === 'overview' && (
                    <div className="vista-overview">
                        <div className="grid-overview" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                            {/* PANEL DE PRUEBAS */}
                            <div className="panel-pruebas" style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '2.5rem',
                                border: '2px solid #e2e8f0',
                                height: 'fit-content'
                            }}>
                                <h3 style={{ color: '#1a202c', margin: '0 0 1rem 0', fontWeight: 800 }}>🧪 Centro de Pruebas</h3>
                                <p style={{ color: '#4a5568', marginBottom: '2rem' }}>Herramientas para probar y verificar el sistema de geolocalización</p>

                                <div className="acciones-prueba" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button
                                        onClick={probarRastreoManual}
                                        disabled={ejecutandoTest}
                                        style={{
                                            background: '#3182ce', color: 'white', border: 'none', padding: '1rem',
                                            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {ejecutandoTest ? <RefreshCw className="animate-spin" /> : <Play />}
                                        {ejecutandoTest ? 'Probando...' : 'Probar Rastreo Manual'}
                                    </button>
                                </div>
                                {resultadoTest && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#2d3748' }}>
                                        {resultadoTest}
                                    </div>
                                )}
                            </div>

                            {/* WIDGET REAL */}
                            <GeolocalizacionUsuarios />
                        </div>
                    </div>
                )}

                {vistaActiva === 'alertas' && (
                    <AlertasSeguridadGeografica />
                )}

                {vistaActiva === 'analytics' && (
                    <AnalyticsGeograficos />
                )}

                {vistaActiva === 'usuarios' && (
                    <GeolocalizacionUsuarios />
                )}

                {/* Placeholder eliminado porque ya todas las secciones están implementadas */}
            </div>
        </div>
    );
};

export default PestanaGeolocalizacion;
