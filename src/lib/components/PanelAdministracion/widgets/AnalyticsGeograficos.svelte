<!-- 📊 WIDGET DE ANALYTICS GEOGRÁFICOS -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { seguridadGeoService } from '$lib/services/seguridadGeograficaService';

  interface AnalyticsData {
    total_paises: number;
    total_ciudades: number;
    distribucion_por_pais: { pais: string; usuarios: number; porcentaje: number }[];
    ubicaciones_activas_simultaneas: number;
    alertas_seguridad_hoy: number;
    conexiones_sospechosas: number;
    patrones_horarios: { zona_horaria: string; usuarios_activos: number }[];
  }

  let analytics: AnalyticsData = {
    total_paises: 0,
    total_ciudades: 0,
    distribucion_por_pais: [],
    ubicaciones_activas_simultaneas: 0,
    alertas_seguridad_hoy: 0,
    conexiones_sospechosas: 0,
    patrones_horarios: []
  };
  let cargando = true;
  let ultimaActualizacion: Date | null = null;
  let datosMapaMundial: any[] = [];

  onMount(() => {
    cargarAnalytics();
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  });

  async function cargarAnalytics() {
    try {
      cargando = true;
      console.log('📊 [ANALYTICS-GEO] Cargando analytics geográficos...');

      const [analyticsData, datosMapa] = await Promise.all([
        seguridadGeoService.obtenerAnalyticsGeograficos(),
        seguridadGeoService.obtenerDatosMapaMundial()
      ]);

      analytics = analyticsData;
      datosMapaMundial = datosMapa;
      ultimaActualizacion = new Date();

      console.log('✅ [ANALYTICS-GEO] Analytics cargados exitosamente');
    } catch (error) {
      console.error('❌ [ANALYTICS-GEO] Error cargando analytics:', error);
    } finally {
      cargando = false;
    }
  }

  function obtenerColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 50) return '#dc2626'; // Rojo para dominante
    if (porcentaje >= 20) return '#ea580c'; // Naranja para alto
    if (porcentaje >= 10) return '#d97706'; // Amarillo para medio
    return '#16a34a'; // Verde para bajo
  }

  function formatearZonaHoraria(zona: string): string {
    return zona.replace('_', ' ').replace('/', ' / ');
  }

  function obtenerEmojiBandera(pais: string): string {
    const banderas: { [key: string]: string } = {
      'Colombia': '🇨🇴',
      'México': '🇲🇽',
      'Argentina': '🇦🇷',
      'España': '🇪🇸',
      'Estados Unidos': '🇺🇸',
      'Brasil': '🇧🇷',
      'Perú': '🇵🇪',
      'Chile': '🇨🇱',
      'Venezuela': '🇻🇪',
      'Ecuador': '🇪🇨'
    };
    return banderas[pais] || '🌍';
  }
</script>

