<script lang="ts">
  import TarjetaEstadistica from './TarjetaEstadistica.svelte';
  import type { EstadisticasUsuarios } from '$lib/services/adminService';
  import { formatearNumero } from '$lib/services/adminService';

  export let estadisticas: EstadisticasUsuarios | null = null;
  export let loading: boolean = false;
</script>

<div class="seccion-usuarios">
  <h2 class="titulo-seccion">
    <i class="fas fa-users"></i>
    Estadísticas de Usuarios
  </h2>
  
  <div class="grid-estadisticas">
    <TarjetaEstadistica
      titulo="Total de Usuarios"
      valor={estadisticas ? formatearNumero(estadisticas.total) : '0'}
      icono="fas fa-users"
      colorFondo="#dbeafe"
      colorIcono="#2563eb"
      subtitulo="Usuarios registrados"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Nuevos este mes"
      valor={estadisticas ? formatearNumero(estadisticas.nuevos_mes) : '0'}
      icono="fas fa-user-plus"
      colorFondo="#dcfce7"
      colorIcono="#16a34a"
      tendencia={estadisticas?.crecimiento}
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Usuarios Activos"
      valor={estadisticas ? formatearNumero(estadisticas.activos) : '0'}
      icono="fas fa-user-check"
      colorFondo="#fef3c7"
      colorIcono="#d97706"
      subtitulo="Con suscripción activa"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Usuarios Premium"
      valor={estadisticas ? formatearNumero(estadisticas.premium) : '0'}
      icono="fas fa-crown"
      colorFondo="#fce7f3"
      colorIcono="#be185d"
      subtitulo="Membresía premium/avanzada"
      {loading}
    />
  </div>
</div>

<style>
  .seccion-usuarios {
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
    color: #2563eb;
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