import React, { useState, useEffect } from 'react';
import { useSimuladorEstadisticas } from '../Hooks/useSimuladorEstadisticas';
import './SimuladorEstadisticas.css';

const caracteristicas = [
    { icono: '🏆', titulo: 'Desafíos Semanales', descripcion: 'Nuevos retos cada semana para mejorar tu técnica', color: 'linear-gradient(45deg, #ffd700, #ffa500)' },
    { icono: '🎯', titulo: 'Retos Progresivos', descripcion: 'Niveles adaptativos según tu progreso personal', color: 'linear-gradient(45deg, #00ff88, #00cc6a)' },
    { icono: '📚', titulo: 'Teoría Musical', descripcion: 'Aprende mientras practicas con ejercicios teóricos', color: 'linear-gradient(45deg, #667eea, #764ba2)' },
    { icono: '🎹', titulo: 'Práctica Libre', descripcion: 'Toca libremente y recibe feedback en tiempo real', color: 'linear-gradient(45deg, #f093fb, #f5576c)' },
    { icono: '📊', titulo: 'Métricas Avanzadas', descripcion: 'Análisis detallado de tu progreso y técnica', color: 'linear-gradient(45deg, #4facfe, #00f2fe)' },
    { icono: '🎵', titulo: 'Biblioteca Musical', descripcion: 'Más de 100 canciones para practicar', color: 'linear-gradient(45deg, #fa709a, #fee140)' }
];

const estadisticasPorDefecto = [
    { icono: '📚', valor: '0', label: 'Lecciones' },
    { icono: '⏱️', valor: '0m', label: 'Estudiando' },
    { icono: '🔥', valor: '0', label: 'Racha' },
    { icono: '💎', valor: '0', label: 'Puntos' }
];

const SimuladorEstadisticas: React.FC = () => {
    const { cargandoEstadisticas, estadisticasReales } = useSimuladorEstadisticas();
    const [caracteristicaActiva, setCaracteristicaActiva] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCaracteristicaActiva(prev => (prev + 1) % caracteristicas.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="academia-simulador-preview">
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

            <div className="academia-lanzamiento-anuncio">
                <div className="academia-lanzamiento-header">
                    <span className="academia-lanzamiento-icon">🚀</span>
                    <h4 className="academia-lanzamiento-titulo">GRAN LANZAMIENTO</h4>
                </div>
                <div className="academia-lanzamiento-fecha">
                    <span className="academia-fecha-destacada">15 de enero de 2026</span>
                </div>
                <div className="academia-lanzamiento-subtitulo">¡Prepárate para la revolución del acordeón!</div>
            </div>

            <div className="academia-caracteristica-destacada">
                <div className="academia-caracteristica-card" style={{ background: caracteristicas[caracteristicaActiva].color }}>
                    <div className="academia-caracteristica-icon">{caracteristicas[caracteristicaActiva].icono}</div>
                    <div className="academia-caracteristica-info">
                        <h4>{caracteristicas[caracteristicaActiva].titulo}</h4>
                        <p>{caracteristicas[caracteristicaActiva].descripcion}</p>
                    </div>
                </div>
            </div>

            <div className="academia-caracteristicas-lista">
                <h4 className="academia-lista-titulo">Lo que incluirá:</h4>
                <div className="academia-caracteristicas-grid">
                    {caracteristicas.map((c, index) => (
                        <div key={index} className={`academia-caracteristica-mini ${index === caracteristicaActiva ? 'academia-activa' : ''}`}>
                            <span className="academia-mini-icon">{c.icono}</span>
                            <span className="academia-mini-titulo">{c.titulo}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel-gaming-stats-container">
                <h4 className="panel-gaming-stats-title">📊 Estadísticas Gaming</h4>
                {cargandoEstadisticas ? (
                    <div className="panel-gaming-stats-skeleton">
                        {estadisticasPorDefecto.map((_, index) => (
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
