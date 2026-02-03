<script lang="ts">
  import TarjetaCurso from './TarjetaCurso.svelte';
  
  // Props
  export let inscripciones: any[] = [];
  export let isLoading: boolean = false;
  export let error: string | null = null;
</script>

<div class="contenedor-grid">
  {#if isLoading}
    <div class="estado-carga">
      <div class="spinner"></div>
      <p>Cargando tus cursos...</p>
    </div>
  {:else if error}
    <div class="estado-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Oops! Algo salió mal</h3>
      <p>{error}</p>
      <button class="boton-reintentar" on:click={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  {:else if inscripciones.length === 0}
    <div class="estado-vacio">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <path d="M8 9h8M8 14h5"/>
      </svg>
      <h3>¡Aún no tienes cursos!</h3>
      <p>Explora nuestro catálogo y encuentra el curso perfecto para ti</p>
      <a href="/cursos" class="boton-explorar">
        Explorar Cursos
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  {:else}
    <div class="grid-cursos">
      {#each inscripciones as inscripcion (inscripcion.id)}
        <TarjetaCurso {inscripcion} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .contenedor-grid {
    width: 100%;
  }

  .grid-cursos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
    width: 100%;
  }

  /* Estados de carga, error y vacío */
  .estado-carga,
  .estado-error,
  .estado-vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    gap: 1.5rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .estado-carga p {
    color: #6b7280;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .estado-error svg {
    color: #ef4444;
  }

  .estado-error h3 {
    color: #1f2937;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .estado-error p {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .boton-reintentar {
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .boton-reintentar:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }

  .estado-vacio svg {
    color: #9ca3af;
  }

  .estado-vacio h3 {
    color: #1f2937;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .estado-vacio p {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
    max-width: 400px;
  }

  .boton-explorar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #2563eb;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .boton-explorar:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .grid-cursos {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .estado-carga,
    .estado-error,
    .estado-vacio {
      padding: 3rem 1rem;
    }

    .estado-vacio h3,
    .estado-error h3 {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .grid-cursos {
      gap: 16px;
    }
  }

  /* Ajuste para tablets */
  @media (min-width: 769px) and (max-width: 1024px) {
    .grid-cursos {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Ajuste para pantallas grandes */
  @media (min-width: 1200px) {
    .grid-cursos {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style> 