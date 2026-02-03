import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import {
    Users,
    UserPlus,
    Zap,
    BookOpen,
    Clock,
    TrendingUp,
    Settings,
    User,
    UserCheck,
    UserX,
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PestanaUsuarios.css';

interface EstadisticasUsuarios {
    totalUsuarios: number;
    nuevosEsteMes: number;
    activosUltimos7Dias: number;
    estudiantesActivos: number;
    administradores: number;
    usuariosConCursos: number;
    promedioTiempoPlataforma: number;
    tasaRetencion: number;
}

const PestanaUsuarios: React.FC = () => {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);
    const [usuariosRecientes, setUsuariosRecientes] = useState<any[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios>({
        totalUsuarios: 0,
        nuevosEsteMes: 0,
        activosUltimos7Dias: 0,
        estudiantesActivos: 0,
        administradores: 0,
        usuariosConCursos: 0,
        promedioTiempoPlataforma: 0,
        tasaRetencion: 0
    });

    useEffect(() => {
        cargarEstadisticasUsuarios();
    }, []);

    async function cargarEstadisticasUsuarios() {
        try {
            setCargando(true);
            console.log('👥 [USUARIOS] Cargando estadísticas...');

            await Promise.all([
                cargarEstadisticasGenerales(),
                cargarUsuariosRecientes()
            ]);

        } catch (error) {
            console.error('❌ [USUARIOS] Error:', error);
        } finally {
            setCargando(false);
        }
    }

    async function cargarEstadisticasGenerales() {
        // Total usuarios
        const { count: totalUsuarios } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .eq('eliminado', false);

        // Nuevos este mes
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const { count: nuevosEsteMes } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', inicioMes.toISOString())
            .eq('eliminado', false);

        // Activos últimos 7 días
        const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: activosUltimos7Dias } = await supabase
            .from('sesiones_usuario')
            .select('usuario_id', { count: 'exact', head: true })
            .gte('ultima_actividad', hace7Dias);

        // Estudiantes y administradores
        const { count: estudiantesActivos } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .eq('rol', 'estudiante')
            .eq('eliminado', false);

        const { count: administradores } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .eq('rol', 'administrador')
            .eq('eliminado', false);

        // Usuarios con cursos
        const { count: usuariosConCursos } = await supabase
            .from('inscripciones')
            .select('usuario_id', { count: 'exact', head: true });

        // Tiempo promedio en plataforma
        const { data: tiemposSesiones } = await supabase
            .from('sesiones_usuario')
            .select('tiempo_total_minutos')
            .not('tiempo_total_minutos', 'is', null);

        let promedioTiempoPlataforma = 0;
        if (tiemposSesiones && tiemposSesiones.length > 0) {
            const tiempoTotal = tiemposSesiones.reduce((sum, s) => sum + (s.tiempo_total_minutos || 0), 0);
            promedioTiempoPlataforma = Math.round(tiempoTotal / tiemposSesiones.length);
        }

        // Tasa de retención (usuarios activos en los últimos 30 días vs total)
        const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: activosUltimos30Dias } = await supabase
            .from('sesiones_usuario')
            .select('usuario_id', { count: 'exact', head: true })
            .gte('ultima_actividad', hace30Dias);

        const tasaRetencion = (totalUsuarios ?? 0) > 0 ? Math.round(((activosUltimos30Dias ?? 0) / (totalUsuarios ?? 1)) * 100) : 0;

        setEstadisticas({
            totalUsuarios: totalUsuarios || 0,
            nuevosEsteMes: nuevosEsteMes || 0,
            activosUltimos7Dias: activosUltimos7Dias || 0,
            estudiantesActivos: estudiantesActivos || 0,
            administradores: administradores || 0,
            usuariosConCursos: usuariosConCursos || 0,
            promedioTiempoPlataforma,
            tasaRetencion
        });
    }

    async function cargarUsuariosRecientes() {
        const { data: usuarios } = await supabase
            .from('perfiles')
            .select(`
                id, nombre, apellido, correo_electronico, rol, created_at, url_foto_perfil,
                sesiones_usuario!left(ultima_actividad, esta_activo)
            `)
            .eq('eliminado', false)
            .order('created_at', { ascending: false })
            .limit(8);

        setUsuariosRecientes(usuarios || []);
    }

    function irAGestionCompleta() {
        navigate('/administrador/usuarios');
    }

    function irAUsuarioEspecifico(usuarioId: string) {
        window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }

    function formatearTiempo(minutos: number): string {
        if (minutos < 60) return `${minutos}m`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}m`;
    }

    function obtenerEstadoUsuario(usuario: any): { texto: string; color: string } {
        if (!usuario.sesiones_usuario || usuario.sesiones_usuario.length === 0) {
            return { texto: 'Sin actividad', color: '#6b7280' };
        }

        // Handle the case where sesiones_usuario might be an array or single object depending on query
        const sesion = Array.isArray(usuario.sesiones_usuario)
            ? usuario.sesiones_usuario[0]
            : usuario.sesiones_usuario;

        if (!sesion) return { texto: 'Sin actividad', color: '#6b7280' };

        if (sesion.esta_activo) {
            return { texto: 'En línea', color: '#10b981' };
        }

        const ultimaActividad = new Date(sesion.ultima_actividad);
        const horasDesdeActividad = (Date.now() - ultimaActividad.getTime()) / (1000 * 60 * 60);

        if (horasDesdeActividad < 1) {
            return { texto: 'Hace poco', color: '#f59e0b' };
        } else if (horasDesdeActividad < 24) {
            return { texto: 'Hoy', color: '#3b82f6' };
        } else {
            return { texto: 'Inactivo', color: '#6b7280' };
        }
    }

    return (
        <div className="pu-container">
            <div className="pu-header">
                <h2>👥 Gestión de Usuarios</h2>
                <p>Estadísticas de usuarios y acceso rápido a la gestión completa</p>
            </div>

            {/* ESTADÍSTICAS PRINCIPALES */}
            <div className="pu-stats-grid">
                <div className="pu-stat-card">
                    <Users className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{estadisticas.totalUsuarios}</div>
                        <div className="pu-stat-label">Total Usuarios</div>
                    </div>
                </div>
                <div className="pu-stat-card">
                    <UserPlus className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{estadisticas.nuevosEsteMes}</div>
                        <div className="pu-stat-label">Nuevos Este Mes</div>
                    </div>
                </div>
                <div className="pu-stat-card">
                    <Zap className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{estadisticas.activosUltimos7Dias}</div>
                        <div className="pu-stat-label">Activos (7 días)</div>
                    </div>
                </div>
                <div className="pu-stat-card">
                    <BookOpen className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{estadisticas.usuariosConCursos}</div>
                        <div className="pu-stat-label">Con Cursos</div>
                    </div>
                </div>
                <div className="pu-stat-card">
                    <Clock className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{formatearTiempo(estadisticas.promedioTiempoPlataforma)}</div>
                        <div className="pu-stat-label">Tiempo Promedio</div>
                    </div>
                </div>
                <div className="pu-stat-card">
                    <TrendingUp className="pu-stat-icon" />
                    <div className="pu-stat-info">
                        <div className="pu-stat-number">{estadisticas.tasaRetencion}%</div>
                        <div className="pu-stat-label">Tasa Retención</div>
                    </div>
                </div>
            </div>

            <div className="pu-content-grid">
                {/* USUARIOS RECIENTES */}
                <div className="pu-section-recents">
                    <div className="pu-section-header">
                        <h3>🆕 Usuarios Recientes</h3>
                        <button className="pu-btn-full-mgmt" onClick={irAGestionCompleta}>
                            <Settings size={16} />
                            Gestión Completa
                        </button>
                    </div>

                    {cargando ? (
                        <div className="pu-loading">
                            <div className="pu-spinner"></div>
                            <p>Cargando usuarios...</p>
                        </div>
                    ) : usuariosRecientes.length === 0 ? (
                        <div className="pu-empty-state">
                            👥 No hay usuarios recientes
                        </div>
                    ) : (
                        <div className="pu-users-grid">
                            {usuariosRecientes.map((usuario) => {
                                const estado = obtenerEstadoUsuario(usuario);
                                return (
                                    <div key={usuario.id} className="pu-user-card" onClick={() => irAUsuarioEspecifico(usuario.id)}>
                                        <div className="pu-user-avatar">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} />
                                            ) : (
                                                <div className="pu-avatar-placeholder">
                                                    <User size={20} />
                                                </div>
                                            )}
                                            <div className="pu-status-indicator" style={{ backgroundColor: estado.color }}></div>
                                        </div>

                                        <div className="pu-user-info">
                                            <div className="pu-user-name">{usuario.nombre} {usuario.apellido}</div>
                                            <div className="pu-user-email">{usuario.correo_electronico}</div>
                                            <div className="pu-user-meta">
                                                <span className="pu-user-role">{usuario.rol}</span>
                                                <span className="pu-user-status-text" style={{ color: estado.color }}>{estado.texto}</span>
                                            </div>
                                            <div className="pu-user-date">Registrado: {formatearFecha(usuario.created_at)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ACCIONES RÁPIDAS */}
                <div className="pu-actions-section">
                    <h3>⚡ Acciones Rápidas</h3>

                    <div className="pu-actions-list">
                        <button className="pu-action-card" onClick={() => navigate('/administrador/usuarios')}>
                            <Users className="pu-action-icon" />
                            <div className="pu-action-info">
                                <div className="pu-action-title">Gestionar Usuarios</div>
                                <div className="pu-action-desc">Ver todos los usuarios registrados</div>
                            </div>
                        </button>

                        <button className="pu-action-card" onClick={() => navigate('/administrador/usuarios?filtro=nuevos')}>
                            <UserPlus className="pu-action-icon" />
                            <div className="pu-action-info">
                                <div className="pu-action-title">Usuarios Nuevos</div>
                                <div className="pu-action-desc">Revisar registros recientes</div>
                            </div>
                        </button>

                        <button className="pu-action-card" onClick={() => navigate('/administrador/usuarios?filtro=inactivos')}>
                            <UserX className="pu-action-icon" />
                            <div className="pu-action-info">
                                <div className="pu-action-title">Usuarios Inactivos</div>
                                <div className="pu-action-desc">Identificar usuarios sin actividad</div>
                            </div>
                        </button>

                        <button className="pu-action-card" onClick={() => navigate('/administrador/usuarios')}>
                            <BookOpen className="pu-action-icon" />
                            <div className="pu-action-info">
                                <div className="pu-action-title">Asignar Cursos</div>
                                <div className="pu-action-desc">Inscribir usuarios en paquetes</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PestanaUsuarios;
