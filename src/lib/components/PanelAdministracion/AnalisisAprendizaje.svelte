<script lang="ts">
  export let metricas: any = null;

  // Obtener color según el valor de la métrica
  function obtenerColorPrecision(precision: number): string {
    if (precision >= 90) return '#10b981'; // Verde
    if (precision >= 75) return '#f59e0b'; // Amarillo
    if (precision >= 60) return '#3b82f6'; // Azul
    return '#ef4444'; // Rojo
  }

  // Formatear tiempo promedio
  function formatearTiempo(minutos: number): string {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return `${horas}h ${minutosRestantes}m`;
  }

  // Calcular progreso en barras
  function calcularProgreso(valor: number, maximo: number): number {
    return Math.min((valor / maximo) * 100, 100);
  }
</script>

<div class="contenedor-analisis">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <h3>📊 Análisis de Aprendizaje</h3>
    <p>Métricas de progreso y rendimiento del simulador</p>
  </div>

  {#if metricas}
    <!-- 📈 MÉTRICAS PRINCIPALES -->
    <div class="metricas-principales">
      
      <!-- 🎯 PRECISIÓN PROMEDIO -->
      <div class="metrica-card precision">
        <div class="metrica-header">
          <div class="icono-metrica">
            <i class="fas fa-bullseye"></i>
          </div>
          <div class="metrica-info">
            <div class="metrica-valor">{metricas.precisionPromedio}%</div>
            <div class="metrica-label">Precisión Promedio</div>
          </div>
        </div>
        <div class="barra-progreso">
          <div 
            class="progreso-fill" 
            style="width: {metricas.precisionPromedio}%; background-color: {obtenerColorPrecision(metricas.precisionPromedio)}"
          ></div>
        </div>
        <div class="metrica-descripcion">
          En el simulador de acordeón esta semana
        </div>
      </div>

      <!-- ⏱️ TIEMPO PROMEDIO -->
      <div class="metrica-card tiempo">
        <div class="metrica-header">
          <div class="icono-metrica">
            <i class="fas fa-clock"></i>
          </div>
          <div class="metrica-info">
            <div class="metrica-valor">{formatearTiempo(metricas.tiempoPromedioSesion)}</div>
            <div class="metrica-label">Tiempo por Sesión</div>
          </div>
        </div>
        <div class="indicador-tendencia positivo">
          <i class="fas fa-arrow-up"></i>
          <span>+12% vs semana anterior</span>
        </div>
        <div class="metrica-descripcion">
          Promedio de duración de práctica
        </div>
      </div>

      <!-- 🏆 LECCIONES COMPLETADAS -->
      <div class="metrica-card lecciones">
        <div class="metrica-header">
          <div class="icono-metrica">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="metrica-info">
            <div class="metrica-valor">{metricas.leccionesCompletadas}</div>
            <div class="metrica-label">Lecciones Completadas</div>
          </div>
        </div>
        <div class="progreso-circular">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="circle"
              stroke-dasharray="{calcularProgreso(metricas.leccionesCompletadas, 100)}, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
        <div class="metrica-descripcion">
          Este mes en la plataforma
        </div>
      </div>

    </div>

    <!-- 🎮 ESTADÍSTICAS DEL SIMULADOR -->
    <div class="seccion-simulador">
      <div class="titulo-subseccion">
        <i class="fas fa-gamepad"></i>
        <h4>Actividad en Simulador</h4>
      </div>

      <div class="grid-simulador">
        
        <!-- 🎵 SESIONES ESTA SEMANA -->
        <div class="stat-item">
          <div class="stat-numero">{metricas.sesionesSimuladorSemana}</div>
          <div class="stat-label">Sesiones esta semana</div>
          <div class="stat-progreso">
            <div class="progreso-bar" style="width: {Math.min((metricas.sesionesSimuladorSemana / 50) * 100, 100)}%"></div>
          </div>
        </div>

        <!-- 🏅 LOGROS DEL MES -->
        <div class="stat-item">
          <div class="stat-numero">{metricas.logrosDelMes}</div>
          <div class="stat-label">Logros conseguidos</div>
          <div class="stat-icono">
            <i class="fas fa-trophy"></i>
          </div>
        </div>

        <!-- 🎯 NOTA PROMEDIO -->
        <div class="stat-item">
          <div class="stat-numero">{metricas.precisionPromedio}%</div>
          <div class="stat-label">Precisión general</div>
          <div class="estado-badge" class:excelente={metricas.precisionPromedio >= 90} class:bueno={metricas.precisionPromedio >= 75} class:regular={metricas.precisionPromedio < 75}>
            {metricas.precisionPromedio >= 90 ? 'Excelente' : metricas.precisionPromedio >= 75 ? 'Bueno' : 'Regular'}
          </div>
        </div>

      </div>
    </div>

    <!-- 📊 ANÁLISIS SEMANAL -->
    <div class="analisis-semanal">
      <div class="titulo-subseccion">
        <i class="fas fa-chart-area"></i>
        <h4>Tendencias de la Semana</h4>
      </div>

      <div class="tendencias-grid">
        
        <div class="tendencia-item positiva">
          <div class="tendencia-icono">
            <i class="fas fa-arrow-trend-up"></i>
          </div>
          <div class="tendencia-contenido">
            <div class="tendencia-titulo">Sesiones de Práctica</div>
            <div class="tendencia-valor">+23%</div>
            <div class="tendencia-desc">Aumento vs semana anterior</div>
          </div>
        </div>

        <div class="tendencia-item neutra">
          <div class="tendencia-icono">
            <i class="fas fa-minus"></i>
          </div>
          <div class="tendencia-contenido">
            <div class="tendencia-titulo">Tiempo Promedio</div>
            <div class="tendencia-valor">Estable</div>
            <div class="tendencia-desc">Sin cambios significativos</div>
          </div>
        </div>

        <div class="tendencia-item positiva">
          <div class="tendencia-icono">
            <i class="fas fa-star"></i>
          </div>
          <div class="tendencia-contenido">
            <div class="tendencia-titulo">Precisión</div>
            <div class="tendencia-valor">+5%</div>
            <div class="tendencia-desc">Mejora continua</div>
          </div>
        </div>

      </div>
    </div>

  {:else}
    <!-- 😴 SIN DATOS -->
    <div class="sin-datos">
      <div class="icono-sin-datos">
        <i class="fas fa-chart-line"></i>
      </div>
      <h4>Cargando análisis...</h4>
      <p>Obteniendo métricas de aprendizaje</p>
    </div>
  {/if}

</div>

<style>
  /* 📊 CONTENEDOR PRINCIPAL */
  .contenedor-analisis {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    height: fit-content;
  }

  /* 🎯 ENCABEZADO */
  .encabezado-seccion {
    margin-bottom: 1.5rem;
  }

  .encabezado-seccion h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: white;
  }

  .encabezado-seccion p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.875rem;
  }

  /* 📈 MÉTRICAS PRINCIPALES */
  .metricas-principales {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metrica-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.3s ease;
  }

  .metrica-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .metrica-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .icono-metrica {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    color: white;
  }

  .precision .icono-metrica {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .tiempo .icono-metrica {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  .lecciones .icono-metrica {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }

  .metrica-info {
    flex: 1;
  }

  .metrica-valor {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .metrica-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.25rem;
  }

  .metrica-descripcion {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 0.5rem;
  }

  /* 📊 BARRA DE PROGRESO */
  .barra-progreso {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin: 0.5rem 0;
  }

  .progreso-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
  }

  /* 📈 INDICADOR DE TENDENCIA */
  .indicador-tendencia {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    margin: 0.5rem 0;
  }

  .indicador-tendencia.positivo {
    color: #10b981;
  }

  /* ⭕ PROGRESO CIRCULAR */
  .progreso-circular {
    width: 40px;
    height: 40px;
    margin-left: auto;
  }

  .circular-chart {
    display: block;
    margin: 0 auto;
    max-width: 40px;
    max-height: 40px;
  }

  .circle-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 2.8;
  }

  .circle {
    fill: none;
    stroke: #8b5cf6;
    stroke-width: 2.8;
    stroke-linecap: round;
    animation: progress 1s ease-out forwards;
  }

  @keyframes progress {
    0% { stroke-dasharray: 0 100; }
  }

  /* 🎮 SECCIÓN SIMULADOR */
  .seccion-simulador {
    margin-bottom: 2rem;
  }

  .titulo-subseccion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .titulo-subseccion h4 {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .titulo-subseccion i {
    color: #6366f1;
  }

  .grid-simulador {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .stat-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    position: relative;
  }

  .stat-numero {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.5rem;
  }

  .stat-progreso {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1.5px;
    overflow: hidden;
  }

  .progreso-bar {
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    transition: all 0.3s ease;
  }

  .stat-icono {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: rgba(255, 255, 255, 0.3);
    font-size: 1.25rem;
  }

  .estado-badge {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
    margin-top: 0.5rem;
    display: inline-block;
  }

  .estado-badge.excelente {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .estado-badge.bueno {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  .estado-badge.regular {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  /* 📊 ANÁLISIS SEMANAL */
  .analisis-semanal {
    margin-bottom: 1rem;
  }

  .tendencias-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .tendencia-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .tendencia-icono {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .tendencia-item.positiva .tendencia-icono {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .tendencia-item.neutra .tendencia-icono {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }

  .tendencia-contenido {
    flex: 1;
  }

  .tendencia-titulo {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.25rem;
  }

  .tendencia-valor {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.125rem;
  }

  .tendencia-desc {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.5);
  }

  /* 😴 SIN DATOS */
  .sin-datos {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-datos {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-datos h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .sin-datos p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .contenedor-analisis {
      padding: 1rem;
    }

    .metricas-principales {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .grid-simulador {
      grid-template-columns: 1fr;
    }

    .tendencias-grid {
      grid-template-columns: 1fr;
    }

    .metrica-valor {
      font-size: 1.25rem;
    }

    .stat-numero {
      font-size: 1.25rem;
    }
  }
</style> 