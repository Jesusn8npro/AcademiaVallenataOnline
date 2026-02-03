<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';

  // Props del reproductor
  export let leccionAnterior: any = null;
  export let leccionSiguiente: any = null;
  export let videoUrl: string = '';
  export let thumbnailUrl: string = '';
  export let titulo: string = '';
  export let tipo: 'leccion' | 'clase' = 'leccion';
  export let completada: boolean = false;
  export let cargandoCompletar: boolean = false;
  export let marcarComoCompletada: () => void = () => {};
  export let errorCompletar: string = '';
  export let autoplay: boolean = false;

  // Estado interno del reproductor
  let elementoVideo: HTMLVideoElement | null = null;
  let elementoIframe: HTMLIFrameElement | null = null;
  let cargando = true;
  let tieneError = false;
  let esYouTube = false;
  let esBunny = false;
  let esEmbed = false;
  let idYouTube = '';
  let urlVideoLimpia = '';
  let videoId = '';
  let libraryId = '';
  let duracion = 0;
  let tiempoActual = 0;
  let reproduciendose = false;

  const dispatch = createEventDispatcher();

  function procesarUrl(url: string): string {
    console.log('🎥 [REPRODUCTOR] Procesando URL:', url);
    
    if (!url || url.trim() === '') {
      console.warn('⚠️ [REPRODUCTOR] URL vacía o nula');
      tieneError = true;
      return '';
    }
    
    // Detectar si es YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      console.log('📺 [REPRODUCTOR] URL de YouTube detectada');
      esYouTube = true;
      esBunny = false;
      
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
        tieneError = false;
        return youtubeUrl;
      } else {
        console.error('❌ [REPRODUCTOR] No se pudo extraer ID de YouTube');
        tieneError = true;
        return '';
      }
    }
    
    // Si es Bunny.net - ARREGLO CRÍTICO
    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      console.log('🐰 [REPRODUCTOR] URL de Bunny.net detectada:', url);
      esYouTube = false;
      esBunny = true;
      
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
          libraryId = match[1];
          videoId = match[2];
          console.log('🐰 [REPRODUCTOR] IDs de Bunny extraídos:', { libraryId, videoId });
          break;
        }
      }
      
      // Si no se encontraron IDs, intentar extraer de manera más agresiva
      if (!libraryId || !videoId) {
        const generalPattern = /\/([0-9]+)\/([a-zA-Z0-9-]+)/;
        const generalMatch = url.match(generalPattern);
        if (generalMatch) {
          libraryId = generalMatch[1];
          videoId = generalMatch[2];
          console.log('🔄 [REPRODUCTOR] IDs extraídos con patrón general:', { libraryId, videoId });
        }
      }
      
      // CRÍTICO: Construir URL correcta para iframe
      if (libraryId && videoId) {
        // Siempre usar el formato /embed/ para iframes
        const bunnyUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=0&controls=1&responsive=1`;
        console.log('✅ [REPRODUCTOR] URL de Bunny.net construida:', bunnyUrl);
        tieneError = false;
        return bunnyUrl;
      } else {
        console.error('❌ [REPRODUCTOR] No se pudieron extraer los IDs de Bunny.net');
        tieneError = true;
        return '';
      }
    }
    
    // Para otras URLs (directo HTML5)
    console.log('🎬 [REPRODUCTOR] URL directa detectada');
    esYouTube = false;
    esBunny = false;
    tieneError = false;
    return url;
  }

  // Reactividad mejorada
  $: {
    console.log('🔄 [REPRODUCTOR] Cambio detectado en videoUrl:', videoUrl);
    if (videoUrl) {
      // Resetear estados
      tieneError = false;
      cargando = true;
      
      urlVideoLimpia = limpiarUrlVideo(videoUrl);
      detectarTipoVideo(videoUrl);
      
      console.log('🔍 [REPRODUCTOR] Tipo detectado:', { esYouTube, esBunny, esEmbed });
    }
  }

  $: urlProcesada = procesarUrl(videoUrl);

  // MEJORADO: Funciones de utilidad para limpiar URLs
  function limpiarUrlVideo(url: string): string {
    if (!url) return '';
    
    console.log('🔍 [LIMPIEZA] Procesando URL:', url);
    
    // Detectar si es una URL de Bunny.net - SINCRONIZADO CON procesarUrl
    if (url.includes('iframe.mediadelivery.net') || url.includes('video.bunnycdn.com') || url.includes('mediadelivery.net')) {
      console.log('🐰 [LIMPIEZA] Detectada URL de Bunny.net:', url);
      esBunny = true;
      esYouTube = false;
      esEmbed = false;

      // Usar los mismos patrones que procesarUrl para consistencia
      const bunnyPatterns = [
        /iframe\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /bunnycdn\.com\/.*\/([0-9]+)\/([a-zA-Z0-9-]+)/
      ];
      
      for (const pattern of bunnyPatterns) {
        const matches = url.match(pattern);
        if (matches) {
          libraryId = matches[1];
          videoId = matches[2];
          console.log('📊 [LIMPIEZA] IDs extraídos:', { libraryId, videoId });
          break;
        }
      }

      // Fallback: patrón general
      if (!libraryId || !videoId) {
        const generalPattern = /\/([0-9]+)\/([a-zA-Z0-9-]+)/;
        const generalMatch = url.match(generalPattern);
        if (generalMatch) {
          libraryId = generalMatch[1];
          videoId = generalMatch[2];
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
      esYouTube = true;
      esBunny = false;
      esEmbed = false;
      
      // Extraer ID de YouTube
      const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
      ];
      
      for (const regex of regexps) {
        const match = url.match(regex);
        if (match) {
          idYouTube = match[1];
          break;
        }
      }
      
      return `https://www.youtube.com/embed/${idYouTube}?autoplay=1&rel=0`;
    }

    console.log('🎬 [LIMPIEZA] URL directa detectada');
    return url;
  }

  // SIMPLIFICADO: Para Bunny.net usar iframe directo es más confiable
  function inicializarBunnyPlayer() {
    console.log('🐰 [BUNNY] Inicializando reproductor Bunny mediante iframe');
    // El iframe se maneja automáticamente, no necesitamos el script player
    cargando = false;
    tieneError = false;
  }

  // MEJORADO: Cargar el script de Bunny.net con fallback a iframe directo
  function cargarScriptBunny() {
    console.log('🐰 [BUNNY] Intentando cargar reproductor de Bunny.net');
    
    // Para Bunny.net, usar iframe directo es más confiable que el script player
    if (esBunny) {
      console.log('🐰 [BUNNY] Usando iframe directo para Bunny.net');
      cargando = false;
      tieneError = false;
      return;
    }
  }

  // Reactividad
  onMount(() => {
    console.log('🔄 [REPRODUCTOR] Componente montado');
    // Ya no necesitamos cargar script para Bunny, usamos iframe directo
  });

  function reintentar() {
    console.log('🔄 Reintentando cargar el video...');
    console.log('📺 URL a reintentar:', videoUrl);
    tieneError = false;
    cargando = true;
    
    // Reprocesar completamente
    esYouTube = false;
    esBunny = false;
    esEmbed = false;
    libraryId = '';
    videoId = '';
    idYouTube = '';
    
    // Detectar tipo de nuevo
    detectarTipoVideo(videoUrl);
    urlVideoLimpia = limpiarUrlVideo(videoUrl);
    
    console.log('🔄 [REINTENTAR] Nuevos valores:', { 
      esYouTube, 
      esBunny, 
      libraryId, 
      videoId, 
      urlVideoLimpia: urlVideoLimpia.substring(0, 100) + '...' 
    });
    
    console.log('✅ Reinicio completo del reproductor');
  }

  function alCargarIframe() {
    console.log('✅ Iframe cargado correctamente');
    console.log('📊 URL actual:', elementoIframe?.src);
    cargando = false;
  }

  function alError(event: Event) {
    console.error('❌ Error en el video:', event);
    console.error('📊 URL que causó el error:', elementoIframe?.src || urlVideoLimpia);
    console.error('📊 Tipo de video:', { esYouTube, esBunny, esEmbed });
    cargando = false;
    tieneError = true;
  }

  // Detectar tipo de video
  function detectarTipoVideo(url: string): void {
    console.log('🔍 DETECTANDO TIPO DE VIDEO:', url);
    
    if (!url) {
      esEmbed = false;
      esYouTube = false;
      esBunny = false;
      console.log('❌ URL vacía');
      return;
    }

    // Detectar YouTube
    const regexYouTube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const coincidenciaYouTube = url.match(regexYouTube);
    
    if (coincidenciaYouTube && coincidenciaYouTube[1]) {
      esYouTube = true;
      esBunny = false;
      esEmbed = true;
      idYouTube = coincidenciaYouTube[1];
      console.log('✅ YouTube detectado - ID:', idYouTube);
      return;
    }

    // Detectar Bunny.net - MEJORADO
    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      esBunny = true;
      esYouTube = false;
      esEmbed = true;
      console.log('✅ [DETECTOR] Bunny.net detectado');
      
      // Extraer IDs para debugging
      const bunnyPattern = /(?:iframe\.)?mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/;
      const match = url.match(bunnyPattern);
      if (match) {
        libraryId = match[1];
        videoId = match[2];
        console.log('📊 [DETECTOR] IDs de Bunny detectados:', { libraryId, videoId });
      }
      
      return;
    }

    // Detectar otros embeds
    if (url.includes('iframe') || url.includes('embed') || url.includes('player') || url.startsWith('<iframe')) {
      esEmbed = true;
      esYouTube = false;
      esBunny = false;
      console.log('✅ Embed detectado (genérico)');
      return;
    }

    // Video directo
    esEmbed = false;
    esYouTube = false;
    esBunny = false;
    console.log('✅ Video directo detectado');
  }

  // Extraer URL de código de embed
  function extraerUrlEmbed(codigoEmbed: string): string {
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
  }

  // Manejar eventos del video
  function alCargarMetadatos() {
    if (elementoVideo) {
      duracion = elementoVideo.duration;
    }
    cargando = false;
  }

  function alActualizarTiempo() {
    if (elementoVideo) {
      tiempoActual = elementoVideo.currentTime;
    }
  }

  function alTerminar() {
    reproduciendose = false;
    dispatch('finalizado');
  }

  function alReproducir() {
    reproduciendose = true;
  }

  function alPausar() {
    reproduciendose = false;
  }

  function alEsperar() {
    cargando = true;
  }

  function alPoderReproducir() {
    cargando = false;
  }
