import React from 'react'
import {
    Users, UserPlus, Zap, BookOpen, Clock, TrendingUp,
    Settings, User, UserX
} from 'lucide-react'
import './PestanaUsuarios.css'
import { usePestanaUsuarios } from './usePestanaUsuarios'

const PestanaUsuarios: React.FC = () => {
    const {
        cargando, usuariosRecientes, estadisticas,
        irAGestionCompleta, irAUsuarioEspecifico,
        formatearFecha, formatearTiempo, obtenerEstadoUsuario,
        navigate
    } = usePestanaUsuarios()

    return (
        <div className="pu-container">
            <div className="pu-header">
                <h2>👥 Gestión de Usuarios</h2>
                <p>Estadísticas de usuarios y acceso rápido a la gestión completa</p>
            </div>

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
                        <div className="pu-empty-state">👥 No hay usuarios recientes</div>
                    ) : (
                        <div className="pu-users-grid">
                            {usuariosRecientes.map((usuario) => {
                                const estado = obtenerEstadoUsuario(usuario)
                                return (
                                    <div key={usuario.id} className="pu-user-card" onClick={() => irAUsuarioEspecifico(usuario.id)}>
                                        <div className="pu-user-avatar">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} />
                                            ) : (
                                                <div className="pu-avatar-placeholder"><User size={20} /></div>
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
                                )
                            })}
                        </div>
                    )}
                </div>

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
    )
}

export default PestanaUsuarios
