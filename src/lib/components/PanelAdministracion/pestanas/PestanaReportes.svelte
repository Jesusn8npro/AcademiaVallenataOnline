<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import AnalyticsPaginasVisitadas from '$lib/components/PanelAdministracion/widgets/AnalyticsPaginasVisitadas.svelte';

  interface ReporteMetricas {
    crecimientoUsuarios: number;
    tasaCompletitud: number;
    ingresosPotenciales: number;
    cursosPopulares: string;
    retenciionPromedio: number;
    satisfaccionGeneral: number;
  }

  let reporteMetricas: ReporteMetricas = {
    crecimientoUsuarios: 0,
    tasaCompletitud: 0,
    ingresosPotenciales: 0,
    cursosPopulares: '',
    retenciionPromedio: 0,
    satisfaccionGeneral: 0
  };

  let reportesSemana: any[] = [];
  let cargandoReporte = false;
  let periodoSeleccionado = '7d';

  onMount(() => {
    cargarReportes();
  });

  async function cargarReportes() {
    try {
      cargandoReporte = true;
      console.log('📊 [REPORTES] Generando análisis...');

      await Promise.all([
        calcularMetricasNegocio(),
        generarReporteSemanal()
      ]);

    } catch (error) {
      console.error('❌ [REPORTES] Error:', error);
    } finally {
      cargandoReporte = false;
    }
  }

  async function calcularMetricasNegocio() {
    try {
      console.log('📊 [REPORTES] Calculando métricas reales...');
      
      // Crecimiento de usuarios (últimos 30 días vs anterior)
      const hoy = new Date();
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
      const hace60Dias = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [{ count: usuariosUltimos30 }, { count: usuariosAnteriores30 }] = await Promise.all([
        supabase
          .from('perfiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', hace30Dias.toISOString())
          .eq('eliminado', false),
        supabase
          .from('perfiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', hace60Dias.toISOString())
          .lt('created_at', hace30Dias.toISOString())
          .eq('eliminado', false)
      ]);

      const crecimientoUsuarios = usuariosAnteriores30 > 0 
        ? Math.round(((usuariosUltimos30 - usuariosAnteriores30) / usuariosAnteriores30) * 100)
        : 0;

    // Tasa de completitud de cursos
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('completado');

    const tasaCompletitud = inscripciones && inscripciones.length > 0
      ? Math.round((inscripciones.filter(i => i.completado).length / inscripciones.length) * 100)
      : 0;

    // Curso más popular
    const { data: cursosPopularesData } = await supabase
      .from('inscripciones')
      .select(`
        paquete_id,
        paquetes_tutoriales(titulo)
      `)
      .limit(100);

    let cursosPopulares = 'N/A';
    if (cursosPopularesData && cursosPopularesData.length > 0) {
      const conteo: { [key: string]: number } = {};
      cursosPopularesData.forEach(i => {
        const titulo = i.paquetes_tutoriales?.titulo || 'Sin título';
        conteo[titulo] = (conteo[titulo] || 0) + 1;
      });
      
      const masPopular = Object.entries(conteo).sort(([,a], [,b]) => b - a)[0];
      cursosPopulares = masPopular ? masPopular[0] : 'N/A';
    }

    // Retención promedio (usuarios activos últimos 30 días / total)
    const { count: totalUsuarios } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .eq('eliminado', false);

    const { count: activosUltimos30 } = await supabase
      .from('sesiones_usuario')
      .select('usuario_id', { count: 'exact', head: true })
      .gte('ultima_actividad', hace30Dias.toISOString());

    const retenciionPromedio = totalUsuarios > 0 
      ? Math.round((activosUltimos30 / totalUsuarios) * 100)
      : 0;

    reporteMetricas = {
      crecimientoUsuarios,
      tasaCompletitud,
      ingresosPotenciales: usuariosUltimos30 * 50, // Estimación
      cursosPopulares,
      retenciionPromedio,
      satisfaccionGeneral: 85 // Placeholder
    };

    console.log('✅ [REPORTES] Métricas calculadas:', reporteMetricas);

    } catch (error) {
      console.error('❌ [REPORTES] Error calculando métricas:', error);
      // Valores por defecto en caso de error
      reporteMetricas = {
        crecimientoUsuarios: 0,
        tasaCompletitud: 0,
        ingresosPotenciales: 0,
        cursosPopulares: 'N/A',
        retenciionPromedio: 0,
        satisfaccionGeneral: 85
      };
    }
  }

  async function generarReporteSemanal() {
    const ultimosSieteDias = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Usuarios activos del día
      const { count: usuariosActivos } = await supabase
        .from('sesiones_usuario')
        .select('usuario_id', { count: 'exact', head: true })
        .eq('fecha', fechaStr);

      // Nuevos registros del día
      const inicioDelDia = fechaStr + 'T00:00:00.000Z';
      const finDelDia = fechaStr + 'T23:59:59.999Z';
      
      const { count: nuevosRegistros } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioDelDia)
        .lte('created_at', finDelDia)
        .eq('eliminado', false);

      // Tiempo promedio de sesión del día
      const { data: sesionesDelDia } = await supabase
        .from('sesiones_usuario')
        .select('tiempo_total_minutos')
        .eq('fecha', fechaStr)
        .not('tiempo_total_minutos', 'is', null);

      let tiempoPromedio = 0;
      if (sesionesDelDia && sesionesDelDia.length > 0) {
        const tiempoTotal = sesionesDelDia.reduce((sum, s) => sum + (s.tiempo_total_minutos || 0), 0);
        tiempoPromedio = Math.round(tiempoTotal / sesionesDelDia.length);
      }

      ultimosSieteDias.push({
        fecha: fechaStr,
        fechaFormateada: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
        usuariosActivos: usuariosActivos || 0,
        nuevosRegistros: nuevosRegistros || 0,
        tiempoPromedio,
        engagement: usuariosActivos > 0 ? Math.round((tiempoPromedio / 60) * 100) : 0
      });
    }

    reportesSemana = ultimosSieteDias;
  }

  function exportarReporteCSV() {
    const headers = ['Fecha', 'Usuarios Activos', 'Nuevos Registros', 'Tiempo Promedio (min)', 'Engagement Score'];
    const rows = reportesSemana.map(dia => [
      dia.fecha,
      dia.usuariosActivos,
      dia.nuevosRegistros,
      dia.tiempoPromedio,
      dia.engagement
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_academia_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('📊 [EXPORTAR] Reporte CSV generado');
  }

  function exportarReportePDF() {
    // Generar reporte en formato texto para PDF
    const reporte = `
REPORTE ACADEMIA VALLENATA ONLINE
Fecha: ${new Date().toLocaleDateString('es-ES')}

=== MÉTRICAS PRINCIPALES ===
• Crecimiento usuarios: ${reporteMetricas.crecimientoUsuarios}%
• Tasa completitud: ${reporteMetricas.tasaCompletitud}%
• Retención promedio: ${reporteMetricas.retenciionPromedio}%
• Curso más popular: ${reporteMetricas.cursosPopulares}

=== ACTIVIDAD SEMANAL ===
${reportesSemana.map(dia => 
  `${dia.fechaFormateada}: ${dia.usuariosActivos} usuarios activos, ${dia.nuevosRegistros} nuevos registros`
).join('\n')}

=== RECOMENDACIONES ===
• Enfocar marketing en días de menor actividad
• Promover curso más popular para aumentar retención
• Implementar estrategias para usuarios inactivos

Generado automáticamente por el Panel de Administración
    `;

    const blob = new Blob([reporte], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_completo_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('📊 [EXPORTAR] Reporte PDF/TXT generado');
  }

  function compartirReporteWhatsApp() {
    const resumen = `🎓 *Reporte Academia Vallenata Online*\n\n` +
      `📈 Crecimiento: ${reporteMetricas.crecimientoUsuarios}%\n` +
      `✅ Completitud: ${reporteMetricas.tasaCompletitud}%\n` +
      `👥 Retención: ${reporteMetricas.retenciionPromedio}%\n` +
      `🔥 Curso popular: ${reporteMetricas.cursosPopulares}\n\n` +
      `Usuarios activos hoy: ${reportesSemana[reportesSemana.length - 1]?.usuariosActivos || 0}`;

    const url = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
    window.open(url, '_blank');
  }

  function obtenerColorMetrica(valor: number, esPositivo: boolean = true): string {
    if (esPositivo) {
      if (valor > 20) return '#10b981'; // Verde
      if (valor > 0) return '#f59e0b';   // Amarillo
      return '#ef4444';                  // Rojo
    } else {
      if (valor < 10) return '#ef4444';  // Rojo
      if (valor < 30) return '#f59e0b';  // Amarillo
      return '#10b981';                  // Verde
    }
  }
</script>

<div class="pestaña-reportes">
  <div class="encabezado-pestaña">
    <h2>📊 Reportes & Analytics</h2>
    <p>Análisis profundo del rendimiento y métricas de negocio</p>
  </div>

  <!-- MÉTRICAS DE NEGOCIO -->
  <div class="metricas-negocio">
    <div class="metrica-negocio">
      <div class="metrica-icono">📈</div>
      <div class="metrica-info">
        <div class="metrica-numero" style="color: {obtenerColorMetrica(reporteMetricas.crecimientoUsuarios)}">
          {reporteMetricas.crecimientoUsuarios > 0 ? '+' : ''}{reporteMetricas.crecimientoUsuarios}%
        </div>
        <div class="metrica-label">Crecimiento Usuarios</div>
        <div class="metrica-periodo">Últimos 30 días</div>
      </div>
    </div>

    <div class="metrica-negocio">
      <div class="metrica-icono">✅</div>
      <div class="metrica-info">
        <div class="metrica-numero" style="color: {obtenerColorMetrica(reporteMetricas.tasaCompletitud, false)}">
          {reporteMetricas.tasaCompletitud}%
        </div>
        <div class="metrica-label">Tasa Completitud</div>
        <div class="metrica-periodo">Cursos finalizados</div>
      </div>
    </div>

    <div class="metrica-negocio">
      <div class="metrica-icono">💰</div>
      <div class="metrica-info">
        <div class="metrica-numero" style="color: #10b981">
          ${reporteMetricas.ingresosPotenciales.toLocaleString()}
        </div>
        <div class="metrica-label">Ingresos Potenciales</div>
        <div class="metrica-periodo">Estimación mensual</div>
      </div>
    </div>

    <div class="metrica-negocio">
      <div class="metrica-icono">🔄</div>
      <div class="metrica-info">
        <div class="metrica-numero" style="color: {obtenerColorMetrica(reporteMetricas.retenciionPromedio, false)}">
          {reporteMetricas.retenciionPromedio}%
        </div>
        <div class="metrica-label">Retención</div>
        <div class="metrica-periodo">Últimos 30 días</div>
      </div>
    </div>
  </div>

  <div class="contenido-reportes">
    <!-- ANALYTICS DE PÁGINAS VISITADAS -->
    <div class="seccion-analytics-paginas">
      <AnalyticsPaginasVisitadas />
    </div>

    <!-- REPORTE SEMANAL -->
    <div class="seccion-reporte-semanal">
      <div class="seccion-header">
        <h3>📅 Reporte Semanal</h3>
        <div class="acciones-reporte">
          <button class="btn-exportar csv" on:click={exportarReporteCSV}>
            <i class="fas fa-file-csv"></i>
            CSV
          </button>
          <button class="btn-exportar pdf" on:click={exportarReportePDF}>
            <i class="fas fa-file-pdf"></i>
            TXT
          </button>
          <button class="btn-exportar whatsapp" on:click={compartirReporteWhatsApp}>
            <i class="fab fa-whatsapp"></i>
            WhatsApp
          </button>
        </div>
      </div>

      {#if cargandoReporte}
        <div class="loading-reporte">
          <div class="spinner"></div>
          <p>Generando reporte...</p>
        </div>
      {:else}
        <div class="tabla-reporte">
          <div class="tabla-header-reporte">
            <div>Fecha</div>
            <div>Usuarios Activos</div>
            <div>Nuevos Registros</div>
            <div>Tiempo Promedio</div>
            <div>Engagement</div>
          </div>

          {#each reportesSemana as dia}
            <div class="tabla-fila-reporte">
              <div class="fecha-reporte">{dia.fechaFormateada}</div>
              <div class="usuarios-activos">
                <span class="badge-numero activos">{dia.usuariosActivos}</span>
              </div>
              <div class="nuevos-registros">
                <span class="badge-numero nuevos">{dia.nuevosRegistros}</span>
              </div>
              <div class="tiempo-promedio">{dia.tiempoPromedio}m</div>
              <div class="engagement-score">
                <div class="engagement-bar">
                  <div class="engagement-fill" style="width: {Math.min(dia.engagement, 100)}%"></div>
                </div>
                <span class="engagement-text">{dia.engagement}%</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- INSIGHTS Y RECOMENDACIONES -->
    <div class="seccion-insights">
      <h3>💡 Insights & Recomendaciones</h3>
      
      <div class="insights-lista">
        <div class="insight-item">
          <div class="insight-icono">🎯</div>
          <div class="insight-contenido">
            <div class="insight-titulo">Curso Más Popular</div>
            <div class="insight-descripcion">{reporteMetricas.cursosPopulares}</div>
            <div class="insight-accion">Promocionar cursos similares</div>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icono">⏰</div>
          <div class="insight-contenido">
            <div class="insight-titulo">Mejor Día de Actividad</div>
            <div class="insight-descripcion">
              {reportesSemana.reduce((mejor, actual) => 
                actual.usuariosActivos > mejor.usuariosActivos ? actual : mejor, 
                reportesSemana[0] || { fechaFormateada: 'N/A' }
              ).fechaFormateada}
            </div>
            <div class="insight-accion">Enfocar contenido nuevo en este día</div>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icono">📈</div>
          <div class="insight-contenido">
            <div class="insight-titulo">Oportunidad de Crecimiento</div>
            <div class="insight-descripcion">
              {reporteMetricas.crecimientoUsuarios > 0 ? 'Tendencia positiva' : 'Necesita atención'}
            </div>
            <div class="insight-accion">
              {reporteMetricas.crecimientoUsuarios > 0 
                ? 'Escalar estrategias actuales' 
                : 'Implementar campañas de marketing'}
            </div>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icono">🎓</div>
          <div class="insight-contenido">
            <div class="insight-titulo">Retención de Estudiantes</div>
            <div class="insight-descripcion">{reporteMetricas.retenciionPromedio}% estudiantes activos</div>
            <div class="insight-accion">
              {reporteMetricas.retenciionPromedio < 30 
                ? 'Implementar programa de re-engagement' 
                : 'Mantener estrategias actuales'}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .pestaña-reportes {
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

  /* MÉTRICAS DE NEGOCIO */
  .metricas-negocio {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .metrica-negocio {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    transition: transform 0.2s ease;
  }

  .metrica-negocio:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.08);
  }

  .metrica-negocio .metrica-icono {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .metrica-negocio .metrica-numero {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .metrica-negocio .metrica-label {
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .metrica-negocio .metrica-periodo {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  /* CONTENIDO */
  .contenido-reportes {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .seccion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .seccion-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .acciones-reporte {
    display: flex;
    gap: 0.5rem;
  }

  .btn-exportar {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .btn-exportar.csv:hover {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  .btn-exportar.pdf:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .btn-exportar.whatsapp:hover {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  /* TABLA REPORTE */
  .tabla-reporte {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tabla-header-reporte {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    font-weight: 600;
    color: white;
    font-size: 0.85rem;
  }

  .tabla-fila-reporte {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    align-items: center;
    transition: background 0.2s ease;
  }

  .tabla-fila-reporte:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .fecha-reporte {
    color: white;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .badge-numero {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
  }

  .badge-numero.activos {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .badge-numero.nuevos {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .tiempo-promedio {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
  }

  .engagement-score {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .engagement-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .engagement-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .engagement-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* INSIGHTS */
  .seccion-insights h3 {
    margin: 0 0 1.5rem 0;
    color: white;
    font-size: 1.1rem;
  }

  .insights-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .insight-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 1rem;
    transition: transform 0.2s ease;
  }

  .insight-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .insight-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .insight-titulo {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .insight-descripcion {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .insight-accion {
    color: #60a5fa;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .loading-reporte {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* RESPONSIVE */
  @media (max-width: 1200px) {
    .metricas-negocio {
      grid-template-columns: repeat(2, 1fr);
    }

    .contenido-reportes {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .metricas-negocio {
      grid-template-columns: 1fr;
    }

    .tabla-header-reporte, .tabla-fila-reporte {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .tabla-fila-reporte {
      padding: 1.5rem 1rem;
    }

    .seccion-header {
      flex-direction: column;
      gap: 1rem;
    }

    .acciones-reporte {
      justify-content: center;
    }
  }
</style> 