import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { TiempoService } from '../../../servicios/tiempoService';
import { GamificacionServicio as GamificacionService, type RankingGlobal } from '../../../servicios/gamificacionServicio';
import './LogrosDesafios.css';

const LogrosDesafios: React.FC = () => {
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    // 🏆 Estados simples
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState({
        leccionesCompletadas: 0,
        tiempoEstudio: 0,
        rachaActual: 0,
        puntosGanados: 0
    });

    // 🕒 FUNCIÓN PARA CALCULAR TIEMPO HISTÓRICO TOTAL (EN PARALELO)
    const calcularTiempoHistoricoRapido = async (usuarioId: string): Promise<number> => {
        try {
            // 🚀 TODAS LAS CONSULTAS EN PARALELO
            const [leccionesResult, tutorialesResult, simuladorResult, sesionesResult] = await Promise.all([
                // 1. TODO el tiempo en lecciones 
                supabase
                    .from('progreso_lecciones')
                    .select('tiempo_total')
                    .eq('usuario_id', usuarioId),

                // 2. TODO el tiempo en tutoriales
                supabase
                    .from('progreso_tutorial')
                    .select('tiempo_visto')
                    .eq('usuario_id', usuarioId),

                // 3. TODO el tiempo en simulador
                supabase
                    .from('sesiones_simulador_acordeon')
                    .select('duracion_minutos')
                    .eq('usuario_id', usuarioId),

                // 4. TODO el tiempo en plataforma (pero limitado a valores realistas)
                supabase
                    .from('sesiones_usuario')
                    .select('tiempo_total_minutos')
                    .eq('usuario_id', usuarioId)
            ]);

            const todasLecciones = leccionesResult.data || [];
            const todosTutoriales = tutorialesResult.data || [];
            const todasSesiones = simuladorResult.data || [];
            const todasSesionesUsuario = sesionesResult.data || [];

            // 🎯 DETERMINAR UNIDADES CORRECTAS
            let totalLecciones = 0;
            let totalTutoriales = 0;

            if (todasLecciones.length > 0) {
                const primerValor = todasLecciones[0].tiempo_total;
                if (primerValor > 1000000) {
                    totalLecciones = todasLecciones.reduce((sum: number, item: any) => sum + ((item.tiempo_total || 0) / 60000), 0);
                } else if (primerValor > 1000) {
                    totalLecciones = todasLecciones.reduce((sum: number, item: any) => sum + ((item.tiempo_total || 0) / 60), 0);
                } else {
                    totalLecciones = todasLecciones.reduce((sum: number, item: any) => sum + (item.tiempo_total || 0), 0);
                }
            }

            if (todosTutoriales.length > 0) {
                const primerValor = todosTutoriales[0].tiempo_visto;
                if (primerValor > 1000000) {
                    totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => sum + ((item.tiempo_visto || 0) / 60000), 0);
                } else if (primerValor > 1000) {
                    totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => sum + ((item.tiempo_visto || 0) / 60), 0);
                } else {
                    totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => sum + (item.tiempo_visto || 0), 0);
                }
            }

            const totalSimulador = todasSesiones.reduce((sum: number, item: any) => sum + (item.duracion_minutos || 0), 0);

            let totalSesiones = 0;
            if (todasSesionesUsuario.length > 0) {
                totalSesiones = todasSesionesUsuario.reduce((sum: number, item: any) => {
                    const tiempo = item.tiempo_total_minutos || 0;
                    return sum + (tiempo < 480 ? tiempo : 0);
                }, 0);
            }

            const tiempoReal = totalLecciones + totalTutoriales + totalSimulador;
            const tiempoCombinado = Math.max(tiempoReal, totalSesiones);

            if (tiempoCombinado === 0) {
                const { data: actividadReciente } = await supabase
                    .from('eventos_actividad')
                    .select('created_at, tipo_evento')
                    .eq('usuario_id', usuarioId)
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false });

                if (actividadReciente && actividadReciente.length > 0) {
                    const tiempoEstimado = Math.min(actividadReciente.length * 5, 120);
                    return tiempoEstimado;
                }
            }

            return Math.round(tiempoCombinado);

        } catch (error) {
            console.error('❌ Error calculando tiempo histórico:', error);
            return 0;
        }
    };

    // 🕒 FUNCIÓN PARA CALCULAR TIEMPO REAL DE USO DE LA PLATAFORMA
    const calcularTiempoRealPlataforma = async (usuarioId: string): Promise<number> => {
        try {
            console.log('🎯 [TIEMPO REAL] Calculando tiempo real de uso de la plataforma...');

            const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const { data: eventosActividad, error } = await supabase
                .from('eventos_actividad')
                .select('created_at, tipo_evento')
                .eq('usuario_id', usuarioId)
                .gte('created_at', fechaLimite.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('⚠️ [TIEMPO REAL] Error consultando eventos:', error);
                return 0;
            }

            if (!eventosActividad || eventosActividad.length === 0) {
                return 0;
            }

            let tiempoTotal = 0;

            eventosActividad.forEach((evento: any) => {
                const tipo = evento.tipo_evento || 'navegacion';
                // Calculamos duración estimada ya que no tenemos el campo duracion_minutos
                switch (tipo) {
                    case 'estudio':
                    case 'leccion':
                    case 'ejercicio':
                        tiempoTotal += 10;
                        break;
                    case 'simulador':
                        tiempoTotal += 15;
                        break;
                    case 'navegacion':
                        tiempoTotal += 2;
                        break;
                    case 'click':
                        tiempoTotal += 1;
                        break;
                    default:
                        tiempoTotal += 3;
                }
            });

            const tiempoFinal = Math.min(tiempoTotal, 480);
            return tiempoFinal;

        } catch (error) {
            console.error('❌ [TIEMPO REAL] Error calculando tiempo real:', error);
            return 0;
        }
    };

    const cargarDatosReales = async () => {
        if (!usuario?.id) {
            setCargando(false);
            return;
        }

        try {
            console.log('🚀 Buscando datos REALES para:', usuario.id);

            const fechaHaceUnMes = new Date();
            fechaHaceUnMes.setDate(fechaHaceUnMes.getDate() - 30);
            const fechaSQL = fechaHaceUnMes.toISOString();

            const [
                ranking,
                progresoLeccionesResult,
                progresoTutorialesResult,
                simuladorSesionesResult,
                actividadRecienteResult,
                tiempoHistoricoTotal,
                tiempoRealPlataforma
            ] = await Promise.all([
                GamificacionService.obtenerRanking('general', 50).catch(() => []),
                supabase
                    .from('progreso_lecciones')
                    .select('tiempo_total, porcentaje_completado, updated_at, estado')
                    .eq('usuario_id', usuario.id)
                    .gte('updated_at', fechaSQL),
                supabase
                    .from('progreso_tutorial')
                    .select('tiempo_visto, ultimo_acceso, completado')
                    .eq('usuario_id', usuario.id)
                    .gte('ultimo_acceso', fechaSQL),
                supabase
                    .from('sesiones_simulador_acordeon')
                    .select('duracion_minutos, created_at')
                    .eq('usuario_id', usuario.id)
                    .gte('created_at', fechaSQL),
                supabase
                    .from('progreso_lecciones')
                    .select('updated_at')
                    .eq('usuario_id', usuario.id)
                    .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('updated_at', { ascending: false }),
                calcularTiempoHistoricoRapido(usuario.id),
                calcularTiempoRealPlataforma(usuario.id)
            ]);

            // 💎 PROCESAR RANKING
            let puntosFinales = 0;
            const miRanking = (ranking as RankingGlobal[]).find(r => r.usuario_id === usuario.id);
            if (miRanking) {
                puntosFinales = miRanking.puntuacion || 0;
            }

            const progresoLecciones = progresoLeccionesResult.data || [];
            const progresoTutoriales = progresoTutorialesResult.data || [];
            const simuladorSesiones = simuladorSesionesResult.data || [];
            const actividadReciente = actividadRecienteResult.data || [];

            // Lecciones completadas esta semana
            const leccionesEstaSemanCompletadas = progresoLecciones?.filter((p: any) =>
                p.estado === 'completado' || p.porcentaje_completado === 100
            ).length || 0;

            const tutorialesEstaSemanProgreso = progresoTutoriales?.length || 0;

            const tiempoTotalSemanal = await TiempoService.obtenerTiempoSemanal(usuario.id);

            let tiempoLecciones = 0;
            let tiempoTutoriales = 0;

            if (progresoLecciones.length > 0) {
                const primerValor = progresoLecciones[0].tiempo_total;
                if (primerValor > 1000000) {
                    tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => total + ((leccion.tiempo_total || 0) / 60000), 0);
                } else if (primerValor > 1000) {
                    tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => total + ((leccion.tiempo_total || 0) / 60), 0);
                } else {
                    tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => total + (leccion.tiempo_total || 0), 0);
                }
            }

            if (progresoTutoriales.length > 0) {
                const primerValor = progresoTutoriales[0].tiempo_visto;
                if (primerValor > 1000000) {
                    tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => total + ((tutorial.tiempo_visto || 0) / 60000), 0);
                } else if (primerValor > 1000) {
                    tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => total + ((tutorial.tiempo_visto || 0) / 60), 0);
                } else {
                    tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => total + (tutorial.tiempo_visto || 0), 0);
                }
            }

            const tiempoSimulador = simuladorSesiones?.reduce((total: number, sesion: any) => total + (sesion.duracion_minutos || 0), 0) || 0;

            const tiempoManual = tiempoLecciones + tiempoTutoriales + tiempoSimulador;

            let rachaCalculada = 0;
            if (actividadReciente && actividadReciente.length > 0) {
                const diasConActividad = actividadReciente.length;
                rachaCalculada = Math.min(diasConActividad, 7);
            }

            let tiempoFinal = Math.max(tiempoRealPlataforma, tiempoHistoricoTotal, tiempoTotalSemanal, tiempoManual);

            if (tiempoFinal === 0 && (leccionesEstaSemanCompletadas > 0 || tutorialesEstaSemanProgreso > 0)) {
                const tiempoSimulado = (leccionesEstaSemanCompletadas * 15) + (tutorialesEstaSemanProgreso * 25);
                tiempoFinal = tiempoSimulado;
            }

            setStats({
                leccionesCompletadas: leccionesEstaSemanCompletadas + tutorialesEstaSemanProgreso,
                tiempoEstudio: tiempoFinal,
                rachaActual: rachaCalculada,
                puntosGanados: puntosFinales
            });

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            setStats({
                leccionesCompletadas: 0,
                tiempoEstudio: 0,
                rachaActual: 0,
                puntosGanados: 0
            });
        } finally {
            setCargando(false);
        }
    };

    function formatearTiempo(minutos: number): string {
        if (minutos < 1) return '0m';
        if (minutos < 60) return `${Math.round(minutos)}m`;
        if (minutos < 1440) {
            const horas = Math.floor(minutos / 60);
            const minRestantes = Math.round(minutos % 60);
            return `${horas}h ${minRestantes}m`;
        }
        const dias = Math.floor(minutos / 1440);
        const horas = Math.floor((minutos % 1440) / 60);
        return `${dias}d ${horas}h`;
    }

    useEffect(() => {
        cargarDatosReales();
    }, [usuario]);

    return (
        <section className="academia-progreso-semanal">
            {cargando ? (
                <div className="academia-loading-skeleton">
                    <h3>🏆 Estadísticas De Mi Perfil</h3>
                    <div className="academia-stats-grid">
                        <div className="academia-stat-card academia-skeleton">
                            <span className="academia-logros-icon">📚</span>
                            <span className="academia-logros-value">-</span>
                            <span className="academia-logros-label">Lecciones</span>
                        </div>
                        <div className="academia-stat-card academia-skeleton">
                            <span className="academia-logros-icon">⏱️</span>
                            <span className="academia-logros-value">-</span>
                            <span className="academia-logros-label">Estudiando</span>
                        </div>
                        <div className="academia-stat-card academia-skeleton">
                            <span className="academia-logros-icon">🔥</span>
                            <span className="academia-logros-value">-</span>
                            <span className="academia-logros-label">Racha</span>
                        </div>
                        <div className="academia-stat-card academia-skeleton">
                            <span className="academia-logros-icon">💎</span>
                            <span className="academia-logros-value">-</span>
                            <span className="academia-logros-label">Puntos</span>
                        </div>
                    </div>
                    <div className="academia-loading-text">
                        🚀 Cargando en paralelo...
                    </div>
                </div>
            ) : (
                <>
                    <h3>🏆 Estadísticas De Mi Perfil</h3>

                    <div className="academia-stats-grid">
                        <div className="academia-stat-card">
                            <span className="academia-logros-icon">📚</span>
                            <span className="academia-logros-value">{stats.leccionesCompletadas}</span>
                            <span className="academia-logros-label">Lecciones</span>
                        </div>

                        <div className="academia-stat-card">
                            <span className="academia-logros-icon">⏱️</span>
                            <span className="academia-logros-value">{formatearTiempo(stats.tiempoEstudio)}</span>
                            <span className="academia-logros-label">Estudiando</span>
                        </div>

                        <div className="academia-stat-card">
                            <span className="academia-logros-icon">🔥</span>
                            <span className="academia-logros-value">{stats.rachaActual}</span>
                            <span className="academia-logros-label">Racha</span>
                        </div>

                        <div className="academia-stat-card">
                            <span className="academia-logros-icon">💎</span>
                            <span className="academia-logros-value">{stats.puntosGanados}</span>
                            <span className="academia-logros-label">Puntos</span>
                        </div>
                    </div>

                    {/* 🎯 Acciones rápidas */}
                    <div className="academia-acciones">
                        <button className="academia-btn-accion" onClick={() => navigate('/simulador-de-acordeon')}>
                            🎮 Practicar Simulador
                        </button>
                        <button className="academia-btn-accion" onClick={() => navigate('/cursos')}>
                            📚 Ver Cursos
                        </button>
                    </div>
                </>
            )}
        </section>
    );
};

export default LogrosDesafios;
