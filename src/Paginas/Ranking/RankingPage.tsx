import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import { GamificacionServicio } from '../../servicios/gamificacionServicio'
import type { RankingGlobal } from '../../servicios/gamificacionServicio'
import './ranking.css'



const Ranking: React.FC = () => {
  // Estado local
  const [rankingCompleto, setRankingCompleto] = useState<RankingGlobal[]>([]);
  const [rankingMostrado, setRankingMostrado] = useState<RankingGlobal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('general');
  const [busqueda, setBusqueda] = useState('');
  const [miPosicion, setMiPosicion] = useState<RankingGlobal | null>(null);
  const [mostrarSoloTop, setMostrarSoloTop] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');

  // Scroll infinito
  const [usuariosMostrados, setUsuariosMostrados] = useState(6);
  const incrementoPorScroll = 4;
  const elementoTriggerRef = useRef<HTMLDivElement>(null);

  // Configuración de categorías
  const categorias = [
    {
      id: 'general',
      nombre: 'General',
      descripcion: 'Ranking global de la academia',
      icono: '🏆',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'simulador',
      nombre: 'Simulador',
      descripcion: 'Mejores en el simulador de acordeón',
      icono: '🎮',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'cursos',
      nombre: 'Cursos',
      descripcion: 'Progreso en cursos y tutoriales',
      icono: '📚',
      color: 'from-green-500 to-blue-600'
    },
    {
      id: 'precision',
      nombre: 'Precisión',
      descripcion: 'Mejor precisión en interpretación',
      icono: '🎯',
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'constancia',
      nombre: 'Constancia',
      descripcion: 'Usuarios más constantes',
      icono: '🔥',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'comunidad',
      nombre: 'Comunidad',
      descripcion: 'Participación en la comunidad',
      icono: '👥',
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  // Cargar ranking
  const cargarRanking = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      setUsuariosMostrados(6); // Reset a 6 usuarios

      console.log(`🎮 Cargando ranking completo: ${categoriaActiva}`);

      // Cargar ranking completo (hasta 200 usuarios)
      const ranking = await GamificacionServicio.obtenerRanking(categoriaActiva, 200);

      // Asignar datos completos
      setRankingCompleto(ranking);

      // Mostrar solo los primeros 6
      actualizarUsuariosMostrados(ranking, 6);

      // TODO: Cargar mi posición si estoy logueado
      // if (usuarioActual?.id) {
      //   const posicion = await GamificacionServicio.obtenerPosicionUsuario(
      //     usuarioActual.id,
      //     categoriaActiva
      //   );
      //   setMiPosicion(posicion);
      // }

      console.log(`✅ Ranking cargado: ${ranking.length} usuarios total, mostrando ${usuariosMostrados}`);

    } catch (err) {
      console.error('💥 Error cargando ranking:', err);
      setError('Error al cargar el ranking: ' + ((err as any)?.message || 'Error desconocido'));
    } finally {
      setCargando(false);
    }
  }, [categoriaActiva]);

  // Actualizar usuarios mostrados
  const actualizarUsuariosMostrados = useCallback((ranking?: RankingGlobal[], cantidad?: number) => {
    const rankingFiltrado = filtrarRanking(ranking || rankingCompleto);
    const cantidadMostrar = cantidad || usuariosMostrados;
    setRankingMostrado(rankingFiltrado.slice(0, cantidadMostrar));
  }, [rankingCompleto, usuariosMostrados, busqueda, filtroNivel, mostrarSoloTop]);

  // Cargar más usuarios
  const cargarMasUsuarios = useCallback(() => {
    const rankingFiltrado = filtrarRanking();

    if (usuariosMostrados >= rankingFiltrado.length) {
      return;
    }

    setCargandoMas(true);

    setTimeout(() => {
      const nuevaCantidad = usuariosMostrados + incrementoPorScroll;
      setUsuariosMostrados(nuevaCantidad);
      actualizarUsuariosMostrados(rankingCompleto, nuevaCantidad);
      setCargandoMas(false);
    }, 300);
  }, [usuariosMostrados, rankingCompleto, actualizarUsuariosMostrados]);

  // Cambiar categoría
  const cambiarCategoria = (categoria: string) => {
    if (categoria === categoriaActiva) return;
    setCategoriaActiva(categoria);
  };

  // Filtrar ranking
  const filtrarRanking = (ranking?: RankingGlobal[]): RankingGlobal[] => {
    const datos = ranking || rankingCompleto;

    if (!datos || !Array.isArray(datos) || datos.length === 0) {
      return [];
    }

    let rankingFiltrado = datos;

    // Filtro por búsqueda
    if (busqueda) {
      rankingFiltrado = rankingFiltrado.filter(item =>
        item.perfiles?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.perfiles?.apellido?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por nivel
    if (filtroNivel !== 'todos') {
      rankingFiltrado = rankingFiltrado.filter(item =>
        item.metricas?.nivel?.toString().toLowerCase() === filtroNivel.toLowerCase()
      );
    }

    // Mostrar solo top 10 si está activado
    if (mostrarSoloTop) {
      rankingFiltrado = rankingFiltrado.slice(0, 10);
    }

    return rankingFiltrado;
  };

  // Utilidades de estilo SCOPED
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

  // Scroll progresivo basado en ventana (evita disparos instantáneos)
  useEffect(() => {
    function onScroll() {
      const nearBottom = (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 120)
      if (nearBottom && !cargandoMas && !cargando) {
        cargarMasUsuarios()
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [cargarMasUsuarios, cargandoMas, cargando])

  // Cargar datos iniciales
  useEffect(() => {
    cargarRanking();
  }, [cargarRanking]);

  // Actualizar cuando cambien los filtros
  useEffect(() => {
    actualizarUsuariosMostrados();
  }, [actualizarUsuariosMostrados]);

  const navegarAInicio = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

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

        {/* CATEGORÍAS */}
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

        {/* FILTROS */}
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

        {/* RANKING */}
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
                {rankingMostrado.map((usuario, index) => (
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

              {/* TRIGGER PARA SCROLL INFINITO */}
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
};

export default Ranking;
