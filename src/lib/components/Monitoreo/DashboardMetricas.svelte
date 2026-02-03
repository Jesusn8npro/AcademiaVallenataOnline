<!-- ✅ FASE 5: DASHBOARD DE MÉTRICAS EN TIEMPO REAL -->
<!-- Componente para visualizar métricas de estabilidad de la aplicación -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    obtenerMetricasMonitoreo, 
    obtenerAlertasMonitoreo, 
    verificarSaludMonitoreo,
    obtenerEstadoMonitoreo 
  } from '$lib/utils/monitoreoRealTime';

  // ✅ ESTADOS DEL COMPONENTE
  let metricas: any = {};
  let alertas: any[] = [];
  let salud: any = { salud: 'excelente', problemas: [], recomendaciones: [] };
  let estado: any = {};
  let visible = false;
  let intervalo: NodeJS.Timeout;

  // ✅ FUNCIONES DE ACTUALIZACIÓN
  const actualizarMetricas = () => {
    if (browser) {
      metricas = obtenerMetricasMonitoreo();
      alertas = obtenerAlertasMonitoreo();
      salud = verificarSaludMonitoreo();
      estado = obtenerEstadoMonitoreo();
    }
  };

  // ✅ FUNCIONES DE UTILIDAD
  const formatearBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatearTiempo = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const obtenerColorSalud = (salud: string): string => {
    switch (salud) {
      case 'excelente': return '#10b981';
      case 'buena': return '#3b82f6';
      case 'regular': return '#f59e0b';
      case 'mala': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const obtenerIconoSalud = (salud: string): string => {
    switch (salud) {
      case 'excelente': return '✅';
      case 'buena': return '🟢';
      case 'regular': return '🟡';
      case 'mala': return '🔴';
      default: return '❓';
    }
  };

  const obtenerTipoAlerta = (tipo: string): string => {
    switch (tipo) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  // ✅ CICLO DE VIDA
  onMount(() => {
    if (browser) {
      // ✅ SOLUCIÓN: Actualizar métricas cada 2 segundos
      intervalo = setInterval(actualizarMetricas, 2000);
      actualizarMetricas();
    }
  });

  onDestroy(() => {
    if (intervalo) {
      clearInterval(intervalo);
    }
  });

  // ✅ TOGGLE VISIBILIDAD
  const toggleVisible = () => {
    visible = !visible;
  };
</script>

<!-- ✅ TEMPLATE DEL DASHBOARD -->
<div class="dashboard-metricas" class:visible={visible}>
  
  <!-- ✅ BOTÓN TOGGLE -->
  <button 
    class="toggle-btn" 
    on:click={toggleVisible}
    title="Mostrar/Ocultar Dashboard de Métricas"
  >
    📊
  </button>

  <!-- ✅ PANEL PRINCIPAL -->
  {#if visible}
    <div class="dashboard-panel">
      
      <!-- ✅ HEADER -->
      <div class="dashboard-header">
        <h3>📊 Dashboard de Métricas</h3>
        <button class="close-btn" on:click={toggleVisible}>✕</button>
      </div>

      <!-- ✅ ESTADO GENERAL -->
      <div class="estado-general">
        <div class="salud-indicator" style="--color: {obtenerColorSalud(salud.salud)}">
          <span class="icono">{obtenerIconoSalud(salud.salud)}</span>
          <span class="texto">Salud: {salud.salud.toUpperCase()}</span>
        </div>
        
        {#if salud.problemas.length > 0}
          <div class="problemas">
            <h4>⚠️ Problemas Detectados:</h4>
            <ul>
              {#each salud.problemas as problema}
                <li>{problema}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if salud.recomendaciones.length > 0}
          <div class="recomendaciones">
            <h4>💡 Recomendaciones:</h4>
            <ul>
              {#each salud.recomendaciones as recomendacion}
                <li>{recomendacion}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- ✅ MÉTRICAS DE RENDIMIENTO -->
      {#if metricas.tiempoCarga}
        <div class="metricas-seccion">
          <h4>⚡ Tiempo de Carga</h4>
          <div class="metricas-grid">
            <div class="metrica">
              <span class="label">DNS:</span>
              <span class="valor">{formatearTiempo(metricas.tiempoCarga.dns)}</span>
            </div>
            <div class="metrica">
              <span class="label">TCP:</span>
              <span class="valor">{formatearTiempo(metricas.tiempoCarga.tcp)}</span>
            </div>
            <div class="metrica">
              <span class="label">TTFB:</span>
              <span class="valor">{formatearTiempo(metricas.tiempoCarga.ttfb)}</span>
            </div>
            <div class="metrica">
              <span class="label">DOM:</span>
              <span class="valor">{formatearTiempo(metricas.tiempoCarga.dom)}</span>
            </div>
            <div class="metrica">
              <span class="label">Carga:</span>
              <span class="valor">{formatearTiempo(metricas.tiempoCarga.carga)}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- ✅ MÉTRICAS DE MEMORIA -->
      {#if metricas.memoria}
        <div class="metricas-seccion">
          <h4>🧠 Memoria</h4>
          <div class="metricas-grid">
            <div class="metrica">
              <span class="label">Usado:</span>
              <span class="valor">{formatearBytes(metricas.memoria.usado)}</span>
            </div>
            <div class="metrica">
              <span class="label">Total:</span>
              <span class="valor">{formatearBytes(metricas.memoria.total)}</span>
            </div>
            <div class="metrica">
              <span class="label">Límite:</span>
              <span class="valor">{formatearBytes(metricas.memoria.limite)}</span>
            </div>
            <div class="metrica">
              <span class="label">Porcentaje:</span>
              <span class="valor" class:critico={metricas.memoria.porcentaje > 80}>
                {metricas.memoria.porcentaje.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <!-- ✅ BARRA DE PROGRESO DE MEMORIA -->
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              style="width: {metricas.memoria.porcentaje}%; background-color: {metricas.memoria.porcentaje > 80 ? '#ef4444' : metricas.memoria.porcentaje > 60 ? '#f59e0b' : '#10b981'}"
            ></div>
          </div>
        </div>
      {/if}

      <!-- ✅ MÉTRICAS DE RED -->
      {#if metricas.red}
        <div class="metricas-seccion">
          <h4>🌐 Red</h4>
          <div class="metricas-grid">
            <div class="metrica">
              <span class="label">Tipo:</span>
              <span class="valor">{metricas.red.tipo}</span>
            </div>
            <div class="metrica">
              <span class="label">Velocidad:</span>
              <span class="valor">{metricas.red.velocidad} Mbps</span>
            </div>
            <div class="metrica">
              <span class="label">RTT:</span>
              <span class="valor">{metricas.red.rtt}ms</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- ✅ MÉTRICAS DE INTERACCIONES -->
      {#if metricas.interacciones}
        <div class="metricas-seccion">
          <h4>👆 Interacciones</h4>
          <div class="metricas-grid">
            <div class="metrica">
              <span class="label">Total:</span>
              <span class="valor">{metricas.interacciones.total}</span>
            </div>
            <div class="metrica">
              <span class="label">Última:</span>
              <span class="valor">{formatearTiempo(metricas.interacciones.inactividad)}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- ✅ ALERTAS ACTIVAS -->
      {#if alertas.length > 0}
        <div class="metricas-seccion">
          <h4>🚨 Alertas Activas ({alertas.length})</h4>
          <div class="alertas-lista">
            {#each alertas as alerta}
              <div class="alerta" class:tipo-warning={alerta.tipo === 'warning'} class:tipo-info={alerta.tipo === 'info'} class:tipo-error={alerta.tipo === 'error'}>
                <span class="icono">{obtenerTipoAlerta(alerta.tipo)}</span>
                <div class="contenido">
                  <div class="mensaje">{alerta.mensaje}</div>
                  {#if alerta.datos}
                    <div class="datos">
                      {#each Object.entries(alerta.datos) as [key, value]}
                        <span class="dato">{key}: {value}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
                <div class="timestamp">
                  {new Date(alerta.timestamp).toLocaleTimeString()}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- ✅ ESTADÍSTICAS DEL SISTEMA -->
      <div class="metricas-seccion">
        <h4>📈 Estadísticas del Sistema</h4>
        <div class="metricas-grid">
          <div class="metrica">
            <span class="label">Métricas:</span>
            <span class="valor">{estado.estadisticas?.metricas || 0}</span>
          </div>
          <div class="metrica">
            <span class="label">Alertas:</span>
            <span class="valor">{estado.estadisticas?.alertas || 0}</span>
          </div>
          <div class="metrica">
            <span class="label">Logs:</span>
            <span class="valor">{estado.estadisticas?.logs || 0}</span>
          </div>
          <div class="metrica">
            <span class="label">Intervalos:</span>
            <span class="valor">{estado.estadisticas?.intervalos || 0}</span>
          </div>
        </div>
      </div>

      <!-- ✅ FOOTER -->
      <div class="dashboard-footer">
        <small>Última actualización: {new Date().toLocaleTimeString()}</small>
      </div>

    </div>
  {/if}

</div>

<!-- ✅ ESTILOS CSS -->
<style>
  .dashboard-metricas {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .toggle-btn {
    position: absolute;
    top: 0;
    right: 0;
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .dashboard-panel {
    position: absolute;
    top: 60px;
    right: 0;
    width: 400px;
    max-height: 80vh;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    color: white;
    font-size: 14px;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .dashboard-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(148, 163, 184, 0.1);
    color: white;
  }

  .estado-general {
    padding: 20px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .salud-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 4px solid var(--color);
  }

  .salud-indicator .icono {
    font-size: 20px;
  }

  .salud-indicator .texto {
    font-weight: 600;
    font-size: 16px;
  }

  .problemas, .recomendaciones {
    margin-top: 15px;
  }

  .problemas h4, .recomendaciones h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .problemas ul, .recomendaciones ul {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #cbd5e1;
  }

  .problemas li, .recomendaciones li {
    margin-bottom: 5px;
  }

  .metricas-seccion {
    padding: 20px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .metricas-seccion h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .metricas-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .metrica {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
  }

  .metrica .label {
    color: #94a3b8;
    font-size: 13px;
  }

  .metrica .valor {
    font-weight: 600;
    color: #e2e8f0;
  }

  .metrica .valor.critico {
    color: #ef4444;
    font-weight: 700;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(148, 163, 184, 0.2);
    border-radius: 4px;
    margin-top: 15px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .alertas-lista {
    max-height: 200px;
    overflow-y: auto;
  }

  .alerta {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    margin-bottom: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 4px solid #ef4444;
  }

  .alerta.tipo-warning {
    border-left-color: #f59e0b;
  }

  .alerta.tipo-info {
    border-left-color: #3b82f6;
  }

  .alerta.tipo-error {
    border-left-color: #ef4444;
  }

  .alerta .icono {
    font-size: 16px;
    margin-top: 2px;
  }

  .alerta .contenido {
    flex: 1;
  }

  .alerta .mensaje {
    font-weight: 600;
    margin-bottom: 5px;
  }

  .alerta .datos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .alerta .dato {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #cbd5e1;
  }

  .alerta .timestamp {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
  }

  .dashboard-footer {
    padding: 15px 20px;
    text-align: center;
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  }

  .dashboard-footer small {
    color: #64748b;
    font-size: 12px;
  }

  /* ✅ RESPONSIVE */
  @media (max-width: 768px) {
    .dashboard-panel {
      width: 350px;
      right: -20px;
    }
    
    .metricas-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .dashboard-panel {
      width: 300px;
      right: -40px;
    }
  }
</style> 