</script>

<div class="reproductor-container">
  <div class="video-wrapper">
    {#if tieneError || !urlProcesada}
      <div class="error-overlay">
        <div class="error-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Video no disponible</h3>
          <p>
            {#if !videoUrl}
              Esta clase aún no tiene un video asignado.
            {:else}
              Hubo un problema al cargar el video. Por favor, inténtalo más tarde.
            {/if}
          </p>
          {#if videoUrl}
            <button class="btn-reintentar" on:click={reintentar}>
              🔄 Reintentar carga
            </button>
          {/if}
          <div class="debug-info">
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
    {:else}
      <iframe
        title={titulo}
        src={urlProcesada}
        class="video-frame"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowfullscreen
        frameborder="0"
        referrerpolicy={esBunny ? "no-referrer-when-downgrade" : "strict-origin-when-cross-origin"}
        loading="eager"
        on:load={() => {
          console.log('✅ [REPRODUCTOR] Video iframe cargado exitosamente');
          console.log('📺 Tipo:', { esYouTube, esBunny });
          console.log('📺 URL cargada:', urlProcesada);
          cargando = false;
          tieneError = false;
        }}
        on:error={(event) => {
          console.error('❌ [REPRODUCTOR] Error cargando iframe');
          console.error('📺 Tipo que falló:', { esYouTube, esBunny });
          console.error('📺 URL que falló:', urlProcesada);
          console.error('📺 Error details:', event);
          tieneError = true;
          cargando = false;
        }}
      ></iframe>

      {#if cargando}
        <div class="loading-overlay">
          <div class="spinner"></div>
          <p class="loading-text">Cargando video...</p>
        </div>
      {/if}
    {/if}
  </div>

  <div class="barra-navegacion">
    <button 
      class="boton-nav anterior" 
      on:click={() => dispatch('anterior-leccion', { leccion: leccionAnterior })}
      disabled={!leccionAnterior}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="texto-completo">{tipo === 'clase' ? 'Anterior Clase' : 'Anterior Lección'}</span>
      <span class="texto-corto">Anterior</span>
    </button>

    <button 
      class="boton-completar" 
      class:completada 
      disabled={cargandoCompletar} 
      on:click={marcarComoCompletada}
    >
      {#if cargandoCompletar}
        <div class="spinner-boton"></div>
        <span>Marcando...</span>
      {:else if completada}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Completada</span>
      {:else}
        <span>Marcar como completada</span>
      {/if}
    </button>

    <button
      class="boton-nav siguiente"
      on:click={() => dispatch('siguiente-leccion', { leccion: leccionSiguiente })}
      disabled={!leccionSiguiente}
    >
      <span class="texto-completo">{tipo === 'clase' ? 'Siguiente Clase' : 'Siguiente Lección'}</span>
      <span class="texto-corto">Siguiente</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>
</div>

<style>
  .reproductor-container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .video-wrapper {
    position: relative;
    padding-top: 56.25%;
    background: #000;
  }

  .video-frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .loading-text {
    margin-top: 1rem;
    color: white;
    font-size: 0.9rem;
  }

  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    padding: 2rem;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-content svg {
    color: #ff6b6b;
    margin-bottom: 1rem;
  }

  .error-content h3 {
    color: white;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .error-content p {
    color: #ccc;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .debug-info {
    margin-top: 1rem;
  }

  .debug-info details {
    cursor: pointer;
  }

  .debug-info summary {
    color: #888;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .debug-info pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    color: #aaa;
    text-align: left;
    white-space: pre-wrap;
  }

  .btn-reintentar {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin: 1rem 0;
    transition: all 0.3s ease;
  }

  .btn-reintentar:hover {
    background: #43A047;
    transform: translateY(-2px);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #333;
    border-top: 3px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-boton {
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .barra-navegacion {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 1rem;
    padding: 1rem;
    background: #1a1a1a;
    border-top: 1px solid #333;
  }

  .boton-nav,
  .boton-completar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    min-height: 44px;
  }

  .boton-nav {
    background: #2a2a2a;
    color: #ffffff;
  }

  .boton-nav:hover:not(:disabled) {
    background: #3a3a3a;
    transform: translateY(-2px);
  }

  .boton-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .boton-completar {
    background: #4CAF50;
    color: white;
    font-weight: 600;
  }

  .boton-completar:hover:not(:disabled) {
    background: #43A047;
    transform: translateY(-2px);
  }

  .boton-completar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .boton-completar.completada {
    background: #1E88E5;
  }

  .boton-completar.completada:hover:not(:disabled) {
    background: #1976D2;
  }

  .texto-corto {
    display: none;
  }

  @media (max-width: 768px) {
    .barra-navegacion {
      grid-template-columns: 1fr 1.2fr 1fr;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .boton-nav,
    .boton-completar {
      padding: 0.5rem;
      font-size: 0.8rem;
      min-height: 40px;
    }

    .texto-completo {
      display: none;
    }

    .texto-corto {
      display: inline;
    }

    .boton-completar {
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 480px) {
    .barra-navegacion {
      grid-template-columns: 1fr 1.5fr 1fr;
      padding: 0.5rem;
    }

    .boton-completar {
      font-size: 0.7rem;
    }

    .boton-nav {
      font-size: 0.7rem;
    }
  }
</style>
