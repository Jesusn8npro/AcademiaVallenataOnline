<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let clase: any;
  export let numeroClase: number;
  export let estado: 'pendiente' | 'completada' = 'pendiente';

  const dispatch = createEventDispatcher();

  // Función para obtener el color del estado
  function getEstadoColor(estado: string) {
    switch (estado) {
      case 'completada':
        return '#10b981';
      default:
        return '#a855f7';
    }
  }

  // Función para obtener el icono del estado
  function getEstadoIcono(estado: string) {
    switch (estado) {
      case 'completada':
        return 'M9 12l2 2 4-4';
      default:
        return 'M5 3l6 6m0 0l6-6M11 9l-6 6';
    }
  }

  // Función para obtener el texto del estado
  function getEstadoTexto(estado: string) {
    switch (estado) {
      case 'completada':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  }

  // Función para hacer clic en la clase
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
    if (!videoUrl) return '/images/default-tutorial.jpg';
    
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
    
    return '/images/default-tutorial.jpg';
  }

  // Función para obtener el tipo de parte formateado
  function getTipoParte(tipoParte: string): string {
    if (!tipoParte) return 'Clase';
    
    // Capitalizar primera letra
    return tipoParte.charAt(0).toUpperCase() + tipoParte.slice(1);
  }
</script>

<div 
  class="tarjeta-clase"
  class:completada={estado === 'completada'}
  class:pendiente={estado === 'pendiente'}
  on:click={handleClick}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
  role="button"
  tabindex="0"
  aria-label={`Clase ${numeroClase}: ${clase.titulo}`}
>
  <div class="clase-miniatura">
    <img 
      src={obtenerMiniatura(clase.video_url)} 
      alt={clase.titulo}
      loading="lazy"
      on:error={(e) => {
        const imgElement = e.currentTarget as HTMLImageElement;
        if (imgElement) {
          imgElement.src = '/images/default-tutorial.jpg';
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
    
    <div class="numero-clase">
      Clase {numeroClase}
    </div>
    
    <div class="estado-badge" style="background-color: {getEstadoColor(estado)}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d={getEstadoIcono(estado)}/>
      </svg>
    </div>
    
    {#if clase.tipo_parte}
      <div class="tipo-parte-badge">
        {getTipoParte(clase.tipo_parte)}
      </div>
    {/if}
  </div>
  
  <div class="clase-info">
    <h4 class="clase-titulo">{clase.titulo}</h4>
    
    {#if clase.descripcion}
      <p class="clase-descripcion">{clase.descripcion}</p>
    {/if}
    
    <div class="clase-metadatos">
      {#if clase.duracion}
        <div class="metadato">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{formatearDuracion(clase.duracion)}</span>
        </div>
      {/if}
      
      <div class="metadato">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span>{getTipoParte(clase.tipo_parte)}</span>
      </div>
    </div>
    
    <div class="clase-estado">
      <div class="estado-texto">
        <span style="color: {getEstadoColor(estado)}">{getEstadoTexto(estado)}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .tarjeta-clase {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    position: relative;
  }

  .tarjeta-clase:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    border-color: #a855f7;
  }

  .tarjeta-clase.completada {
    border-color: #10b981;
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  }

  .tarjeta-clase.pendiente {
    border-color: #a855f7;
    background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  }

  .clase-miniatura {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;
  }

  .clase-miniatura img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .tarjeta-clase:hover .clase-miniatura img {
    transform: scale(1.05);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .tarjeta-clase:hover .overlay {
    opacity: 1;
  }

  .play-button {
    background: rgba(168, 85, 247, 0.9);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.8);
    transition: transform 0.2s ease;
  }

  .tarjeta-clase:hover .play-button {
    transform: scale(1);
  }

  .numero-clase {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(168, 85, 247, 0.9);
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

  .tipo-parte-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .clase-info {
    padding: 1rem;
  }

  .clase-titulo {
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

  .clase-descripcion {
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0 0 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .clase-metadatos {
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
    color: #a855f7;
  }

  .clase-estado {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .estado-texto {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .clase-miniatura {
      height: 120px;
    }
    
    .clase-info {
      padding: 0.75rem;
    }
    
    .clase-titulo {
      font-size: 0.9rem;
    }
    
    .play-button {
      width: 40px;
      height: 40px;
    }
  }
</style> 