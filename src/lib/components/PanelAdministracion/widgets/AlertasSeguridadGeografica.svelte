<!-- 🚨 WIDGET DE ALERTAS DE SEGURIDAD GEOGRÁFICA -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { seguridadGeoService } from '$lib/services/seguridadGeograficaService';

  let cuentasCompartidas: any[] = [];
  let cambiosSospechosos: any[] = [];
  let conexionesSospechosas: any[] = [];
  let cargando = true;
  let ultimaActualizacion: Date | null = null;

  onMount(() => {
    cargarAlertas();
    // Actualizar cada 2 minutos
    const interval = setInterval(cargarAlertas, 2 * 60 * 1000);
    return () => clearInterval(interval);
  });

  async function cargarAlertas() {
    try {
      cargando = true;
  

      const [cuentas, cambios, conexiones] = await Promise.all([
        seguridadGeoService.detectarCuentasCompartidas(),
        seguridadGeoService.detectarCambiosUbicacionSospechosos(),
        seguridadGeoService.detectarDatacentersYProxies()
      ]);

      cuentasCompartidas = cuentas;
      cambiosSospechosos = cambios;
      conexionesSospechosas = conexiones;
      ultimaActualizacion = new Date();

        } catch (error) {
    } finally {
      cargando = false;
    }
  }

  function obtenerIconoRiesgo(nivel: string) {
    switch (nivel) {
      case 'CRITICO': return '🔴';
      case 'ALTO': return '🟠';
      case 'MEDIO': return '🟡';
      default: return '🟢';
    }
  }

  function obtenerColorRiesgo(nivel: string) {
    switch (nivel) {
      case 'CRITICO': return '#dc2626';
      case 'ALTO': return '#ea580c';
      case 'MEDIO': return '#d97706';
      default: return '#16a34a';
    }
  }

  $: totalAlertas = cuentasCompartidas.length + cambiosSospechosos.length + conexionesSospechosas.length;
  $: alertasCriticas = [...cuentasCompartidas, ...cambiosSospechosos, ...conexionesSospechosas]
    .filter(alerta => alerta.nivel_riesgo === 'CRITICO' || alerta.nivel_riesgo === 'ALTO').length;
</script>

