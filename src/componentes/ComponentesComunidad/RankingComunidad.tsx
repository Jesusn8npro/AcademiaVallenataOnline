import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import './RankingComunidad.css';

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

const RankingComunidad: React.FC = () => {
  // Estados principales
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [rankingCompleto, setRankingCompleto] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('general');
  const [datosUsuarioActual, setDatosUsuarioActual] = useState<any>(null);
  const [posicionUsuario, setPosicionUsuario] = useState(0);

  // Paginación
  const [itemsPerPage] = useState(7);
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

      // Intentar cargar con RPC primero
      const { data, error: supabaseError } = await supabase.rpc('obtener_ranking_hibrido_completo', {
        p_tipo_ranking: filtroTipo,
        p_limite: 1000
      });

      if (supabaseError) {
        console.error('Error obteniendo ranking:', supabaseError);
        await cargarRankingTradicional();
        return;
      }

      if (!data || data.length === 0) {
        await cargarRankingTradicional();
        return;
      }

      // Mapear datos y reorganizar posiciones
      const rankingMapeado = data
        .filter((item: any) => item.usuario_id && (item.puntuacion > 0 || item.posicion > 0))
        .map((item: any, index: number) => ({
          posicion: index + 1,
          puntuacion: Math.max(0, item.puntuacion || 0),
          usuario_id: item.usuario_id,
          usuario: {
            nombre: item.nombre || 'Usuario',
            apellido: item.apellido || '',
            nombre_usuario: item.nombre_usuario || null,
            nombre_completo: item.nombre_completo || null,
            url_foto_perfil: item.url_foto_perfil
          },
          nivel: Math.max(1, item.nivel || 1),
          xp_total: Math.max(0, item.xp_total || 0),
          cursos_completados: Math.max(0, item.cursos_completados || 0),
          tutoriales_completados: Math.max(0, item.tutoriales_completados || 0),
          publicaciones_creadas: Math.max(0, item.publicaciones_creadas || 0),
          likes_recibidos: Math.max(0, item.likes_recibidos || 0),
          comentarios_hechos: Math.max(0, item.comentarios_hechos || 0),
          racha_actual_dias: Math.max(0, item.racha_actual_dias || 0),
          logros_totales: Math.max(0, item.logros_totales || 0),
          es_gaming: item.es_gaming || false
        }));

      setRankingCompleto(rankingMapeado);

      // Encontrar posición del usuario actual
      if (datosUsuarioActual?.id) {
        const userIndex = rankingMapeado.findIndex(u => u.usuario_id === datosUsuarioActual.id);
        setPosicionUsuario(userIndex >= 0 ? userIndex + 1 : 0);
      }

      // Cargar primera página
      cargarPaginaInicial(rankingMapeado);

    } catch (error) {
      console.error('Error en cargarRankingCompleto:', error);
      await cargarRankingTradicional();
    }
  };

  // Método de respaldo
  const cargarRankingTradicional = async () => {
    try {
      // Simular datos de ejemplo para desarrollo
      const datosEjemplo: RankingItem[] = [
        {
          posicion: 1,
          puntuacion: 3572,
          usuario_id: '1',
          usuario: {
            nombre: 'Carlos',
            apellido: 'Mendoza',
            url_foto_perfil: ''
          },
          nivel: 15,
          xp_total: 3572,
          cursos_completados: 8,
          tutoriales_completados: 12,
          publicaciones_creadas: 25,
          likes_recibidos: 150,
          comentarios_hechos: 45,
          racha_actual_dias: 30,
          logros_totales: 12,
          es_gaming: true
        },
        {
          posicion: 2,
          puntuacion: 2200,
          usuario_id: '2',
          usuario: {
            nombre: 'Ana',
            apellido: 'Rodriguez',
            url_foto_perfil: ''
          },
          nivel: 12,
          xp_total: 2200,
          cursos_completados: 6,
          tutoriales_completados: 8,
          publicaciones_creadas: 18,
          likes_recibidos: 95,
          comentarios_hechos: 32,
          racha_actual_dias: 25,
          logros_totales: 8,
          es_gaming: false
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
        }
      ];

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
    setCurrentPage(1);
    setRankingData(ranking.slice(0, itemsPerPage));
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
      const nuevosUsuarios = rankingCompleto.slice(startIndex, endIndex);

      if (nuevosUsuarios.length > 0) {
        setRankingData(prev => [...prev, ...nuevosUsuarios]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < rankingCompleto.length);
      } else {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    }, 500);
  };

  // Cargar al montar
  useEffect(() => {
    cargarRankingCompleto();
  }, []);

  // Recargar cuando cambie el filtro
  useEffect(() => {
    if (filtroTipo) {
      cargarRankingCompleto();
    }
  }, [filtroTipo]);

  // Obtener clase de posición
  const obtenerClasePosicion = (posicion: number): string => {
    if (posicion === 1) return 'ranking-oro';
    if (posicion === 2) return 'ranking-plata';
    if (posicion === 3) return 'ranking-bronce';
    if (posicion <= 10) return 'ranking-top-10';
    return 'ranking-otros';
  };

  // Obtener emoji de posición
  const obtenerEmojiPosicion = (posicion: number): string => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    if (posicion <= 10) return '🏆';
    return '🎯';
  };

  // Obtener descripción de puntuación según filtro
  const obtenerDescripcionPuntuacion = (item: RankingItem): string => {
    if (filtroTipo === 'cursos') {
      return `${item.cursos_completados} cursos • ${item.tutoriales_completados} tutoriales`;
    }
    if (filtroTipo === 'comunidad') {
      return `${item.publicaciones_creadas} posts • ${item.likes_recibidos} likes`;
    }
    if (filtroTipo === 'constancia') {
      return `${item.racha_actual_dias} días activo`;
    }
    if (filtroTipo === 'simulador') {
      return `Nivel ${item.nivel} • ${item.xp_total} XP`;
    }
    return `${item.puntuacion} puntos • Nivel ${item.nivel}`;
  };

  // Navegar a perfil de usuario
  const irAPerfil = (item: RankingItem) => {
    console.log(`🔗 Navegando al perfil de:`, item.usuario);
    // Aquí implementarías la navegación
    // navigate(`/usuarios/${slug}`);
  };

  return (
    <div className="ranking-comunidad">
      {/* Encabezado mejorado - SIN botones feos */}
      <div className="ranking-header">
        <div className="header-info">
          <h3>🏆 Ranking Comunidad</h3>
          <p>Compite con otros acordeonistas</p>
        </div>
      </div>

      {/* Filtros mejorados */}
      <div className="filtros-ranking">
        {filtros.map((filtro) => (
          <button
            key={filtro.value}
            className={`filtro-btn ${filtroTipo === filtro.value ? 'active' : ''}`}
            onClick={() => setFiltroTipo(filtro.value)}
          >
            <span className="filtro-icon">{filtro.icon}</span>
            <span className="filtro-label">{filtro.label}</span>
          </button>
        ))}
      </div>

      {/* Mi posición */}
      {posicionUsuario > 0 && (
        <div className="mi-posicion">
          <span className="posicion-icon">{obtenerEmojiPosicion(posicionUsuario)}</span>
          <span className="posicion-texto">
            Tu posición: <strong>#{posicionUsuario}</strong>
          </span>
        </div>
      )}

      {/* Lista de ranking con scroll mejorado */}
      <div className="ranking-container">
        <div className="ranking-lista">
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Cargando ranking...</p>
            </div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
              <button className="retry-btn" onClick={cargarRankingCompleto}>
                Reintentar
              </button>
            </div>
          ) : rankingData.length === 0 ? (
            <div className="empty">
              <p>No hay datos disponibles</p>
            </div>
          ) : (
            rankingData.map((item, index) => (
              <div
                key={item.usuario_id}
                className={`ranking-item ${obtenerClasePosicion(item.posicion)} ${item.usuario_id === datosUsuarioActual?.id ? 'es-usuario-actual' : ''
                  } ${item.es_gaming ? 'es-gaming' : ''}`}
                onClick={() => irAPerfil(item)}
                onKeyDown={(e) => e.key === 'Enter' && irAPerfil(item)}
                role="button"
                tabIndex={0}
                title={`Ver perfil de ${item.usuario.nombre}`}
              >
                {/* Posición */}
                <div className="posicion">
                  <span className="posicion-emoji">{obtenerEmojiPosicion(item.posicion)}</span>
                  <span className="posicion-numero">#{item.posicion}</span>
                </div>

                {/* Avatar */}
                <div className="avatar">
                  {item.usuario.url_foto_perfil ? (
                    <img src={item.usuario.url_foto_perfil} alt={`Avatar de ${item.usuario.nombre}`} />
                  ) : (
                    <div className="avatar-placeholder">
                      {item.usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {item.es_gaming && (
                    <div className="gaming-badge">🎮</div>
                  )}
                </div>

                {/* Info usuario */}
                <div className="usuario-info">
                  <h4 className="nombre">
                    {item.usuario.nombre} {item.usuario.apellido}
                  </h4>
                  <p className="descripcion">
                    {obtenerDescripcionPuntuacion(item)}
                  </p>
                </div>

                {/* Puntuación */}
                <div className="puntuacion">
                  <span className="puntos">{item.puntuacion.toLocaleString()}</span>
                  <span className="puntos-label">puntos</span>
                </div>

                {/* Indicador gaming */}
                {item.es_gaming && (
                  <div className="gaming-indicator">
                    <div className="gaming-dot"></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botón cargar más */}
      {hasMore && !isLoading && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={cargarMasUsuarios}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <div className="btn-spinner"></div>
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

export default RankingComunidad;
