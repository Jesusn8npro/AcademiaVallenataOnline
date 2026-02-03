<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  
  interface PaginaEstadistica {
    pagina: string;
    nombreAmigable: string;
    visitas: number;
    tiempoPromedio: number;
    porcentaje: number;
    color: string;
    icono: string;
  }

  interface RutaNavegacion {
    desde: string;
    hacia: string;
    frecuencia: number;
    porcentaje: number;
  }

  let paginasVisitadas: PaginaEstadistica[] = [];
  let rutasNavegacion: RutaNavegacion[] = [];
  let cargando = false;
  let vistaActual: 'paginas' | 'rutas' | 'heatmap' = 'paginas';
  let periodoSeleccionado: '24h' | '7d' | '30d' = '7d';
  
  let estadisticas = {
    totalPageviews: 0,
    paginasUnicas: 0,
    tiempoPromedioSesion: 0,
    bounceRate: 0
  };

  let intervalId: NodeJS.Timeout | null = null;

  onMount(() => {
    cargarAnalytics();
    // Actualizar cada 5 minutos
    intervalId = setInterval(cargarAnalytics, 300000);
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  async function cargarAnalytics() {
    try {
      cargando = true;
      console.log('📊 [ANALYTICS] Cargando estadísticas de páginas...');
      
      await Promise.all([
        cargarPaginasVisitadas(),
        cargarRutasNavegacion(),
        cargarEstadisticasGenerales()
      ]);
      
    } catch (error) {
      console.error('❌ [ANALYTICS] Error:', error);
    } finally {
      cargando = false;
    }
  }

  async function cargarPaginasVisitadas() {
    const fechaInicio = obtenerFechaInicio();
    
    // Obtener eventos de actividad con detalles de página
    const { data: eventos } = await supabase
      .from('eventos_actividad')
      .select('pagina, tiempo_sesion, created_at')
      .gte('created_at', fechaInicio)
      .not('pagina', 'is', null)
      .order('created_at', { ascending: false });

    if (!eventos) return;

    // Procesar y agrupar por página
    const paginasMap = new Map<string, { visitas: number; tiempoTotal: number }>();
    
    eventos.forEach(evento => {
      const pagina = evento.pagina || '/';
      const tiempo = evento.tiempo_sesion || 0;
      
      if (paginasMap.has(pagina)) {
        const actual = paginasMap.get(pagina)!;
        paginasMap.set(pagina, {
          visitas: actual.visitas + 1,
          tiempoTotal: actual.tiempoTotal + tiempo
        });
      } else {
        paginasMap.set(pagina, {
          visitas: 1,
          tiempoTotal: tiempo
        });
      }
    });

    // Convertir a array y calcular estadísticas
    const totalVisitas = Array.from(paginasMap.values()).reduce((sum, p) => sum + p.visitas, 0);
    
    paginasVisitadas = Array.from(paginasMap.entries())
      .map(([pagina, data]) => ({
        pagina,
        nombreAmigable: formatearNombrePagina(pagina),
        visitas: data.visitas,
        tiempoPromedio: Math.round(data.tiempoTotal / data.visitas),
        porcentaje: Math.round((data.visitas / totalVisitas) * 100),
        color: obtenerColorPagina(pagina),
        icono: obtenerIconoPagina(pagina)
      }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 10); // Top 10 páginas
  }

  async function cargarRutasNavegacion() {
    const fechaInicio = obtenerFechaInicio();
    
    // Obtener secuencias de navegación por sesión
    const { data: eventos } = await supabase
      .from('eventos_actividad')
      .select('usuario_id, pagina, created_at')
      .gte('created_at', fechaInicio)
      .not('pagina', 'is', null)
      .order('usuario_id', { ascending: true })
      .order('created_at', { ascending: true });

    if (!eventos) return;

    // Procesar secuencias de navegación
    const rutasMap = new Map<string, number>();
    const sesiones = new Map<string, string[]>();
    
    // Agrupar por usuario/sesión
    eventos.forEach(evento => {
      const key = `${evento.usuario_id}`;
      if (!sesiones.has(key)) {
        sesiones.set(key, []);
      }
      sesiones.get(key)!.push(evento.pagina);
    });

    // Analizar transiciones
    sesiones.forEach(paginas => {
      for (let i = 0; i < paginas.length - 1; i++) {
        const desde = formatearNombrePagina(paginas[i]);
        const hacia = formatearNombrePagina(paginas[i + 1]);
        const clave = `${desde} → ${hacia}`;
        
        rutasMap.set(clave, (rutasMap.get(clave) || 0) + 1);
      }
    });

    // Convertir a array
    const totalTransiciones = Array.from(rutasMap.values()).reduce((sum, f) => sum + f, 0);
    
    rutasNavegacion = Array.from(rutasMap.entries())
      .map(([ruta, frecuencia]) => {
        const [desde, hacia] = ruta.split(' → ');
        return {
          desde,
          hacia,
          frecuencia,
          porcentaje: Math.round((frecuencia / totalTransiciones) * 100)
        };
      })
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 8); // Top 8 rutas
  }

  async function cargarEstadisticasGenerales() {
    const fechaInicio = obtenerFechaInicio();
    
    const { data: eventos } = await supabase
      .from('eventos_actividad')
      .select('usuario_id, pagina, tiempo_sesion, created_at')
      .gte('created_at', fechaInicio);

    if (!eventos || eventos.length === 0) return;

    const paginasUnicas = new Set(eventos.map(e => e.pagina)).size;
    const totalPageviews = eventos.length;
    const tiempoTotal = eventos.reduce((sum, e) => sum + (e.tiempo_sesion || 0), 0);
    const tiempoPromedioSesion = Math.round(tiempoTotal / eventos.length);

    // Calcular bounce rate (sesiones de una sola página)
    const sesiones = new Map<string, number>();
    eventos.forEach(evento => {
      const key = evento.usuario_id;
      sesiones.set(key, (sesiones.get(key) || 0) + 1);
    });
    
    const sesionesSinglePage = Array.from(sesiones.values()).filter(count => count === 1).length;
    const bounceRate = Math.round((sesionesSinglePage / sesiones.size) * 100);

    estadisticas = {
      totalPageviews,
      paginasUnicas,
      tiempoPromedioSesion,
      bounceRate
    };
  }

  function obtenerFechaInicio(): string {
    const ahora = new Date();
    switch (periodoSeleccionado) {
      case '24h':
        return new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  function formatearNombrePagina(url: string): string {
    if (!url || url === '/') return 'Inicio';
    
    const mapping: { [key: string]: string } = {
      '/panel-estudiante': 'Panel Estudiante',
      '/panel-administracion': 'Panel Admin',
      '/cursos': 'Cursos',
      '/simulador-gaming': 'Simulador Gaming', 
      '/simulador-de-acordeon': 'Simulador Acordeón',
      '/membresias': 'Membresías',
      '/comunidad': 'Comunidad',
      '/ranking': 'Ranking',
      '/blog': 'Blog',
      '/contacto': 'Contacto',
      '/nuestra-academia': 'Nuestra Academia'
    };

    // Buscar coincidencia exacta
    if (mapping[url]) return mapping[url];
    
    // Manejar rutas dinámicas
    if (url.includes('/cursos/')) return 'Curso Específico';
    if (url.includes('/tutoriales/')) return 'Tutorial';
    if (url.includes('/administrador/')) return 'Administración';
    if (url.includes('/blog/')) return 'Artículo Blog';
    
    // Fallback: limpiar URL
    return url.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' > ') || 'Página';
  }

  function obtenerColorPagina(url: string): string {
    const colores = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    
    // Hash simple para color consistente
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash + url.charCodeAt(i)) & 0xffffffff;
    }
    return colores[Math.abs(hash) % colores.length];
  }

  function obtenerIconoPagina(url: string): string {
    if (url === '/' || url.includes('inicio')) return '🏠';
    if (url.includes('curso')) return '📚';
    if (url.includes('simulador')) return '🎮';
    if (url.includes('panel')) return '📊';
    if (url.includes('membresia')) return '💎';
    if (url.includes('blog')) return '📝';
    if (url.includes('comunidad')) return '👥';
    if (url.includes('contacto')) return '📞';
    if (url.includes('ranking')) return '🏆';
    if (url.includes('admin')) return '⚙️';
    return '📄';
  }

  function cambiarVista(nueva: typeof vistaActual) {
    vistaActual = nueva;
  }

  function cambiarPeriodo(nuevo: typeof periodoSeleccionado) {
    periodoSeleccionado = nuevo;
    cargarAnalytics();
  }

  function formatearTiempo(minutos: number): string {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  }
</script>

<div class="analytics-paginas">
  <div class="analytics-header">
    <div class="header-title">
      <h3>📊 Analytics de Navegación</h3>
      <p>Análisis de páginas más visitadas y patrones de navegación</p>
    </div>
    
    <div class="header-controls">
      <!-- SELECTOR DE PERÍODO -->
      <div class="periodo-selector">
        <button 
          class="btn-periodo" 
          class:activo={periodoSeleccionado === '24h'}
          on:click={() => cambiarPeriodo('24h')}
        >
          24h
        </button>
        <button 
          class="btn-periodo" 
          class:activo={periodoSeleccionado === '7d'}
          on:click={() => cambiarPeriodo('7d')}
        >
          7d
        </button>
        <button 
          class="btn-periodo" 
          class:activo={periodoSeleccionado === '30d'}
          on:click={() => cambiarPeriodo('30d')}
        >
          30d
        </button>
      </div>

      <!-- SELECTOR DE VISTA -->
      <div class="vista-selector">
        <button 
          class="btn-vista" 
          class:activo={vistaActual === 'paginas'}
          on:click={() => cambiarVista('paginas')}
        >
          <i class="fas fa-chart-bar"></i>
          Páginas
        </button>
        <button 
          class="btn-vista" 
          class:activo={vistaActual === 'rutas'}
          on:click={() => cambiarVista('rutas')}
        >
          <i class="fas fa-route"></i>
          Rutas
        </button>
      </div>

      <button class="btn-refresh-analytics" on:click={cargarAnalytics} disabled={cargando}>
        <i class="fas fa-sync-alt" class:girando={cargando}></i>
      </button>
    </div>
  </div>

  <!-- MÉTRICAS RÁPIDAS -->
  <div class="metricas-rapidas">
    <div class="metrica-item">
      <div class="metrica-valor">{estadisticas.totalPageviews.toLocaleString()}</div>
      <div class="metrica-label">📄 Pageviews</div>
    </div>
    <div class="metrica-item">
      <div class="metrica-valor">{estadisticas.paginasUnicas}</div>
      <div class="metrica-label">🔗 Páginas Únicas</div>
    </div>
    <div class="metrica-item">
      <div class="metrica-valor">{formatearTiempo(estadisticas.tiempoPromedioSesion)}</div>
      <div class="metrica-label">⏱️ Tiempo Promedio</div>
    </div>
    <div class="metrica-item">
      <div class="metrica-valor">{estadisticas.bounceRate}%</div>
      <div class="metrica-label">🏃‍♂️ Bounce Rate</div>
    </div>
  </div>

  {#if cargando}
    <div class="loading-analytics">
      <div class="spinner-analytics"></div>
      <p>Analizando patrones de navegación...</p>
    </div>
  {:else}
    
    <!-- VISTA DE PÁGINAS MÁS VISITADAS -->
    {#if vistaActual === 'paginas'}
      <div class="vista-paginas">
        <div class="grafico-barras">
          {#each paginasVisitadas as pagina}
            <div class="barra-item">
              <div class="barra-info">
                <span class="pagina-icono">{pagina.icono}</span>
                <span class="pagina-nombre">{pagina.nombreAmigable}</span>
                <span class="pagina-stats">
                  {pagina.visitas} visitas • {formatearTiempo(pagina.tiempoPromedio)}
                </span>
              </div>
              <div class="barra-visual">
                <div 
                  class="barra-progreso" 
                  style="width: {pagina.porcentaje}%; background-color: {pagina.color}"
                ></div>
                <span class="porcentaje-label">{pagina.porcentaje}%</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- VISTA DE RUTAS DE NAVEGACIÓN -->
    {#if vistaActual === 'rutas'}
      <div class="vista-rutas">
        <div class="rutas-lista">
          {#each rutasNavegacion as ruta}
            <div class="ruta-item">
              <div class="ruta-flujo">
                <span class="ruta-desde">{ruta.desde}</span>
                <i class="fas fa-arrow-right ruta-flecha"></i>
                <span class="ruta-hacia">{ruta.hacia}</span>
              </div>
              <div class="ruta-stats">
                <span class="ruta-frecuencia">{ruta.frecuencia} transiciones</span>
                <span class="ruta-porcentaje">{ruta.porcentaje}%</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  {/if}
</div>

<style>
  .analytics-paginas {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .header-title h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .header-title p {
    margin: 0.25rem 0 0 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .periodo-selector, .vista-selector {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    overflow: hidden;
  }

  .btn-periodo, .btn-vista {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
  }

  .btn-periodo.activo, .btn-vista.activo {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-refresh-analytics {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    padding: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-refresh-analytics:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .girando {
    animation: girar 1s linear infinite;
  }

  .metricas-rapidas {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .metrica-item {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metrica-valor {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .metrica-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .loading-analytics {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner-analytics {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  /* VISTA PÁGINAS */
  .vista-paginas {
    min-height: 400px;
  }

  .grafico-barras {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .barra-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .barra-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .pagina-icono {
    font-size: 1.2rem;
  }

  .pagina-nombre {
    font-weight: 500;
    color: white;
    flex: 1;
  }

  .pagina-stats {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .barra-visual {
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    height: 8px;
  }

  .barra-progreso {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .porcentaje-label {
    position: absolute;
    right: 0.5rem;
    top: -1.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  /* VISTA RUTAS */
  .vista-rutas {
    min-height: 400px;
  }

  .rutas-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ruta-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ruta-flujo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .ruta-desde, .ruta-hacia {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: white;
    font-size: 0.85rem;
  }

  .ruta-flecha {
    color: rgba(255, 255, 255, 0.5);
  }

  .ruta-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .ruta-frecuencia {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .ruta-porcentaje {
    font-weight: 600;
    color: white;
  }

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 1024px) {
    .analytics-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-controls {
      justify-content: space-between;
    }

    .metricas-rapidas {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .metricas-rapidas {
      grid-template-columns: 1fr;
    }

    .ruta-item {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .ruta-stats {
      align-items: flex-start;
    }

    .header-controls {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style> 