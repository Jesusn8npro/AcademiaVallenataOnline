import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import DetectorRetencion from './DetectorRetencion';
import { RefreshCw, MessageCircle, Eye, Clock, BookOpen, Timer, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import './PestanaRetencion.css';

interface UsuarioInactivo {
    id: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    ultima_actividad: string;
    dias_inactivo: number;
    riesgo: 'alto' | 'medio' | 'bajo';
    tiempo_total_plataforma: number;
    cursos_inscritos: number;
    razon_principal: string;
}

const PestanaRetencion = () => {
    const [usuariosInactivos, setUsuariosInactivos] = useState<UsuarioInactivo[]>([]);
    const [cargandoUsuariosInactivos, setCargandoUsuariosInactivos] = useState(false);
    const [estadisticasRetencion, setEstadisticasRetencion] = useState({
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosInactivos: 0,
        tasaRetencion: 0,
        usuariosRiesgoAlto: 0,
        usuariosRiesgoMedio: 0
    });

    useEffect(() => {
        cargarUsuariosInactivos();
    }, []);

    const cargarUsuariosInactivos = async () => {
        try {
            setCargandoUsuariosInactivos(true);
            console.log('⚠️ [RETENCIÓN] Cargando usuarios inactivos...');

            const { data: usuariosConActividad } = await supabase
                .from('perfiles')
                .select(`
                  id, nombre, apellido, correo_electronico, created_at,
                  sesiones_usuario!left(ultima_actividad, tiempo_total_minutos),
                  inscripciones(id)
                `)
                .eq('eliminado', false)
                .eq('rol', 'estudiante');

            if (!usuariosConActividad) return;

            const usuariosInactivosProcesados: UsuarioInactivo[] = [];
            let activosCount = 0;

            for (const usuario of usuariosConActividad) {
                // Ajuste para TS:
                const sesion = Array.isArray(usuario.sesiones_usuario) ? usuario.sesiones_usuario[0] : usuario.sesiones_usuario;

                const ultimaActividad = sesion?.ultima_actividad || usuario.created_at;
                const diasInactivo = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24));

                if (diasInactivo >= 7) {
                    const tiempoTotal = sesion?.tiempo_total_minutos || 0;
                    const cursosInscritos = Array.isArray(usuario.inscripciones) ? usuario.inscripciones.length : 0;

                    let riesgo: 'alto' | 'medio' | 'bajo' = 'bajo';
                    let razonPrincipal = 'Baja actividad general';

                    if (diasInactivo > 30) {
                        riesgo = 'alto';
                        razonPrincipal = 'Más de 30 días sin actividad';
                    } else if (diasInactivo > 14) {
                        riesgo = 'medio';
                        razonPrincipal = 'Más de 2 semanas sin actividad';
                    }

                    if (cursosInscritos === 0) {
                        riesgo = 'alto';
                        razonPrincipal = 'No tiene cursos asignados';
                    } else if (tiempoTotal < 30) {
                        if (riesgo === 'bajo') riesgo = 'medio';
                        razonPrincipal = 'Poco tiempo de uso de la plataforma';
                    }

                    usuariosInactivosProcesados.push({
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo_electronico: usuario.correo_electronico,
                        ultima_actividad: ultimaActividad,
                        dias_inactivo: diasInactivo,
                        riesgo,
                        tiempo_total_plataforma: tiempoTotal,
                        cursos_inscritos: cursosInscritos,
                        razon_principal: razonPrincipal
                    });
                } else {
                    activosCount++;
                }
            }

            const usuariosOrdenados = usuariosInactivosProcesados.sort((a, b) => {
                const riesgoOrder = { alto: 3, medio: 2, bajo: 1 };
                if (riesgoOrder[a.riesgo] !== riesgoOrder[b.riesgo]) {
                    return riesgoOrder[b.riesgo] - riesgoOrder[a.riesgo];
                }
                return b.dias_inactivo - a.dias_inactivo;
            });

            setUsuariosInactivos(usuariosOrdenados);

            setEstadisticasRetencion({
                totalUsuarios: usuariosConActividad.length,
                usuariosActivos: activosCount,
                usuariosInactivos: usuariosOrdenados.length,
                tasaRetencion: Math.round((activosCount / usuariosConActividad.length) * 100) || 0,
                usuariosRiesgoAlto: usuariosOrdenados.filter(u => u.riesgo === 'alto').length,
                usuariosRiesgoMedio: usuariosOrdenados.filter(u => u.riesgo === 'medio').length
            });

        } catch (error) {
            console.error('❌ [RETENCIÓN] Error:', error);
        } finally {
            setCargandoUsuariosInactivos(false);
        }
    };

    const obtenerColorRiesgo = (riesgo: string) => {
        switch (riesgo) {
            case 'alto': return '#ef4444';
            case 'medio': return '#f59e0b';
            case 'bajo': return '#10b981';
            default: return '#6b7280';
        }
    };

    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        const ahora = new Date();
        const diffDias = Math.floor((ahora.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias === 0) return 'Hoy';
        if (diffDias === 1) return 'Ayer';
        if (diffDias < 7) return `Hace ${diffDias} días`;
        if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
        return `Hace ${Math.floor(diffDias / 30)} meses`;
    };

    const contactarUsuario = (usuario: UsuarioInactivo) => {
        const mensaje = `Hola ${usuario.nombre}, hemos notado que no has estado activo en nuestra academia. ¿Podemos ayudarte con algo?`;
        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const verDetallesUsuario = (usuarioId: string) => {
        // window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
        console.log("Ver detalles de", usuarioId);
    };

    return (
        <div className="pr-container">
            <div className="pr-header">
                <h2>🎯 Herramientas de Retención</h2>
                <p>Detecta usuarios en riesgo y gestiona estrategias de retención</p>
            </div>

            {/* ESTADÍSTICAS DE RETENCIÓN */}
            <div className="pr-stats-grid">
                <div className="pr-stat-card activos">
                    <div className="stat-numero">{estadisticasRetencion.usuariosActivos}</div>
                    <div className="stat-label">👥 Usuarios Activos</div>
                </div>
                <div className="pr-stat-card inactivos">
                    <div className="stat-numero">{estadisticasRetencion.usuariosInactivos}</div>
                    <div className="stat-label">😴 Usuarios Inactivos</div>
                </div>
                <div className="pr-stat-card retencion">
                    <div className="stat-numero">{estadisticasRetencion.tasaRetencion}%</div>
                    <div className="stat-label">📈 Tasa de Retención</div>
                </div>
                <div className="pr-stat-card riesgo-alto">
                    <div className="stat-numero">{estadisticasRetencion.usuariosRiesgoAlto}</div>
                    <div className="stat-label">🚨 Riesgo Alto</div>
                </div>
            </div>

            <div className="pr-content">
                {/* DETECTOR DE RETENCIÓN ORIGINAL */}
                <div className="seccion-detector">
                    <DetectorRetencion />
                </div>

                {/* USUARIOS INACTIVOS REALES */}
                <div className="pr-inactivos-section">
                    <div className="pr-inactivos-header">
                        <h3>👥 Usuarios Inactivos (Datos Reales)</h3>
                        <button className="pr-btn-refresh" onClick={cargarUsuariosInactivos} disabled={cargandoUsuariosInactivos}>
                            <RefreshCw size={14} className={cargandoUsuariosInactivos ? 'pr-spinning' : ''} style={{ marginRight: '0.5rem' }} />
                            Actualizar
                        </button>
                    </div>

                    {cargandoUsuariosInactivos ? (
                        <div className="pr-loading">
                            <div className="pr-spinner"></div>
                            <p>Analizando usuarios inactivos...</p>
                        </div>
                    ) : usuariosInactivos.length === 0 ? (
                        <div className="pr-empty-state">
                            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                            <div>🎉 ¡Excelente! No hay usuarios inactivos</div>
                        </div>
                    ) : (
                        <div className="pr-users-list">
                            {usuariosInactivos.map((usuario) => (
                                <div key={usuario.id} className="pr-user-card">
                                    <div className="pr-user-info">
                                        <div className="pr-user-header">
                                            <div className="pr-user-name">{usuario.nombre} {usuario.apellido}</div>
                                            <div
                                                className="pr-risk-badge"
                                                style={{
                                                    backgroundColor: `${obtenerColorRiesgo(usuario.riesgo)}20`,
                                                    color: obtenerColorRiesgo(usuario.riesgo),
                                                    border: `1px solid ${obtenerColorRiesgo(usuario.riesgo)}40`
                                                }}
                                            >
                                                {usuario.riesgo === 'alto' && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                                                {usuario.riesgo === 'medio' && <HelpCircle size={12} style={{ marginRight: 4 }} />}
                                                {usuario.riesgo === 'bajo' && <CheckCircle size={12} style={{ marginRight: 4 }} />}
                                                RIESGO {usuario.riesgo.toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="pr-user-email">{usuario.correo_electronico}</div>

                                        <div className="pr-user-stats">
                                            <div className="pr-stat-item">
                                                <Clock size={14} className="pr-stat-icon" />
                                                <span>Inactivo {usuario.dias_inactivo} días</span>
                                            </div>
                                            <div className="pr-stat-item">
                                                <BookOpen size={14} className="pr-stat-icon" />
                                                <span>{usuario.cursos_inscritos} cursos</span>
                                            </div>
                                            <div className="pr-stat-item">
                                                <Timer size={14} className="pr-stat-icon" />
                                                <span>{usuario.tiempo_total_plataforma}m total</span>
                                            </div>
                                        </div>

                                        <div className="pr-reason">
                                            <strong>Razón:</strong> {usuario.razon_principal}
                                        </div>

                                        <div className="pr-last-activity">
                                            <strong>Última actividad:</strong> {formatearFecha(usuario.ultima_actividad)}
                                        </div>
                                    </div>

                                    <div className="pr-user-actions">
                                        <button className="pr-btn-contact" onClick={() => contactarUsuario(usuario)}>
                                            <MessageCircle size={16} />
                                            Contactar
                                        </button>
                                        <button className="pr-btn-details" onClick={() => verDetallesUsuario(usuario.id)}>
                                            <Eye size={16} />
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PestanaRetencion;
