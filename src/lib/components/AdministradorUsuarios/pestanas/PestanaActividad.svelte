<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  
  export let usuario: any;
  
  // 📊 Estado del componente
  let cargandoActividad = false;
  let datosActividad = {
    // ⏰ Métricas principales
    tiempoTotal: 0,
    sesionesHoy: 0,
    ultimaActividad: null as string | null,
    diasActivos: 0,
    promedioSesionDiaria: 0,
    
    // 📱 Sesiones recientes
    sesionesRecientes: [] as any[],
    
    // 📍 Páginas más visitadas  
    paginasFavoritas: [] as Array<{ pagina: string; visitas: number; tiempo_total: number }>,
    
    // 📈 Tendencias
    actividadPorDia: [] as Array<{ fecha: string; tiempo: number; sesiones: number }>,
    
    // 🎯 Métricas avanzadas
    cursosProgreso: [] as any[],
    logrosObtenidos: [] as any[],
    racha: 0
  };

  onMount(() => {
    cargarDatosActividadReal();
  });

  // 🔥 CARGAR DATOS REALES DE ACTIVIDAD
  async function cargarDatosActividadReal() {
    if (!usuario?.id) return;
    
    try {
      cargandoActividad = true;
      console.log('📊 [ACTIVIDAD] Cargando datos reales para usuario:', usuario.nombre);
      
      // 1️⃣ OBTENER RESUMEN DE SESIONES_USUARIO
      const { data: resumenSesiones } = await supabase
        .from('sesiones_usuario')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('fecha', { ascending: false })
        .limit(30); // Últimos 30 días
      
      // 2️⃣ OBTENER EVENTOS DE ACTIVIDAD DETALLADOS
      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventosActividad } = await supabase
        .from('eventos_actividad')
        .select('*')
        .eq('usuario_id', usuario.id)
        .gte('timestamp_evento', hace30Dias)
        .order('timestamp_evento', { ascending: false })
        .limit(100);
      
      // 3️⃣ OBTENER PROGRESO EN CURSOS
      const { data: progresoInscripciones } = await supabase
        .from('inscripciones')
        .select(`
          *,
          cursos:curso_id (titulo, imagen_url),
          paquetes_tutoriales:paquete_id (titulo, imagen_url)
        `)
        .eq('usuario_id', usuario.id);

      // 4️⃣ PROCESAR Y CALCULAR MÉTRICAS
      await procesarDatosActividad(resumenSesiones, eventosActividad, progresoInscripciones);
      
      console.log('✅ [ACTIVIDAD] Datos cargados:', datosActividad);
      
    } catch (error) {
      console.error('❌ [ACTIVIDAD] Error cargando datos:', error);
      
      // Datos de fallback seguros
      datosActividad = {
        ...datosActividad,
        tiempoTotal: 0,
        sesionesHoy: 0,
        ultimaActividad: null
      };
    } finally {
      cargandoActividad = false;
    }
  }

  // 🧮 PROCESAR DATOS Y CALCULAR MÉTRICAS
  async function procesarDatosActividad(sesiones: any[], eventos: any[], inscripciones: any[]) {
    const ahora = new Date();
    const hoyISO = ahora.toISOString().split('T')[0];
    
    // ⏰ CALCULAR TIEMPO TOTAL Y SESIONES
    const tiempoTotal = sesiones?.reduce((total, sesion) => total + (sesion.tiempo_total_minutos || 0), 0) || 0;
    const sesionesHoy = sesiones?.filter(s => s.fecha === hoyISO)?.length || 0;
    const ultimaActividad = sesiones?.[0]?.ultima_actividad || null;
    const diasActivos = sesiones?.length || 0;
    const promedioSesionDiaria = diasActivos > 0 ? Math.round(tiempoTotal / diasActivos) : 0;

    // 📱 OBTENER SESIONES RECIENTES (últimas 10)
    const sesionesRecientes = (sesiones || []).slice(0, 10).map(sesion => ({
      ...sesion,
      tiempo_formateado: formatearTiempo(sesion.tiempo_total_minutos || 0),
      hace: formatearTiempoRelativo(sesion.ultima_actividad)
    }));

    // 📍 CALCULAR PÁGINAS MÁS VISITADAS
    const contadorPaginas = new Map();
    eventos?.forEach(evento => {
      const pagina = evento.pagina || 'Desconocida';
      const tiempoEvento = evento.duracion_minutos || 1;
      
      if (contadorPaginas.has(pagina)) {
        const actual = contadorPaginas.get(pagina);
        contadorPaginas.set(pagina, {
          visitas: actual.visitas + 1,
          tiempo_total: actual.tiempo_total + tiempoEvento
        });
      } else {
        contadorPaginas.set(pagina, { visitas: 1, tiempo_total: tiempoEvento });
      }
    });

    const paginasFavoritas = Array.from(contadorPaginas.entries())
      .map(([pagina, datos]) => ({
        pagina: formatearNombrePagina(pagina),
        visitas: datos.visitas,
        tiempo_total: datos.tiempo_total
      }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 8);

    // 📈 ACTIVIDAD POR DÍA (últimos 14 días)
    const actividadPorDia = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      const fechaISO = fecha.toISOString().split('T')[0];
      
      const sesionDia = sesiones?.find(s => s.fecha === fechaISO);
      const eventosDia = eventos?.filter(e => e.timestamp_evento?.startsWith(fechaISO)) || [];
      
      actividadPorDia.push({
        fecha: fechaISO,
        tiempo: sesionDia?.tiempo_total_minutos || 0,
        sesiones: eventosDia.length,
        fecha_formateada: fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
      });
    }

    // 📚 PROGRESO EN CURSOS
    const cursosProgreso = (inscripciones || []).map(inscripcion => ({
      ...inscripcion,
      nombre: inscripcion.cursos?.titulo || inscripcion.paquetes_tutoriales?.titulo || 'Curso',
      imagen: inscripcion.cursos?.imagen_url || inscripcion.paquetes_tutoriales?.imagen_url || '/images/default-course.jpg',
      progreso_texto: `${inscripcion.porcentaje_completado || 0}%`,
      estado: inscripcion.completado ? 'Completado' : 'En progreso'
    }));

    // 🏆 CALCULAR RACHA (días consecutivos con actividad)
    let racha = 0;
    for (let i = 0; i < sesiones.length; i++) {
      const fechaSesion = new Date(sesiones[i].fecha);
      const fechaEsperada = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      
      if (fechaSesion.toDateString() === fechaEsperada.toDateString()) {
        racha++;
      } else {
        break;
      }
    }

    // 🎯 ASIGNAR TODOS LOS DATOS
    datosActividad = {
      tiempoTotal,
      sesionesHoy,
      ultimaActividad,
      diasActivos,
      promedioSesionDiaria,
      sesionesRecientes,
      paginasFavoritas,
      actividadPorDia,
      cursosProgreso,
      logrosObtenidos: [], // Por implementar
      racha
    };
  }

  // 🎨 UTILIDADES DE FORMATO
  function formatearTiempo(minutos: number): string {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  }

  function formatearTiempoRelativo(fecha: string | null): string {
    if (!fecha) return 'Nunca';
    
    const ahora = new Date();
    const fechaActividad = new Date(fecha);
    const diferencia = Math.floor((ahora.getTime() - fechaActividad.getTime()) / (1000 * 60));
    
    if (diferencia < 1) return 'Ahora mismo';
    if (diferencia < 60) return `Hace ${diferencia}m`;
    if (diferencia < 1440) return `Hace ${Math.floor(diferencia / 60)}h`;
    return `Hace ${Math.floor(diferencia / 1440)}d`;
  }

  function formatearNombrePagina(pagina: string): string {
    const mapaPaginas: { [key: string]: string } = {
      '/': '🏠 Inicio',
      '/panel-estudiante': '📚 Panel Estudiante',
      '/cursos': '📖 Cursos',
      '/simulador-gaming': '🎮 Simulador',
      '/ranking': '🏆 Ranking',
      '/eventos': '📅 Eventos',
      '/mensajes': '💬 Mensajes'
    };
    
    return mapaPaginas[pagina] || pagina.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="pestana-actividad">
  {#if cargandoActividad}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando actividad real del usuario...</p>
    </div>
  {:else}
    
    <!-- 📊 MÉTRICAS PRINCIPALES -->
    <div class="metricas-principales">
      <div class="metrica-card tiempo-total">
        <div class="metrica-valor">{formatearTiempo(datosActividad.tiempoTotal)}</div>
        <div class="metrica-label">Tiempo Total</div>
        <div class="metrica-detalle">{datosActividad.diasActivos} días activos</div>
      </div>
      
      <div class="metrica-card sesiones-hoy">
        <div class="metrica-valor">{datosActividad.sesionesHoy}</div>
        <div class="metrica-label">Sesiones Hoy</div>
        <div class="metrica-detalle">Promedio: {formatearTiempo(datosActividad.promedioSesionDiaria)}/día</div>
      </div>
      
      <div class="metrica-card ultima-actividad">
        <div class="metrica-valor">
          {datosActividad.ultimaActividad ? formatearTiempoRelativo(datosActividad.ultimaActividad) : 'Nunca'}
        </div>
        <div class="metrica-label">Última Actividad</div>
        <div class="metrica-detalle">Racha: {datosActividad.racha} días</div>
      </div>
    </div>

    <!-- 📈 GRÁFICO DE ACTIVIDAD -->
    <div class="actividad-chart">
      <h4>📈 Actividad Últimos 14 Días</h4>
      <div class="chart-bars">
        {#each datosActividad.actividadPorDia as dia}
          <div class="chart-day">
            <div 
              class="chart-bar" 
              style="height: {Math.max(4, (dia.tiempo / 120) * 100)}px"
              title="{dia.fecha_formateada}: {formatearTiempo(dia.tiempo)}"
            ></div>
            <span class="chart-label">{dia.fecha_formateada}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- 📱 SESIONES RECIENTES -->
    <div class="sesiones-recientes">
      <h4>📱 Sesiones Recientes</h4>
      <div class="sesiones-lista">
        {#each datosActividad.sesionesRecientes as sesion}
          <div class="sesion-item">
            <div class="sesion-fecha">{formatearFecha(sesion.ultima_actividad)}</div>
            <div class="sesion-tiempo">{sesion.tiempo_formateado}</div>
            <div class="sesion-pagina">{sesion.pagina_actual || 'N/A'}</div>
            <div class="sesion-estado" class:activo={sesion.esta_activo}>
              {sesion.esta_activo ? 'Activo' : 'Finalizada'}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- 📍 PÁGINAS MÁS VISITADAS -->
    <div class="paginas-favoritas">
      <h4>📍 Páginas Más Visitadas</h4>
      <div class="paginas-lista">
        {#each datosActividad.paginasFavoritas as pagina}
          <div class="pagina-item">
            <span class="pagina-nombre">{pagina.pagina}</span>
            <div class="pagina-stats">
              <span class="pagina-visitas">{pagina.visitas} visitas</span>
              <span class="pagina-tiempo">{formatearTiempo(pagina.tiempo_total)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- 📚 PROGRESO EN CURSOS -->
    {#if datosActividad.cursosProgreso.length > 0}
      <div class="cursos-progreso">
        <h4>📚 Progreso en Cursos</h4>
        <div class="cursos-grid">
          {#each datosActividad.cursosProgreso as curso}
            <div class="curso-card">
              <img src={curso.imagen} alt={curso.nombre} class="curso-imagen" />
              <div class="curso-info">
                <h5>{curso.nombre}</h5>
                <div class="progreso-bar">
                  <div 
                    class="progreso-fill" 
                    style="width: {curso.porcentaje_completado || 0}%"
                  ></div>
                </div>
                <span class="progreso-texto">{curso.progreso_texto}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  {/if}
</div>

<style>
  .pestana-actividad {
    padding: 1.5rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  /* 🔄 LOADING */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📊 MÉTRICAS PRINCIPALES */
  .metricas-principales {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metrica-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metrica-valor {
    font-size: 2rem;
    font-weight: 600;
    color: #8b5cf6;
    margin-bottom: 0.5rem;
  }

  .metrica-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 0.25rem;
  }

  .metrica-detalle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  /* 📈 GRÁFICO */
  .actividad-chart {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .actividad-chart h4 {
    margin: 0 0 1rem 0;
    color: white;
  }

  .chart-bars {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    height: 120px;
  }

  .chart-day {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .chart-bar {
    width: 100%;
    background: linear-gradient(to top, #8b5cf6, #a78bfa);
    border-radius: 2px;
    min-height: 4px;
    transition: all 0.3s ease;
  }

  .chart-bar:hover {
    background: linear-gradient(to top, #7c3aed, #8b5cf6);
  }

  .chart-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    writing-mode: initial;
  }

  /* 📱 SESIONES */
  .sesiones-recientes {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .sesiones-recientes h4 {
    margin: 0 0 1rem 0;
    color: white;
  }

  .sesiones-lista {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sesion-item {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr 1fr;
    gap: 1rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .sesion-fecha {
    color: rgba(255, 255, 255, 0.9);
  }

  .sesion-tiempo {
    color: #10b981;
    font-weight: 500;
  }

  .sesion-pagina {
    color: rgba(255, 255, 255, 0.7);
  }

  .sesion-estado {
    color: #6b7280;
  }

  .sesion-estado.activo {
    color: #10b981;
  }

  /* 📍 PÁGINAS FAVORITAS */
  .paginas-favoritas {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .paginas-favoritas h4 {
    margin: 0 0 1rem 0;
    color: white;
  }

  .paginas-lista {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pagina-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .pagina-nombre {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .pagina-stats {
    display: flex;
    gap: 1rem;
  }

  .pagina-visitas {
    color: #8b5cf6;
    font-size: 0.85rem;
  }

  .pagina-tiempo {
    color: #10b981;
    font-size: 0.85rem;
  }

  /* 📚 CURSOS */
  .cursos-progreso {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .cursos-progreso h4 {
    margin: 0 0 1rem 0;
    color: white;
  }

  .cursos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .curso-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    gap: 1rem;
  }

  .curso-imagen {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 6px;
  }

  .curso-info {
    flex: 1;
  }

  .curso-info h5 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 0.9rem;
  }

  .progreso-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(to right, #8b5cf6, #10b981);
    transition: width 0.3s ease;
  }

  .progreso-texto {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style> 