<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let proximaLeccion: any;
  export let tipoContenido: 'curso' | 'tutorial' = 'curso';

  const dispatch = createEventDispatcher();

  // Función para obtener el color según el tipo de contenido
  function getColorPrincipal(tipo: 'curso' | 'tutorial') {
    return tipo === 'curso' ? '#3b82f6' : '#a855f7';
  }

  // Función para obtener el color de hover según el tipo de contenido
  function getColorHover(tipo: 'curso' | 'tutorial') {
    return tipo === 'curso' ? '#2563eb' : '#9333ea';
  }

  // Función para obtener el color de fondo según el tipo de contenido
  function getColorFondo(tipo: 'curso' | 'tutorial') {
    return tipo === 'curso' ? '#dbeafe' : '#f3e8ff';
  }

  // Función para obtener el título de la próxima lección
  function getTituloProximaLeccion() {
    if (tipoContenido === 'curso') {
      return proximaLeccion?.leccion?.titulo || 'Próxima lección';
    } else {
      return proximaLeccion?.clase?.titulo || 'Próxima clase';
    }
  }

  // Función para obtener el módulo de la próxima lección (solo para cursos)
  function getModuloProximaLeccion() {
    if (tipoContenido === 'curso') {
      return proximaLeccion?.modulo?.titulo || '';
    }
    return '';
  }

  // Función para hacer clic en continuar
  function handleContinuar() {
    dispatch('continuar');
  }

  $: colorPrincipal = getColorPrincipal(tipoContenido);
  $: colorHover = getColorHover(tipoContenido);
  $: colorFondo = getColorFondo(tipoContenido);
  $: tituloProximaLeccion = getTituloProximaLeccion();
  $: moduloProximaLeccion = getModuloProximaLeccion();
</script>

<div class="boton-continuar-container">
  <div class="continuar-header">
    <div class="continuar-icono">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    </div>
    <div class="continuar-info">
      <h3>Continuar Aprendiendo</h3>
      <p>Retoma donde lo dejaste</p>
    </div>
  </div>

  <div class="proxima-leccion" style="background-color: {colorFondo}; border-color: {colorPrincipal};">
    <div class="leccion-info">
      <div class="leccion-tipo">
        {tipoContenido === 'curso' ? 'Próxima Lección' : 'Próxima Clase'}
      </div>
      <div class="leccion-titulo">{tituloProximaLeccion}</div>
      {#if moduloProximaLeccion}
        <div class="leccion-modulo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span>{moduloProximaLeccion}</span>
        </div>
      {/if}
    </div>
    
    <div class="leccion-accion">
      <button 
        class="btn-continuar"
        style="background-color: {colorPrincipal}; --hover-color: {colorHover};"
        on:click={handleContinuar}
      >
        <span>Continuar</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="sugerencias">
    <div class="sugerencia">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span>Mantén tu racha de aprendizaje</span>
    </div>
    <div class="sugerencia">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>Dedica 15 minutos al día</span>
    </div>
    <div class="sugerencia">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4l5.4-5.4a2 2 0 0 0 0-2.8L9 11z"/>
        <path d="M15 12l-6-6"/>
        <path d="M11 6l6 6"/>
      </svg>
      <span>Practica regularmente</span>
    </div>
  </div>
</div>

<style>
  .boton-continuar-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .continuar-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .continuar-icono {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .continuar-info h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .continuar-info p {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .proxima-leccion {
    border: 2px solid;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .leccion-info {
    flex: 1;
  }

  .leccion-tipo {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .leccion-titulo {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .leccion-modulo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .leccion-accion {
    flex-shrink: 0;
  }

  .btn-continuar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-continuar:hover {
    background-color: var(--hover-color) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .btn-continuar:active {
    transform: translateY(0);
  }

  .sugerencias {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sugerencia {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .sugerencia svg {
    color: #3b82f6;
    flex-shrink: 0;
  }

  .sugerencia span {
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .boton-continuar-container {
      padding: 1.5rem;
    }
    
    .proxima-leccion {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }
    
    .leccion-accion {
      width: 100%;
    }
    
    .btn-continuar {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .boton-continuar-container {
      padding: 1rem;
    }
    
    .continuar-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .sugerencias {
      gap: 0.75rem;
    }
    
    .sugerencia {
      padding: 0.5rem;
    }
  }
</style> 