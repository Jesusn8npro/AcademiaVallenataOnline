import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { useContinuarAprendiendo, formatearUltimaActividad } from '../Hooks/useContinuarAprendiendo';
import Avatar from './Avatar';
import './ContinuarAprendiendo.css';

const ContinuarAprendiendo: React.FC = () => {
    const navigate = useNavigate();
    const { usuario } = useUsuario();
    const {
        cargando, ultimaActividad, todasLasActividades, actividadActual, isChanging,
        mensajeMotivacional, anteriorActividad, siguienteActividad, irAActividad, continuarAprendizaje
    } = useContinuarAprendiendo();

    return (
        <section className="academia-continuar-aprendiendo">
            {cargando ? (
                <div className="academia-hero-motivacional">
                    <div className="academia-motivacion-container">
                        <div className="academia-icono-acordeon">
                            <span className="academia-acordeon-animado">🎹</span>
                            <div className="academia-notas-musicales">
                                <span className="academia-nota">♪</span>
                                <span className="academia-nota">♫</span>
                                <span className="academia-nota">♬</span>
                            </div>
                        </div>
                        <div className="academia-mensaje-principal">
                            <h2 className="academia-titulo-bienvenida">¡Bienvenido a tu Panel de Estudiante!</h2>
                            <p className="academia-subtitulo-motivacional">Aquí podrás ver todas tus clases, retos completados y mucho más</p>
                        </div>
                        <div className="academia-caracteristicas-destacadas">
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">📚</span>
                                <span className="academia-texto-caracteristica">Tus cursos en progreso</span>
                            </div>
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">🏆</span>
                                <span className="academia-texto-caracteristica">Logros y retos</span>
                            </div>
                            <div className="academia-caracteristica">
                                <span className="academia-icono-caracteristica">🎵</span>
                                <span className="academia-texto-caracteristica">Próxima clase</span>
                            </div>
                        </div>
                        <div className="academia-indicador-carga">
                            <div className="academia-puntos-carga">
                                <span className="academia-punto"></span>
                                <span className="academia-punto"></span>
                                <span className="academia-punto"></span>
                            </div>
                            <p className="academia-texto-carga">Preparando tu experiencia de aprendizaje...</p>
                        </div>
                    </div>
                </div>
            ) : ultimaActividad && todasLasActividades.length > 0 ? (
                <div className="academia-slider-container">
                    <div className="academia-slider-header">
                        <div className="academia-usuario-info">
                            <Avatar
                                src={usuario?.url_foto_perfil}
                                alt="Foto de perfil"
                                nombreCompleto={usuario?.nombre || 'Usuario'}
                                size="large"
                                onClick={() => navigate('/perfil')}
                            />
                            <div className="academia-saludo-usuario">
                                <span className="academia-saludo">¡Hola {usuario?.nombre || 'Estudiante'}!</span>
                                <span className="academia-submensaje">{mensajeMotivacional}</span>
                            </div>
                        </div>
                        {todasLasActividades.length > 1 && (
                            <div className="academia-navegacion-externa">
                                <button className="academia-nav-btn-external academia-nav-prev" onClick={anteriorActividad} disabled={actividadActual === 0} aria-label="Actividad anterior">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                </button>
                                <span className="academia-contador-externo">{actividadActual + 1} / {todasLasActividades.length}</span>
                                <button className="academia-nav-btn-external academia-nav-next" onClick={siguienteActividad} aria-label="Siguiente actividad">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`academia-hero-actividad academia-slide-content ${isChanging ? 'academia-changing' : ''}`}>
                        <div className="academia-contenido-izquierdo">
                            <div className="academia-etiqueta-continuar">
                                <span className="academia-icono">{ultimaActividad.tipo === 'curso' ? '📚' : '🎵'}</span>
                                <span>Continuar Aprendiendo</span>
                            </div>
                            <h2 className="academia-titulo-principal">{ultimaActividad.titulo}</h2>
                            <div className="academia-info-actividad">
                                {ultimaActividad.tipo === 'curso' ? (
                                    <p className="academia-descripcion">
                                        <span className="academia-modulo">📖 {ultimaActividad.modulo}</span>
                                        <span className="academia-separador">•</span>
                                        <span className="academia-leccion">🎯 {ultimaActividad.leccion}</span>
                                    </p>
                                ) : (
                                    <p className="academia-descripcion">
                                        <span className="academia-artista">🎵 {ultimaActividad.artista}</span>
                                        <span className="academia-separador">•</span>
                                        <span className="academia-leccion">🎯 {ultimaActividad.leccion}</span>
                                    </p>
                                )}
                                <div className="academia-estadisticas">
                                    <div className="academia-stat">
                                        <span className="academia-valor">{ultimaActividad.progreso}%</span>
                                        <span className="academia-label">completado</span>
                                    </div>
                                    <div className="academia-stat">
                                        <span className="academia-valor">{ultimaActividad.tipo === 'curso' ? ultimaActividad.leccionesCompletadas : ultimaActividad.clasesCompletadas}</span>
                                        <span className="academia-label">de {ultimaActividad.tipo === 'curso' ? ultimaActividad.totalLecciones : ultimaActividad.totalClases} {ultimaActividad.tipo === 'curso' ? 'lecciones' : 'clases'}</span>
                                    </div>
                                </div>
                                <div className="academia-progreso-visual">
                                    <div className="academia-barra-progreso">
                                        <div className="academia-progreso-fill" style={{ width: `${ultimaActividad.progreso}%` }}></div>
                                    </div>
                                    <span className="academia-progreso-texto">{ultimaActividad.progreso}% completado</span>
                                </div>
                                <p className="academia-ultima-sesion">
                                    Última actividad: {formatearUltimaActividad(new Date(ultimaActividad.ultimaActividad))}
                                </p>
                            </div>
                            <div className="academia-botones-container">
                                <button className="academia-boton-continuar" onClick={continuarAprendizaje}>
                                    <span className="academia-icono-play">▶️</span>
                                    <span>Continuar {ultimaActividad.tipo === 'curso' ? 'Lección' : 'Clase'}</span>
                                    <svg className="academia-icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                                <button className="academia-boton-mis-cursos" onClick={() => navigate('/mis-cursos')}>
                                    <span className="academia-icono-libros">📚</span>
                                    <span>Ver Todos Mis Cursos</span>
                                    <svg className="academia-icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="academia-contenido-derecho">
                            <div className="academia-imagen-contenedor">
                                <img src={ultimaActividad.imagen || '/images/Home/academia-vallenata-1.jpg'} alt={ultimaActividad.titulo} className="academia-imagen-curso" />
                                <div className="academia-overlay-progreso">
                                    <div className="academia-progreso-circular">
                                        <div className="academia-circular-chart">
                                            <svg viewBox="0 0 36 36" className="academia-circular-chart-svg">
                                                <path className="academia-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="academia-circle" strokeDasharray={`${ultimaActividad.progreso}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="academia-percentage">{ultimaActividad.progreso}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {todasLasActividades.length > 1 && (
                        <div className="academia-slider-indicators">
                            {todasLasActividades.map((actividad, index) => (
                                <button key={index} className={`academia-indicator ${index === actividadActual ? 'academia-active' : ''}`} onClick={() => irAActividad(index)} aria-label={`Ir a ${actividad.titulo}`}>
                                    <span className="academia-tipo-indicator">{actividad.tipo === 'curso' ? '📚' : '🎵'}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="academia-hero-sin-actividad">
                    <div className="academia-contenido-vacio">
                        <div className="academia-icono-vacio">🎵</div>
                        <h2>¡Comienza tu viaje musical!</h2>
                        <p>Inscríbete en un curso o tutorial para empezar a aprender acordeón</p>
                        <div className="academia-botones-accion">
                            <button className="academia-boton-principal" onClick={() => navigate('/cursos')}>📚 Explorar Cursos</button>
                            <button className="academia-boton-secundario" onClick={() => navigate('/tutoriales')}>🎵 Ver Tutoriales</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ContinuarAprendiendo;
