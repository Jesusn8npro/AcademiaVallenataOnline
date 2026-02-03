import React, { useState, useEffect } from 'react';
import './GeolocalizacionUsuarios.css';
import { supabase } from '../../../../servicios/supabaseCliente';
import { RefreshCw, MapPin } from 'lucide-react';

interface UbicacionUsuario {
    usuario_id: string;
    usuario_nombre: string;
    ip: string;
    pais: string;
    ciudad: string;
    bandera_url: string;
    ultima_visita: string;
    visitas_totales: number;
}

interface Estadisticas {
    totalUsuarios: number;
    paisesUnicos: number;
    totalVisitas: number;
    paisesPrincipales: Array<{ pais: string, total_usuarios: number }>;
}

const GeolocalizacionUsuarios: React.FC = () => {
    // Variables de estado
    const [ubicaciones, setUbicaciones] = useState<UbicacionUsuario[]>([]);
    const [estadisticas, setEstadisticas] = useState<Estadisticas>({
        totalUsuarios: 0,
        paisesUnicos: 0,
        totalVisitas: 0,
        paisesPrincipales: []
    });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [hayDatosReales, setHayDatosReales] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');

            await Promise.all([
                cargarUbicaciones(),
                // Estadísticas simples calculadas en el cliente por ahora para no depender de RPCs complejos
            ]);

        } catch (err) {
            setError('Error cargando datos de geolocalización');
        } finally {
            setCargando(false);
        }
    };

    const cargarUbicaciones = async () => {
        try {
            // Obtener ubicaciones desde Supabase
            const { data: geoData, error: geoError } = await supabase
                .from('geolocalizacion_usuarios')
                .select('*')
                .order('ultima_visita', { ascending: false })
                .limit(10);

            if (geoError) {
                console.error('❌ [GEO-WIDGET] Error en consulta:', geoError);
                return;
            }

            if (!geoData || geoData.length === 0) {
                console.log('📋 [GEO-WIDGET] No hay datos de geolocalización');
                setUbicaciones([]);
                setHayDatosReales(false);
                return;
            }

            // Obtener información de usuarios
            const usuarioIds = geoData.map((g: any) => g.usuario_id);
            const { data: perfiles, error: perfilError } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido')
                .in('id', usuarioIds);

            if (perfilError) {
                console.error('❌ [GEO-WIDGET] Error consultando perfiles:', perfilError);
            }

            // Combinar datos
            const ubicacionesProcesadas = geoData.map((geo: any) => {
                const perfil = perfiles?.find(p => p.id === geo.usuario_id);
                const nombreCompleto = perfil
                    ? `${perfil.nombre} ${perfil.apellido}`
                    : 'Usuario';

                return {
                    usuario_id: geo.usuario_id,
                    usuario_nombre: nombreCompleto,
                    ip: geo.ip,
                    pais: geo.pais || 'Desconocido',
                    ciudad: geo.ciudad || 'Desconocida',
                    bandera_url: geo.bandera_url || `https://flagcdn.com/32x24/xx.png`,
                    ultima_visita: geo.ultima_visita,
                    visitas_totales: geo.visitas_totales || 1
                };
            });

            setUbicaciones(ubicacionesProcesadas);
            setHayDatosReales(true);

            // Calcular estadísticas básicas en cliente
            const paisesUnicos = new Set(geoData.map((g: any) => g.pais)).size;
            const totalVisitas = geoData.reduce((sum: number, g: any) => sum + (g.visitas_totales || 1), 0);

            // Agrupar por país
            const paisesCount: Record<string, number> = {};
            geoData.forEach((g: any) => {
                paisesCount[g.pais] = (paisesCount[g.pais] || 0) + 1;
            });
            const paisesPrincipales = Object.entries(paisesCount)
                .map(([pais, count]) => ({ pais, total_usuarios: count }))
                .sort((a, b) => b.total_usuarios - a.total_usuarios)
                .slice(0, 5);

            setEstadisticas({
                totalUsuarios: geoData.length,
                paisesUnicos,
                totalVisitas,
                paisesPrincipales
            });

            console.log('✅ [GEO-WIDGET] Datos cargados:', ubicacionesProcesadas.length, 'ubicaciones');

        } catch (error) {
            console.error('❌ [GEO-WIDGET] Error cargando ubicaciones:', error);
        }
    };

    const formatearTiempoRelativo = (fecha: string): string => {
        const ahora = new Date();
        const fechaVisita = new Date(fecha);
        const diferencia = ahora.getTime() - fechaVisita.getTime();
        const minutos = Math.floor(diferencia / (1000 * 60));

        if (minutos < 1) return 'Ahora mismo';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `${horas}h`;
        return fechaVisita.toLocaleDateString('es-ES');
    };

    return (
        <div className="widget-geolocalizacion">
            {/* HEADER */}
            <div className="widget-header">
                <div className="header-info">
                    <h3>🌍 Geolocalización de Usuarios</h3>
                    <p className="header-subtitle">
                        {hayDatosReales ? (
                            <>
                                <span className="badge-real" style={{ marginRight: '8px' }}>DATOS REALES</span>
                                Ubicaciones reales de usuarios conectados
                            </>
                        ) : (
                            <>
                                <span className="badge-vacio" style={{ marginRight: '8px' }}>SIN DATOS</span>
                                Esperando usuarios con geolocalización
                            </>
                        )}
                    </p>
                </div>

                <div className="header-acciones">
                    <button className="btn-actualizar" onClick={cargarDatos} disabled={cargando}>
                        <RefreshCw className={cargando ? 'animate-spin' : ''} size={18} />
                        Actualizar
                    </button>
                </div>
            </div>

            {cargando && !hayDatosReales ? (
                <div className="estado-carga">
                    <div className="spinner-widget"></div>
                    <p>Cargando datos de geolocalización...</p>
                </div>
            ) : error ? (
                <div className="estado-error">
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    {/* ESTADÍSTICAS */}
                    <div className="estadisticas-grid">
                        <div className="stat-card-widget">
                            <div className="stat-numero-widget">{estadisticas.totalUsuarios}</div>
                            <div className="stat-label-widget">Usuarios</div>
                        </div>
                        <div className="stat-card-widget">
                            <div className="stat-numero-widget">{estadisticas.paisesUnicos}</div>
                            <div className="stat-label-widget">Países</div>
                        </div>
                        <div className="stat-card-widget">
                            <div className="stat-numero-widget">{estadisticas.totalVisitas}</div>
                            <div className="stat-label-widget">Visitas</div>
                        </div>
                    </div>

                    {/* LISTA DE UBICACIONES */}
                    <div className="ubicaciones-contenedor">
                        <h4>📍 Ubicaciones Recientes ({ubicaciones.length})</h4>

                        {ubicaciones.length > 0 ? (
                            <div className="ubicaciones-lista">
                                {ubicaciones.map((ubicacion) => (
                                    <div key={ubicacion.usuario_id} className="ubicacion-item">
                                        <div className="usuario-info">
                                            <div className="usuario-avatar">
                                                {ubicacion.usuario_nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="usuario-detalles">
                                                <div className="usuario-nombre">{ubicacion.usuario_nombre}</div>
                                                <div className="usuario-ip">{ubicacion.ip}</div>
                                            </div>
                                        </div>

                                        <div className="ubicacion-geo">
                                            <div className="geo-principal">
                                                <img src={ubicacion.bandera_url} alt={ubicacion.pais} className="bandera" />
                                                <span className="ubicacion-texto">{ubicacion.ciudad}, {ubicacion.pais}</span>
                                            </div>
                                            <div className="geo-tiempo">
                                                {formatearTiempoRelativo(ubicacion.ultima_visita)} • {ubicacion.visitas_totales} visitas
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sin-datos">
                                <div className="sin-datos-icono">🌍</div>
                                <h4>No hay datos de geolocalización</h4>
                                <p>Las ubicaciones aparecerán cuando los usuarios visiten el sitio.</p>
                                <p><strong>✅ El tracking automático está activado con ipapi.co</strong></p>
                            </div>
                        )}
                    </div>

                    {/* PAÍSES PRINCIPALES */}
                    {estadisticas.paisesPrincipales.length > 0 && (
                        <div className="paises-principales">
                            <h4>🏆 Países Principales</h4>
                            <div className="paises-lista">
                                {estadisticas.paisesPrincipales.map((pais, index) => (
                                    <div key={index} className="pais-item">
                                        <div className="pais-info">
                                            <img
                                                src={`https://flagcdn.com/24x18/${pais.pais.slice(0, 2).toLowerCase()}.png`}
                                                alt={pais.pais}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <span className="pais-nombre">{pais.pais}</span>
                                        </div>
                                        <div className="pais-usuarios">{pais.total_usuarios} usuarios</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GeolocalizacionUsuarios;
