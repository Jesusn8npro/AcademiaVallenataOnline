import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import { RefreshCw, Eye, EyeOff, User, MessageCircle } from 'lucide-react';
import './DetectorRetencion.css';

interface UsuarioEnRiesgo {
    id: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    suscripcion: string;
    puntuacionRiesgo: number;
    motivos: string[];
    ultimaActividad: string;
    diasInactivo: number;
    cursosCompletados: number;
    progresoPromedio: number;
    url_foto_perfil?: string;
}

const DetectorRetencion = () => {
    const [usuariosEnRiesgo, setUsuariosEnRiesgo] = useState<UsuarioEnRiesgo[]>([]);
    const [cargando, setCargando] = useState(false);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [estadisticas, setEstadisticas] = useState({
        totalEnRiesgo: 0,
        riesgoAlto: 0,
        riesgoMedio: 0,
        riesgoBajo: 0
    });

    useEffect(() => {
        detectarUsuariosEnRiesgo();
    }, []);

    const detectarUsuariosEnRiesgo = async () => {
        try {
            setCargando(true);
            console.log('🎯 [RETENCIÓN] Iniciando análisis de riesgo...');

            const { data: usuarios } = await supabase
                .from('perfiles')
                .select(`
                  id, nombre, apellido, correo_electronico, suscripcion, 
                  url_foto_perfil, created_at
                `)
                .eq('rol', 'estudiante')
                .eq('eliminado', false);

            if (!usuarios) return;

            const usuariosConRiesgo: UsuarioEnRiesgo[] = [];

            for (const usuario of usuarios) {
                const riesgoData = await calcularRiesgoUsuario(usuario);
                if (riesgoData.puntuacionRiesgo >= 30) {
                    usuariosConRiesgo.push(riesgoData);
                }
            }

            const usuariosOrdenados = usuariosConRiesgo
                .sort((a, b) => b.puntuacionRiesgo - a.puntuacionRiesgo)
                .slice(0, 20);

            setUsuariosEnRiesgo(usuariosOrdenados);
            calcularEstadisticas(usuariosOrdenados);

            console.log(`✅ [RETENCIÓN] ${usuariosOrdenados.length} usuarios en riesgo detectados`);

        } catch (error) {
            console.error('❌ [RETENCIÓN] Error:', error);
        } finally {
            setCargando(false);
        }
    };

    const calcularRiesgoUsuario = async (usuario: any): Promise<UsuarioEnRiesgo> => {
        let puntuacionRiesgo = 0;
        const motivos: string[] = [];

        const { data: sesionReciente } = await supabase
            .from('sesiones_usuario')
            .select('ultima_actividad, tiempo_total_minutos, sesiones_totales')
            .eq('usuario_id', usuario.id)
            .order('ultima_actividad', { ascending: false })
            .limit(1)
            .single();

        let ultimaActividad = sesionReciente?.ultima_actividad || usuario.created_at;
        let diasInactivo = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24));

        if (diasInactivo > 14) {
            puntuacionRiesgo += 40;
            motivos.push(`${diasInactivo} días sin actividad`);
        } else if (diasInactivo > 7) {
            puntuacionRiesgo += 25;
            motivos.push(`${diasInactivo} días inactivo`);
        } else if (diasInactivo > 3) {
            puntuacionRiesgo += 15;
            motivos.push(`${diasInactivo} días sin entrar`);
        }

        const tiempoTotal = sesionReciente?.tiempo_total_minutos || 0;
        if (tiempoTotal < 30) {
            puntuacionRiesgo += 25;
            motivos.push('Muy poco tiempo en plataforma');
        } else if (tiempoTotal < 120) {
            puntuacionRiesgo += 15;
            motivos.push('Bajo tiempo de uso');
        }

        const { data: inscripciones } = await supabase
            .from('inscripciones')
            .select('porcentaje_completado, completado')
            .eq('usuario_id', usuario.id);

        let cursosCompletados = 0;
        let progresoPromedio = 0;

        if (inscripciones && inscripciones.length > 0) {
            cursosCompletados = inscripciones.filter((i: any) => i.completado).length;
            progresoPromedio = Math.round(
                inscripciones.reduce((sum: number, i: any) => sum + (i.porcentaje_completado || 0), 0) / inscripciones.length
            );

            if (cursosCompletados === 0 && inscripciones.length > 0) {
                puntuacionRiesgo += 20;
                motivos.push('No ha completado ningún curso');
            }

            if (progresoPromedio < 10) {
                puntuacionRiesgo += 15;
                motivos.push('Progreso muy bajo en cursos');
            }
        } else {
            puntuacionRiesgo += 30;
            motivos.push('No está inscrito en ningún curso');
        }

        const diasRegistrado = Math.floor((Date.now() - new Date(usuario.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (diasRegistrado < 7 && (sesionReciente?.sesiones_totales || 0) <= 1) {
            puntuacionRiesgo += 20;
            motivos.push('Usuario nuevo sin engagement');
        }

        if (usuario.suscripcion === 'premium' && puntuacionRiesgo > 20) {
            puntuacionRiesgo += 10;
            motivos.push('Cliente premium en riesgo');
        }

        return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo_electronico: usuario.correo_electronico,
            suscripcion: usuario.suscripcion,
            puntuacionRiesgo: Math.min(puntuacionRiesgo, 100),
            motivos,
            ultimaActividad,
            diasInactivo,
            cursosCompletados,
            progresoPromedio,
            url_foto_perfil: usuario.url_foto_perfil
        };
    };

    const calcularEstadisticas = (usuarios: UsuarioEnRiesgo[]) => {
        setEstadisticas({
            totalEnRiesgo: usuarios.length,
            riesgoAlto: usuarios.filter(u => u.puntuacionRiesgo >= 70).length,
            riesgoMedio: usuarios.filter(u => u.puntuacionRiesgo >= 50 && u.puntuacionRiesgo < 70).length,
            riesgoBajo: usuarios.filter(u => u.puntuacionRiesgo < 50).length
        });
    };

    const obtenerColorRiesgo = (puntuacion: number) => {
        if (puntuacion >= 70) return '#ef4444';
        if (puntuacion >= 50) return '#f59e0b';
        return '#6b7280';
    };

    const obtenerNivelRiesgo = (puntuacion: number) => {
        if (puntuacion >= 70) return 'ALTO';
        if (puntuacion >= 50) return 'MEDIO';
        return 'BAJO';
    };

    const toggleDetalle = () => {
        setMostrarDetalle(!mostrarDetalle);
    };

    const contactarUsuario = (usuario: UsuarioEnRiesgo) => {
        const mensaje = `Hola ${usuario.nombre}, hemos notado que llevas ${usuario.diasInactivo} días sin conectarte. ¿Te podemos ayudar con algo?`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    };

    const verPerfilCompleto = (usuarioId: string) => {
        // En SPA real, usaríamos history.push o similar, pero aquí simulamos
        // window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
        console.log("Navegar a perfil de usuario:", usuarioId);
    };

    return (
        <div className="detector-retencion">
            <div className="detector-header">
                <div className="header-info">
                    <h3>🎯 Detector de Retención</h3>
                    <p>Usuarios en riesgo de abandono</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={detectarUsuariosEnRiesgo} disabled={cargando}>
                        <RefreshCw size={14} className={cargando ? 'girando' : ''} />
                    </button>
                    <button className="btn-toggle-detalle" onClick={toggleDetalle}>
                        {mostrarDetalle ? <EyeOff size={14} style={{ marginRight: '0.5rem' }} /> : <Eye size={14} style={{ marginRight: '0.5rem' }} />}
                        {mostrarDetalle ? 'Ocultar' : 'Ver Todos'}
                    </button>
                </div>
            </div>

            {/* 📊 ESTADÍSTICAS RÁPIDAS */}
            <div className="estadisticas-riesgo">
                <div className="stat-riesgo total">
                    <span className="stat-numero">{estadisticas.totalEnRiesgo}</span>
                    <span className="stat-label">Total en Riesgo</span>
                </div>
                <div className="stat-riesgo alto">
                    <span className="stat-numero">{estadisticas.riesgoAlto}</span>
                    <span className="stat-label">Riesgo Alto</span>
                </div>
                <div className="stat-riesgo medio">
                    <span className="stat-numero">{estadisticas.riesgoMedio}</span>
                    <span className="stat-label">Riesgo Medio</span>
                </div>
                <div className="stat-riesgo bajo">
                    <span className="stat-numero">{estadisticas.riesgoBajo}</span>
                    <span className="stat-label">Riesgo Bajo</span>
                </div>
            </div>

            {cargando ? (
                <div className="loading-detectando">
                    <div className="spinner-retencion"></div>
                    <p>Analizando patrones de riesgo...</p>
                </div>
            ) : usuariosEnRiesgo.length === 0 ? (
                <div className="sin-riesgo">
                    ✅ ¡Excelente! No se detectaron usuarios en riesgo alto
                </div>
            ) : (
                <>
                    {/* 🔴 VISTA COMPACTA (primeros 5) */}
                    {!mostrarDetalle ? (
                        <div className="usuarios-compactos">
                            {usuariosEnRiesgo.slice(0, 5).map((usuario) => (
                                <div key={usuario.id} className="usuario-compacto" style={{ borderLeftColor: obtenerColorRiesgo(usuario.puntuacionRiesgo) }}>
                                    <div className="usuario-info-compacto">
                                        <div className="foto-y-nombre">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} className="foto-mini" />
                                            ) : (
                                                <div className="avatar-mini">
                                                    <User size={14} />
                                                </div>
                                            )}
                                            <div>
                                                <strong style={{ display: 'block' }}>{usuario.nombre} {usuario.apellido}</strong>
                                                <div className="nivel-riesgo" style={{ color: obtenerColorRiesgo(usuario.puntuacionRiesgo) }}>
                                                    {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} ({usuario.puntuacionRiesgo}%)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="acciones-rapidas">
                                            <button className="btn-accion-mini" onClick={() => contactarUsuario(usuario)}>
                                                <MessageCircle size={14} />
                                            </button>
                                            <button className="btn-accion-mini" onClick={() => verPerfilCompleto(usuario.id)}>
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="motivos-mini">
                                        {usuario.motivos[0]} {usuario.motivos.length > 1 ? `+${usuario.motivos.length - 1} más` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* 📋 VISTA DETALLADA */
                        <div className="usuarios-detalle">
                            {usuariosEnRiesgo.map((usuario) => (
                                <div key={usuario.id} className="usuario-detalle">
                                    <div className="usuario-header">
                                        <div className="usuario-foto-info">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} className="foto-perfil" />
                                            ) : (
                                                <div className="avatar-default">
                                                    <User size={24} />
                                                </div>
                                            )}
                                            <div className="usuario-datos">
                                                <h4>{usuario.nombre} {usuario.apellido}</h4>
                                                <p className="email">{usuario.correo_electronico}</p>
                                                <div className="badges">
                                                    <span className={`badge-suscripcion ${usuario.suscripcion}`}>
                                                        {usuario.suscripcion?.toUpperCase()}
                                                    </span>
                                                    <span
                                                        className="badge-riesgo"
                                                        style={{
                                                            backgroundColor: `${obtenerColorRiesgo(usuario.puntuacionRiesgo)}20`,
                                                            color: obtenerColorRiesgo(usuario.puntuacionRiesgo)
                                                        }}
                                                    >
                                                        {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} {usuario.puntuacionRiesgo}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="usuario-acciones">
                                            <button className="btn-contactar" onClick={() => contactarUsuario(usuario)}>
                                                <MessageCircle size={14} style={{ marginRight: '0.25rem' }} />
                                                Contactar
                                            </button>
                                            <button className="btn-ver-perfil" onClick={() => verPerfilCompleto(usuario.id)}>
                                                <User size={14} style={{ marginRight: '0.25rem' }} />
                                                Ver Perfil
                                            </button>
                                        </div>
                                    </div>

                                    <div className="usuario-metricas">
                                        <div className="metrica">
                                            <span className="metrica-label">Días Inactivo:</span>
                                            <span className="metrica-valor">{usuario.diasInactivo}</span>
                                        </div>
                                        <div className="metrica">
                                            <span className="metrica-label">Cursos Completados:</span>
                                            <span className="metrica-valor">{usuario.cursosCompletados}</span>
                                        </div>
                                        <div className="metrica">
                                            <span className="metrica-label">Progreso Promedio:</span>
                                            <span className="metrica-valor">{usuario.progresoPromedio}%</span>
                                        </div>
                                    </div>

                                    <div className="motivos-riesgo">
                                        <strong>Motivos de riesgo:</strong>
                                        <ul>
                                            {usuario.motivos.map((motivo, idx) => (
                                                <li key={idx}>{motivo}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DetectorRetencion;
