import React from 'react';
import { useRankingComunidad } from './Hooks/useRankingComunidad';
import './RankingComunidadNuevo.css';

const RankingComunidadNuevo: React.FC = () => {
  const {
    rankingData, isLoading, isLoadingMore, error,
    datosUsuarioActual, hasMore, loaderRef,
    cargarRanking,
    obtenerEmojiPosicion, obtenerClasePosicion,
  } = useRankingComunidad();

  return (
    <div className="ranking-nuevo-container">
      <div className="ranking-nuevo-header">
        <div className="ranking-nuevo-titulo">
          <h3>🏆 Ranking de la Comunidad</h3>
          <p>Los mejores estudiantes de la academia</p>
        </div>
      </div>

      <div className="ranking-nuevo-lista">
        {isLoading ? (
          <div className="ranking-nuevo-loading">
            <div className="ranking-nuevo-spinner"></div>
            <p>Cargando ranking...</p>
          </div>
        ) : error ? (
          <div className="ranking-nuevo-error">
            <p>{error}</p>
            <button className="ranking-nuevo-retry-btn" onClick={cargarRanking}>
              Reintentar
            </button>
          </div>
        ) : rankingData.length === 0 ? (
          <div className="ranking-nuevo-empty">
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          rankingData.filter(item => item && item.usuario).map((item) => (
            <div
              key={item.usuario_id}
              className={`ranking-card ${obtenerClasePosicion(item.posicion)} ${item.usuario_id === datosUsuarioActual?.id ? 'is-self' : ''}`}
              role="button"
              tabIndex={0}
            >
              <div className="ranking-card-pos">
                {item.posicion <= 3 ? (
                  <span className="ranking-medal">{obtenerEmojiPosicion(item.posicion)}</span>
                ) : (
                  <span className="ranking-number">#{item.posicion}</span>
                )}
              </div>

              <div className="ranking-card-avatar">
                {item.usuario?.url_foto_perfil ? (
                  <img src={item.usuario.url_foto_perfil} alt={item.usuario?.nombre} />
                ) : (
                  <div className="ranking-avatar-text">
                    {(item.usuario?.nombre || 'U').charAt(0)}
                  </div>
                )}
                {item.es_gaming && <div className="ranking-online-dot" />}
              </div>

              <div className="ranking-card-content">
                <div className="ranking-card-header">
                  <span className="ranking-user-name">
                    {item.usuario?.nombre} {item.usuario?.apellido}
                  </span>
                </div>
                <div className="ranking-card-stats">
                  <span className="ranking-xp-label">{item.puntuacion.toLocaleString()} pts</span>
                  <span className="ranking-divider">•</span>
                  <span className="ranking-level-label">Nivel {item.nivel}</span>
                </div>
              </div>

              {item.es_gaming && (
                <div className="ranking-gaming-tag" title="Usuario Pro">
                  <span className="ranking-gaming-icon">🎮</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="ranking-infinite-loader">
          {isLoadingMore ? (
            <div className="ranking-spinner-premium"></div>
          ) : (
            <div className="ranking-scroll-hint">
              <span>Desliza para ver más</span>
              <div className="mouse-icon">
                <div className="wheel"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RankingComunidadNuevo;
