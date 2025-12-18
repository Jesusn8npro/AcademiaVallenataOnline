import React, { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/supabaseCliente';
import { useUsuario } from '../../../contextos/UsuarioContext';
import GamificacionService, { type RankingGlobal } from '../../../servicios/gamificacionServicio';
import './SimuladorEstadisticas.css';

// 🚀 Características del simulador próximo
const caracteristicas = [
    {
        icono: '🏆',
        titulo: 'Desafíos Semanales',
        descripcion: 'Nuevos retos cada semana para mejorar tu técnica',
        color: 'linear-gradient(45deg, #ffd700, #ffa500)'
    },
    {
        icono: '🎯',
        titulo: 'Retos Progresivos',
        descripcion: 'Niveles adaptativos según tu progreso personal',
        color: 'linear-gradient(45deg, #00ff88, #00cc6a)'
    },
    {
        icono: '📚',
        titulo: 'Teoría Musical',
        descripcion: 'Aprende mientras practicas con ejercicios teóricos',
        color: 'linear-gradient(45deg, #667eea, #764ba2)'
    },
    {
        icono: '🎹',
        titulo: 'Práctica Libre',
        descripcion: 'Toca libremente y recibe feedback en tiempo real',
        color: 'linear-gradient(45deg, #f093fb, #f5576c)'
    },
    {
        icono: '📊',
        titulo: 'Métricas Avanzadas',
        descripcion: 'Análisis detallado de tu progreso y técnica',
        color: 'linear-gradient(45deg, #4facfe, #00f2fe)'
    },
    {
        icono: '🎵',
        titulo: 'Biblioteca Musical',
        descripcion: 'Más de 100 canciones para practicar',
        color: 'linear-gradient(45deg, #fa709a, #fee140)'
    }
];

// 🎯 DATOS POR DEFECTO PARA MOSTRAR INMEDIATAMENTE
const estadisticasPorDefecto = [
    { icono: '📚', valor: '0', label: 'Lecciones' },
    { icono: '⏱️', valor: '0m', label: 'Estudiando' },
    { icono: '🔥', valor: '0', label: 'Racha' },
    { icono: '💎', valor: '0', label: 'Puntos' }
];

const SimuladorEstadisticas: React.FC = () => {
    const { usuario } = useUsuario();

    // 🎯 Estados del componente
    const [caracteristicaActiva, setCaracteristicaActiva] = useState(0);

    // ⚡ ESTADOS DE CARGA VISUALES
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
    const [estadisticasReales, setEstadisticasReales] = useState<any[]>([]);

    // 🔄 Rotar características automáticamente
    useEffect(() => {
        const interval = setInterval(() => {
            setCaracteristicaActiva(prev => (prev + 1) % caracteristicas.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // 🕒 FUNCIÓN PARA FORMATEAR TIEMPO DE MANERA LEGIBLE
    const formatearTiempo = (minutos: number): string => {
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
    };

    // 🕒 Función RÁPIDA para calcular tiempo histórico total (EN PARALELO)
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

                // 4. TODO el tiempo en plataforma
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

            // ✅ USAR tiempo_total_minutos PERO LIMITADO a valores realistas
            let totalSesiones = 0;
            if (todasSesionesUsuario.length > 0) {
                // 🎯 LIMITAR a máximo 8 horas por día (480 minutos)
                totalSesiones = todasSesionesUsuario.reduce((sum: number, item: any) => {
                    const tiempo = item.tiempo_total_minutos || 0;
                    return sum + (tiempo < 480 ? tiempo : 0);
                }, 0);
            }

            // ✅ CALCULAR TIEMPO REAL BASADO EN ACTIVIDAD REAL
            const tiempoReal = totalLecciones + totalTutoriales + totalSimulador;

            // 🎯 COMBINAR tiempo real + sesiones limitadas
            const tiempoCombinado = Math.max(tiempoReal, totalSesiones);

            // 🎯 Si no hay tiempo registrado, calcular basado en actividad reciente
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
            console.error('❌ [SIMULADOR] Error calculando tiempo histórico:', error);
            return 0;
        }
    };

    // 📊 CARGAR ESTADÍSTICAS REALES DEL USUARIO
    useEffect(() => {
        const cargarEstadisticasReales = async () => {
            if (!usuario?.id) {
                setCargandoEstadisticas(false);
                return;
            }

            try {
                console.log('🚀 [SIMULADOR] Cargando estadísticas reales para:', usuario.id);

                const [ranking, tiempoHistorico] = await Promise.all([
                    GamificacionService.obtenerRanking('general', 50).catch(() => []),
                    calcularTiempoHistoricoRapido(usuario.id)
                ]);

                // 💎 PROCESAR RANKING
                let puntosFinales = 0;
                const miRanking = (ranking as RankingGlobal[]).find(r => r.usuario_id === usuario.id);
                if (miRanking) {
                    puntosFinales = miRanking.puntuacion || 0;
                }

                // 📊 CALCULAR ESTADÍSTICAS REALES
                const leccionesCompletadas = 0; // Por ahora en 0
                const tiempoEstudio = tiempoHistorico;
                const rachaActual = 0; // Por ahora en 0

                setEstadisticasReales([
                    { icono: '📚', valor: leccionesCompletadas.toString(), label: 'Lecciones' },
                    { icono: '⏱️', valor: formatearTiempo(tiempoEstudio), label: 'Estudiando' },
                    { icono: '🔥', valor: rachaActual.toString(), label: 'Racha' },
                    { icono: '💎', valor: puntosFinales.toString(), label: 'Puntos' }
                ]);

                setCargandoEstadisticas(false);

            } catch (error) {
                console.error('❌ [SIMULADOR] Error cargando estadísticas:', error);
                setCargandoEstadisticas(false);
            }
        };

        cargarEstadisticasReales();
    }, [usuario]);


    return (
        <div className="academia-simulador-preview">

            {/* 🎮 Header del preview */}
            <div className="academia-preview-header">
                <div className="academia-header-icon">
                    <div className="academia-acordeon-icon">🎹</div>
                    <div className="academia-coming-soon-badge">PRÓXIMAMENTE</div>
                </div>
                <div className="academia-header-info">
                    <h3>🚀 Simulador Avanzado</h3>
                    <p className="academia-subtitulo">Aquí encontrarás todos tus desafíos del simulador de acordeón</p>
                </div>
            </div>

            {/* 🚀 TÍTULO ANIMADO DEL LANZAMIENTO */}
            <div className="academia-lanzamiento-anuncio">
                <div className="academia-lanzamiento-header">
                    <span className="academia-lanzamiento-icon">🚀</span>
                    <h4 className="academia-lanzamiento-titulo">GRAN LANZAMIENTO</h4>
                </div>
                <div className="academia-lanzamiento-fecha">
                    <span className="academia-fecha-destacada">15 de enero de 2026</span>
                </div>
                <div className="academia-lanzamiento-subtitulo">
                    ¡Prepárate para la revolución del acordeón!
                </div>
            </div>

            {/* ✨ Característica destacada (rotativa) */}
            <div className="academia-caracteristica-destacada">
                <div
                    className="academia-caracteristica-card"
                    style={{ background: caracteristicas[caracteristicaActiva].color }}
                >
                    <div className="academia-caracteristica-icon">
                        {caracteristicas[caracteristicaActiva].icono}
                    </div>
                    <div className="academia-caracteristica-info">
                        <h4>{caracteristicas[caracteristicaActiva].titulo}</h4>
                        <p>{caracteristicas[caracteristicaActiva].descripcion}</p>
                    </div>
                </div>
            </div>

            {/* 🎯 Lista de características */}
            <div className="academia-caracteristicas-lista">
                <h4 className="academia-lista-titulo">Lo que incluirá:</h4>
                <div className="academia-caracteristicas-grid">
                    {caracteristicas.map((caracteristica, index) => (
                        <div
                            key={index}
                            className={`academia-caracteristica-mini ${index === caracteristicaActiva ? 'academia-activa' : ''}`}
                        >
                            <span className="academia-mini-icon">{caracteristica.icono}</span>
                            <span className="academia-mini-titulo">{caracteristica.titulo}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 📊 ESTADÍSTICAS GAMING - CON SKELETON LOADER */}
            <div className="panel-gaming-stats-container">
                <h4 className="panel-gaming-stats-title">📊 Estadísticas Gaming</h4>

                {cargandoEstadisticas ? (
                    /* ⚡ SKELETON LOADER PARA ESTADÍSTICAS */
                    <div className="panel-gaming-stats-skeleton">
                        {estadisticasPorDefecto.map((stat, index) => (
                            <div key={index} className="panel-gaming-stat-skeleton">
                                <div className="panel-gaming-stat-icon-skeleton"></div>
                                <div className="panel-gaming-stat-content-skeleton">
                                    <div className="panel-gaming-stat-val-skeleton"></div>
                                    <div className="panel-gaming-stat-lbl-skeleton"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ✅ ESTADÍSTICAS REALES */
                    <div className="panel-gaming-stats-grid">
                        {(estadisticasReales.length > 0 ? estadisticasReales : estadisticasPorDefecto).map((stat, index) => (
                            <div key={index} className="panel-gaming-stat-item">
                                <span className="panel-gaming-stat-icon">{stat.icono}</span>
                                <div className="panel-gaming-stat-info">
                                    <span className="panel-gaming-stat-value">{stat.valor}</span>
                                    <span className="panel-gaming-stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimuladorEstadisticas;
