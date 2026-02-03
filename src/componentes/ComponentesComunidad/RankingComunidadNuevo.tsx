import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import './RankingComunidadNuevo.css';

interface Usuario {
  nombre: string;
  apellido: string;
  nombre_usuario?: string;
  nombre_completo?: string;
  url_foto_perfil?: string;
}

interface RankingItem {
  posicion: number;
  puntuacion: number;
  usuario_id: string;
  usuario: Usuario;
  nivel: number;
  xp_total: number;
  cursos_completados: number;
  tutoriales_completados: number;
  publicaciones_creadas: number;
  likes_recibidos: number;
  comentarios_hechos: number;
  racha_actual_dias: number;
  logros_totales: number;
  es_gaming: boolean;
}

interface Filtro {
  value: string;
  label: string;
  icon: string;
}

const RankingComunidadNuevo: React.FC = () => {
  // Estados principales
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [rankingCompleto, setRankingCompleto] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('general');
  const [datosUsuarioActual, setDatosUsuarioActual] = useState<any>(null);
  const [posicionUsuario, setPosicionUsuario] = useState(0);
  const [showXPBars, setShowXPBars] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  // Paginación
  const [itemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Referencias
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Opciones de filtro
  const filtros: Filtro[] = [
    { value: 'general', label: 'General', icon: '🏆' },
    { value: 'cursos', label: 'Cursos', icon: '📚' },
    { value: 'comunidad', label: 'Comunidad', icon: '💬' },
    { value: 'simulador', label: 'Simulador', icon: '🎹' },
    { value: 'constancia', label: 'Constancia', icon: '🔥' }
  ];

  // Obtener usuario actual
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (perfil) {
            setDatosUsuarioActual({ id: user.id, ...perfil });
          }
        }
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
      }
    };

    obtenerUsuarioActual();
  }, []);

  // Cargar ranking completo
  const cargarRankingCompleto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Cargando ranking completo...');

      // Por ahora usar siempre datos de ejemplo para asegurar que funcione
      await cargarRankingTradicional();

    } catch (error) {
      console.error('Error cargando ranking:', error);
      setIsLoading(false);
      setError('Error al cargar el ranking');
    }
  };

  // Cargar ranking tradicional (datos de ejemplo)
  const cargarRankingTradicional = async () => {
    try {
      console.log('🔄 Cargando ranking tradicional...');

      const datosEjemplo: RankingItem[] = [
        {
          posicion: 1,
          puntuacion: 2500,
          usuario_id: '1',
          usuario: {
            nombre: 'Carlos',
            apellido: 'Mendoza',
            url_foto_perfil: ''
          },
          nivel: 15,
          xp_total: 2500,
          cursos_completados: 8,
          tutoriales_completados: 12,
          publicaciones_creadas: 25,
          likes_recibidos: 150,
          comentarios_hechos: 45,
          racha_actual_dias: 30,
          logros_totales: 8,
          es_gaming: true
        },
        {
          posicion: 2,
          puntuacion: 2300,
          usuario_id: '2',
          usuario: {
            nombre: 'Ana',
            apellido: 'Rodriguez',
            url_foto_perfil: ''
          },
          nivel: 14,
          xp_total: 2300,
          cursos_completados: 7,
          tutoriales_completados: 10,
          publicaciones_creadas: 20,
          likes_recibidos: 120,
          comentarios_hechos: 35,
          racha_actual_dias: 25,
          logros_totales: 7,
          es_gaming: true
        },
        {
          posicion: 3,
          puntuacion: 1900,
          usuario_id: '3',
          usuario: {
            nombre: 'Luis',
            apellido: 'García',
            url_foto_perfil: ''
          },
          nivel: 10,
          xp_total: 1900,
          cursos_completados: 5,
          tutoriales_completados: 6,
          publicaciones_creadas: 15,
          likes_recibidos: 78,
          comentarios_hechos: 28,
          racha_actual_dias: 20,
          logros_totales: 6,
          es_gaming: true
        },
        {
          posicion: 4,
          puntuacion: 1800,
          usuario_id: '4',
          usuario: {
            nombre: 'María',
            apellido: 'López',
            url_foto_perfil: ''
          },
          nivel: 9,
          xp_total: 1800,
          cursos_completados: 4,
          tutoriales_completados: 8,
          publicaciones_creadas: 12,
          likes_recibidos: 65,
          comentarios_hechos: 22,
          racha_actual_dias: 18,
          logros_totales: 5,
          es_gaming: true
        },
        {
          posicion: 5,
          puntuacion: 1700,
          usuario_id: '5',
          usuario: {
            nombre: 'Pedro',
            apellido: 'Martínez',
            url_foto_perfil: ''
          },
          nivel: 8,
          xp_total: 1700,
          cursos_completados: 3,
          tutoriales_completados: 7,
          publicaciones_creadas: 10,
          likes_recibidos: 55,
          comentarios_hechos: 18,
          racha_actual_dias: 15,
          logros_totales: 4,
          es_gaming: true
        },
        {
          posicion: 6,
          puntuacion: 1600,
          usuario_id: '6',
          usuario: {
            nombre: 'Sofia',
            apellido: 'González',
            url_foto_perfil: ''
          },
          nivel: 7,
          xp_total: 1600,
          cursos_completados: 2,
          tutoriales_completados: 6,
          publicaciones_creadas: 8,
          likes_recibidos: 45,
          comentarios_hechos: 15,
          racha_actual_dias: 12,
          logros_totales: 3,
          es_gaming: true
        },
        {
          posicion: 7,
          puntuacion: 1500,
          usuario_id: '7',
          usuario: {
            nombre: 'Diego',
            apellido: 'Hernández',
            url_foto_perfil: ''
          },
          nivel: 6,
          xp_total: 1500,
          cursos_completados: 2,
          tutoriales_completados: 5,
          publicaciones_creadas: 6,
          likes_recibidos: 35,
          comentarios_hechos: 12,
          racha_actual_dias: 10,
          logros_totales: 2,
          es_gaming: true
        },
        {
          posicion: 8,
          puntuacion: 1400,
          usuario_id: '8',
          usuario: {
            nombre: 'Laura',
            apellido: 'Díaz',
            url_foto_perfil: ''
          },
          nivel: 5,
          xp_total: 1400,
          cursos_completados: 1,
          tutoriales_completados: 4,
          publicaciones_creadas: 4,
          likes_recibidos: 25,
          comentarios_hechos: 8,
          racha_actual_dias: 8,
          logros_totales: 2,
          es_gaming: true
        },
        {
          posicion: 9,
          puntuacion: 1300,
          usuario_id: '9',
          usuario: {
            nombre: 'Miguel',
            apellido: 'Ruiz',
            url_foto_perfil: ''
          },
          nivel: 4,
          xp_total: 1300,
          cursos_completados: 1,
          tutoriales_completados: 3,
          publicaciones_creadas: 3,
          likes_recibidos: 20,
          comentarios_hechos: 6,
          racha_actual_dias: 6,
          logros_totales: 1,
          es_gaming: true
        },
        {
          posicion: 10,
          puntuacion: 1200,
          usuario_id: '10',
          usuario: {
            nombre: 'Carmen',
            apellido: 'Vega',
            url_foto_perfil: ''
          },
          nivel: 3,
          xp_total: 1200,
          cursos_completados: 1,
          tutoriales_completados: 2,
          publicaciones_creadas: 2,
          likes_recibidos: 15,
          comentarios_hechos: 4,
          racha_actual_dias: 4,
          logros_totales: 1,
          es_gaming: true
        }
      ];

      console.log('📊 Datos de ejemplo cargados:', datosEjemplo.length);
      setRankingCompleto(datosEjemplo);
      cargarPaginaInicial(datosEjemplo);

    } catch (error) {
      console.error('Error en cargarRankingTradicional:', error);
      setIsLoading(false);
      setError('Error al cargar el ranking');
    }
  };

  // Cargar página inicial
  const cargarPaginaInicial = (ranking: RankingItem[]) => {
    console.log('📄 Cargando página inicial con', ranking.length, 'usuarios');
    setCurrentPage(1);
    const primerosUsuarios = ranking.slice(0, itemsPerPage);
    console.log('👥 Primeros usuarios:', primerosUsuarios.length);
    setRankingData(primerosUsuarios);
    setHasMore(ranking.length > itemsPerPage);
    setIsLoading(false);
  };

  // Cargar más usuarios
  const cargarMasUsuarios = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const nuevosItems = rankingCompleto.slice(startIndex, endIndex);

      if (nuevosItems.length > 0) {
        setRankingData(prev => [...prev, ...nuevosItems]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < rankingCompleto.length);
      } else {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    }, 500);
  };

  // Cambiar filtro
  const cambiarFiltro = (nuevoFiltro: string) => {
    if (nuevoFiltro !== filtroTipo) {
      setFiltroTipo(nuevoFiltro);
      setCurrentPage(1);
      setRankingData([]);
      cargarRankingCompleto();
    }
  };

  // Cargar ranking al montar y cuando cambie el filtro
  useEffect(() => {
    cargarRankingCompleto();
  }, [filtroTipo]);

  // Funciones de utilidad
  const obtenerEmojiPosicion = (posicion: number): string => {
    switch (posicion) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const obtenerClasePosicion = (posicion: number): string => {
    if (posicion <= 3) return 'top-tres';
    if (posicion <= 10) return 'top-diez';
    return 'otros';
  };

  const obtenerDescripcionPuntuacion = (item: RankingItem): string => {
    switch (filtroTipo) {
      case 'cursos':
        return `${item.cursos_completados} cursos completados`;
      case 'comunidad':
        return `${item.publicaciones_creadas} publicaciones`;
      case 'simulador':
        return `Nivel ${item.nivel}`;
      case 'constancia':
        return `${item.racha_actual_dias} días de racha`;
      default:
        return `Nivel ${item.nivel}`;
    }
  };

  const irAPerfil = (usuario: RankingItem) => {
    console.log('Navegando al perfil de:', usuario.usuario?.nombre || 'Usuario');
    // Aquí puedes implementar la navegación al perfil
  };

  return (
    <div className="ranking-nuevo-container">
      {/* Header */}
      <div className="ranking-nuevo-header">
        <div className="ranking-nuevo-titulo">
          <h3>🏆 Ranking de la Comunidad</h3>
          <p>Los mejores estudiantes de la academia</p>
        </div>

        <div className="ranking-nuevo-controls">
          <button
            className="ranking-nuevo-btn-info"
            onClick={() => setMostrarExplicacion(!mostrarExplicacion)}
            title="¿Cómo funciona el ranking?"
          >
            <span>ℹ️</span>
          </button>

          <button
            className="ranking-nuevo-btn-xp"
            onClick={() => setShowXPBars(!showXPBars)}
            title="Mostrar barras de XP"
          >
            <span>📊</span>
          </button>
        </div>
      </div>

      {/* Explicación */}
      {mostrarExplicacion && (
        <div className="ranking-nuevo-explicacion">
          <div className="ranking-nuevo-explicacion-content">
            <h4>🎯 ¿Cómo funciona el ranking?</h4>
            <p>El ranking se basa en tu actividad en la plataforma: cursos completados, participación en la comunidad, uso del simulador y constancia en el aprendizaje.</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="ranking-nuevo-filtros">
        {filtros.map((filtro) => (
          <button
            key={filtro.value}
            className={`ranking-nuevo-filtro-btn ${filtroTipo === filtro.value ? 'activo' : ''}`}
            onClick={() => cambiarFiltro(filtro.value)}
          >
            <span className="ranking-nuevo-filtro-icono">{filtro.icon}</span>
            <span className="ranking-nuevo-filtro-texto">{filtro.label}</span>
          </button>
        ))}
      </div>

      {/* Posición del usuario actual */}
      {datosUsuarioActual && posicionUsuario > 0 && (
        <div className="ranking-nuevo-usuario-actual">
          <div className="ranking-nuevo-usuario-info">
            <span className="ranking-nuevo-usuario-posicion">#{posicionUsuario}</span>
            <span className="ranking-nuevo-usuario-nombre">
              {datosUsuarioActual.nombre} {datosUsuarioActual.apellido}
            </span>
          </div>
        </div>
      )}

      {/* Lista de ranking */}
      <div className="ranking-nuevo-lista">
        {isLoading ? (
          <div className="ranking-nuevo-loading">
            <div className="ranking-nuevo-spinner"></div>
            <p>Cargando ranking...</p>
          </div>
        ) : error ? (
          <div className="ranking-nuevo-error">
            <p>{error}</p>
            <button className="ranking-nuevo-retry-btn" onClick={cargarRankingCompleto}>
              Reintentar
            </button>
          </div>
        ) : rankingData.length === 0 ? (
          <div className="ranking-nuevo-empty">
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          rankingData.filter(item => item && item.usuario).map((item, index) => (
            <div
              key={item.usuario_id}
              className={`ranking-nuevo-item ${obtenerClasePosicion(item.posicion)} ${item.usuario_id === datosUsuarioActual?.id ? 'es-usuario-actual' : ''
                } ${item.es_gaming ? 'es-gaming' : ''}`}
              onClick={() => irAPerfil(item)}
              onKeyDown={(e) => e.key === 'Enter' && irAPerfil(item)}
              role="button"
              tabIndex={0}
              title={`Ver perfil de ${item.usuario?.nombre || 'Usuario'}`}
            >
              {/* Contenedor principal del usuario */}
              <div className="ranking-nuevo-usuario-container">
                {/* Posición */}
                <div className="ranking-nuevo-posicion">
                  <span className="ranking-nuevo-posicion-emoji">{obtenerEmojiPosicion(item.posicion)}</span>
                  <span className="ranking-nuevo-posicion-numero">#{item.posicion}</span>
                </div>

                {/* Avatar */}
                <div className="ranking-nuevo-avatar">
                  {item.usuario?.url_foto_perfil ? (
                    <img src={item.usuario.url_foto_perfil} alt={`Avatar de ${item.usuario?.nombre || 'Usuario'}`} />
                  ) : (
                    <div className="ranking-nuevo-avatar-placeholder">
                      {(item.usuario?.nombre || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {item.es_gaming && (
                    <div className="ranking-nuevo-gaming-badge">🎮</div>
                  )}
                </div>

                {/* Info usuario */}
                <div className="ranking-nuevo-usuario-info">
                  <h4 className="ranking-nuevo-nombre">
                    {item.usuario?.nombre || 'Usuario'} {item.usuario?.apellido || ''}
                  </h4>
                  <p className="ranking-nuevo-descripcion">
                    {obtenerDescripcionPuntuacion(item)}
                  </p>
                </div>

                {/* Indicador gaming */}
                {item.es_gaming && (
                  <div className="ranking-nuevo-gaming-indicator">
                    <div className="ranking-nuevo-gaming-dot"></div>
                  </div>
                )}
              </div>

              {/* Puntuación - Ahora ocupa todo el ancho */}
              <div className="ranking-nuevo-puntuacion">
                <span className="ranking-nuevo-puntos">{item.puntuacion.toLocaleString()}</span>
                <span className="ranking-nuevo-puntos-label">puntos</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón cargar más */}
      {hasMore && !isLoading && (
        <div className="ranking-nuevo-load-more-container">
          <button
            className="ranking-nuevo-load-more-btn"
            onClick={cargarMasUsuarios}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <div className="ranking-nuevo-btn-spinner"></div>
                Cargando...
              </>
            ) : (
              'Ver más usuarios'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RankingComunidadNuevo;
