<script lang="ts">
  import { goto } from '$app/navigation';

  export let curso: {
    id: string;
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    slug: string;
    porcentaje_completado: number;
    ultima_leccion_titulo?: string;
    tiempo_estimado?: string;
    instructor?: string;
    categoria?: string;
    tipo?: 'curso' | 'tutorial';
  };

  async function continuarCurso() {
    if (!curso.slug) {
      console.error('❌ No se puede continuar curso sin slug');
      return;
    }

    try {
      console.log('🎯 Navegando a la última lección de:', curso.titulo);

      // Para desarrollo/testing, ir directamente al contenido por ahora
      // TODO: Implementar navegación inteligente a última lección
      
      const rutaBase = curso.tipo === 'tutorial' ? '/tutoriales' : '/cursos';
      
      // Si hay información de última lección, tratar de navegar allí
      if (curso.ultima_leccion_titulo && curso.ultima_leccion_titulo !== 'Sin iniciar' && curso.ultima_leccion_titulo !== '¡Completado!') {
        console.log('📍 Última lección encontrada:', curso.ultima_leccion_titulo);
      }
      
      // Por ahora, navegar a la página principal del curso/tutorial
      // donde la lógica interna del curso decidirá la navegación
      goto(`${rutaBase}/${curso.slug}`);
      
    } catch (error) {
      console.error('❌ Error navegando a curso:', error);
      // Fallback
      const rutaBase = curso.tipo === 'tutorial' ? '/tutoriales' : '/cursos';
      goto(`${rutaBase}/${curso.slug}`);
    }
  }

  function formatearTiempoRestante(porcentaje: number): string {
    if (porcentaje >= 95) return 'Casi completado';
    if (porcentaje >= 75) return 'Falta poco';
    if (porcentaje >= 50) return 'En progreso';
    if (porcentaje >= 25) return 'Comenzado';
    return 'Recién iniciado';
  }

  $: estadoProgreso = formatearTiempoRestante(curso.porcentaje_completado);
  $: colorProgreso = curso.porcentaje_completado >= 75 ? '#059669' : 
                    curso.porcentaje_completado >= 50 ? '#3b82f6' : 
                    curso.porcentaje_completado >= 25 ? '#f97316' : '#ef4444';
</script>

<div class="tarjeta-curso-progreso" on:click={continuarCurso} role="button" tabindex="0"
     on:keydown={(e) => e.key === 'Enter' && continuarCurso()}>
  
  <!-- Imagen del curso -->
  <div class="contenedor-imagen">
    {#if curso.imagen_url}
      <img src={curso.imagen_url} alt={curso.titulo} class="imagen-curso" />
    {:else}
      <div class="imagen-placeholder">
        <span class="icono-placeholder">
          {curso.tipo === 'tutorial' ? '📝' : '📚'}
        </span>
      </div>
    {/if}
    
    <!-- Badge de tipo de contenido -->
    <div class="badge-tipo {curso.tipo || 'curso'}">
      {curso.tipo === 'tutorial' ? 'Tutorial' : 'Curso'}
    </div>
  </div>

  <!-- Contenido principal -->
  <div class="contenido-curso">
    <div class="encabezado-curso">
      <h3 class="titulo-curso">{curso.titulo}</h3>
      <div class="porcentaje-progreso" style="color: {colorProgreso}">
        {Math.round(curso.porcentaje_completado)}%
      </div>
    </div>

    {#if curso.categoria}
      <div class="categoria-curso">{curso.categoria}</div>
    {/if}

    {#if curso.ultima_leccion_titulo}
      <div class="ultima-leccion">
        <svg class="icono-leccion" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Siguiente: {curso.ultima_leccion_titulo}</span>
      </div>
    {/if}

    {#if curso.instructor}
      <div class="instructor-info">
        <svg class="icono-instructor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>{curso.instructor}</span>
      </div>
    {/if}

    <!-- Barra de progreso -->
    <div class="contenedor-progreso">
      <div class="barra-progreso">
        <div 
          class="relleno-progreso"
          style="width: {curso.porcentaje_completado}%; background-color: {colorProgreso}"
        ></div>
      </div>
      <div class="estado-progreso">{estadoProgreso}</div>
    </div>

    <!-- Botón de acción -->
    <button class="boton-continuar" on:click|stopPropagation={continuarCurso}>
      <svg class="icono-continuar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>{curso.porcentaje_completado > 0 ? 'Continuar' : 'Empezar'}</span>
      {#if curso.tiempo_estimado}
        <span class="tiempo-estimado">• {curso.tiempo_estimado}</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .tarjeta-curso-progreso {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tarjeta-curso-progreso:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }

  .contenedor-imagen {
    position: relative;
    height: 180px;
    overflow: hidden;
  }

  .imagen-curso {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .tarjeta-curso-progreso:hover .imagen-curso {
    transform: scale(1.05);
  }

  .imagen-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icono-placeholder {
    font-size: 3rem;
    color: white;
    opacity: 0.9;
  }

  .badge-tipo {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    backdrop-filter: blur(8px);
    color: white;
  }

  .badge-tipo.curso {
    background: rgba(59, 130, 246, 0.9);
  }

  .badge-tipo.tutorial {
    background: rgba(139, 92, 246, 0.9);
  }

  .contenido-curso {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .encabezado-curso {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 0.75rem;
  }

  .titulo-curso {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .porcentaje-progreso {
    font-size: 0.875rem;
    font-weight: 700;
    white-space: nowrap;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  .categoria-curso {
    font-size: 0.75rem;
    font-weight: 500;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ultima-leccion,
  .instructor-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .icono-leccion,
  .icono-instructor {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .contenedor-progreso {
    margin-top: auto;
  }

  .barra-progreso {
    width: 100%;
    height: 4px;
    background: #f1f5f9;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .relleno-progreso {
    height: 100%;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 2px;
  }

  .estado-progreso {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    text-align: center;
  }

  .boton-continuar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
  }

  .boton-continuar:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .icono-continuar {
    width: 16px;
    height: 16px;
  }

  .tiempo-estimado {
    opacity: 0.8;
    font-weight: 400;
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .tarjeta-curso-progreso {
      background: #1e293b;
      border-color: #334155;
    }

    .titulo-curso {
      color: #f1f5f9;
    }

    .porcentaje-progreso {
      background: rgba(255, 255, 255, 0.1);
    }

    .categoria-curso {
      color: #a78bfa;
    }

    .ultima-leccion,
    .instructor-info,
    .estado-progreso {
      color: #94a3b8;
    }

    .barra-progreso {
      background: #475569;
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .contenedor-imagen {
      height: 140px;
    }

    .contenido-curso {
      padding: 1rem;
      gap: 0.5rem;
    }

    .titulo-curso {
      font-size: 1rem;
    }

    .encabezado-curso {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .porcentaje-progreso {
      align-self: flex-end;
    }
  }
</style> 