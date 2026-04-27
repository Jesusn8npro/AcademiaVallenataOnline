import React from 'react';
import { useRecomendaciones } from '../Hooks/useRecomendaciones';
import './RecomendacionesCursos.css';

const RecomendacionesCursos: React.FC = () => {
    const { cargando, recomendaciones, mostrarMas, setMostrarMas, verContenido, formatearPrecio, calcularDescuento, acortarTexto, navigate } = useRecomendaciones();

    return (
        <div className="academia-recomendaciones-cursos">
            {cargando ? (
                <div className="academia-cargando-recomendaciones">
                    <div className="academia-skeleton-recomendaciones"></div>
                </div>
            ) : (
                <div className="academia-tarjeta-recomendaciones">
                    <div className="academia-recomendaciones-header">
                        <div className="academia-header-info">
                            <h3>🚀 Recomendaciones Para Ti</h3>
                            <p className="academia-subtitulo">Contenido perfecto que aún no has explorado</p>
                        </div>
                        <div className="academia-header-stats">
                            <span className="academia-stat-badge">{recomendaciones.filter(i => i.tipo === 'curso').length} Cursos</span>
                            <span className="academia-stat-badge">{recomendaciones.filter(i => i.tipo === 'tutorial').length} Tutoriales</span>
                        </div>
                    </div>

                    <div className="academia-contenido-recomendaciones">
                        {recomendaciones.length === 0 ? (
                            <div className="academia-sin-recomendaciones">
                                <h4>📚 Cargando recomendaciones...</h4>
                                <p>Estamos buscando el mejor contenido para ti</p>
                            </div>
                        ) : (
                            <>
                                <div className="academia-recomendaciones-grid">
                                    {recomendaciones.slice(0, mostrarMas ? 8 : 4).map((item, index) => (
                                        <div key={index} className="academia-curso-card" onClick={() => verContenido(item)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && verContenido(item)}>
                                            <div className="academia-curso-imagen-container">
                                                <img src={item.imagen_url} alt={item.titulo} className="academia-curso-imagen" loading="lazy" />
                                                <div className={`academia-tipo-badge ${item.tipo}`}>
                                                    {item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
                                                </div>
                                                {item.precio_rebajado && item.precio_normal && (() => {
                                                    const desc = calcularDescuento(item.precio_normal, item.precio_rebajado);
                                                    return desc > 0 ? <div className="academia-descuento-badge">-{desc}%</div> : null;
                                                })()}
                                                <div className="academia-imagen-overlay">
                                                    <button className="academia-btn-ver-curso">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                                                        {item.tipo === 'curso' ? 'Ver Curso' : 'Ver Tutorial'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="academia-curso-content">
                                                <div className="academia-curso-header">
                                                    <h4 className="academia-curso-titulo">{item.titulo}</h4>
                                                    <div className="academia-curso-meta">
                                                        <span className="academia-rating">⭐ {item.rating}</span>
                                                        <span className="academia-estudiantes">👥 {item.estudiantes}</span>
                                                    </div>
                                                </div>
                                                <p className="academia-curso-descripcion">{acortarTexto(item.descripcion, 80)}</p>
                                                <div className="academia-nivel-container">
                                                    <span className={`academia-nivel-badge nivel-${item.nivel}`}>
                                                        {item.nivel === 'principiante' && '🌱 Principiante'}
                                                        {item.nivel === 'intermedio' && '🔥 Intermedio'}
                                                        {item.nivel === 'avanzado' && '⚡ Avanzado'}
                                                        {item.nivel === 'profesional' && '👑 Profesional'}
                                                        {!['principiante', 'intermedio', 'avanzado', 'profesional'].includes(item.nivel) && `📚 ${item.nivel}`}
                                                    </span>
                                                </div>
                                                <div className="academia-curso-footer">
                                                    <div className="academia-precio-container">
                                                        {item.precio_normal === 0 || item.precio_normal === null ? (
                                                            <span className="academia-precio-gratis">¡GRATIS!</span>
                                                        ) : item.precio_rebajado && item.precio_rebajado < item.precio_normal ? (
                                                            <>
                                                                <span className="academia-precio-original">{formatearPrecio(item.precio_normal)}</span>
                                                                <span className="academia-precio-actual">{formatearPrecio(item.precio_rebajado)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="academia-precio-actual">{formatearPrecio(item.precio_normal)}</span>
                                                        )}
                                                    </div>
                                                    <button className={`academia-btn-acceder ${item.tipo}`}>
                                                        {item.precio_normal === 0 || item.precio_normal === null ? 'Acceder Gratis' : 'Comenzar Ahora'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="academia-acciones-container">
                                    {recomendaciones.length > 4 && (
                                        <button className="academia-ver-mas-btn" onClick={() => setMostrarMas(!mostrarMas)}>
                                            <span>{mostrarMas ? '👆 Ver Menos' : '👀 Ver Más Recomendaciones'}</span>
                                        </button>
                                    )}
                                    <button className="academia-ver-todos-btn" onClick={() => navigate('/cursos')}>
                                        <span>📚 Explorar Todos los Cursos</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecomendacionesCursos;
