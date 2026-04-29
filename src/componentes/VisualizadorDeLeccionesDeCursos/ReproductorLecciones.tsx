import React from 'react';
import { useReproductorLecciones } from './useReproductorLecciones';
import { useVideoFirmado } from '../../hooks/useVideoFirmado';
import './ReproductorLecciones.css';

interface ReproductorLeccionesProps {
  leccionAnterior?: any;
  leccionSiguiente?: any;
  videoUrl?: string;
  parteId?: string;
  leccionId?: string;
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
  parteId,
  leccionId,
  titulo = '',
  tipo = 'leccion',
  completada = false,
  cargandoCompletar = false,
  marcarComoCompletada = () => {},
}) => {
  const usarFirmado = !!(parteId || leccionId);
  const firmado = useVideoFirmado(usarFirmado ? { parteId, leccionId } : {});
  const sinAcceso = usarFirmado && firmado.error?.codigo === 'sin_acceso';
  const cargandoFirmado = usarFirmado && firmado.loading && !firmado.url;
  const errorFirmado = usarFirmado && !!firmado.error && firmado.error.codigo !== 'sin_acceso';
  const esBunnyFirmado = usarFirmado && firmado.plataforma === 'bunny';

  // Hook interno solo para navegación y flujo legacy (sin parteId/leccionId).
  // Cuando hay URL firmada la usamos tal cual: si la pasáramos por procesarUrl()
  // se perderían los query params del token de firma de Bunny.
  const {
    cargando, setCargando, tieneError, setTieneError,
    esYouTube, esBunny, videoId, libraryId, idYouTube,
    urlProcesada, elementoIframeRef, reintentar, navegarAnterior, navegarSiguiente
  } = useReproductorLecciones({
    videoUrl: usarFirmado ? '' : videoUrl,
    leccionAnterior,
    leccionSiguiente,
    tipo
  });

  const srcIframe = usarFirmado ? firmado.url : urlProcesada;
  const referrerPolicyIframe = usarFirmado
    ? (esBunnyFirmado ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin')
    : (esBunny ? 'no-referrer-when-downgrade' : 'strict-origin-when-cross-origin');

  if (sinAcceso) {
    const mensaje = tipo === 'clase'
      ? 'Necesitas estar inscrito en este tutorial o paquete para reproducir el video.'
      : 'Necesitas estar inscrito en este curso para reproducir el video.';
    const linkInscripcion = tipo === 'clase' ? '/tutoriales' : '/cursos';
    return (
      <div className="reproductor-container">
        <div className="video-wrapper">
          <div className="error-overlay">
            <div className="error-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h3>Contenido bloqueado</h3>
              <p>{mensaje}</p>
              <a href={linkInscripcion} className="btn-reintentar" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Ver opciones de inscripción
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reproductor-container">
      <div className="video-wrapper">
        {cargandoFirmado ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p className="loading-text">Verificando acceso...</p>
          </div>
        ) : errorFirmado || (!usarFirmado && tieneError) || !srcIframe ? (
          <div className="error-overlay">
            <div className="error-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Video no disponible</h3>
              <p>
                {usarFirmado
                  ? (firmado.error?.mensaje || 'Hubo un problema al cargar el video. Inténtalo más tarde.')
                  : (!videoUrl
                      ? 'Esta clase aún no tiene un video asignado.'
                      : 'Hubo un problema al cargar el video. Por favor, inténtalo más tarde.')}
              </p>
              {usarFirmado ? (
                <button className="btn-reintentar" onClick={() => firmado.refrescar()}>
                  🔄 Reintentar
                </button>
              ) : videoUrl && (
                <button className="btn-reintentar" onClick={reintentar}>
                  🔄 Reintentar carga
                </button>
              )}
              {!usarFirmado && (
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
              )}
            </div>
          </div>
        ) : (
          <>
            <iframe
              ref={elementoIframeRef}
              title={titulo}
              src={srcIframe}
              className="video-frame"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              frameBorder="0"
              referrerPolicy={referrerPolicyIframe}
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
