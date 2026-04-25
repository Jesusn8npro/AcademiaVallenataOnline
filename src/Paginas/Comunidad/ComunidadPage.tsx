import React from 'react';
import BannerComunidad from '../../componentes/ComponentesComunidad/BannerComunidad';
import ComunidadPublicar from '../../componentes/ComponentesComunidad/ComunidadPublicar';
import FeedPublicaciones from '../../componentes/ComponentesComunidad/FeedPublicaciones';
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil';
import RankingComunidadNuevo from '../../componentes/ComponentesComunidad/RankingComunidadNuevo';
import UltimosArticulosBlog from '../../componentes/Perfil/UltimosArticulosBlog';
import SliderCursos from '../../componentes/ComponentesComunidad/SliderCursos';
import { useComunidad } from './Hooks/useComunidad';
import './ComunidadPage.css';

const ComunidadPage: React.FC = () => {
  const {
    usuario,
    publicaciones,
    cargando,
    error,
    perfilCompleto,
    viendoUnica,
    manejarNuevaPublicacion,
    eliminarPublicacion,
  } = useComunidad();

  return (
    <div className="comunidad-page-contenedor">
      <BannerComunidad />

      <div className="comunidad-page-contenido">
        <div className="comunidad-page-timeline-grid">

          <div className="comunidad-page-columna-timeline comunidad-page-columna-izquierda">
            <div className="comunidad-page-bloque-ranking">
              {perfilCompleto && <PorcentajePerfil perfil={perfilCompleto} />}
            </div>
            <UltimosArticulosBlog />
          </div>

          <div className="comunidad-page-columna-timeline comunidad-page-columna-central">
            <div className="comunidad-page-contenedor-publicar">
              {usuario && (
                <ComunidadPublicar usuario={usuario} onPublicar={manejarNuevaPublicacion} />
              )}
            </div>

            <div className="comunidad-page-feed-publicaciones">
              {cargando ? (
                <div className="comunidad-page-estado-carga">
                  <div className="comunidad-page-spinner"></div>
                  <p>Cargando publicaciones...</p>
                </div>
              ) : error ? (
                <div className="comunidad-page-estado-error">
                  <p>{error}</p>
                  <button
                    className="comunidad-page-btn-reintentar"
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  {viendoUnica && (
                    <div className="comunidad-page-filtro-info">
                      <p>Mostrando una publicación específica</p>
                      <button
                        className="comunidad-page-btn-ver-todo"
                        onClick={manejarNuevaPublicacion}
                      >
                        Ver todas las publicaciones
                      </button>
                    </div>
                  )}
                  {publicaciones.length === 0 ? (
                    <div className="comunidad-page-estado-vacio">
                      <div className="comunidad-page-icono-vacio">🎵</div>
                      <h3>No hay publicaciones aún</h3>
                      <p>¡Sé el primero en compartir algo con la comunidad!</p>
                    </div>
                  ) : (
                    publicaciones.map((publicacion) => (
                      <FeedPublicaciones
                        key={publicacion.id}
                        {...publicacion}
                        usuario={usuario}
                        onEliminar={eliminarPublicacion}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          <div className="comunidad-page-columna-timeline comunidad-page-columna-derecha">
            <RankingComunidadNuevo />
            <SliderCursos />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComunidadPage;