<div class="analytics-geograficos-widget">
  <!-- ENCABEZADO -->
  <div class="widget-header">
    <div class="titulo-seccion">
      <h3>📊 Analytics Geográficos</h3>
      <p>Distribución global de usuarios en tiempo real</p>
    </div>
    
    <div class="controles">
      <button class="btn-actualizar" on:click={cargarAnalytics} disabled={cargando}>
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
  <div class="analytics-contenido">
    {#if cargando}
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Analizando distribución geográfica...</p>
      </div>
    {:else}
      <!-- MÉTRICAS PRINCIPALES -->
      <div class="metricas-principales">
        <div class="metrica-card">
          <div class="metrica-icon">🌍</div>
          <div class="metrica-info">
            <div class="metrica-valor">{analytics.total_paises}</div>
            <div class="metrica-label">Países</div>
          </div>
        </div>

        <div class="metrica-card">
          <div class="metrica-icon">🏙️</div>
          <div class="metrica-info">
            <div class="metrica-valor">{analytics.total_ciudades}</div>
            <div class="metrica-label">Ciudades</div>
          </div>
        </div>

        <div class="metrica-card">
          <div class="metrica-icon">👥</div>
          <div class="metrica-info">
            <div class="metrica-valor">{analytics.ubicaciones_activas_simultaneas}</div>
            <div class="metrica-label">Usuarios Activos</div>
          </div>
        </div>

        <div class="metrica-card alerta" class:activo={analytics.alertas_seguridad_hoy > 0}>
          <div class="metrica-icon">🚨</div>
          <div class="metrica-info">
            <div class="metrica-valor">{analytics.alertas_seguridad_hoy}</div>
            <div class="metrica-label">Alertas Hoy</div>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- DISTRIBUCIÓN POR PAÍSES -->
        <div class="seccion-analytics">
          <h4>🌍 Distribución por Países</h4>
          {#if analytics.distribucion_por_pais.length > 0}
            <div class="paises-lista">
              {#each analytics.distribucion_por_pais as pais}
                <div class="pais-item">
                  <div class="pais-info">
                    <span class="bandera">{obtenerEmojiBandera(pais.pais)}</span>
                    <span class="nombre-pais">{pais.pais}</span>
                  </div>
                  <div class="pais-estadisticas">
                    <div class="barra-progreso">
                      <div 
                        class="progreso" 
                        style="width: {pais.porcentaje}%; background-color: {obtenerColorPorcentaje(pais.porcentaje)}"
                      ></div>
                    </div>
                    <div class="pais-numeros">
                      <span class="usuarios">{pais.usuarios} usuarios</span>
                      <span class="porcentaje" style="color: {obtenerColorPorcentaje(pais.porcentaje)}">
                        {pais.porcentaje}%
                      </span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="no-datos">
              <i class="fas fa-globe-americas"></i>
              <p>No hay datos de distribución por países</p>
            </div>
          {/if}
        </div>

        <!-- PATRONES HORARIOS -->
        <div class="seccion-analytics">
          <h4>⏰ Patrones por Zona Horaria</h4>
          {#if analytics.patrones_horarios.length > 0}
            <div class="zonas-lista">
              {#each analytics.patrones_horarios.slice(0, 8) as zona}
                <div class="zona-item">
                  <div class="zona-info">
                    <span class="zona-nombre">{formatearZonaHoraria(zona.zona_horaria)}</span>
                  </div>
                  <div class="zona-estadisticas">
                    <div class="usuarios-zona">
                      <i class="fas fa-users"></i>
                      <span>{zona.usuarios_activos} usuarios</span>
                    </div>
                    <div class="hora-local">
                      <i class="fas fa-clock"></i>
                      <span>Zona activa</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="no-datos">
              <i class="fas fa-clock"></i>
              <p>No hay datos de patrones horarios</p>
            </div>
          {/if}
        </div>

        <!-- MAPA VISUAL SIMPLE -->
        <div class="seccion-analytics mapa-seccion">
          <h4>🗺️ Ubicaciones Activas</h4>
          {#if datosMapaMundial.length > 0}
            <div class="mapa-simple">
              <div class="mapa-puntos">
                {#each datosMapaMundial.slice(0, 10) as ubicacion}
                  <div class="punto-mapa">
                    <div class="punto-info">
                      <div class="punto-circulo" style="width: {Math.min(ubicacion.usuarios * 8 + 12, 32)}px; height: {Math.min(ubicacion.usuarios * 8 + 12, 32)}px;">
                        <span class="punto-numero">{ubicacion.usuarios}</span>
                      </div>
                      <div class="punto-detalles">
                        <strong>{ubicacion.ciudad}</strong>
                        <span>{ubicacion.pais}</span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
              <div class="mapa-leyenda">
                <div class="leyenda-item">
                  <div class="leyenda-circulo pequeno"></div>
                  <span>1-2 usuarios</span>
                </div>
                <div class="leyenda-item">
                  <div class="leyenda-circulo mediano"></div>
                  <span>3-5 usuarios</span>
                </div>
                <div class="leyenda-item">
                  <div class="leyenda-circulo grande"></div>
                  <span>6+ usuarios</span>
                </div>
              </div>
            </div>
          {:else}
            <div class="no-datos">
              <i class="fas fa-map"></i>
              <p>No hay ubicaciones activas para mostrar</p>
            </div>
          {/if}
        </div>

        <!-- RESUMEN DE SEGURIDAD -->
        <div class="seccion-analytics seguridad-resumen">
          <h4>🛡️ Resumen de Seguridad</h4>
          <div class="seguridad-metricas">
            <div class="seguridad-item">
              <div class="seguridad-icon" class:alerta={analytics.alertas_seguridad_hoy > 0}>
                <i class="fas fa-shield-alt"></i>
              </div>
              <div class="seguridad-info">
                <div class="seguridad-valor">{analytics.alertas_seguridad_hoy}</div>
                <div class="seguridad-label">Alertas Hoy</div>
              </div>
            </div>

            <div class="seguridad-item">
              <div class="seguridad-icon" class:alerta={analytics.conexiones_sospechosas > 0}>
                <i class="fas fa-server"></i>
              </div>
              <div class="seguridad-info">
                <div class="seguridad-valor">{analytics.conexiones_sospechosas}</div>
                <div class="seguridad-label">Conexiones Sospechosas</div>
              </div>
            </div>

            <div class="seguridad-item">
              <div class="seguridad-icon bueno">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="seguridad-info">
                <div class="seguridad-valor">
                  {analytics.ubicaciones_activas_simultaneas - analytics.conexiones_sospechosas}
                </div>
                <div class="seguridad-label">Conexiones Seguras</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .analytics-geograficos-widget {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .widget-header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .titulo-seccion h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
  }

  .titulo-seccion p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.875rem;
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

  .analytics-contenido {
    padding: 1.5rem;
  }

  .loading-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .loading-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #d1d5db;
  }

  .metricas-principales {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metrica-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s;
  }

  .metrica-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .metrica-card.alerta.activo {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .metrica-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .metrica-valor {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
  }

  .metrica-label {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }

  .seccion-analytics {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .seccion-analytics h4 {
    margin: 0 0 1.5rem 0;
    color: #374151;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .paises-lista, .zonas-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pais-item, .zona-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
  }

  .pais-info, .zona-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .bandera {
    font-size: 1.5rem;
  }

  .nombre-pais, .zona-nombre {
    font-weight: 600;
    color: #1f2937;
  }

  .barra-progreso {
    background: #e5e7eb;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progreso {
    height: 100%;
    transition: width 0.3s ease;
  }

  .pais-numeros {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .zona-estadisticas {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .usuarios-zona, .hora-local {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .mapa-simple {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
  }

  .mapa-puntos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .punto-mapa {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .punto-circulo {
    background: #3b82f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
    min-width: 20px;
    min-height: 20px;
  }

  .punto-detalles strong {
    display: block;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .punto-detalles span {
    color: #6b7280;
    font-size: 0.75rem;
  }

  .mapa-leyenda {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .leyenda-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .leyenda-circulo {
    border-radius: 50%;
    background: #3b82f6;
  }

  .leyenda-circulo.pequeno { width: 12px; height: 12px; }
  .leyenda-circulo.mediano { width: 16px; height: 16px; }
  .leyenda-circulo.grande { width: 24px; height: 24px; }

  .seguridad-metricas {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .seguridad-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .seguridad-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #6b7280;
  }

  .seguridad-icon.alerta {
    background: #fef2f2;
    color: #dc2626;
  }

  .seguridad-icon.bueno {
    background: #f0fdf4;
    color: #16a34a;
  }

  .seguridad-valor {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }

  .seguridad-label {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .no-datos {
    text-align: center;
    padding: 2rem 1rem;
    color: #6b7280;
  }

  .no-datos i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #d1d5db;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .analytics-grid {
      grid-template-columns: 1fr;
    }

    .metricas-principales {
      grid-template-columns: repeat(2, 1fr);
    }

    .widget-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
  }
</style> 