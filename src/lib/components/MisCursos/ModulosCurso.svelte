<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  import { goto } from '$app/navigation';
  import TarjetaLeccion from './TarjetaLeccion.svelte';

  // Props
  export let curso: any;
  export let progreso: any = {};
  export let slug: string = '';

  // Estados
  let modulosExpandidos: Record<string, boolean> = {};
  const dispatch = createEventDispatcher();

  // Expandir todos los módulos por defecto
  $: if (curso?.modulos) {
    curso.modulos.forEach((modulo: any) => {
      if (!(modulo.id in modulosExpandidos)) {
        modulosExpandidos[modulo.id] = true;
      }
    });
  }

  // Función para alternar expansión de módulo
  function toggleModulo(moduloId: string) {
    modulosExpandidos[moduloId] = !modulosExpandidos[moduloId];
    modulosExpandidos = { ...modulosExpandidos };
  }

  // Función para navegar a una lección
  function irALeccion(modulo: any, leccion: any) {
    const moduloSlug = modulo.slug || generateSlug(modulo.titulo);
    const leccionSlug = leccion.slug || generateSlug(leccion.titulo);
    const ruta = `/cursos/${slug}/${moduloSlug}/${leccionSlug}`;
    goto(ruta);
  }

  // Función para calcular progreso del módulo
  function calcularProgresoModulo(modulo: any) {
    if (!modulo.lecciones || modulo.lecciones.length === 0) {
      return { completadas: 0, total: 0, porcentaje: 0 };
    }

    const total = modulo.lecciones.length;
    const completadas = modulo.lecciones.filter((leccion: any) => 
      progreso[leccion.id]?.estado === 'completada'
    ).length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return { completadas, total, porcentaje };
  }

  // Función para obtener el estado de una lección
  function getEstadoLeccion(leccionId: string) {
    const progresoLeccion = progreso[leccionId];
    if (!progresoLeccion) return 'pendiente';
    
    if (progresoLeccion.estado === 'completada') return 'completada';
    if (progresoLeccion.porcentaje > 0) return 'en_progreso';
    return 'pendiente';
  }
</script>

<div class="modulos-container">
  <h2>Módulos del Curso</h2>
  <p class="subtitulo">Explora todas las lecciones organizadas por módulos</p>

  {#if curso?.modulos && curso.modulos.length > 0}
    <div class="modulos-lista">
      {#each curso.modulos as modulo, index (modulo.id)}
        {@const progresoModulo = calcularProgresoModulo(modulo)}
        
        <div class="modulo-card">
          <div 
            class="modulo-header"
            on:click={() => toggleModulo(modulo.id)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleModulo(modulo.id); }}
            role="button"
            tabindex="0"
            aria-expanded={modulosExpandidos[modulo.id]}
          >
            <div class="modulo-info">
              <div class="modulo-numero">
                Módulo {index + 1}
              </div>
              <h3 class="modulo-titulo">{modulo.titulo}</h3>
              {#if modulo.descripcion}
                <p class="modulo-descripcion">{modulo.descripcion}</p>
              {/if}
            </div>
            
            <div class="modulo-stats">
              <div class="progreso-modulo">
                <div class="progreso-texto">
                  {progresoModulo.completadas} / {progresoModulo.total} lecciones
                </div>
                <div class="progreso-barra">
                  <div 
                    class="progreso-fill"
                    style="width: {progresoModulo.porcentaje}%"
                  ></div>
                </div>
                <div class="progreso-porcentaje">
                  {progresoModulo.porcentaje}%
                </div>
              </div>
              
              <div class="toggle-icon" class:expandido={modulosExpandidos[modulo.id]}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          {#if modulosExpandidos[modulo.id]}
            <div class="lecciones-container">
              {#if modulo.lecciones && modulo.lecciones.length > 0}
                <div class="lecciones-grid">
                  {#each modulo.lecciones as leccion, leccionIndex (leccion.id)}
                    <TarjetaLeccion
                      {leccion}
                      numeroLeccion={leccionIndex + 1}
                      estado={getEstadoLeccion(leccion.id)}
                      progreso={progreso[leccion.id]?.porcentaje || 0}
                      on:click={() => irALeccion(modulo, leccion)}
                    />
                  {/each}
                </div>
              {:else}
                <div class="sin-lecciones">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p>No hay lecciones disponibles en este módulo</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="sin-modulos">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      <h3>No hay módulos disponibles</h3>
      <p>Este curso aún no tiene módulos configurados</p>
    </div>
  {/if}
</div>

<style>
  .modulos-container {
    width: 100%;
  }

  .modulos-container h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .subtitulo {
    color: #64748b;
    font-size: 1rem;
    margin: 0 0 2rem 0;
  }

  .modulos-lista {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .modulo-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .modulo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .modulo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    cursor: pointer;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-bottom: 1px solid #f1f5f9;
  }

  .modulo-header:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
  }

  .modulo-info {
    flex: 1;
  }

  .modulo-numero {
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .modulo-titulo {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
  }

  .modulo-descripcion {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }

  .modulo-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progreso-modulo {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 120px;
  }

  .progreso-texto {
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progreso-barra {
    width: 100px;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  .progreso-porcentaje {
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .toggle-icon {
    color: #64748b;
    transition: transform 0.2s ease;
  }

  .toggle-icon.expandido {
    transform: rotate(180deg);
  }

  .lecciones-container {
    padding: 0 1.5rem 1.5rem;
  }

  .lecciones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .sin-lecciones,
  .sin-modulos {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }

  .sin-lecciones svg,
  .sin-modulos svg {
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .sin-lecciones h3,
  .sin-modulos h3 {
    color: #475569;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .sin-lecciones p,
  .sin-modulos p {
    margin: 0;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modulo-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .modulo-stats {
      width: 100%;
      justify-content: space-between;
    }

    .lecciones-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .modulo-header {
      padding: 1rem;
    }

    .lecciones-container {
      padding: 0 1rem 1rem;
    }
  }
</style> 