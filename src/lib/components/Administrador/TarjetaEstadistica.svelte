<script lang="ts">
  export let titulo: string;
  export let valor: string | number;
  export let icono: string;
  export let colorFondo: string = '#f3f4f6';
  export let colorIcono: string = '#374151';
  export let subtitulo: string = '';
  export let tendencia: number | null = null;
  export let loading: boolean = false;
</script>

<div class="tarjeta-estadistica" style="background-color: {colorFondo}">
  {#if loading}
    <div class="loading-skeleton">
      <div class="skeleton-icon"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-value"></div>
      </div>
    </div>
  {:else}
    <div class="icono-contenedor" style="color: {colorIcono}">
      <i class={icono}></i>
    </div>
    
    <div class="contenido">
      <h3 class="titulo">{titulo}</h3>
      <p class="valor">{valor}</p>
      
      {#if subtitulo}
        <p class="subtitulo">{subtitulo}</p>
      {/if}
      
      {#if tendencia !== null}
        <div class="tendencia" class:positiva={tendencia > 0} class:negativa={tendencia < 0}>
          <i class={tendencia > 0 ? 'fas fa-arrow-up' : tendencia < 0 ? 'fas fa-arrow-down' : 'fas fa-minus'}></i>
          <span>{Math.abs(tendencia)}%</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tarjeta-estadistica {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    background-color: white;
  }

  .tarjeta-estadistica:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .icono-contenedor {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.8);
    font-size: 1.5rem;
  }

  .contenido {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .titulo {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .valor {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1;
  }

  .subtitulo {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
  }

  .tendencia {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .tendencia.positiva {
    color: #059669;
  }

  .tendencia.negativa {
    color: #dc2626;
  }

  /* Loading skeleton */
  .loading-skeleton {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .skeleton-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-title {
    height: 12px;
    width: 60%;
    border-radius: 6px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  .skeleton-value {
    height: 24px;
    width: 40%;
    border-radius: 6px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .tarjeta-estadistica {
      padding: 1rem;
      gap: 0.75rem;
    }

    .icono-contenedor {
      width: 40px;
      height: 40px;
      font-size: 1.25rem;
    }

    .valor {
      font-size: 1.5rem;
    }

    .titulo {
      font-size: 0.8rem;
    }
  }
</style> 