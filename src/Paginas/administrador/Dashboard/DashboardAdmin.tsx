import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import { actividadService } from '../../../servicios/actividadService';
import EstadisticasGenerales from './componentes/EstadisticasGenerales';
import PestanasAdministracion from './componentes/PestanasAdministracion';
import './DashboardAdmin.css';

const DashboardAdmin: React.FC = () => {
    const navigate = useNavigate();

    // Estados
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [ultimaActualizacion, setUltimaActualizacion] = useState('');

    // Datos
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [actividadReal, setActividadReal] = useState<any[]>([]);
    const [alumnosActivos, setAlumnosActivos] = useState<any[]>([]);

    // Refs para intervalos
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Efecto inicial
    useEffect(() => {
        cargarDatosCompletos();

        // Iniciar auto-refresh
        if (autoRefresh) {
            iniciarIntervalo();
        }

        return () => detenerIntervalo();
    }, []);

    // Efecto para toggle auto-refresh
    useEffect(() => {
        if (autoRefresh) {
            iniciarIntervalo();
        } else {
            detenerIntervalo();
        }
    }, [autoRefresh]);

    const iniciarIntervalo = () => {
        detenerIntervalo();
        intervalRef.current = setInterval(() => {
            console.log('🔄 [AUTO] Actualizando dashboard...');
            cargarDatosTiempoReal(); // Solo actualizamos lo ligero
        }, 10000);
    };

    const detenerIntervalo = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Carga de datos pesada (Estadísticas completas)
    const cargarDatosCompletos = async () => {
        try {
            setCargando(true);
            setError('');

            await Promise.all([
                cargarEstadisticas(),
                cargarDatosTiempoReal()
            ]);

            setUltimaActualizacion(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Error cargando dashboard:', err);
            setError('Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    // Carga ligera (Solo actividad y alumnos online)
    const cargarDatosTiempoReal = async () => {
        try {
            const [actividad, alumnos] = await Promise.all([
                actividadService.cargarActividadTiempoReal(),
                actividadService.cargarAlumnosActivos()
            ]);

            setActividadReal(actividad);
            setAlumnosActivos(alumnos);
            setUltimaActualizacion(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Error actualización tiempo real:', err);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            // 1. Perfiles y Suscripciones
            const { data: perfiles } = await supabase.from('perfiles').select('id, suscripcion');
            const totalEstudiantes = perfiles?.length || 0;
            const usuariosPremium = perfiles?.filter((p: any) => p.suscripcion && p.suscripcion !== 'free').length || 0;

            // 2. Contenido
            const { count: countCursos } = await supabase.from('cursos').select('*', { count: 'exact', head: true });
            const { count: countTutoriales } = await supabase.from('tutoriales').select('*', { count: 'exact', head: true });

            // 3. Ventas Mes
            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);

            const { data: pagos } = await supabase
                .from('pagos_epayco')
                .select('*')
                .gte('created_at', inicioMes.toISOString());

            const pagosReales = pagos || [];
            const ventasTotalesMes = pagosReales.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);

            // 4. Inscripciones recientes (30 días)
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            const { count: countInscripciones } = await supabase
                .from('inscripciones')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hace30Dias.toISOString());

            setEstadisticas({
                totalUsuarios: totalEstudiantes,
                usuariosPremium,
                totalContenido: (countCursos || 0) + (countTutoriales || 0),
                cursosActivos: countCursos || 0,
                tutorialesActivos: countTutoriales || 0,
                inscripcionesRecientes: countInscripciones || 0,
                porcentajePremium: totalEstudiantes > 0 ? Math.round((usuariosPremium / totalEstudiantes) * 100) : 0,
                ventasTotalesMes,
                transaccionesDelMes: pagosReales.length,
                pagosAceptados: pagosReales.filter(p => p.estado === 'aceptada').length,
                ventasCursos: pagosReales.filter(p => p.curso_id).length,
                ventasTutoriales: pagosReales.filter(p => p.tutorial_id).length
            });

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    return (
        <div className="dashboard-admin-page">
            <div className="encabezado-panel">
                <div className="info-panel">
                    <div className="icono-panel">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="detalles-panel">
                        <h1>Panel Administración</h1>
                        <p>Academia Vallenata Online • {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="ultima-actualizacion">
                            <i className="fas fa-clock"></i>
                            Última actualización: {ultimaActualizacion}
                        </p>
                    </div>
                </div>

                <div className="controles-panel">
                    <button
                        className={`boton-auto-refresh ${autoRefresh ? 'activo' : ''}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <i className="fas fa-sync-alt"></i>
                        Auto {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                    <button className="boton-refrescar" onClick={cargarDatosCompletos}>
                        <i className="fas fa-redo"></i>
                        Refrescar
                    </button>
                </div>
            </div>

            {error && (
                <div className="alerta-error">
                    <div className="contenido-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{error}</span>
                        <button className="boton-reintentar" onClick={cargarDatosCompletos}>Reintentar</button>
                    </div>
                </div>
            )}

            {cargando && !estadisticas ? (
                <div className="cargando-datos">
                    <div className="spinner-grande"></div>
                    <h3>Cargando estadísticas...</h3>
                    <p>Obteniendo métricas de la academia</p>
                </div>
            ) : (
                <div className="contenido-panel">
                    <EstadisticasGenerales
                        datos={estadisticas}
                        onClickCursos={() => navigate('/administrador/contenido')}
                        onClickUsuarios={() => navigate('/administrador/usuarios')}
                    />

                    <PestanasAdministracion
                        actividadTiempoReal={actividadReal}
                        alumnosActivos={alumnosActivos}
                        estadisticasGenerales={estadisticas}
                        onGestionarTodos={() => navigate('/administrador/usuarios')}
                    />
                </div>
            )}
        </div>
    );
};

export default DashboardAdmin;
