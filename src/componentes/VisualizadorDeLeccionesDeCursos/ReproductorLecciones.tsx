import React, { useState, useEffect, useRef } from 'react';
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
  thumbnailUrl = '',
  titulo = '',
  tipo = 'leccion',
  completada = false,
  cargandoCompletar = false,
  marcarComoCompletada = () => { },
  errorCompletar = '',
  autoplay = false
}) => {
  // Debug: Log de props recibidas
  console.log('🎬 [REPRODUCTOR] Props recibidas:', {
    videoUrl,
    thumbnailUrl,
    titulo,
    tipo,
    completada,
    cargandoCompletar,
    errorCompletar
  });
  // Estado interno del reproductor
  const [cargando, setCargando] = useState(true);
  const [tieneError, setTieneError] = useState(false);
  const [esYouTube, setEsYouTube] = useState(false);
  const [esBunny, setEsBunny] = useState(false);
  const [esEmbed, setEsEmbed] = useState(false);
  const [idYouTube, setIdYouTube] = useState('');
  const [urlVideoLimpia, setUrlVideoLimpia] = useState('');
  const [videoId, setVideoId] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [duracion, setDuracion] = useState(0);
  const [tiempoActual, setTiempoActual] = useState(0);
  const [reproduciendose, setReproduciendose] = useState(false);
  const [urlProcesada, setUrlProcesada] = useState('');

  const elementoVideoRef = useRef<HTMLVideoElement>(null);
  const elementoIframeRef = useRef<HTMLIFrameElement>(null);

  const procesarUrl = (url: string): string => {
    console.log('🎥 [REPRODUCTOR] Procesando URL:', url);

    if (!url || url.trim() === '') {
      console.warn('⚠️ [REPRODUCTOR] URL vacía o nula');
      setTieneError(true);
      return '';
    }

    // Detectar si es YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      console.log('📺 [REPRODUCTOR] URL de YouTube detectada');
      setEsYouTube(true);
      setEsBunny(false);

      // Extraer ID de YouTube
      let videoId = '';
      const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          videoId = match[1];
          console.log('📺 [REPRODUCTOR] ID de YouTube extraído:', videoId);
          break;
        }
      }

      if (videoId) {
        // URL mejorada con parámetros optimizados
        const youtubeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&controls=1&enablejsapi=1&origin=${window.location.origin}`;
        console.log('✅ [REPRODUCTOR] URL de YouTube procesada:', youtubeUrl);
        setTieneError(false);
        return youtubeUrl;
      } else {
        console.error('❌ [REPRODUCTOR] No se pudo extraer ID de YouTube');
        setTieneError(true);
        return '';
      }
    }

    // Si es Bunny.net - ARREGLO CRÍTICO
    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      console.log('🐰 [REPRODUCTOR] URL de Bunny.net detectada:', url);
      setEsYouTube(false);
      setEsBunny(true);

      // Extraer libraryId y videoId con patrones MEJORADOS para /play/ y /embed/
      const bunnyPatterns = [
        /iframe\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /bunnycdn\.com\/.*\/([0-9]+)\/([a-zA-Z0-9-]+)/
      ];

      let match = null;
      for (const pattern of bunnyPatterns) {
        match = url.match(pattern);
        if (match) {
          const libraryId = match[1];
          const videoId = match[2];
          console.log('🐰 [REPRODUCTOR] IDs de Bunny extraídos:', { libraryId, videoId });
          setLibraryId(libraryId);
          setVideoId(videoId);

          // CRÍTICO: Construir URL correcta para iframe
          const bunnyUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=0&controls=1&responsive=1`;
          console.log('✅ [REPRODUCTOR] URL de Bunny.net construida:', bunnyUrl);
          setTieneError(false);
          return bunnyUrl;
        }
      }

      console.error('❌ [REPRODUCTOR] No se pudieron extraer los IDs de Bunny.net');
      setTieneError(true);
      return '';
    }

    // Para otras URLs (directo HTML5)
    console.log('🎬 [REPRODUCTOR] URL directa detectada');
    setEsYouTube(false);
    setEsBunny(false);
    setTieneError(false);
    return url;
  };

  // Reactividad mejorada - EXACTAMENTE COMO EN SVELTE
  useEffect(() => {
    console.log('🔄 [REPRODUCTOR] Cambio detectado en videoUrl:', videoUrl);
    if (videoUrl) {
      // Resetear estados
      setTieneError(false);
      setCargando(true);

      const urlLimpia = limpiarUrlVideo(videoUrl);
      setUrlVideoLimpia(urlLimpia);
      detectarTipoVideo(videoUrl);

      console.log('🔍 [REPRODUCTOR] Tipo detectado:', { esYouTube, esBunny, esEmbed });
    }
  }, [videoUrl]);

  // Procesar URL cuando cambie - EXACTAMENTE COMO EN SVELTE
  useEffect(() => {
    const urlProcesada = procesarUrl(videoUrl);
    setUrlProcesada(urlProcesada);
  }, [videoUrl]);

  // MEJORADO: Funciones de utilidad para limpiar URLs
  const limpiarUrlVideo = (url: string): string => {
    if (!url) return '';

    console.log('🔍 [LIMPIEZA] Procesando URL:', url);

    // Detectar si es una URL de Bunny.net - SINCRONIZADO CON procesarUrl
    if (url.includes('iframe.mediadelivery.net') || url.includes('video.bunnycdn.com') || url.includes('mediadelivery.net')) {
      console.log('🐰 [LIMPIEZA] Detectada URL de Bunny.net:', url);
      setEsBunny(true);
      setEsYouTube(false);
      setEsEmbed(false);

      // Usar los mismos patrones que procesarUrl para consistencia
      const bunnyPatterns = [
        /iframe\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /bunnycdn\.com\/.*\/([0-9]+)\/([a-zA-Z0-9-]+)/
      ];

      for (const pattern of bunnyPatterns) {
        const matches = url.match(pattern);
        if (matches) {
          const libraryId = matches[1];
          const videoId = matches[2];
          setLibraryId(libraryId);
          setVideoId(videoId);
          console.log('📊 [LIMPIEZA] IDs extraídos:', { libraryId, videoId });
          break;
        }
      }

      // Fallback: patrón general
      if (!libraryId || !videoId) {
        const generalPattern = /\/([0-9]+)\/([a-zA-Z0-9-]+)/;
        const generalMatch = url.match(generalPattern);
        if (generalMatch) {
          const libraryId = generalMatch[1];
          const videoId = generalMatch[2];
          setLibraryId(libraryId);
          setVideoId(videoId);
          console.log('🔄 [LIMPIEZA] IDs extraídos con patrón general:', { libraryId, videoId });
        }
      }

      // Construir URL correcta para iframe
      if (libraryId && videoId) {
        const cleanUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=0&controls=1&responsive=1`;
        console.log('✅ [LIMPIEZA] URL de Bunny normalizada:', cleanUrl);
        return cleanUrl;
      }

      console.warn('⚠️ [LIMPIEZA] No se pudieron extraer IDs, devolviendo URL original');
      return url;
    }

    // Detectar YouTube (sin cambios, ya funciona)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setEsYouTube(true);
      setEsBunny(false);
      setEsEmbed(false);

      // Extraer ID de YouTube
      const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
      ];

      for (const regex of regexps) {
        const match = url.match(regex);
        if (match) {
          const idYouTube = match[1];
          setIdYouTube(idYouTube);
          break;
        }
      }

      return `https://www.youtube.com/embed/${idYouTube}?autoplay=1&rel=0`;
    }

    console.log('🎬 [LIMPIEZA] URL directa detectada');
    return url;
  };

  // SIMPLIFICADO: Para Bunny.net usar iframe directo es más confiable
  const inicializarBunnyPlayer = () => {
    console.log('🐰 [BUNNY] Inicializando reproductor Bunny mediante iframe');
    // El iframe se maneja automáticamente, no necesitamos el script player
    setCargando(false);
    setTieneError(false);
  };

  // MEJORADO: Cargar el script de Bunny.net con fallback a iframe directo
  const cargarScriptBunny = () => {
    console.log('🐰 [BUNNY] Intentando cargar reproductor de Bunny.net');

    // Para Bunny.net, usar iframe directo es más confiable que el script player
    if (esBunny) {
      console.log('🐰 [BUNNY] Usando iframe directo para Bunny.net');
      setCargando(false);
      setTieneError(false);
      return;
    }
  };

  useEffect(() => {
    console.log('🔄 [REPRODUCTOR] Componente montado');
    // Ya no necesitamos cargar script para Bunny, usamos iframe directo
  }, []);

  const reintentar = () => {
    console.log('🔄 Reintentando cargar el video...');
    console.log('📺 URL a reintentar:', videoUrl);
    setTieneError(false);
    setCargando(true);

    // Reprocesar completamente
    setEsYouTube(false);
    setEsBunny(false);
    setEsEmbed(false);
    setLibraryId('');
    setVideoId('');
    setIdYouTube('');

    // Detectar tipo de nuevo
    detectarTipoVideo(videoUrl);
    const urlLimpia = limpiarUrlVideo(videoUrl);
    setUrlVideoLimpia(urlLimpia);

    console.log('🔄 [REINTENTAR] Nuevos valores:', {
      esYouTube,
      esBunny,
      libraryId,
      videoId,
      urlVideoLimpia: urlLimpia.substring(0, 100) + '...'
    });

    console.log('✅ Reinicio completo del reproductor');
  };

  const alCargarIframe = () => {
    console.log('✅ Iframe cargado correctamente');
    console.log('📊 URL actual:', elementoIframeRef.current?.src);
    setCargando(false);
  };

  const alError = (event: Event) => {
    console.error('❌ Error en el video:', event);
    console.error('📊 URL que causó el error:', elementoIframeRef.current?.src || urlVideoLimpia);
    console.error('📊 Tipo de video:', { esYouTube, esBunny, esEmbed });
    setCargando(false);
    setTieneError(true);
  };

  // Detectar tipo de video
  const detectarTipoVideo = (url: string): void => {
    console.log('🔍 DETECTANDO TIPO DE VIDEO:', url);

    if (!url) {
      setEsEmbed(false);
      setEsYouTube(false);
      setEsBunny(false);
      console.log('❌ URL vacía');
      return;
    }

    // Detectar YouTube
    const regexYouTube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const coincidenciaYouTube = url.match(regexYouTube);

    if (coincidenciaYouTube && coincidenciaYouTube[1]) {
      setEsYouTube(true);
      setEsBunny(false);
      setEsEmbed(true);
      setIdYouTube(coincidenciaYouTube[1]);
      console.log('✅ YouTube detectado - ID:', coincidenciaYouTube[1]);
      return;
    }

    // Detectar Bunny.net - MEJORADO
    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      setEsBunny(true);
      setEsYouTube(false);
      setEsEmbed(true);
      console.log('✅ [DETECTOR] Bunny.net detectado');

      // Extraer IDs para debugging
      const bunnyPattern = /(?:iframe\.)?mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/;
      const match = url.match(bunnyPattern);
      if (match) {
        const libraryId = match[1];
        const videoId = match[2];
        setLibraryId(libraryId);
        setVideoId(videoId);
        console.log('📊 [DETECTOR] IDs de Bunny detectados:', { libraryId, videoId });
      }

      return;
    }

    // Detectar otros embeds
    if (url.includes('iframe') || url.includes('embed') || url.includes('player') || url.startsWith('<iframe')) {
      setEsEmbed(true);
      setEsYouTube(false);
      setEsBunny(false);
      console.log('✅ Embed detectado (genérico)');
      return;
    }

    // Video directo
    setEsEmbed(false);
    setEsYouTube(false);
    setEsBunny(false);
    console.log('✅ Video directo detectado');
  };

  // Extraer URL de código de embed
  const extraerUrlEmbed = (codigoEmbed: string): string => {
    console.log('📝 EXTRAYENDO URL DE EMBED:', codigoEmbed);

    if (!codigoEmbed.includes('<iframe')) {
      console.log('🔄 No es iframe, devolviendo original');
      return codigoEmbed;
    }

    const coincidenciaSrc = codigoEmbed.match(/src=["'](.+?)["']/i);
    if (coincidenciaSrc && coincidenciaSrc[1]) {
      console.log('✅ URL extraída del iframe:', coincidenciaSrc[1]);
      return coincidenciaSrc[1];
    }

    console.log('❌ No se pudo extraer URL del iframe');
    return codigoEmbed;
  };

  // Manejar eventos del video
  const alCargarMetadatos = () => {
    if (elementoVideoRef.current) {
      setDuracion(elementoVideoRef.current.duration);
    }
    setCargando(false);
  };

  const alActualizarTiempo = () => {
    if (elementoVideoRef.current) {
      setTiempoActual(elementoVideoRef.current.currentTime);
    }
  };

  const alTerminar = () => {
    setReproduciendose(false);
    // Aquí podrías dispatch un evento si fuera necesario
  };

  const alReproducir = () => {
    setReproduciendose(true);
  };

  const alPausar = () => {
    setReproduciendose(false);
  };

  const alEsperar = () => {
    setCargando(true);
  };

  const alPoderReproducir = () => {
    setCargando(false);
  };

  // Funciones para navegación
  // Funciones para navegación
  const navegarAnterior = () => {
    if (leccionAnterior) {
      const parentSlug = window.location.pathname.split('/')[2];
      const leccionSlug = leccionAnterior.slug || leccionAnterior.id;

      if (tipo === 'leccion') {
        const moduloSlug = leccionAnterior.moduloSlug;
        if (moduloSlug) {
          window.location.href = `/cursos/${parentSlug}/${moduloSlug}/${leccionSlug}`;
        } else {
          console.error('[NAVEGACION] Falta moduloSlug para lección anterior de curso');
        }
      } else {
        window.location.href = `/tutoriales/${parentSlug}/clase/${leccionSlug}`;
      }
    }
  };

  const navegarSiguiente = () => {
    if (leccionSiguiente) {
      const parentSlug = window.location.pathname.split('/')[2];
      const leccionSlug = leccionSiguiente.slug || leccionSiguiente.id;

      if (tipo === 'leccion') {
        const moduloSlug = leccionSiguiente.moduloSlug;
        if (moduloSlug) {
          window.location.href = `/cursos/${parentSlug}/${moduloSlug}/${leccionSlug}`;
        } else {
          console.error('[NAVEGACION] Falta moduloSlug para lección siguiente de curso');
        }
      } else {
        window.location.href = `/tutoriales/${parentSlug}/clase/${leccionSlug}`;
      }
    }
  };

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
                {!videoUrl ? (
                  'Esta clase aún no tiene un video asignado.'
                ) : (
                  'Hubo un problema al cargar el video. Por favor, inténtalo más tarde.'
                )}
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
              referrerPolicy={esBunny ? "no-referrer-when-downgrade" : "strict-origin-when-cross-origin"}
              loading="eager"
              onLoad={() => {
                console.log('✅ [REPRODUCTOR] Video iframe cargado exitosamente');
                console.log('📺 Tipo:', { esYouTube, esBunny });
                console.log('📺 URL cargada:', urlProcesada);
                setCargando(false);
                setTieneError(false);
              }}
              onError={(event) => {
                console.error('❌ [REPRODUCTOR] Error cargando iframe');
                console.error('📺 Tipo que falló:', { esYouTube, esBunny });
                console.error('📺 URL que falló:', urlProcesada);
                console.error('📺 Error details:', event);
                setTieneError(true);
                setCargando(false);
              }}
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
        <button
          className="boton-nav anterior"
          onClick={navegarAnterior}
          disabled={!leccionAnterior}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="texto-completo">{tipo === 'clase' ? 'Anterior Clase' : 'Anterior Lección'}</span>
          <span className="texto-corto">Anterior</span>
        </button>

        <button
          className={`boton-completar ${completada ? 'completada' : ''}`}
          disabled={cargandoCompletar}
          onClick={marcarComoCompletada}
        >
          {cargandoCompletar ? (
            <>
              <div className="spinner-boton"></div>
              <span>Marcando...</span>
            </>
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

        <button
          className="boton-nav siguiente"
          onClick={navegarSiguiente}
          disabled={!leccionSiguiente}
        >
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
