import { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/clienteSupabase';
import { leerCacheStale, guardarCache } from '../../../../utilidades/cacheLocal';
import './SidebarResumenAdmin.css';

interface Stats {
    totalCursos: number;
    totalTutoriales: number;
    cursosPublicados: number;
    tutorialesPublicados: number;
    cursosRecientes: any[];
    tutorialesRecientes: any[];
}

const SidebarResumenAdmin = () => {
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalCursos: 0,
        totalTutoriales: 0,
        cursosPublicados: 0,
        tutorialesPublicados: 0,
        cursosRecientes: [],
        tutorialesRecientes: []
    });

    useEffect(() => {
        cargarEstadisticas();
        // Auto-refresh cada 5 minutos
        const interval = setInterval(cargarEstadisticas, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const cargarEstadisticas = async () => {
        try {
            // Stale-while-revalidate: mostrar cache al instante mientras refrescamos
            const cached = leerCacheStale<Stats>('sidebar-resumen-admin');
            if (cached) {
                setStats(cached);
                setCargando(false);
            }

            // Promise.allSettled + timeout: si una query falla, las otras igual cargan.
            // Antes con Promise.all, una falla dejaba los counts en 0.
            const withTimeout = <T,>(p: PromiseLike<T>): Promise<T> => Promise.race([
                Promise.resolve(p),
                new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
            ]);

            const results = await Promise.allSettled([
                withTimeout(supabase.from('cursos').select('*', { count: 'exact', head: true })),
                withTimeout(supabase.from('tutoriales').select('*', { count: 'exact', head: true })),
                withTimeout(supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('estado', 'publicado')),
                withTimeout(supabase.from('tutoriales').select('*', { count: 'exact', head: true }).eq('estado', 'publicado')),
                withTimeout(supabase.from('cursos').select('id, titulo, estado, created_at').order('created_at', { ascending: false }).limit(3)),
                withTimeout(supabase.from('tutoriales').select('id, titulo, estado, created_at').order('created_at', { ascending: false }).limit(3)),
            ]);
            const val = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as any).value : null;

            const nuevasStats: Stats = {
                totalCursos: val(0)?.count || 0,
                totalTutoriales: val(1)?.count || 0,
                cursosPublicados: val(2)?.count || 0,
                tutorialesPublicados: val(3)?.count || 0,
                cursosRecientes: val(4)?.data || [],
                tutorialesRecientes: val(5)?.data || [],
            };
            setStats(nuevasStats);
            guardarCache('sidebar-resumen-admin', nuevasStats);
        } catch (error) {
        } finally {
            setCargando(false);
        }
    };

    const formatearFecha = (fecha: string) => {
        const ahora = new Date();
        const fechaItem = new Date(fecha);
        const diffTiempo = ahora.getTime() - fechaItem.getTime();
        const diffDias = Math.ceil(diffTiempo / (1000 * 3600 * 24));

        if (diffDias === 1) return 'Ayer';
        if (diffDias < 7) return `Hace ${diffDias} días`;
        return fechaItem.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
        });
    };

    const totalContenido = stats.totalCursos + stats.totalTutoriales;
    const totalPublicados = stats.cursosPublicados + stats.tutorialesPublicados;
    const porcentaje = totalContenido > 0 ? Math.round((totalPublicados / totalContenido) * 100) : 0;

    if (cargando) {
        return (
            <div className="sidebar-admin-resumen">
                <div className="sidebar-admin-loading">
                    <div className="sidebar-admin-skeleton"></div>
                    <div className="sidebar-admin-skeleton"></div>
                    <div className="sidebar-admin-skeleton"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="sidebar-admin-resumen">
            {/* Panel de Control */}
            <div className="sidebar-admin-panel-control">
                <div className="sidebar-admin-panel-header">
                    <h3>📊 Panel de Control</h3>
                    <span className="sidebar-admin-actualizado">🔄 Actualizado ahora</span>
                </div>
            </div>

            {/* Resumen General */}
            <div className="sidebar-admin-widget">
                <h4>📈 Resumen General</h4>

                <div className="sidebar-admin-stat-item">
                    <div className="sidebar-admin-stat-icon">📚</div>
                    <div className="sidebar-admin-stat-info">
                        <span className="sidebar-admin-stat-number">{stats.totalCursos}</span>
                        <span className="sidebar-admin-stat-label">Cursos Totales</span>
                        <span className="sidebar-admin-stat-trend">📈 +0 esta semana</span>
                    </div>
                </div>

                <div className="sidebar-admin-stat-item">
                    <div className="sidebar-admin-stat-icon">🎥</div>
                    <div className="sidebar-admin-stat-info">
                        <span className="sidebar-admin-stat-number">{stats.totalTutoriales}</span>
                        <span className="sidebar-admin-stat-label">Tutoriales Totales</span>
                        <span className="sidebar-admin-stat-trend">📈 +0 esta semana</span>
                    </div>
                </div>

                <div className="sidebar-admin-stat-item">
                    <div className="sidebar-admin-stat-icon">👥</div>
                    <div className="sidebar-admin-stat-info">
                        <span className="sidebar-admin-stat-number">0</span>
                        <span className="sidebar-admin-stat-label">Estudiantes Activos</span>
                        <span className="sidebar-admin-stat-trend">📈 +0 esta semana</span>
                    </div>
                </div>
            </div>

            {/* Progreso de Publicación */}
            <div className="sidebar-admin-widget">
                <h4>🎯 Progreso de Publicación</h4>

                <div className="sidebar-admin-progreso-principal">
                    <span className="sidebar-admin-progreso-numero">{porcentaje}%</span>
                    <span className="sidebar-admin-progreso-texto">Contenido publicado</span>
                </div>

                <div className="sidebar-admin-barra-progreso">
                    <div className="sidebar-admin-progreso-fill" style={{ width: `${porcentaje}%` }}></div>
                </div>

                <div className="sidebar-admin-progreso-detalles">
                    <div className="sidebar-admin-detalle-item">
                        <span className="sidebar-admin-bullet sidebar-admin-bullet-green"></span>
                        <span>{stats.cursosPublicados} cursos publicados</span>
                    </div>
                    <div className="sidebar-admin-detalle-item">
                        <span className="sidebar-admin-bullet sidebar-admin-bullet-blue"></span>
                        <span>{stats.tutorialesPublicados} tutoriales publicados</span>
                    </div>
                </div>
            </div>

            {/* Actividad Reciente */}
            <div className="sidebar-admin-widget">
                <h4>🕐 Actividad Reciente</h4>

                {stats.tutorialesRecientes.length > 0 && (
                    <div className="sidebar-admin-actividad-seccion">
                        <h5>🎥 Tutoriales recientes</h5>
                        {stats.tutorialesRecientes.map((tutorial) => (
                            <div key={tutorial.id} className="sidebar-admin-item-reciente">
                                <div className="sidebar-admin-item-info">
                                    <span className="sidebar-admin-item-titulo">{tutorial.titulo}</span>
                                    <span className="sidebar-admin-item-fecha">{formatearFecha(tutorial.created_at)}</span>
                                </div>
                                <span className={`sidebar-admin-item-estado ${tutorial.estado === 'publicado' ? 'sidebar-admin-publicado' : 'sidebar-admin-borrador'}`}>
                                    {tutorial.estado === 'publicado' ? '✅' : '📝'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {stats.cursosRecientes.length > 0 && (
                    <div className="sidebar-admin-actividad-seccion">
                        <h5>📚 Cursos recientes</h5>
                        {stats.cursosRecientes.map((curso) => (
                            <div key={curso.id} className="sidebar-admin-item-reciente">
                                <div className="sidebar-admin-item-info">
                                    <span className="sidebar-admin-item-titulo">{curso.titulo}</span>
                                    <span className="sidebar-admin-item-fecha">{formatearFecha(curso.created_at)}</span>
                                </div>
                                <span className={`sidebar-admin-item-estado ${curso.estado === 'publicado' ? 'sidebar-admin-publicado' : 'sidebar-admin-borrador'}`}>
                                    {curso.estado === 'publicado' ? '✅' : '📝'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="sidebar-admin-refresh-info">
                    🔄 Datos en tiempo real
                </div>
            </div>
        </div>
    );
};

export default SidebarResumenAdmin;
