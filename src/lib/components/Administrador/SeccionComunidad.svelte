<script lang="ts">
  import TarjetaEstadistica from './TarjetaEstadistica.svelte';
  import type { EstadisticasComunidad, EstadisticasCursos } from '$lib/services/adminService';
  import { formatearNumero } from '$lib/services/adminService';

  export let estadisticasComunidad: EstadisticasComunidad | null = null;
  export let estadisticasCursos: EstadisticasCursos | null = null;
  export let loading: boolean = false;
</script>

<div class="seccion-comunidad">
  <h2 class="titulo-seccion">
    <i class="fas fa-users"></i>
    Cursos y Comunidad
  </h2>
  
  <div class="grid-estadisticas">
    <!-- Cursos -->
    <TarjetaEstadistica
      titulo="Total de Cursos"
      valor={estadisticasCursos ? formatearNumero(estadisticasCursos.total) : '0'}
      icono="fas fa-graduation-cap"
      colorFondo="#f0f9ff"
      colorIcono="#0284c7"
      subtitulo="Cursos disponibles"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Estudiantes"
      valor={estadisticasCursos ? formatearNumero(estadisticasCursos.estudiantes) : '0'}
      icono="fas fa-user-graduate"
      colorFondo="#ecfdf5"
      colorIcono="#059669"
      subtitulo="Estudiantes inscritos"
      {loading}
    />
    
    <!-- Comunidad -->
    <TarjetaEstadistica
      titulo="Publicaciones"
      valor={estadisticasComunidad ? formatearNumero(estadisticasComunidad.publicaciones) : '0'}
      icono="fas fa-edit"
      colorFondo="#fef3c7"
      colorIcono="#d97706"
      subtitulo="Publicaciones de comunidad"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Me Gusta"
      valor={estadisticasComunidad ? formatearNumero(estadisticasComunidad.likes) : '0'}
      icono="fas fa-heart"
      colorFondo="#fce7f3"
      colorIcono="#be185d"
      subtitulo="Total de likes"
      {loading}
    />
  </div>
</div>

<style>
  .seccion-comunidad {
    margin-bottom: 2rem;
  }

  .titulo-seccion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }

  .titulo-seccion i {
    color: #8b5cf6;
  }

  .grid-estadisticas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .grid-estadisticas {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .titulo-seccion {
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }
  }
</style> 