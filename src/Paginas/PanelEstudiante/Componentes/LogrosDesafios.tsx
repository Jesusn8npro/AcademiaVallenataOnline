import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogrosDesafios, formatearTiempo } from '../Hooks/useLogrosDesafios';
import './LogrosDesafios.css';

const LogrosDesafios: React.FC = () => {
    const navigate = useNavigate();
    const { cargando, stats } = useLogrosDesafios();

    return (
        <section className="academia-progreso-semanal">
            {cargando ? (
                <div className="academia-loading-skeleton">
                    <h3>🏆 Estadísticas De Mi Perfil</h3>
                    <div className="academia-stats-grid">
                        {['📚', '⏱️', '🔥', '💎'].map((icono, i) => (
                            <div key={i} className="academia-stat-card academia-skeleton">
                                <span className="academia-logros-icon">{icono}</span>
                                <span className="academia-logros-value">-</span>
                            </div>
                        ))}
                    </div>
                    <div className="academia-loading-text">🚀 Cargando en paralelo...</div>
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
