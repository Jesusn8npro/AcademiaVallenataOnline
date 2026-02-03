<script lang="ts">
  import TarjetaEstadistica from './TarjetaEstadistica.svelte';
  import type { EstadisticasVentas } from '$lib/services/adminService';
  import { formatearNumero, formatearMoneda } from '$lib/services/adminService';

  export let estadisticas: EstadisticasVentas | null = null;
  export let loading: boolean = false;
</script>

<div class="seccion-ventas">
  <h2 class="titulo-seccion">
    <i class="fas fa-chart-line"></i>
    Estadísticas de Ventas
  </h2>
  
  <div class="grid-estadisticas">
    <TarjetaEstadistica
      titulo="Total de Ventas"
      valor={estadisticas ? formatearNumero(estadisticas.total) : '0'}
      icono="fas fa-shopping-cart"
      colorFondo="#ecfdf5"
      colorIcono="#059669"
      subtitulo="Ventas completadas"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Ventas este mes"
      valor={estadisticas ? formatearNumero(estadisticas.mes_actual) : '0'}
      icono="fas fa-calendar-check"
      colorFondo="#fef2f2"
      colorIcono="#dc2626"
      tendencia={estadisticas?.crecimiento_ventas}
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Ingresos Totales"
      valor={estadisticas ? formatearMoneda(estadisticas.ingresos) : '$0'}
      icono="fas fa-money-bill-wave"
      colorFondo="#fffbeb"
      colorIcono="#d97706"
      subtitulo="Ingresos acumulados"
      {loading}
    />
    
    <TarjetaEstadistica
      titulo="Ticket Promedio"
      valor={estadisticas ? formatearMoneda(estadisticas.ticket_promedio) : '$0'}
      icono="fas fa-receipt"
      colorFondo="#f0f9ff"
      colorIcono="#0284c7"
      subtitulo="Valor promedio por venta"
      {loading}
    />
  </div>
</div>

<style>
  .seccion-ventas {
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
    color: #059669;
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