<!-- 🌍 PESTAÑA DEDICADA DE GEOLOCALIZACIÓN EXPANDIDA -->
<script lang="ts">
  import { onMount } from 'svelte';
  import GeolocalizacionUsuarios from '$lib/components/PanelAdministracion/widgets/GeolocalizacionUsuarios.svelte';
  import AlertasSeguridadGeografica from '$lib/components/PanelAdministracion/widgets/AlertasSeguridadGeografica.svelte';
  import AnalyticsGeograficos from '$lib/components/PanelAdministracion/widgets/AnalyticsGeograficos.svelte';
  import { servicioGeoEspanol } from '$lib/services/servicioGeolocalizacionEspanol';
  import { supabase } from '$lib/supabase/clienteSupabase';

  // Variables de estado
  let resultadoTest = '';
  let ejecutandoTest = false;
  let vistaActiva = 'overview'; // 'overview', 'alertas', 'analytics', 'usuarios'
  let estadisticasGenerales = {
    totalRegistros: 0,
    usuariosConUbicacion: 0,
    paisesDetectados: 0,
    ubicacionesHoy: 0
  };

  onMount(() => {
    cargarEstadisticasGenerales();
  });

  // 🧪 FUNCIÓN DE PRUEBA MANUAL CON IPAPI.CO
  async function probarRastreoManual() {
    ejecutandoTest = true;
    resultadoTest = '🔄 Probando rastreo de ubicación con ipapi.co...';

    try {
      console.log('🧪 [TEST] Iniciando prueba manual con ipapi.co...');

      // Usar el servicio profesional de ipapi.co en español
      const exito = await servicioGeoEspanol.rastreoCompleto();

      if (exito) {
        resultadoTest = '🎉 ¡ÉXITO! Rastreo de ubicación completado con ipapi.co';
        // Recargar estadísticas después del test exitoso
        setTimeout(cargarEstadisticasGenerales, 1000);
      } else {
        resultadoTest = '❌ Error en el rastreo. Revisa la consola para más detalles.';
      }
    } catch (error) {
      console.error('❌ [TEST] Error en prueba:', error);
      resultadoTest = `❌ Error: ${(error as Error).message}`;
    } finally {
      ejecutandoTest = false;
    }
  }

  async function cargarEstadisticasGenerales() {
    try {
      console.log('📊 [STATS] Cargando estadísticas generales...');

      // Estadísticas básicas de la tabla
      const { data: registros, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('id, usuario_id, pais, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular estadísticas
      const hoy = new Date().toISOString().split('T')[0];
      const registrosHoy = registros?.filter((r: any) => r.created_at.startsWith(hoy)) || [];
      const usuariosUnicos = new Set(registros?.map((r: any) => r.usuario_id) || []);
      const paisesUnicos = new Set(registros?.map((r: any) => r.pais) || []);

      estadisticasGenerales = {
        totalRegistros: registros?.length || 0,
        usuariosConUbicacion: usuariosUnicos.size,
        paisesDetectados: paisesUnicos.size,
        ubicacionesHoy: registrosHoy.length
      };

      console.log('✅ [STATS] Estadísticas cargadas:', estadisticasGenerales);
    } catch (error) {
      console.error('❌ [STATS] Error cargando estadísticas:', error as Error);
    }
  }

  function limpiarCache() {
    servicioGeoEspanol.limpiarCache();
    resultadoTest = '🧹 Cache limpiado correctamente';
  }
</script>

<div class="pestana-geolocalizacion">
  <!-- ENCABEZADO PRINCIPAL -->
  <div class="header-geolocalizacion">
    <div class="titulo-principal">
      <h2>🌍 Geolocalización Avanzada</h2>
      <p>Ubicaciones y seguridad geográfica - Powered by ipapi.co (30K requests/mes gratis)</p>
    </div>
    
    <!-- ESTADÍSTICAS RÁPIDAS -->
    <div class="stats-rapidas">
      <div class="stat-item">
        <div class="stat-valor">{estadisticasGenerales.totalRegistros}</div>
        <div class="stat-label">Registros Total</div>
      </div>
      <div class="stat-item">
        <div class="stat-valor">{estadisticasGenerales.usuariosConUbicacion}</div>
        <div class="stat-label">Usuarios Rastreados</div>
      </div>
      <div class="stat-item">
        <div class="stat-valor">{estadisticasGenerales.paisesDetectados}</div>
        <div class="stat-label">Países Detectados</div>
      </div>
      <div class="stat-item ubicaciones-hoy" class:activo={estadisticasGenerales.ubicacionesHoy > 0}>
        <div class="stat-valor">{estadisticasGenerales.ubicacionesHoy}</div>
        <div class="stat-label">Ubicaciones Hoy</div>
      </div>
    </div>
  </div>

  <!-- NAVEGACIÓN DE PESTAÑAS -->
  <div class="tabs-navegacion">
    <button 
      class="tab-btn" 
      class:activo={vistaActiva === 'overview'} 
      on:click={() => vistaActiva = 'overview'}
    >
      <i class="fas fa-tachometer-alt"></i>
      Resumen General
    </button>
    
    <button 
      class="tab-btn" 
      class:activo={vistaActiva === 'alertas'} 
      on:click={() => vistaActiva = 'alertas'}
    >
      <i class="fas fa-shield-alt"></i>
      Alertas de Seguridad
    </button>
    
    <button 
      class="tab-btn" 
      class:activo={vistaActiva === 'analytics'} 
      on:click={() => vistaActiva = 'analytics'}
    >
      <i class="fas fa-chart-pie"></i>
      Analytics Geográficos
    </button>
    
    <button 
      class="tab-btn" 
      class:activo={vistaActiva === 'usuarios'} 
      on:click={() => vistaActiva = 'usuarios'}
    >
      <i class="fas fa-users"></i>
      Gestión de Usuarios
    </button>
  </div>

  <!-- CONTENIDO DINÁMICO -->
  <div class="contenido-pestana">
    {#if vistaActiva === 'overview'}
      <!-- VISTA RESUMEN GENERAL -->
      <div class="vista-overview">
        <div class="grid-overview">
          <!-- PANEL DE PRUEBAS -->
          <div class="panel-pruebas">
            <h3>🧪 Centro de Pruebas</h3>
            <p>Herramientas para probar y verificar el sistema de geolocalización</p>
            
            <div class="acciones-prueba">
              <button 
                class="btn-accion principal" 
                on:click={probarRastreoManual} 
                disabled={ejecutandoTest}
              >
                {#if ejecutandoTest}
                  <i class="fas fa-spinner fa-spin"></i>
                  Probando ipapi.co...
                {:else}
                  <i class="fas fa-play"></i>
                  Probar Rastreo Manual
                {/if}
              </button>

              <button class="btn-accion secundario" on:click={limpiarCache}>
                <i class="fas fa-broom"></i>
                Limpiar Cache
              </button>

              <button class="btn-accion secundario" on:click={cargarEstadisticasGenerales}>
                <i class="fas fa-sync-alt"></i>
                Actualizar Stats
              </button>
            </div>

            {#if resultadoTest}
              <div class="resultado-prueba" class:exito={resultadoTest.includes('ÉXITO')} class:error={resultadoTest.includes('Error')}>
                <i class="fas fa-info-circle"></i>
                {resultadoTest}
              </div>
            {/if}
          </div>

          <!-- WIDGET PRINCIPAL DE GEOLOCALIZACIÓN RESUMIDO -->
          <div class="widget-geolocalizacion-resumido">
            <GeolocalizacionUsuarios />
          </div>
        </div>

        <!-- WIDGETS DE VISTA RÁPIDA -->
        <div class="widgets-vista-rapida">
          <div class="widget-rapido alertas">
            <h4>🚨 Alertas Recientes</h4>
            <div class="contenido-rapido">
              <p>Las alertas de seguridad aparecerán aquí</p>
              <button class="btn-ver-mas" on:click={() => vistaActiva = 'alertas'}>
                Ver Todas las Alertas →
              </button>
            </div>
          </div>

          <div class="widget-rapido analytics">
            <h4>📊 Stats Rápidas</h4>
            <div class="contenido-rapido">
              <div class="mini-stats">
                <div class="mini-stat">
                  <span class="numero">{estadisticasGenerales.paisesDetectados}</span>
                  <span class="etiqueta">Países</span>
                </div>
                <div class="mini-stat">
                  <span class="numero">{estadisticasGenerales.usuariosConUbicacion}</span>
                  <span class="etiqueta">Usuarios</span>
                </div>
              </div>
              <button class="btn-ver-mas" on:click={() => vistaActiva = 'analytics'}>
                Ver Analytics Completos →
              </button>
            </div>
          </div>
        </div>
      </div>

    {:else if vistaActiva === 'alertas'}
      <!-- VISTA ALERTAS DE SEGURIDAD -->
      <div class="vista-alertas">
        <AlertasSeguridadGeografica />
      </div>

    {:else if vistaActiva === 'analytics'}
      <!-- VISTA ANALYTICS GEOGRÁFICOS -->
      <div class="vista-analytics">
        <AnalyticsGeograficos />
      </div>

    {:else if vistaActiva === 'usuarios'}
      <!-- VISTA GESTIÓN DE USUARIOS -->
      <div class="vista-usuarios">
        <GeolocalizacionUsuarios />
      </div>
    {/if}
  </div>
</div>

<style>
  .pestana-geolocalizacion {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
  }

  .header-geolocalizacion {
    background: #1a202c !important;
    color: white !important;
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-bottom: 4px solid #2d3748;
  }

  .titulo-principal h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 900;
    color: #ffffff !important;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .titulo-principal p {
    margin: 0;
    font-size: 1rem;
    color: #e2e8f0 !important;
    font-weight: 600;
  }

  .stats-rapidas {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .stat-item {
    text-align: center;
    min-width: 120px;
    background: #ffffff !important;
    padding: 1.5rem;
    border-radius: 12px;
    border: 3px solid #2d3748 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .stat-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    border-color: #4a5568 !important;
  }

  .stat-valor {
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 0.5rem;
    color: #1a202c !important;
    text-shadow: none;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #2d3748 !important;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .stat-item.ubicaciones-hoy.activo {
    background: #38a169 !important;
    border-color: #2f855a !important;
    color: white !important;
  }

  .stat-item.ubicaciones-hoy.activo .stat-valor {
    color: #ffffff !important;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .stat-item.ubicaciones-hoy.activo .stat-label {
    color: #f0fff4 !important;
  }

  .tabs-navegacion {
    display: flex;
    background: #f7fafc;
    border-bottom: 3px solid #cbd5e1;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .tab-btn {
    padding: 1.5rem 2rem;
    border: none;
    background: transparent;
    color: #2d3748 !important;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    white-space: nowrap;
    border-bottom: 4px solid transparent;
    font-size: 1rem;
  }

  .tab-btn:hover {
    color: #1a202c !important;
    background: #edf2f7 !important;
    transform: translateY(-1px);
  }

  .tab-btn.activo {
    color: #1a202c !important;
    border-bottom-color: #3182ce !important;
    background: #edf2f7 !important;
    font-weight: 800;
  }

  .tab-btn i {
    font-size: 1.2rem;
    color: #3182ce !important;
  }

  .contenido-pestana {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    background: #f8fafc !important;
    min-height: 600px;
  }

  .vista-overview {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .grid-overview {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }

  .panel-pruebas {
    background: #ffffff !important;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    height: fit-content;
    border: 2px solid #e2e8f0 !important;
  }

  .panel-pruebas h3 {
    margin: 0 0 1rem 0;
    color: #1a202c !important;
    font-size: 1.5rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .panel-pruebas p {
    margin: 0 0 2rem 0;
    color: #4a5568 !important;
    font-size: 1rem;
    line-height: 1.6;
    font-weight: 500;
  }

  .acciones-prueba {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .btn-accion {
    padding: 1.25rem 2rem;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-accion.principal {
    background: #3182ce !important;
    color: #ffffff !important;
    border: 2px solid #2c5282 !important;
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }

  .btn-accion.principal:hover:not(:disabled) {
    background: #2c5282 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(49, 130, 206, 0.4);
  }

  .btn-accion.principal:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-accion.secundario {
    background: #e2e8f0 !important;
    color: #1a202c !important;
    border: 2px solid #cbd5e1 !important;
  }

  .btn-accion.secundario:hover {
    background: #cbd5e1 !important;
    transform: translateY(-1px);
    color: #000000 !important;
  }

  .resultado-prueba {
    background: #f7fafc !important;
    border: 3px solid #cbd5e1 !important;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748 !important;
  }

  .resultado-prueba.exito {
    background: #f0fff4 !important;
    border-color: #38a169 !important;
    color: #22543d !important;
  }

  .resultado-prueba.exito i {
    color: #38a169 !important;
    font-size: 1.5rem;
  }

  .resultado-prueba.error {
    background: #fff5f5 !important;
    border-color: #e53e3e !important;
    color: #742a2a !important;
  }

  .resultado-prueba.error i {
    color: #e53e3e !important;
    font-size: 1.5rem;
  }

  .widget-geolocalizacion-resumido {
    background: #ffffff !important;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border: 2px solid #e2e8f0 !important;
  }

  .widgets-vista-rapida {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }

  .widget-rapido {
    background: #ffffff !important;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border: 2px solid #e2e8f0 !important;
    transition: all 0.3s ease;
  }

  .widget-rapido:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    border-color: #3182ce !important;
  }

  .widget-rapido h4 {
    margin: 0 0 1.5rem 0;
    color: #1a202c !important;
    font-size: 1.3rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .contenido-rapido {
    color: #4a5568 !important;
    font-size: 1rem;
    line-height: 1.6;
    font-weight: 500;
  }

  .mini-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    justify-content: center;
  }

  .mini-stat {
    text-align: center;
    padding: 1.5rem;
    background: #edf2f7 !important;
    border-radius: 12px;
    border: 2px solid #cbd5e1 !important;
    min-width: 100px;
  }

  .mini-stat .numero {
    display: block;
    font-size: 2rem;
    font-weight: 900;
    color: #1a202c !important;
  }

  .mini-stat .etiqueta {
    font-size: 0.85rem;
    color: #2d3748 !important;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-ver-mas {
    background: #3182ce !important;
    border: none;
    color: #ffffff !important;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 1rem 2rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-ver-mas:hover {
    background: #2c5282 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }

  .vista-alertas, .vista-analytics, .vista-usuarios {
    height: 100%;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.02);
    }
  }

  .stat-item.ubicaciones-hoy.activo {
    animation: pulse 2s infinite;
  }

  @media (max-width: 1024px) {
    .grid-overview {
      grid-template-columns: 1fr;
    }

    .header-geolocalizacion {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      padding: 2rem 1.5rem;
    }

    .stats-rapidas {
      justify-content: center;
      gap: 1rem;
    }

    .stat-item {
      min-width: 100px;
      padding: 1.25rem;
    }

    .stat-valor {
      font-size: 2rem;
    }
  }

  @media (max-width: 768px) {
    .contenido-pestana {
      padding: 1rem;
    }

    .header-geolocalizacion {
      padding: 1.5rem 1rem;
    }

    .stats-rapidas {
      gap: 0.75rem;
    }

    .widgets-vista-rapida {
      grid-template-columns: 1fr;
    }

    .mini-stats {
      gap: 1rem;
    }

    .tab-btn {
      padding: 1rem 1.5rem;
      font-size: 0.9rem;
    }

    .panel-pruebas {
      padding: 2rem;
    }

    .widget-rapido {
      padding: 2rem;
    }
  }
</style> 