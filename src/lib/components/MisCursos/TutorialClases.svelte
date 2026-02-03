<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  import { goto } from '$app/navigation';
  import TarjetaClase from './TarjetaClase.svelte';

  // Props
  export let tutorial: any;
  export let progreso: any = {};
  export let slug: string = '';

  const dispatch = createEventDispatcher();

  // Función para navegar a una clase
  function irAClase(parte: any) {
    const parteSlug = parte.slug || generateSlug(parte.titulo);
    const ruta = `/tutoriales/${slug}/clase/${parteSlug}`;
    goto(ruta);
  }

  // Función para obtener el estado de una clase
  function getEstadoClase(parteId: string) {
    const progresoClase = progreso[parteId];
    if (!progresoClase) return 'pendiente';
    
    if (progresoClase.completado) return 'completada';
    return 'pendiente';
  }

  // Función para calcular estadísticas del tutorial
  function calcularEstadisticas() {
    if (!tutorial?.partes || tutorial.partes.length === 0) {
      return { completadas: 0, total: 0, porcentaje: 0 };
    }

    const total = tutorial.partes.length;
    const completadas = tutorial.partes.filter((parte: any) => 
      progreso[parte.id]?.completado
    ).length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return { completadas, total, porcentaje };
  }

  // Función para obtener información adicional del tutorial
  function getInfoTutorial() {
    const info = [];
    
    if (tutorial.artista) {
      info.push(`Artista: ${tutorial.artista}`);
    }
    
    if (tutorial.acordeonista) {
      info.push(`Acordeonista: ${tutorial.acordeonista}`);
    }
    
    if (tutorial.tonalidad) {
      info.push(`Tonalidad: ${tutorial.tonalidad}`);
    }
    
    return info;
  }

  $: estadisticas = calcularEstadisticas();
  $: infoTutorial = getInfoTutorial();
</script>

<div class="tutorial-container">
  <div class="tutorial-header">
    <h2>Clases del Tutorial</h2>
    <p class="subtitulo">Aprende esta canción paso a paso</p>
    
    {#if infoTutorial.length > 0}
      <div class="info-tutorial">
        {#each infoTutorial as info}
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <span>{info}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="progreso-global">
    <div class="progreso-stats">
      <div class="stat">
        <div class="stat-numero">{estadisticas.completadas}</div>
        <div class="stat-label">Completadas</div>
      </div>
      <div class="stat">
        <div class="stat-numero">{estadisticas.total - estadisticas.completadas}</div>
        <div class="stat-label">Pendientes</div>
      </div>
      <div class="stat">
        <div class="stat-numero">{estadisticas.porcentaje}%</div>
        <div class="stat-label">Progreso</div>
      </div>
    </div>
    
    <div class="progreso-barra-global">
      <div class="progreso-texto">
        {estadisticas.completadas} de {estadisticas.total} clases completadas
      </div>
      <div class="progreso-barra">
        <div 
          class="progreso-fill"
          style="width: {estadisticas.porcentaje}%"
        ></div>
      </div>
    </div>
  </div>

  {#if tutorial?.partes && tutorial.partes.length > 0}
    <div class="clases-lista">
      {#each tutorial.partes as parte, index (parte.id)}
        <TarjetaClase
          clase={parte}
          numeroClase={index + 1}
          estado={getEstadoClase(parte.id)}
          on:click={() => irAClase(parte)}
        />
      {/each}
    </div>
  {:else}
    <div class="sin-clases">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
      <h3>No hay clases disponibles</h3>
      <p>Este tutorial aún no tiene clases configuradas</p>
    </div>
  {/if}
</div>

<style>
  .tutorial-container {
    width: 100%;
  }

  .tutorial-header {
    margin-bottom: 2rem;
  }

  .tutorial-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .subtitulo {
    color: #64748b;
    font-size: 1rem;
    margin: 0 0 1rem 0;
  }

  .info-tutorial {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 12px;
    border: 1px solid #f59e0b;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #92400e;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .info-item svg {
    color: #d97706;
  }

  .progreso-global {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .progreso-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    text-align: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .stat-numero {
    font-size: 1.5rem;
    font-weight: 800;
    color: #a855f7;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progreso-barra-global {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progreso-texto {
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progreso-barra {
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
    transition: width 0.3s ease;
    border-radius: 6px;
  }

  .clases-lista {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .sin-clases {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }

  .sin-clases svg {
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .sin-clases h3 {
    color: #475569;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .sin-clases p {
    margin: 0;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .progreso-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .clases-lista {
      grid-template-columns: 1fr;
    }
    
    .info-tutorial {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .progreso-stats {
      grid-template-columns: 1fr;
    }
    
    .progreso-global {
      padding: 1rem;
    }
  }
</style> 