<div class="alertas-seguridad-widget">
  <!-- ENCABEZADO -->
  <div class="widget-header">
    <div class="titulo-seccion">
      <h3>🚨 Alertas de Seguridad Geográfica</h3>
      <div class="badges-resumen">
        <div class="badge total" class:activo={totalAlertas > 0}>
          {totalAlertas} alertas
        </div>
        {#if alertasCriticas > 0}
          <div class="badge critico">
            {alertasCriticas} críticas
          </div>
        {/if}
      </div>
    </div>
    
    <div class="controles">
      <button class="btn-actualizar" on:click={cargarAlertas} disabled={cargando}>
        <i class="fas fa-sync-alt" class:rotating={cargando}></i>
        {cargando ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>
  </div>

  {#if ultimaActualizacion}
    <div class="ultima-actualizacion">
      <i class="fas fa-clock"></i>
      Última actualización: {ultimaActualizacion.toLocaleTimeString()}
    </div>
  {/if}

  <!-- CONTENIDO -->
  <div class="alertas-contenido">
    {#if cargando}
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Analizando seguridad geográfica...</p>
      </div>
    {:else if totalAlertas === 0}
      <div class="no-alertas">
        <i class="fas fa-shield-alt"></i>
        <h4>✅ Todo seguro</h4>
        <p>No se han detectado alertas de seguridad geográfica</p>
      </div>
    {:else}
      <!-- CUENTAS COMPARTIDAS -->
      {#if cuentasCompartidas.length > 0}
        <div class="seccion-alertas">
          <h4>
            <i class="fas fa-users"></i>
            Cuentas Compartidas Detectadas ({cuentasCompartidas.length})
          </h4>
          {#each cuentasCompartidas as cuenta}
            <div class="alerta-item" style="border-left-color: {obtenerColorRiesgo(cuenta.nivel_riesgo)}">
              <div class="alerta-header">
                <div class="usuario-info">
                  <strong>{cuenta.usuario?.nombre || 'Usuario'} {cuenta.usuario?.apellido || ''}</strong>
                  <span class="email">{cuenta.usuario?.email || ''}</span>
                </div>
                <div class="riesgo-badge" style="background-color: {obtenerColorRiesgo(cuenta.nivel_riesgo)}">
                  {obtenerIconoRiesgo(cuenta.nivel_riesgo)} {cuenta.nivel_riesgo}
                </div>
              </div>
              <div class="alerta-detalles">
                <div class="detalle-item">
                  <i class="fas fa-globe"></i>
                  <strong>Ubicaciones simultáneas:</strong> {cuenta.ubicaciones_simultaneas}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-flag"></i>
                  <strong>Países diferentes:</strong> {cuenta.paises_diferentes}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-network-wired"></i>
                  <strong>IPs diferentes:</strong> {cuenta.ips_diferentes}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- CAMBIOS SOSPECHOSOS -->
      {#if cambiosSospechosos.length > 0}
        <div class="seccion-alertas">
          <h4>
            <i class="fas fa-route"></i>
            Cambios de Ubicación Sospechosos ({cambiosSospechosos.length})
          </h4>
          {#each cambiosSospechosos as cambio}
            <div class="alerta-item" style="border-left-color: {obtenerColorRiesgo(cambio.nivel_riesgo)}">
              <div class="alerta-header">
                <div class="usuario-info">
                  <strong>{cambio.usuario?.nombre || 'Usuario'} {cambio.usuario?.apellido || ''}</strong>
                  <span class="email">{cambio.usuario?.email || ''}</span>
                </div>
                <div class="riesgo-badge" style="background-color: {obtenerColorRiesgo(cambio.nivel_riesgo)}">
                  {obtenerIconoRiesgo(cambio.nivel_riesgo)} {cambio.nivel_riesgo}
                </div>
              </div>
              <div class="alerta-detalles">
                <div class="detalle-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <strong>De:</strong> {cambio.ubicacion_anterior}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <strong>A:</strong> {cambio.ubicacion_actual}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-ruler"></i>
                  <strong>Distancia:</strong> {cambio.distancia_km} km
                </div>
                <div class="detalle-item">
                  <i class="fas fa-clock"></i>
                  <strong>Tiempo:</strong> {cambio.tiempo_minutos} minutos
                </div>
                <div class="detalle-item velocidad-imposible">
                  <i class="fas fa-tachometer-alt"></i>
                  <strong>Velocidad teórica:</strong> {cambio.velocidad_teorica} km/h
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- CONEXIONES SOSPECHOSAS -->
      {#if conexionesSospechosas.length > 0}
        <div class="seccion-alertas">
          <h4>
            <i class="fas fa-server"></i>
            Conexiones Sospechosas ({conexionesSospechosas.length})
          </h4>
          {#each conexionesSospechosas as conexion}
            <div class="alerta-item" style="border-left-color: {obtenerColorRiesgo(conexion.nivel_riesgo)}">
              <div class="alerta-header">
                <div class="usuario-info">
                  <strong>{conexion.usuario?.nombre || 'Usuario'} {conexion.usuario?.apellido || ''}</strong>
                  <span class="email">{conexion.usuario?.email || ''}</span>
                </div>
                <div class="riesgo-badge" style="background-color: {obtenerColorRiesgo(conexion.nivel_riesgo)}">
                  {obtenerIconoRiesgo(conexion.nivel_riesgo)} {conexion.nivel_riesgo}
                </div>
              </div>
              <div class="alerta-detalles">
                <div class="detalle-item">
                  <i class="fas fa-network-wired"></i>
                  <strong>IP:</strong> {conexion.ip}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <strong>Ubicación:</strong> {conexion.ubicacion}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-building"></i>
                  <strong>Organización:</strong> {conexion.organizacion}
                </div>
                <div class="detalle-item">
                  <i class="fas fa-exclamation-triangle"></i>
                  <strong>Motivos:</strong> {conexion.motivos_sospecha.join(', ')}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .alertas-seguridad-widget {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .widget-header {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .titulo-seccion h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }

  .badges-resumen {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge.total {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .badge.total.activo {
    background: rgba(245, 158, 11, 0.9);
    border-color: #f59e0b;
  }

  .badge.critico {
    background: #7f1d1d;
    border: 1px solid #dc2626;
    animation: pulse 2s infinite;
  }

  .btn-actualizar {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-actualizar:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  .btn-actualizar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rotating {
    animation: spin 1s linear infinite;
  }

  .ultima-actualizacion {
    background: #f3f4f6;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .alertas-contenido {
    padding: 1.5rem;
  }

  .loading-state, .no-alertas {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .loading-state i, .no-alertas i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #d1d5db;
  }

  .no-alertas i {
    color: #10b981;
  }

  .seccion-alertas {
    margin-bottom: 2rem;
  }

  .seccion-alertas h4 {
    color: #374151;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .alerta-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #d1d5db;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.2s;
  }

  .alerta-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .alerta-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .usuario-info strong {
    display: block;
    color: #1f2937;
    font-size: 1rem;
  }

  .usuario-info .email {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .riesgo-badge {
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .alerta-detalles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .detalle-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .detalle-item i {
    width: 16px;
    color: #9ca3af;
  }

  .velocidad-imposible {
    color: #dc2626;
    font-weight: 600;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @media (max-width: 768px) {
    .widget-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .alerta-detalles {
      grid-template-columns: 1fr;
    }
  }
</style> 