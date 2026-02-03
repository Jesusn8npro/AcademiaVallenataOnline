<script lang="ts">
  import { onMount } from 'svelte';
  import ActividadTiempoReal from '$lib/components/PanelAdministracion/ActividadTiempoReal.svelte';
  import GestionAlumnos from '$lib/components/PanelAdministracion/GestionAlumnos.svelte';
  import EstadisticasGenerales from '$lib/components/PanelAdministracion/EstadisticasGenerales.svelte';
  import AlertasInteligentes from '$lib/components/PanelAdministracion/widgets/AlertasInteligentes.svelte';
  
  // Props recibidas del componente principal
  export let actividadTiempoReal: any[] = [];
  export let alumnosActivos: any[] = [];
  export let estadisticasGenerales: any = null;
  export let onGestionarTodos: () => void = () => {};

  // Métricas rápidas de actividad
  let metricasActividad = {
    usuariosOnline: 0,
    totalSesionesHoy: 0,
    tiempoPromedioSesion: 0,
    paginaMasVisitada: ''
  };

  $: {
    // Calcular métricas en tiempo real
    metricasActividad.usuariosOnline = alumnosActivos.filter(a => a.estado_visual === 'online').length;
    metricasActividad.totalSesionesHoy = actividadTiempoReal.length;
    
    if (actividadTiempoReal.length > 0) {
      const tiempoTotal = actividadTiempoReal.reduce((sum, a) => sum + (a.tiempo_sesion || 0), 0);
      metricasActividad.tiempoPromedioSesion = Math.round(tiempoTotal / actividadTiempoReal.length);
    }
  }
</script>

<div class="pestaña-actividad">
  <div class="encabezado-pestaña">
    <h2>📊 Actividad en Tiempo Real</h2>
    <p>Monitoreo de usuarios activos y actividad del sistema</p>
  </div>

  <!-- MÉTRICAS RÁPIDAS -->
  <div class="metricas-rapidas">
    <div class="metrica-card">
      <div class="metrica-icono">👥</div>
      <div class="metrica-info">
        <div class="metrica-numero">{metricasActividad.usuariosOnline}</div>
        <div class="metrica-label">En Línea Ahora</div>
      </div>
    </div>
    <div class="metrica-card">
      <div class="metrica-icono">📱</div>
      <div class="metrica-info">
        <div class="metrica-numero">{metricasActividad.totalSesionesHoy}</div>
        <div class="metrica-label">Sesiones Hoy</div>
      </div>
    </div>
    <div class="metrica-card">
      <div class="metrica-icono">⏱️</div>
      <div class="metrica-info">
        <div class="metrica-numero">{metricasActividad.tiempoPromedioSesion}m</div>
        <div class="metrica-label">Tiempo Promedio</div>
      </div>
    </div>
    <div class="metrica-card">
      <div class="metrica-icono">📈</div>
      <div class="metrica-info">
        <div class="metrica-numero">{estadisticasGenerales?.totalUsuarios || 0}</div>
        <div class="metrica-label">Total Usuarios</div>
      </div>
    </div>
  </div>

  <!-- ALERTAS INTELIGENTES -->
  <div class="seccion-alertas">
    <AlertasInteligentes />
  </div>

  <div class="contenido-actividad">
    <!-- ACTIVIDAD TIEMPO REAL -->
    <div class="seccion-tiempo-real">
      <ActividadTiempoReal 
        actividad={actividadTiempoReal}
      />
    </div>
    
    <!-- GESTIÓN DE ALUMNOS -->
    <div class="seccion-alumnos">
      <GestionAlumnos
        alumnosActivos={alumnosActivos}
        {onGestionarTodos}
      />
    </div>
  </div>
</div>

<style>
  .pestaña-actividad {
    width: 100%;
    animation: fadeIn 0.3s ease;
  }

  .encabezado-pestaña {
    margin-bottom: 2rem;
    text-align: center;
  }

  .encabezado-pestaña h2 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .encabezado-pestaña p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .metricas-rapidas {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metrica-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
  }

  .metrica-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  .metrica-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .metrica-numero {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .metrica-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .contenido-actividad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  /* IGUALAR ALTURAS */
  .seccion-tiempo-real,
  .seccion-alumnos {
    height: 600px;
    display: flex;
    flex-direction: column;
  }

  .seccion-tiempo-real :global(.contenedor-actividad),
  .seccion-alumnos :global(.contenedor-alumnos) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* RESPONSIVE */
  @media (max-width: 1200px) {
    .metricas-rapidas {
      grid-template-columns: repeat(2, 1fr);
    }

    .contenido-actividad {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .seccion-tiempo-real,
    .seccion-alumnos {
      height: auto;
      min-height: 400px;
    }
  }

  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .encabezado-pestaña p {
      font-size: 0.85rem;
    }

    .metricas-rapidas {
      grid-template-columns: 1fr;
    }

    .metrica-card {
      padding: 1rem;
    }

    .contenido-actividad {
      gap: 1rem;
    }
  }
</style> 