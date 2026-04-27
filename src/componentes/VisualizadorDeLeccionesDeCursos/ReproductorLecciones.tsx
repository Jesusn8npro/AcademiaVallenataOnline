import React from 'react';
import { useReproductorLecciones } from './useReproductorLecciones';
import './ReproductorLecciones.css';

interface ReproductorLeccionesProps {
  leccionAnterior?: any;
  leccionSiguiente?: any;
  videoUrl?: string;
  thumbnailUrl?: string;
  titulo?: string;
  tipo?: 'leccion' | 'clase';
  completada?: boolean;
  cargandoCompletar?: boolean;
  marcarComoCompletada?: () => void;
  errorCompletar?: string;
  autoplay?: boolean;
}

const ReproductorLecciones: React.FC<ReproductorLeccionesProps> = ({
  leccionAnterior = null,
  leccionSiguiente = null,
  videoUrl = '',
  titulo = '',
  tipo = 'leccion',
  completada = false,
  cargandoCompletar = false,
  marcarComoCompletada = () => {},
}) => {
  const {
    cargando, setCargando, tieneError, setTieneError,
    esYouTube, esBunny, videoId, libraryId, idYouTube,
    urlProcesada, elementoIframeRef, reintentar, navegarAnterior, navegarSiguiente
  } = useReproductorLecciones({ videoUrl, leccionAnterior, leccionSiguiente, tipo });

  return (
    <div className="reproductor-container">
      <div className="video-wrapper">
        {tieneError || !urlProcesada ? (
          <div className="error-overlay">
            <div className="error-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Video no disponible</h3>
              <p>
                {!videoUrl
                  ? 'Esta clase aún no tiene un video asignado.'
                  : 'Hubo un problema al cargar el video. Por favor, inténtalo más tarde.'}
              </p>
              {videoUrl && (
                <button className="btn-reintentar" onClick={reintentar}>
                  🔄 Reintentar carga
                </button>
              )}
              <div className="debug-info">
                <details>
                  <summary>Información de depuración</summary>
                  <pre>
                    URL original: {videoUrl || 'No proporcionada'}
                    URL procesada: {urlProcesada || 'No procesada'}
                    YouTube: {esYouTube}
                    Bunny: {esBunny}
                    Library ID: {libraryId || 'No detectado'}
                    Video ID: {videoId || 'No detectado'}
                    YouTube ID: {idYouTube || 'No detectado'}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        ) : (
          <>
            <iframe
              ref={elementoIframeRef}
              title={titulo}
              src={urlProcesada}
              className="video-frame"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              frameBorder="0"
              referrerPolicy={esBunny ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin'}
              loading="eager"
              onLoad={() => { setCargando(false); setTieneError(false); }}
              onError={() => { setTieneError(true); setCargando(false); }}
            />
            {cargando && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p className="loading-text">Cargando video...</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="barra-navegacion">
        <button className="boton-nav anterior" onClick={navegarAnterior} disabled={!leccionAnterior}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="texto-completo">{tipo === 'clase' ? 'Anterior Clase' : 'Anterior Lección'}</span>
          <span className="texto-corto">Anterior</span>
        </button>

        <button className={`boton-completar ${completada ? 'completada' : ''}`} disabled={cargandoCompletar} onClick={marcarComoCompletada}>
          {cargandoCompletar ? (
            <><div className="spinner-boton"></div><span>Marcando...</span></>
          ) : completada ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Completada</span>
            </>
          ) : (
            <span>Marcar como completada</span>
          )}
        </button>

        <button className="boton-nav siguiente" onClick={navegarSiguiente} disabled={!leccionSiguiente}>
          <span className="texto-completo">{tipo === 'clase' ? 'Siguiente Clase' : 'Siguiente Lección'}</span>
          <span className="texto-corto">Siguiente</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReproductorLecciones;
