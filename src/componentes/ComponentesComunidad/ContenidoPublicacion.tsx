import React from 'react';

interface ContenidoPublicacionProps {
  tipo: string;
  titulo?: string;
  contenido: string;
  url_imagen?: string;
  url_video?: string;
  url_gif?: string;
  enc?: Record<string, unknown>;
  grabacionHero: any;
  cargandoGrabacionHero: boolean;
  setMostrarReplayHero: (v: boolean) => void;
}

const ContenidoPublicacion: React.FC<ContenidoPublicacionProps> = ({
  tipo, titulo, contenido, url_imagen, url_video, url_gif,
  enc, grabacionHero, cargandoGrabacionHero, setMostrarReplayHero,
}) => {
  return (
    <div className="feed-publicaciones-contenido-principal">
      {tipo === 'foto_perfil' ? (
        <p className="feed-publicaciones-texto-publicacion-automatica">
          <span className="feed-publicaciones-accion-automatica">Actualizó su foto de perfil</span>
        </p>
      ) : tipo === 'foto_portada' ? (
        <p className="feed-publicaciones-texto-publicacion-automatica">
          <span className="feed-publicaciones-accion-automatica">Actualizó su foto de portada</span>
        </p>
      ) : (
        <>
          {titulo && <h4 className="feed-publicaciones-titulo-publicacion">{titulo}</h4>}
          {contenido && <p className="feed-publicaciones-texto-publicacion">{contenido}</p>}
        </>
      )}

      {tipo === 'grabacion_hero' && (
        <div className="feed-publicaciones-grabacion-hero">
          <div className="feed-publicaciones-grabacion-meta">
            <span className={`feed-publicaciones-grabacion-badge ${enc?.modo === 'competencia' ? 'competencia' : 'practica'}`}>
              {enc?.modo === 'competencia' ? `${Math.round(Number(enc?.precision_porcentaje) || 0)}% · competencia` : 'practica libre'}
            </span>
            <span className="feed-publicaciones-grabacion-resumen">
              {String(enc?.cancion_titulo || enc?.titulo_grabacion || 'Replay Hero')}
              {enc?.puntuacion ? ` · ${Number(enc.puntuacion).toLocaleString('es-CO')} pts` : ''}
            </span>
          </div>
          <div className="feed-publicaciones-grabacion-player">
            <button
              className="feed-publicaciones-grabacion-btn"
              onClick={() => setMostrarReplayHero(true)}
              disabled={!grabacionHero || cargandoGrabacionHero}
            >
              {cargandoGrabacionHero ? 'Cargando replay...' : 'Ver replay'}
            </button>
            <div className="feed-publicaciones-grabacion-barra">
              <div className="feed-publicaciones-grabacion-barra-interna" />
            </div>
            <span className="feed-publicaciones-grabacion-tiempo">
              {grabacionHero?.duracion_ms
                ? `${Math.floor(grabacionHero.duracion_ms / 60000)}:${Math.floor((grabacionHero.duracion_ms % 60000) / 1000).toString().padStart(2, '0')}`
                : 'Replay'}
            </span>
          </div>
        </div>
      )}

      {url_imagen && (
        <div className={`feed-publicaciones-contenedor-media ${tipo === 'foto_perfil' ? 'feed-publicaciones-media-perfil' : ''}`}>
          <img
            src={url_imagen}
            alt="Imagen de la publicación"
            className="feed-publicaciones-imagen-publicacion"
            loading="lazy"
          />
        </div>
      )}

      {url_video && (
        <div className="feed-publicaciones-contenedor-media">
          <video
            src={url_video}
            controls
            className="feed-publicaciones-video-publicacion"
            preload="metadata"
            aria-label="Video de la publicación"
          >
            <track kind="captions" src="" label="Sin subtítulos disponibles" default />
            Su navegador no soporta la reproducción de video.
          </video>
        </div>
      )}

      {url_gif && (
        <div className="feed-publicaciones-contenedor-media">
          <img
            src={url_gif}
            alt="GIF de la publicación"
            className="feed-publicaciones-gif-publicacion"
            loading="lazy"
          />
        </div>
      )}

      {enc?.opciones && Array.isArray(enc.opciones) && enc.opciones.length > 0 && (
        <div className="feed-publicaciones-encuesta">
          <h4 className="feed-publicaciones-titulo-encuesta">{String(enc.pregunta)}</h4>
          <div className="feed-publicaciones-opciones-encuesta">
            {(enc.opciones as string[]).map((opcion, index) => (
              <button key={index} className="feed-publicaciones-opcion-encuesta">
                {opcion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContenidoPublicacion;
