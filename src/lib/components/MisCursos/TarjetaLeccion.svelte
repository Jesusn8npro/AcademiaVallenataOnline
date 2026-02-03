<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let leccion: any;
  export let numeroLeccion: number;
  export let estado: 'pendiente' | 'en_progreso' | 'completada' = 'pendiente';
  export let progreso: number = 0;

  const dispatch = createEventDispatcher();

  // Función para obtener el color del estado
  function getEstadoColor(estado: string) {
    switch (estado) {
      case 'completada':
        return '#10b981';
      case 'en_progreso':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }

  // Función para obtener el icono del estado
  function getEstadoIcono(estado: string) {
    switch (estado) {
      case 'completada':
        return 'M9 12l2 2 4-4';
      case 'en_progreso':
        return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
      default:
        return 'M5 3l6 6m0 0l6-6M11 9l-6 6';
    }
  }

  // Función para obtener el texto del estado
  function getEstadoTexto(estado: string) {
    switch (estado) {
      case 'completada':
        return 'Completada';
      case 'en_progreso':
        return 'En progreso';
      default:
        return 'Pendiente';
    }
  }

  // Función para hacer clic en la lección
  function handleClick() {
    dispatch('click');
  }

  // Función para obtener la duración formateada
  function formatearDuracion(duracion: number): string {
    if (!duracion) return '';
    
    const horas = Math.floor(duracion / 3600);
    const minutos = Math.floor((duracion % 3600) / 60);
    const segundos = duracion % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos}s`;
    } else {
      return `${segundos}s`;
    }
  }

  // Función para obtener miniatura del video
  function obtenerMiniatura(videoUrl: string): string {
    if (!videoUrl) return '/images/default-leccion.jpg';
    
    // YouTube
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    // Bunny.net
    const bunnyMatch = videoUrl.match(/iframe\.mediadelivery\.net\/(?:embed|play)\/([0-9]+)\/([a-zA-Z0-9-]+)/);
    if (bunnyMatch) {
      return `https://iframe.mediadelivery.net/thumbnail/${bunnyMatch[1]}/${bunnyMatch[2]}`;
    }
    
    return '/images/default-leccion.jpg';
  }
</script>

<div 
  class="tarjeta-leccion"
  class:completada={estado === 'completada'}
  class:en-progreso={estado === 'en_progreso'}
  class:pendiente={estado === 'pendiente'}
  on:click={handleClick}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
  role="button"
  tabindex="0"
  aria-label={`Lección ${numeroLeccion}: ${leccion.titulo}`}
>
  <div class="leccion-miniatura">
    <img 
      src={obtenerMiniatura(leccion.video_url)} 
      alt={leccion.titulo}
      loading="lazy"
      on:error={(e) => {
        const imgElement = e.currentTarget as HTMLImageElement;
        if (imgElement) {
          imgElement.src = '/images/default-leccion.jpg';
        }
      }}
    />
    
    <div class="overlay">
      <div class="play-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
    </div>
    
    <div class="numero-leccion">
      {numeroLeccion}
    </div>
    
    <div class="estado-badge" style="background-color: {getEstadoColor(estado)}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d={getEstadoIcono(estado)}/>
      </svg>
    </div>
  </div>
  
  <div class="leccion-info">
    <h4 class="leccion-titulo">{leccion.titulo}</h4>
    
    <div class="leccion-metadatos">
      {#if leccion.duracion}
        <div class="metadato">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{formatearDuracion(leccion.duracion)}</span>
        </div>
      {/if}
      
      <div class="metadato">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span>{leccion.tipo_contenido || 'Video'}</span>
      </div>
    </div>
    
    <div class="leccion-estado">
      <div class="estado-texto">
        <span style="color: {getEstadoColor(estado)}">{getEstadoTexto(estado)}</span>
      </div>
      
      {#if estado === 'en_progreso' && progreso > 0}
        <div class="progreso-mini">
          <div class="progreso-barra-mini">
            <div class="progreso-fill-mini" style="width: {progreso}%"></div>
          </div>
          <span class="progreso-texto-mini">{Math.round(progreso)}%</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .tarjeta-leccion {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    position: relative;
  }

  .tarjeta-leccion:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    border-color: #3b82f6;
  }

  .tarjeta-leccion.completada {
    border-color: #10b981;
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  }

  .tarjeta-leccion.en-progreso {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
  }

  .tarjeta-leccion.pendiente {
    border-color: #e2e8f0;
  }

  .leccion-miniatura {
    position: relative;
    width: 100%;
    height: 120px;
    overflow: hidden;
  }

  .leccion-miniatura img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .tarjeta-leccion:hover .leccion-miniatura img {
    transform: scale(1.05);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .tarjeta-leccion:hover .overlay {
    opacity: 1;
  }

  .play-button {
    background: rgba(59, 130, 246, 0.9);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.8);
    transition: transform 0.2s ease;
  }

  .tarjeta-leccion:hover .play-button {
    transform: scale(1);
  }

  .numero-leccion {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .estado-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .estado-badge svg {
    color: white;
  }

  .leccion-info {
    padding: 1rem;
  }

  .leccion-titulo {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .leccion-metadatos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .metadato {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #64748b;
    font-size: 0.8rem;
  }

  .metadato svg {
    color: #94a3b8;
  }

  .leccion-estado {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .estado-texto {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progreso-mini {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progreso-barra-mini {
    flex: 1;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .progreso-fill-mini {
    height: 100%;
    background: #f59e0b;
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  .progreso-texto-mini {
    font-size: 0.75rem;
    color: #f59e0b;
    font-weight: 600;
    min-width: 35px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .leccion-miniatura {
      height: 100px;
    }
    
    .leccion-info {
      padding: 0.75rem;
    }
    
    .leccion-titulo {
      font-size: 0.9rem;
    }
    
    .play-button {
      width: 40px;
      height: 40px;
    }
  }
</style> 