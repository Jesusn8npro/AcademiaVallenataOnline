<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  
  // Props
  export let curso: any;
  export let moduloActivo: string;
  export let leccionActiva: string;
  export let progreso: any = {};
  export let tipo: 'curso' | 'tutorial' = 'curso';
  export let cerrarSidebarFuncion: (() => void) | null = null;
  export let mostrarSidebar: boolean = true;
  
  // Estado
  let modulosExpandidos: Record<string, boolean> = {};
  
  const dispatch = createEventDispatcher();
  
  // Adaptar tutoriales para funcionar como cursos
  $: {
    if (curso && !curso.modulos) {
      // Buscar lecciones en orden de prioridad
      const opcionesLecciones = [
        'partes_tutorial', 'clases_tutorial', 'partes', 'clases'
      ];
      
      let leccionesArray = null;
      for (const opcion of opcionesLecciones) {
        if (Array.isArray(curso[opcion]) && curso[opcion].length > 0) {
          leccionesArray = curso[opcion];
          break;
        }
      }
      
      if (leccionesArray && leccionesArray.length > 0) {
        // Eliminar duplicados y normalizar datos
        const leccionesUnicas = leccionesArray.filter((parte: any, index: number, array: any[]) => 
          array.findIndex((p: any) => p.id === parte.id) === index
        );
        
        const partesNormalizadas = leccionesUnicas.map((parte: any) => ({
          ...parte,
          thumbnail_url: parte.thumbnail_url || parte.thumbnail || parte.video_miniatura_url || '',
        }));
        
        curso.modulos = [{
          id: 'tutorial-partes',
          titulo: 'Clases',
          lecciones: partesNormalizadas
        }];
      }
    }
    
    // Expandir módulos por defecto
    if (curso?.modulos) {
      curso.modulos.forEach((modulo: any) => {
        if (!(modulo.id in modulosExpandidos)) {
          modulosExpandidos[modulo.id] = true;
        }
      });
    }
  }
  
  // Funciones para manejo de videos
  function obtenerVideoId(url: string): { source: 'youtube' | 'bunny' | null; id: string | null; libraryId: string | null } {
    if (!url) return { source: null, id: null, libraryId: null };

    // Patrones de YouTube
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

    // Patrones de Bunny.net
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
  
  // Funciones de navegación y estado
  function toggleModulo(moduloId: string) {
    modulosExpandidos[moduloId] = !modulosExpandidos[moduloId];
    modulosExpandidos = { ...modulosExpandidos };
  }
  
  function irALeccion(modulo: any, leccion: any) {
    const cursoSlug = curso?.slug || (curso?.titulo ? generateSlug(curso.titulo) : '');
    const moduloSlug = modulo?.slug || (modulo?.titulo ? generateSlug(modulo.titulo) : '');
    const leccionSlug = leccion?.slug || (leccion?.titulo ? generateSlug(leccion.titulo) : '');

    if (tipo === 'curso' && cursoSlug && moduloSlug && leccionSlug) {
      window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
    } else if (tipo === 'tutorial' && cursoSlug && leccionSlug) {
      window.location.href = `/tutoriales/${cursoSlug}/clase/${leccionSlug}`;
    }
  }
  
  function esLeccionCompletada(leccionId: string): boolean {
    return progreso[leccionId] >= 90;
  }
  
  function esLeccionActiva(leccion: any): boolean {
    return String(leccion.slug) === String(leccionActiva) || 
           String(leccion.id) === String(leccionActiva) ||
           leccion.id === parseInt(String(leccionActiva));
  }
</script>

<div class="curso-sidebar">
  <div class="sidebar-header">
    <h2>{curso.titulo}</h2>
    <button 
      class="cerrar-sidebar" 
      on:click|stopPropagation={() => {
        console.log('🔥 [BOTON X] HACIENDO LO MISMO QUE CLIC AFUERA');
        
        // SIMULAR EL CLIC AFUERA QUE SÍ FUNCIONA
        const overlay = document.querySelector('.sidebar-mobile-overlay') as HTMLElement;
        if (overlay) {
          overlay.click(); // ¡Simular el clic que SÍ funciona!
        } else {
          // Fallback: hacer lo que hace el clic afuera directamente
          mostrarSidebar = false;
          if (cerrarSidebarFuncion) {
            cerrarSidebarFuncion();
          }
        }
      }} 
      on:touchstart|preventDefault|stopPropagation={() => {
        console.log('🔥 [BOTON X] TOUCH - HACIENDO LO MISMO QUE CLIC AFUERA');
        
        // SIMULAR EL CLIC AFUERA QUE SÍ FUNCIONA
        const overlay = document.querySelector('.sidebar-mobile-overlay') as HTMLElement;
        if (overlay) {
          overlay.click(); // ¡Simular el clic que SÍ funciona!
        } else {
          // Fallback: hacer lo que hace el clic afuera directamente
          mostrarSidebar = false;
          if (cerrarSidebarFuncion) {
            cerrarSidebarFuncion();
          }
        }
      }}
      aria-label="Cerrar menú del curso"
      type="button"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
  
  <div class="sidebar-content">
    {#if curso?.modulos}
      {#each curso.modulos as modulo (modulo.id)}
        <div class="modulo" class:activo={modulo.slug === moduloActivo || modulo.id === 'tutorial-partes'}>
          <div 
            class="modulo-header" 
            on:click={() => toggleModulo(modulo.id)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleModulo(modulo.id); }}
            role="button" 
            tabindex="0"
            aria-expanded={modulosExpandidos[modulo.id]}
          >
            <span class="modulo-titulo">{modulo.titulo}</span>
            <svg 
              class="toggle-icon" 
              class:expandido={modulosExpandidos[modulo.id]} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          
          {#if modulosExpandidos[modulo.id]}
            <div class="lecciones-list" transition:slide|local={{duration: 300}}>
              {#if modulo.lecciones?.length > 0}
                {#each modulo.lecciones as leccion (leccion.id)}
                  <div 
                    class="leccion-item"
                    class:activa={esLeccionActiva(leccion)}
                    class:completada={esLeccionCompletada(leccion.id)}
                    on:click={() => irALeccion(modulo, leccion)}
                    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') irALeccion(modulo, leccion); }}
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
                        {:else if progreso[leccion.id] > 0}
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
              {:else}
                <div class="no-lecciones">No hay lecciones en este módulo.</div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      <div class="no-modulos">No hay contenido disponible.</div>
    {/if}
  </div>
</div>

<style>
  /* Contenedor principal */
  .curso-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1a1a1a;
    color: #fff;
    overflow-y: auto;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: -2px 0 15px rgba(0, 0, 0, 0.3);
  }

  /* Header del sidebar */
  .sidebar-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(5px);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .cerrar-sidebar {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    width: 44px; /* Área más grande para móvil */
    height: 44px; /* Área más grande para móvil */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    position: relative;
    z-index: 999; /* Asegurar que esté por encima */
    touch-action: manipulation; /* Mejorar respuesta táctil */
    -webkit-tap-highlight-color: transparent; /* Quitar highlight azul en iOS */
    flex-shrink: 0; /* No reducir tamaño */
  }

  .cerrar-sidebar:hover,
  .cerrar-sidebar:active,
  .cerrar-sidebar:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }

  /* Estilos específicos para móvil */
  @media (max-width: 768px) {
    .cerrar-sidebar {
      width: 48px; /* Aún más grande en móvil */
      height: 48px;
      background-color: rgba(0, 0, 0, 0.3); /* Fondo semi-transparente para mayor visibilidad */
    }
    
    .cerrar-sidebar:active {
      background-color: rgba(255, 255, 255, 0.2);
      transform: scale(0.95); /* Feedback visual al tocar */
    }
  }

  /* Contenido del sidebar */
  .sidebar-content {
    padding: 10px;
    flex: 1;
    overflow-y: auto;
  }

  /* Scrollbar personalizada */
  .sidebar-content::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .sidebar-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  /* Módulos */
  .modulo {
    margin-bottom: 10px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #242424;
  }

  .modulo.activo {
    background-color: #2a2a2a;
    border-left: 3px solid #4CAF50;
  }

  .modulo-header {
    padding: 15px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
  }

  .modulo-header:hover {
    background-color: #2a2a2a;
  }

  .modulo-titulo {
    font-weight: 500;
  }

  .toggle-icon {
    transition: transform 0.3s ease;
  }

  .toggle-icon.expandido {
    transform: rotate(180deg);
  }

  /* Lista de lecciones */
  .lecciones-list {
    padding: 0 10px 10px 10px;
  }

  .leccion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border-left: 4px solid transparent;
    background-color: transparent;
    color: #fff;
  }

  .leccion-item:hover {
    background-color: #2a2a2a;
  }

  /* Estados de lección */
  .leccion-item.activa {
    background-color: #ffffff !important;
    border-left-color: #fb923c !important;
    color: #c2410c !important;
  }

  .leccion-item.activa .leccion-titulo {
    color: inherit !important;
    font-weight: 600 !important;
  }

  .leccion-item.activa .leccion-estado,
  .leccion-item.activa .estado-pendiente,
  .leccion-item.activa .estado-completado,
  .leccion-item.activa .estado-progreso {
    color: inherit !important;
  }

  .leccion-item.activa .estado-pendiente svg,
  .leccion-item.activa .estado-completado svg {
    stroke: currentColor !important;
  }

  .leccion-item.completada:not(.activa) {
    opacity: 0.8;
  }

  .leccion-item.completada:not(.activa) .estado-completado {
    color: #22c55e !important;
  }

  .leccion-item.completada:not(.activa) .estado-completado svg {
    stroke: #22c55e !important;
  }

  /* Thumbnail de lección */
  .leccion-thumbnail {
    position: relative;
    width: 120px;
    height: 68px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background-color: #111;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    border: 2px solid transparent;
    margin-right: 5px;
  }
  
  .leccion-item:hover .leccion-thumbnail {
    transform: scale(1.05);
    border-color: rgba(255, 140, 0, 0.5);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  }
  
  .leccion-item.activa .leccion-thumbnail {
    border-color: #fb923c;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(251, 146, 60, 0.3);
  }

  .leccion-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-color: #1a1a1a;
  }

  .thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #2a2a2a;
    color: #666;
  }

  /* Icono de reproducción */
  .leccion-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background-color: rgba(255, 140, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    z-index: 2;
  }

  .leccion-item:hover .leccion-play-icon {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
    background-color: rgba(255, 140, 0, 1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  /* Información de lección */
  .leccion-info {
    flex: 1;
    min-width: 0;
  }

  .leccion-titulo {
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .leccion-estado {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #a0a0a0;
  }

  /* Estados de progreso */
  .estado-completado,
  .estado-pendiente,
  .estado-progreso {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
  }

  .estado-completado {
    font-weight: 600;
  }

  .estado-pendiente {
    color: #a0a0a0;
  }

  .progreso-mini-bar {
    width: 50px;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 1.5px;
    overflow: hidden;
  }

  .progreso-mini-fill {
    height: 100%;
    background-color: #4CAF50;
  }

  /* Contenedor de tipo de parte */
  .tipo-parte-container {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 6px;
    text-align: center;
  }

  .tipo-parte {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #fff;
  }

  .tipo-texto {
    font-size: 12px;
    font-weight: 600;
    color: #fb923c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .titulo-texto {
    font-size: 11px;
    color: #a0a0a0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .leccion-item:hover .tipo-parte-container {
    background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
  }

  .leccion-item.activa .tipo-parte-container {
    background: linear-gradient(135deg, #fb923c 0%, #c2410c 100%);
  }

  .leccion-item.activa .tipo-texto {
    color: #fff;
  }

  .leccion-item.activa .titulo-texto {
    color: rgba(255, 255, 255, 0.9);
  }

  /* Estados vacíos */
  .no-lecciones,
  .no-modulos {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    text-align: center;
    color: #a0a0a0;
  }

  /* Responsive */
  @media (max-width: 1100px) {
    .leccion-thumbnail {
      width: 100px;
      height: 56px;
    }
    
    .leccion-item {
      padding: 8px;
      margin-bottom: 6px;
    }
  }
</style> 