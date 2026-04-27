import { useRanking } from './useRanking';
import './ranking.css';

const categorias = [
    { id: 'general', nombre: 'General', descripcion: 'Ranking global de la academia', icono: '🏆' },
    { id: 'simulador', nombre: 'Simulador', descripcion: 'Mejores en el simulador de acordeón', icono: '🎮' },
    { id: 'cursos', nombre: 'Cursos', descripcion: 'Progreso en cursos y tutoriales', icono: '📚' },
    { id: 'precision', nombre: 'Precisión', descripcion: 'Mejor precisión en interpretación', icono: '🎯' },
    { id: 'constancia', nombre: 'Constancia', descripcion: 'Usuarios más constantes', icono: '🔥' },
    { id: 'comunidad', nombre: 'Comunidad', descripcion: 'Participación en la comunidad', icono: '👥' }
];

const obtenerColorPosicion = (posicion: number): string => {
    if (posicion === 1) return 'pr-text-gold';
    if (posicion === 2) return 'pr-text-silver';
    if (posicion === 3) return 'pr-text-bronze';
    if (posicion <= 10) return 'pr-text-blue';
    if (posicion <= 50) return 'pr-text-green';
    return 'pr-text-gray';
};

const obtenerIconoPosicion = (posicion: number): string => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    if (posicion <= 10) return '🏅';
    return '📊';
};

const obtenerEstiloTarjeta = (posicion: number): string => {
    if (posicion === 1) return 'pr-card-gold';
    if (posicion === 2) return 'pr-card-silver';
    if (posicion === 3) return 'pr-card-bronze';
    if (posicion <= 10) return 'pr-card-top10';
    return '';
};

const formatearPuntuacion = (puntos: number): string => {
    if (puntos >= 1000000) return `${(puntos / 1000000).toFixed(1)}M`;
    if (puntos >= 1000) return `${(puntos / 1000).toFixed(1)}K`;
    return puntos.toString();
};

export default function Ranking() {
    const {
        rankingMostrado, cargando, cargandoMas, error,
        categoriaActiva, busqueda, setBusqueda,
        mostrarSoloTop, setMostrarSoloTop,
        filtroNivel, setFiltroNivel,
        elementoTriggerRef,
        cargarRanking, cambiarCategoria
    } = useRanking();

    return (
        <>
            <title>Ranking Gaming - Academia Vallenata Online</title>
            <meta name="description" content="Ranking de estudiantes de Academia Vallenata Online. Compite, mejora y alcanza la cima del ranking musical." />

            <div className="page-ranking-container">
                <header className="page-ranking-header-section">
                    <h1 className="page-ranking-title">🏆 Ranking Gaming</h1>
                    <p className="page-ranking-description">
                        Selecciona una categoría, usa la búsqueda y desplázate para cargar más resultados.
                        La puntuación refleja tu actividad, progreso y XP en la academia.
                    </p>
                </header>

                <section className="page-ranking-categories-section">
                    <div className="page-ranking-categories-grid">
                        {categorias.map((categoria) => (
                            <button
                                key={categoria.id}
                                onClick={() => cambiarCategoria(categoria.id)}
                                className={`page-ranking-cat-btn ${categoriaActiva === categoria.id ? 'active' : ''}`}
                            >
                                <span className="page-ranking-cat-icon">{categoria.icono}</span>
                                <div className="page-ranking-cat-info">
                                    <h3>{categoria.nombre}</h3>
                                    <p>{categoria.descripcion}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="page-ranking-filters-section">
                    <div className="page-ranking-filters-wrapper">
                        <div className="page-ranking-search-box">
                            <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="page-ranking-search-input"
                            />
                        </div>

                        <div className="page-ranking-opts">
                            <select
                                value={filtroNivel}
                                onChange={(e) => setFiltroNivel(e.target.value)}
                                className="page-ranking-select"
                            >
                                <option value="todos">Todos los niveles</option>
                                <option value="principiante">Principiante</option>
                                <option value="intermedio">Intermedio</option>
                                <option value="avanzado">Avanzado</option>
                                <option value="experto">Experto</option>
                            </select>

                            <label className="page-ranking-toggle">
                                <input
                                    type="checkbox"
                                    checked={mostrarSoloTop}
                                    onChange={(e) => setMostrarSoloTop(e.target.checked)}
                                />
                                <span className="toggle-text">Solo Top 10</span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="page-ranking-list-section">
                    {cargando ? (
                        <div className="page-ranking-loader">
                            <div className="page-ranking-spinner"></div>
                            <p>Cargando tabla de líderes...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p>{error}</p>
                            <button onClick={cargarRanking} className="retry-btn">Reintentar</button>
                        </div>
                    ) : (
                        <>
                            <div className="page-ranking-list-wrapper">
                                {rankingMostrado.map((usuario) => (
                                    <div
                                        key={usuario.id}
                                        className={`page-ranking-user-card ${obtenerEstiloTarjeta(usuario.posicion)}`}
                                    >
                                        <div className="pr-pos-wrapper">
                                            <span className={`pr-pos-num ${obtenerColorPosicion(usuario.posicion)}`}>
                                                #{usuario.posicion}
                                            </span>
                                            <span className="pr-pos-icon">
                                                {obtenerIconoPosicion(usuario.posicion)}
                                            </span>
                                        </div>

                                        <div className="pr-avatar-wrapper">
                                            <img
                                                src={usuario.perfiles?.url_foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usuario.usuario_id}`}
                                                alt={`Avatar de ${usuario.perfiles?.nombre}`}
                                            />
                                        </div>

                                        <div className="pr-user-info">
                                            <h3 className="pr-user-name">
                                                {usuario.perfiles?.nombre} {usuario.perfiles?.apellido}
                                            </h3>
                                            <p className="pr-user-level">Nivel {usuario.metricas?.nivel || 1}</p>
                                        </div>

                                        <div className="pr-stats-wrapper">
                                            <div className="pr-stat-box">
                                                <span className="pr-stat-val">
                                                    {formatearPuntuacion(usuario.puntuacion)}
                                                </span>
                                                <span className="pr-stat-label">Puntos</span>
                                            </div>
                                            <div className="pr-stat-box">
                                                <span className="pr-stat-val">
                                                    {formatearPuntuacion(usuario.metricas?.xp_total || 0)}
                                                </span>
                                                <span className="pr-stat-label">XP Total</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div ref={elementoTriggerRef} className="page-ranking-scroll-trigger">
                                {cargandoMas && (
                                    <div className="loading-mas">
                                        <div className="page-ranking-spinner-sm"></div>
                                        <p>Cargando más...</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </>
    );
}
