<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Props
  export let modoSPA: boolean = false;
  export let clases: any[] = [];
  export let leccionActiva: string = '';
  export let progreso: Record<string, any> = {};
  export let curso: any = {};
  export let moduloActivo: any = null;

  const dispatch = createEventDispatcher();

  // Variables para navegación
  let contenedorScroll: HTMLElement;
  let modulosData: any[] = [];
  let moduloActualIndex = 0;
  let leccionesDelModulo: any[] = [];

  // Funciones para manejo de videos
  function obtenerVideoId(url: string): { source: 'youtube' | 'bunny' | null; id: string | null; libraryId: string | null } {
    if (!url) return { source: null, id: null, libraryId: null };

    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return { source: 'youtube', id: match[1], libraryId: null };
      }
    }

    const bunnyPatterns = [
      /iframe\.mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/,
      /iframe\.mediadelivery\.net\/play\/([0-9]+)\/([a-zA-Z0-9-]+)/
    ];

    for (const pattern of bunnyPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { source: 'bunny', id: match[2], libraryId: match[1] };
      }
    }

    return { source: null, id: null, libraryId: null };
  }

  function obtenerMiniatura(videoUrl: string): string {
    const { source, id, libraryId } = obtenerVideoId(videoUrl);
    
    if (source === 'youtube' && id) {
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    } else if (source === 'bunny' && libraryId && id) {
      return `https://iframe.mediadelivery.net/thumbnail/${libraryId}/${id}`;
    }
    
    return 'https://academiavallenataonline.com/wp-content/uploads/2023/06/placeholder-video.jpg';
  }

  // Obtener ID de lección desde URL
  $: idLeccionURL = '';
  $: {
    const params = get(page).params;
    idLeccionURL = params.claseSlug || leccionActiva;
    if (idLeccionURL && typeof idLeccionURL === 'number') {
      idLeccionURL = String(idLeccionURL);
    }
  }

  // Procesar datos y crear módulos
  $: {
    modulosData = [];
    
    if (curso && Array.isArray(curso.modulos) && curso.modulos.length > 0) {
      // Cursos: usar módulos existentes
      modulosData = curso.modulos.map((modulo: any) => ({
        id: modulo.id,
        titulo: modulo.titulo,
        slug: modulo.slug,
        lecciones: modulo.lecciones || [],
        esDeModulo: true
      }));
    } else if (clases && clases.length > 0) {
      // Tutoriales: crear módulo único
      modulosData = [{
        id: 'tutorial-clases',
        titulo: 'Clases del Tutorial',
        slug: 'clases',
        lecciones: clases,
        esDeModulo: false
      }];
    }
    
    // Encontrar módulo actual basado en lección activa
    encontrarModuloActual();
    cargarLeccionesDelModulo();
  }

  // Encontrar el módulo que contiene la lección activa
  function encontrarModuloActual() {
    for (let i = 0; i < modulosData.length; i++) {
      const modulo = modulosData[i];
      if (modulo.lecciones.some((leccion: any) => esLeccionActiva(leccion))) {
        moduloActualIndex = i;
        return;
      }
    }
    moduloActualIndex = 0; // Por defecto primer módulo
  }

  // Cargar todas las lecciones del módulo actual
  function cargarLeccionesDelModulo() {
    if (!modulosData[moduloActualIndex]) return;
    
    const moduloActual = modulosData[moduloActualIndex];
    leccionesDelModulo = moduloActual.lecciones || [];
  }

  // Navegación entre módulos
  function navegarModulo(direccion: 'anterior' | 'siguiente') {
    if (direccion === 'anterior' && moduloActualIndex > 0) {
      moduloActualIndex--;
      cargarLeccionesDelModulo();
    } else if (direccion === 'siguiente' && moduloActualIndex < modulosData.length - 1) {
      moduloActualIndex++;
      cargarLeccionesDelModulo();
    }
  }

  // Funciones de navegación y estado
  function esLeccionActiva(leccion: any): boolean {
    if (!leccion || !idLeccionURL) return false;

    const idURL = String(idLeccionURL).toLowerCase();
    const idLeccion = String(leccion.id).toLowerCase();
    const slugLeccion = (leccion.slug || '').toLowerCase();
    const slugGenerado = leccion.titulo ? generateSlug(leccion.titulo).toLowerCase() : '';

    return idLeccion === idURL || 
           slugLeccion === idURL || 
           slugGenerado === idURL || 
           (slugGenerado !== '' && idURL.startsWith(slugGenerado + '-'));
  }

  function irALeccion(leccion: any) {
    const cursoSlug = curso?.slug || (curso?.titulo ? generateSlug(curso.titulo) : '');
    const leccionSlug = leccion?.slug || (leccion?.titulo ? generateSlug(leccion.titulo) : '');
    const moduloActual = modulosData[moduloActualIndex];

    if (moduloActual.esDeModulo) {
      // Navegación para cursos
      const moduloSlug = moduloActual.slug || (moduloActual.titulo ? generateSlug(moduloActual.titulo) : '');
      if (cursoSlug && moduloSlug && leccionSlug) {
        window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
        return;
      }
    } else {
      // Navegación para tutoriales
      if (cursoSlug && leccionSlug) {
        window.location.href = `/tutoriales/${cursoSlug}/clase/${leccionSlug}`;
        return;
      }
    }
    
    dispatch('cambiar-leccion', { leccion });
  }

  function formatearDuracion(segundos: number): string {
    if (!segundos) return '0:00';
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    if (horas > 0) {
      return `${horas}:${minutos < 10 ? '0' : ''}${minutos}:${segs < 10 ? '0' : ''}${segs}`;
    }
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`;
  }

  // Función corregida de estado completado (exactamente igual que BarraLateralCurso)
  function esLeccionCompletada(leccionId: string): boolean {
    return progreso[leccionId] >= 90;
  }



  onMount(() => {
    // Scroll automático a la lección activa
    setTimeout(() => {
      const leccionActiva = document.querySelector('.leccion-item.activa');
      if (leccionActiva && contenedorScroll) {
        leccionActiva.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
    
    // Agregar event listener para evitar propagación solo en límites
    if (contenedorScroll) {
      const handleWheel = (event: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = contenedorScroll;
        
        // Solo prevenir en los límites exactos
        if ((scrollTop <= 0 && event.deltaY < 0) || 
            (scrollTop + clientHeight >= scrollHeight - 1 && event.deltaY > 0)) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      
      const handleTouch = (event: TouchEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = contenedorScroll;
        
        // Solo prevenir en los límites exactos
        if ((scrollTop <= 0 || scrollTop + clientHeight >= scrollHeight - 1)) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      
      contenedorScroll.addEventListener('wheel', handleWheel, { passive: false });
      contenedorScroll.addEventListener('touchmove', handleTouch, { passive: false });
      
      return () => {
        contenedorScroll?.removeEventListener('wheel', handleWheel);
        contenedorScroll?.removeEventListener('touchmove', handleTouch);
      };
    }
  });
</script>

<div class="contenedor-principal">
  {#if modulosData.length > 0}
    <!-- Navegación de módulos -->
    <div class="navegacion-modulos">
      <button 
        class="btn-navegacion anterior"
        class:deshabilitado={moduloActualIndex === 0}
        on:click={() => navegarModulo('anterior')}
        disabled={moduloActualIndex === 0}
        aria-label="Módulo anterior"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      
      <div class="info-modulo">
        <h3 class="titulo-modulo">{modulosData[moduloActualIndex]?.titulo || 'Módulo'}</h3>
        <span class="contador-modulo">{moduloActualIndex + 1} de {modulosData.length}</span>
      </div>
      
      <button 
        class="btn-navegacion siguiente"
        class:deshabilitado={moduloActualIndex === modulosData.length - 1}
        on:click={() => navegarModulo('siguiente')}
        disabled={moduloActualIndex === modulosData.length - 1}
        aria-label="Módulo siguiente"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>

    <!-- Contenido del módulo -->
    <div 
      class="contenedor-scroll" 
      bind:this={contenedorScroll}
    >
      <div class="lecciones-contenedor">
        {#each leccionesDelModulo as leccion (leccion.id)}
          <div 
            class="leccion-item"
            class:activa={esLeccionActiva(leccion)}
            class:completada={esLeccionCompletada(leccion.id)}
            on:click={() => irALeccion(leccion)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') irALeccion(leccion); }}
            tabindex="0"
            role="button"
            aria-label={`Ir a la lección ${leccion.titulo}`}
          >
            <div class="leccion-thumbnail">
              {#if leccion.video_url}
                {#if leccion.video_url.includes('youtube.com') || leccion.video_url.includes('youtu.be')}
                  <img 
                    src={obtenerMiniatura(leccion.video_url)} 
                    alt={leccion.titulo}
                    loading="lazy"
                    on:error={(e) => {
                      const imgElement = e.currentTarget as HTMLImageElement;
                      if (imgElement) {
                        imgElement.onerror = null;
                        imgElement.src = 'https://academiavallenataonline.com/wp-content/uploads/2023/06/placeholder-video.jpg';
                      }
                    }}
                  />
                {:else}
                  <div class="tipo-parte-container">
                    <div class="tipo-parte">
                      <span class="tipo-texto">{leccion.tipo_parte || 'Clase'}</span>
                      <span class="titulo-texto">{leccion.titulo}</span>
                    </div>
                  </div>
                {/if}
              {:else}
                <div class="thumbnail-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
              {/if}
              
              <div class="leccion-play-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              
              {#if leccion.duracion}
                <div class="duracion-badge">{formatearDuracion(leccion.duracion)}</div>
              {/if}
            </div>
            
            <div class="leccion-info">
              <div class="leccion-titulo">{leccion.titulo}</div>
              <div class="leccion-estado">
                {#if esLeccionCompletada(leccion.id)}
                  <div class="estado-completado">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Completada</span>
                  </div>
                {:else if progreso[leccion.id] && progreso[leccion.id] > 0}
                  <div class="estado-progreso">
                    <div class="progreso-mini-bar">
                      <div class="progreso-mini-fill" style="width: {progreso[leccion.id]}%"></div>
                    </div>
                    <span>{Math.round(progreso[leccion.id])}%</span>
                  </div>
                {:else}
                  <div class="estado-pendiente">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span>Pendiente</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Contador de lecciones -->
    <div class="contador-lecciones">
      <span>{leccionesDelModulo.length} lecciones en este módulo</span>
    </div>
  {:else}
    <div class="sin-contenido">
      <div class="sin-contenido-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      </div>
      <p>No hay clases disponibles en este momento.</p>
    </div>
  {/if}
</div>

<style>
  /* Contenedor principal */
  .contenedor-principal {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* Navegación de módulos */
  .navegacion-modulos {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    color: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .btn-navegacion {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  .btn-navegacion:hover:not(.deshabilitado) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .btn-navegacion.deshabilitado {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .info-modulo {
    text-align: center;
    flex: 1;
    padding: 0 1rem;
  }

  .titulo-modulo {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .contador-modulo {
    font-size: 0.9rem;
    opacity: 0.9;
    font-weight: 500;
  }

  /* Contenedor de scroll */
  .contenedor-scroll {
    flex: 1 1 auto;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    /* Mostrar barra de scroll horizontal */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
    /* Evitar propagación del scroll */
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .contenedor-scroll::-webkit-scrollbar {
    height: 8px;
  }

  .contenedor-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .contenedor-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .contenedor-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Contenedor de lecciones */
  .lecciones-contenedor {
    display: flex;
    gap: 1rem;
    padding: 1rem 1rem 2rem 1rem;
    width: max-content;
    min-height: 100%;
    align-items: stretch;
  }

  /* Mobile: Layout vertical */
  @media (max-width: 768px) {
    .contenedor-principal {
      min-height: 400px;
    }
    
    .contenedor-scroll {
      overflow-x: hidden;
      overflow-y: auto;
      min-height: 400px;
      flex: 1 1 auto;
      /* Evitar propagación del scroll en mobile */
      overscroll-behavior-y: contain;
      -webkit-overflow-scrolling: touch;
      /* Ocultar barra de scroll en mobile */
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .contenedor-scroll::-webkit-scrollbar {
      display: none;
    }
    
    .lecciones-contenedor {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem 1rem 2rem 1rem;
      width: 100%;
    }
  }

  /* Lección Item */
  .leccion-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    background: #ffffff;
    color: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    flex: 0 0 280px;
    max-height: 320px;
  }

  .leccion-item:hover {
    background: #e3f2fd;
    border-color: #2196f3;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(33, 150, 243, 0.2);
  }

  .leccion-item.activa {
    background: #e8f5e8;
    border-color: #4CAF50;
    color: #2e7d32;
  }

  .leccion-item.completada:not(.activa) {
    background: #f3e5f5;
    border-color: #9c27b0;
  }

  /* Mobile: Layout horizontal */
  @media (max-width: 768px) {
    .leccion-item {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
      flex: 0 0 auto;
      width: 100%;
      max-height: none;
    }
  }

  /* Thumbnail */
  .leccion-thumbnail {
    position: relative;
    width: 100%;
    height: 160px;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    .leccion-thumbnail {
      width: 100px;
      height: 56px;
      flex-shrink: 0;
    }
  }

  .leccion-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #374151;
    color: #9ca3af;
  }

  .leccion-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 140, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .leccion-item:hover .leccion-play-icon {
    background: rgba(255, 140, 0, 1);
    transform: translate(-50%, -50%) scale(1.1);
  }

  @media (max-width: 768px) {
    .leccion-play-icon {
      width: 28px;
      height: 28px;
    }
    
    .leccion-play-icon svg {
      width: 12px;
      height: 12px;
    }
  }

  .duracion-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .duracion-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.3rem;
    }
  }

  /* Tipo de parte container */
  .tipo-parte-container {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    text-align: center;
  }

  .tipo-parte {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tipo-texto {
    font-size: 0.7rem;
    font-weight: 600;
    color: #fbbf24;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .titulo-texto {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    .tipo-parte-container {
      padding: 8px;
    }
    
    .tipo-texto {
      font-size: 0.6rem;
    }
    
    .titulo-texto {
      font-size: 0.55rem;
      -webkit-line-clamp: 2;
    }
  }

  /* Información de lección */
  .leccion-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .leccion-titulo {
    font-size: 1rem;
    font-weight: 600;
    color: inherit;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  @media (max-width: 768px) {
    .leccion-titulo {
      font-size: 0.9rem;
      -webkit-line-clamp: 1;
    }
  }

  .leccion-estado {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    margin-top: auto;
  }

  /* Estados corregidos (exactamente igual que BarraLateralCurso) */
  .estado-completado,
  .estado-pendiente,
  .estado-progreso {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .estado-completado {
    color: #22c55e;
  }

  .estado-pendiente {
    color: #64748b;
  }

  .estado-progreso {
    color: #f59e0b;
  }

  .progreso-mini-bar {
    width: 60px;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progreso-mini-fill {
    height: 100%;
    background: currentColor;
    transition: width 0.3s ease;
  }

  /* Contador de lecciones */
  .contador-lecciones {
    padding: 1rem 1rem 1.5rem 1rem;
    text-align: center;
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
    font-size: 0.9rem;
    border-radius: 0 0 12px 12px;
  }

  /* Sin contenido */
  .sin-contenido {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: #64748b;
    height: 100%;
  }

  .sin-contenido-icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-contenido p {
    margin: 0;
    font-size: 1rem;
    font-style: italic;
  }

  /* Responsive para navegación */
  @media (max-width: 768px) {
    .navegacion-modulos {
      padding: 0.75rem;
    }
    
    .titulo-modulo {
      font-size: 1rem;
    }
    
    .contador-modulo {
      font-size: 0.8rem;
    }
    
    .btn-navegacion {
      width: 36px;
      height: 36px;
    }
  }
</style>
