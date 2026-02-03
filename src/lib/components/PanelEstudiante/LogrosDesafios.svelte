<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { TiempoService } from '$lib/services/tiempoService';
  import { GamificacionService } from '$lib/services/gamificacionService';

  // 🏆 Estados simples
  let cargando = true;
  let stats = {
    leccionesCompletadas: 0,
    tiempoEstudio: 0,
    rachaActual: 0,
    puntosGanados: 0
  };

  // 🕒 FUNCIÓN PARA CALCULAR TIEMPO HISTÓRICO TOTAL (EN PARALELO)
  async function calcularTiempoHistoricoRapido(usuarioId: string): Promise<number> {
    try {
      // 🚀 TODAS LAS CONSULTAS EN PARALELO
      const [leccionesResult, tutorialesResult, simuladorResult, sesionesResult] = await Promise.all([
        // 1. TODO el tiempo en lecciones 
        supabase
          .from('progreso_lecciones')
          .select('tiempo_total')
          .eq('usuario_id', usuarioId),
          
        // 2. TODO el tiempo en tutoriales
        supabase
          .from('progreso_tutorial')
          .select('tiempo_visto')
          .eq('usuario_id', usuarioId),
          
        // 3. TODO el tiempo en simulador
        supabase
          .from('sesiones_simulador_acordeon')
          .select('duracion_minutos')
          .eq('usuario_id', usuarioId),
          
        // 4. TODO el tiempo en plataforma (pero limitado a valores realistas)
        supabase
          .from('sesiones_usuario')
          .select('tiempo_total_minutos')
          .eq('usuario_id', usuarioId)
      ]);

      // ✅ MANEJAR RESULTADOS CON VERIFICACIÓN DE ERRORES
      const todasLecciones = leccionesResult.data || [];
      const todosTutoriales = tutorialesResult.data || [];
      const todasSesiones = simuladorResult.data || [];
      const todasSesionesUsuario = sesionesResult.data || [];

      // 🔍 VERIFICAR SI HAY ERRORES EN LAS CONSULTAS
      if (leccionesResult.error) {
        console.warn('⚠️ [DIAGNÓSTICO] Error en consulta de lecciones:', leccionesResult.error);
      }
      if (tutorialesResult.error) {
        console.warn('⚠️ [DIAGNÓSTICO] Error en consulta de tutoriales:', tutorialesResult.error);
      }
      if (simuladorResult.error) {
        console.warn('⚠️ [DIAGNÓSTICO] Error en consulta de simulador:', simuladorResult.error);
      }
      if (sesionesResult.error) {
        console.warn('⚠️ [DIAGNÓSTICO] Error en consulta de sesiones:', sesionesResult.error);
      }

      // 🔍 DIAGNÓSTICO: Ver valores exactos en la base de datos
      console.log('🔍 [DIAGNÓSTICO] Valores RAW en la base de datos:', {
        lecciones: todasLecciones.length > 0 ? todasLecciones[0].tiempo_total : 'Sin datos',
        tutoriales: todosTutoriales.length > 0 ? todosTutoriales[0].tiempo_visto : 'Sin datos',
        simulador: todasSesiones.length > 0 ? todasSesiones[0].duracion_minutos : 'Sin datos',
        sesiones: todasSesionesUsuario.length > 0 ? todasSesionesUsuario[0].tiempo_total_minutos : 'Sin datos'
      });

      // 🎯 DETERMINAR UNIDADES CORRECTAS
      let totalLecciones = 0;
      let totalTutoriales = 0;
      
      if (todasLecciones.length > 0) {
        const primerValor = todasLecciones[0].tiempo_total;
        if (primerValor > 1000000) {
          // Si es muy grande, probablemente en milisegundos
          totalLecciones = todasLecciones.reduce((sum: number, item: any) => 
            sum + ((item.tiempo_total || 0) / 60000), 0);
          console.log('🔍 [DIAGNÓSTICO] Lecciones: Valores en MILISEGUNDOS, convirtiendo a minutos');
        } else if (primerValor > 1000) {
          // Si es mediano, probablemente en segundos
          totalLecciones = todasLecciones.reduce((sum: number, item: any) => 
            sum + ((item.tiempo_total || 0) / 60), 0);
          console.log('🔍 [DIAGNÓSTICO] Lecciones: Valores en SEGUNDOS, convirtiendo a minutos');
        } else {
          // Si es pequeño, probablemente ya en minutos
          totalLecciones = todasLecciones.reduce((sum: number, item: any) => 
            sum + (item.tiempo_total || 0), 0);
          console.log('🔍 [DIAGNÓSTICO] Lecciones: Valores ya en MINUTOS');
        }
      }
      
      if (todosTutoriales.length > 0) {
        const primerValor = todosTutoriales[0].tiempo_visto;
        if (primerValor > 1000000) {
          // Si es muy grande, probablemente en milisegundos
          totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => 
            sum + ((item.tiempo_visto || 0) / 60000), 0);
          console.log('🔍 [DIAGNÓSTICO] Tutoriales: Valores en MILISEGUNDOS, convirtiendo a minutos');
        } else if (primerValor > 1000) {
          // Si es mediano, probablemente en segundos
          totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => 
            sum + ((item.tiempo_visto || 0) / 60), 0);
          console.log('🔍 [DIAGNÓSTICO] Tutoriales: Valores en SEGUNDOS, convirtiendo a minutos');
        } else {
          // Si es pequeño, probablemente ya en minutos
          totalTutoriales = todosTutoriales.reduce((sum: number, item: any) => 
            sum + (item.tiempo_visto || 0), 0);
          console.log('🔍 [DIAGNÓSTICO] Tutoriales: Valores ya en MINUTOS');
        }
      }
      
      const totalSimulador = todasSesiones.reduce((sum: number, item: any) => 
        sum + (item.duracion_minutos || 0), 0); // Ya está en minutos ✅
      
      // ✅ USAR tiempo_total_minutos PERO LIMITADO a valores realistas
      let totalSesiones = 0;
      if (todasSesionesUsuario.length > 0) {
        // 🎯 LIMITAR a máximo 8 horas por día (480 minutos)
        totalSesiones = todasSesionesUsuario.reduce((sum: number, item: any) => {
          const tiempo = item.tiempo_total_minutos || 0;
          // ✅ Solo usar valores realistas (< 480 minutos = 8 horas)
          return sum + (tiempo < 480 ? tiempo : 0);
        }, 0);
        
        if (totalSesiones > 0) {
          console.log('🔍 [DIAGNÓSTICO] Sesiones: Usando tiempo limitado a valores realistas');
        }
      }
      
      // ✅ CALCULAR TIEMPO REAL BASADO EN ACTIVIDAD REAL
      const tiempoReal = totalLecciones + totalTutoriales + totalSimulador;
      
      // 🎯 COMBINAR tiempo real + sesiones limitadas
      const tiempoCombinado = Math.max(tiempoReal, totalSesiones);
      
      // 🎯 Si no hay tiempo registrado, calcular basado en actividad reciente
      if (tiempoCombinado === 0) {
        // Buscar actividad reciente para estimar tiempo
        const { data: actividadReciente } = await supabase
          .from('eventos_actividad')
          .select('created_at, tipo_evento')
          .eq('usuario_id', usuarioId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 7 días
          .order('created_at', { ascending: false });
        
        if (actividadReciente && actividadReciente.length > 0) {
          // Estimar tiempo basado en actividad: 5 minutos por evento
          const tiempoEstimado = Math.min(actividadReciente.length * 5, 120); // Máximo 2 horas
          console.log('🎯 [TIEMPO REAL] Estimando tiempo basado en actividad reciente:', tiempoEstimado, 'min');
          return tiempoEstimado;
        }
      }

      // 🎯 PRIORIDAD: Usar tiempo combinado (real + sesiones limitadas)
      console.log('⏱️ [TIEMPO COMBINADO] Cálculo inteligente:', {
        lecciones: totalLecciones.toFixed(2) + ' min',
        tutoriales: totalTutoriales.toFixed(2) + ' min', 
        simulador: totalSimulador + ' min',
        sesionesLimitadas: totalSesiones + ' min',
        tiempoReal: tiempoReal.toFixed(2) + ' min',
        tiempoCombinado: tiempoCombinado.toFixed(2) + ' min',
        nota: 'Combinando tiempo real + sesiones limitadas a valores realistas'
      });

      return Math.round(tiempoCombinado); // Redondear a minutos enteros

    } catch (error) {
      console.error('❌ Error calculando tiempo histórico:', error);
      return 0;
    }
  }

  // 🕒 FUNCIÓN PARA CALCULAR TIEMPO REAL DE USO DE LA PLATAFORMA
  async function calcularTiempoRealPlataforma(usuarioId: string): Promise<number> {
    try {
      console.log('🎯 [TIEMPO REAL] Calculando tiempo real de uso de la plataforma...');
      
      // 🚀 CONSULTAR EVENTOS DE ACTIVIDAD REAL (últimos 30 días)
      const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { data: eventosActividad, error } = await supabase
        .from('eventos_actividad')
        .select('created_at, tipo_evento, pagina, duracion_minutos')
        .eq('usuario_id', usuarioId)
        .gte('created_at', fechaLimite.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('⚠️ [TIEMPO REAL] Error consultando eventos:', error);
        return 0;
      }
      
      if (!eventosActividad || eventosActividad.length === 0) {
        console.log('🎯 [TIEMPO REAL] No hay eventos de actividad recientes');
        return 0;
      }
      
      // 📊 CALCULAR TIEMPO REAL BASADO EN TIPOS DE EVENTOS
      let tiempoTotal = 0;
      const eventosPorTipo: { [key: string]: number } = {};
      
      eventosActividad.forEach((evento: any) => {
        const tipo = evento.tipo_evento || 'navegacion';
        eventosPorTipo[tipo] = (eventosPorTipo[tipo] || 0) + 1;
        
        // 🎯 TIEMPO REAL POR TIPO DE EVENTO
        switch (tipo) {
          case 'estudio':
          case 'leccion':
          case 'ejercicio':
            tiempoTotal += evento.duracion_minutos || 10; // 10 min por evento de estudio
            break;
          case 'simulador':
            tiempoTotal += evento.duracion_minutos || 15; // 15 min por sesión de simulador
            break;
          case 'navegacion':
            tiempoTotal += 2; // 2 min por navegación
            break;
          case 'click':
            tiempoTotal += 1; // 1 min por click
            break;
          default:
            tiempoTotal += 3; // 3 min por evento desconocido
        }
      });
      
      // 🎯 LIMITAR TIEMPO MÁXIMO (evitar valores irreales)
      const tiempoFinal = Math.min(tiempoTotal, 480); // Máximo 8 horas por día
      
      console.log('🎯 [TIEMPO REAL] Cálculo basado en eventos reales:', {
        totalEventos: eventosActividad.length,
        eventosPorTipo,
        tiempoCalculado: tiempoTotal + ' min',
        tiempoFinal: tiempoFinal + ' min',
        periodo: 'Últimos 30 días'
      });
      
      return tiempoFinal;
      
    } catch (error) {
      console.error('❌ [TIEMPO REAL] Error calculando tiempo real:', error);
      return 0;
    }
  }

  // 🔥 Cargar datos REALES desde las tablas correctas
    async function cargarDatosReales() {
    if (!$usuario?.id) {
      cargando = false;
      return;
    }

    try {
      console.log('🚀 Buscando datos REALES para:', $usuario.id);

      // 📅 Fecha más amplia para capturar más actividad (últimos 30 días)
      const fechaHaceUnMes = new Date();
      fechaHaceUnMes.setDate(fechaHaceUnMes.getDate() - 30);
      const fechaSQL = fechaHaceUnMes.toISOString();
      
      console.log('📅 Buscando actividad desde:', fechaSQL);

      // 🚀 EJECUTAR TODAS LAS CONSULTAS EN PARALELO
      const [
        ranking,
        progresoLeccionesResult,
        progresoTutorialesResult, 
        simuladorSesionesResult,
        actividadRecienteResult,
        tiempoHistoricoTotal,
        tiempoRealPlataforma
      ] = await Promise.all([
        // 💎 1. RANKING
        GamificacionService.obtenerRanking('general', 50).catch(() => []),
        
        // 📚 2. PROGRESO LECCIONES
        supabase
          .from('progreso_lecciones')
          .select('tiempo_total, porcentaje_completado, updated_at, estado')
          .eq('usuario_id', $usuario.id)
          .gte('updated_at', fechaSQL),
          
        // 🎵 3. PROGRESO TUTORIALES  
        supabase
          .from('progreso_tutorial')
          .select('tiempo_visto, ultimo_acceso, completado')
          .eq('usuario_id', $usuario.id)
          .gte('ultimo_acceso', fechaSQL),
          
        // 🎮 4. SIMULADOR SESIONES
        supabase
          .from('sesiones_simulador_acordeon')
          .select('duracion_minutos, created_at')
          .eq('usuario_id', $usuario.id)
          .gte('created_at', fechaSQL),
          
        // 🔥 5. ACTIVIDAD RECIENTE
        supabase
          .from('progreso_lecciones')
          .select('updated_at')
          .eq('usuario_id', $usuario.id)
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false }),
          
        // ⏱️ 6. TIEMPO HISTÓRICO EN PARALELO
        calcularTiempoHistoricoRapido($usuario.id),
        
        // 🎯 7. TIEMPO REAL DE USO DE LA PLATAFORMA
        calcularTiempoRealPlataforma($usuario.id)
      ]);

      // 💎 PROCESAR RANKING
      let puntosFinales = 0;
      const miRanking = ranking.find((r: any) => r.usuario_id === $usuario.id);
      if (miRanking) {
        puntosFinales = miRanking.puntuacion || 0;
        console.log('💎 Puntos del ranking encontrados:', puntosFinales);
      }

      // 📊 EXTRAER DATOS DE LAS RESPUESTAS
      const progresoLecciones = progresoLeccionesResult.data || [];
      const progresoTutoriales = progresoTutorialesResult.data || [];
      const simuladorSesiones = simuladorSesionesResult.data || [];
      const actividadReciente = actividadRecienteResult.data || [];

      console.log('📚 Progreso lecciones:', progresoLecciones);
      console.log('🎵 Progreso tutoriales:', progresoTutoriales);
      console.log('🎮 Simulador sesiones:', simuladorSesiones);
      console.log('🔥 Actividad reciente:', actividadReciente);

      // 📊 CALCULAR ESTADÍSTICAS REALES
      
             // Lecciones completadas esta semana
       const leccionesEstaSemanCompletadas = progresoLecciones?.filter((p: any) => 
         p.estado === 'completado' || p.porcentaje_completado === 100
       ).length || 0;
      
      const tutorialesEstaSemanProgreso = progresoTutoriales?.length || 0;

                   // ⏱️ Obtener tiempo semanal del servicio
      const tiempoTotalSemanal = await TiempoService.obtenerTiempoSemanal($usuario.id);
       
             console.log('⏱️ Tiempo semanal del servicio:', tiempoTotalSemanal);
      console.log('⏱️ Tiempo histórico total:', tiempoHistoricoTotal);
       
       // Backup: calcular manualmente si el servicio no tiene datos
       // ✅ CORRECCIÓN: Detectar unidades y convertir correctamente
       let tiempoLecciones = 0;
       let tiempoTutoriales = 0;
       
       if (progresoLecciones.length > 0) {
         const primerValor = progresoLecciones[0].tiempo_total;
         if (primerValor > 1000000) {
           // Si es muy grande, probablemente en milisegundos
           tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => 
             total + ((leccion.tiempo_total || 0) / 60000), 0);
           console.log('🔍 [DIAGNÓSTICO] Lecciones manual: Valores en MILISEGUNDOS, convirtiendo a minutos');
         } else if (primerValor > 1000) {
           // Si es mediano, probablemente en segundos
           tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => 
             total + ((leccion.tiempo_total || 0) / 60), 0);
           console.log('🔍 [DIAGNÓSTICO] Lecciones manual: Valores en SEGUNDOS, convirtiendo a minutos');
         } else {
           // Si es pequeño, probablemente ya en minutos
           tiempoLecciones = progresoLecciones.reduce((total: number, leccion: any) => 
             total + (leccion.tiempo_total || 0), 0);
           console.log('🔍 [DIAGNÓSTICO] Lecciones manual: Valores ya en MINUTOS');
         }
       }
       
       if (progresoTutoriales.length > 0) {
         const primerValor = progresoTutoriales[0].tiempo_visto;
         if (primerValor > 1000000) {
           // Si es muy grande, probablemente en milisegundos
           tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => 
             total + ((tutorial.tiempo_visto || 0) / 60000), 0);
           console.log('🔍 [DIAGNÓSTICO] Tutoriales manual: Valores en MILISEGUNDOS, convirtiendo a minutos');
         } else if (primerValor > 1000) {
           // Si es mediano, probablemente en segundos
           tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => 
             total + ((tutorial.tiempo_visto || 0) / 60), 0);
           console.log('🔍 [DIAGNÓSTICO] Tutoriales manual: Valores en SEGUNDOS, convirtiendo a minutos');
         } else {
           // Si es pequeño, probablemente ya en minutos
           tiempoTutoriales = progresoTutoriales.reduce((total: number, tutorial: any) => 
             total + (tutorial.tiempo_visto || 0), 0);
           console.log('🔍 [DIAGNÓSTICO] Tutoriales manual: Valores ya en MINUTOS');
         }
       }
       
       const tiempoSimulador = simuladorSesiones?.reduce((total: number, sesion: any) => 
         total + (sesion.duracion_minutos || 0), 0) || 0; // Ya está en minutos ✅
         
       const tiempoManual = tiempoLecciones + tiempoTutoriales + tiempoSimulador;

             // Calcular racha simple basada en actividad reciente
       let rachaCalculada = 0;
       if (actividadReciente && actividadReciente.length > 0) {
         // Simplificar: si hay actividad reciente, asignar racha basada en cantidad
         const diasConActividad = actividadReciente.length;
         rachaCalculada = Math.min(diasConActividad, 7); // Máximo 7 días
       }

             // ✅ ASIGNAR VALORES REALES - Usar tiempo REAL de la plataforma
       let tiempoFinal = Math.max(tiempoRealPlataforma, tiempoHistoricoTotal, tiempoTotalSemanal, tiempoManual);
       
       // 🎯 Si no hay tiempo registrado, simular basado en actividad
       if (tiempoFinal === 0 && (leccionesEstaSemanCompletadas > 0 || tutorialesEstaSemanProgreso > 0)) {
         const tiempoSimulado = (leccionesEstaSemanCompletadas * 15) + (tutorialesEstaSemanProgreso * 25);
         tiempoFinal = tiempoSimulado;
         console.log('🎯 Tiempo simulado basado en actividad:', tiempoSimulado, 'min');
       }
       
       stats = {
         leccionesCompletadas: leccionesEstaSemanCompletadas + tutorialesEstaSemanProgreso,
         tiempoEstudio: tiempoFinal,
         rachaActual: rachaCalculada,
         puntosGanados: puntosFinales // Puntos reales del ranking (0 si no está en ranking)
       };

      console.log('✅ STATS FINALES REALES:', stats);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      
      // Mantener en 0 si hay error
      stats = { 
        leccionesCompletadas: 0, 
        tiempoEstudio: 0, 
        rachaActual: 0, 
        puntosGanados: 0 
      };
    } finally {
      cargando = false;
    }
  }

  // 🕒 FUNCIÓN PARA FORMATEAR TIEMPO DE MANERA LEGIBLE
  function formatearTiempo(minutos: number): string {
    if (minutos < 1) return '0m';
    if (minutos < 60) return `${Math.round(minutos)}m`;
    if (minutos < 1440) {
      const horas = Math.floor(minutos / 60);
      const minRestantes = Math.round(minutos % 60);
      return `${horas}h ${minRestantes}m`;
    }
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    return `${dias}d ${horas}h`;
  }

  onMount(cargarDatosReales);
</script>

<!-- 🏆 PROGRESO SEMANAL - DATOS REALES DEL RANKING -->
<section class="progreso-semanal">
  {#if cargando}
    <div class="loading-skeleton">
      <h3>🏆 Estadísticas Gaming</h3>
      <div class="stats-grid">
        <div class="stat-card skeleton">
          <span class="icon">📚</span>
          <span class="value">-</span>
          <span class="label">Lecciones</span>
        </div>
        <div class="stat-card skeleton">
          <span class="icon">⏱️</span>
          <span class="value">-</span>
          <span class="label">Estudiando</span>
        </div>
        <div class="stat-card skeleton">
          <span class="icon">🔥</span>
          <span class="value">-</span>
          <span class="label">Racha</span>
        </div>
        <div class="stat-card skeleton">
          <span class="icon">💎</span>
          <span class="value">-</span>
          <span class="label">Puntos</span>
        </div>
      </div>
      <div class="loading-text">
        🚀 Cargando en paralelo...
      </div>
    </div>
  {:else}
    <h3>🏆 Estadísticas Gaming</h3>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="icon">📚</span>
        <span class="value">{stats.leccionesCompletadas}</span>
        <span class="label">Lecciones</span>
      </div>
      
      <div class="stat-card">
        <span class="icon">⏱️</span>
        <span class="value">{formatearTiempo(stats.tiempoEstudio)}</span>
        <span class="label">Estudiando</span>
      </div>
      
      <div class="stat-card">
        <span class="icon">🔥</span>
        <span class="value">{stats.rachaActual}</span>
        <span class="label">Racha</span>
      </div>
      
      <div class="stat-card">
        <span class="icon">💎</span>
        <span class="value">{stats.puntosGanados}</span>
        <span class="label">Puntos</span>
      </div>
    </div>

    <!-- 🎯 Acciones rápidas -->
    <div class="acciones">
      <button class="btn-accion" on:click={() => goto('/simulador-de-acordeon')}>
        🎮 Practicar Simulador
      </button>
      <button class="btn-accion" on:click={() => goto('/cursos')}>
        📚 Ver Cursos
      </button>
    </div>
  {/if}
</section>

<style>
  .progreso-semanal {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 16px;
    padding: 24px;
    margin: 20px 0;
    border: 1px solid #475569;
  }

  .loading-skeleton {
    padding: 1.5rem;
    background: var(--color-card);
    border-radius: 12px;
    border: 1px solid var(--color-borde);
  }
  
  .loading-skeleton h3 {
    margin-bottom: 1rem;
    color: var(--color-texto-principal);
  }
  
  .skeleton {
    opacity: 0.6;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .skeleton .value {
    background: linear-gradient(90deg, #444 25%, #555 50%, #444 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    display: inline-block;
    width: 20px;
    height: 16px;
  }
  
  .loading-text {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: var(--color-texto-secundario);
    font-weight: 500;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.8; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  h3 {
    color: #f1f5f9;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    text-align: center;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #475569;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    transition: transform 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    border-color: #3b82f6;
  }

  .icon {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
  }

  .value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 4px;
  }

  .label {
    color: #94a3b8;
    font-size: 14px;
    font-weight: 500;
  }

  .acciones {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .btn-accion {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-accion:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .acciones {
      flex-direction: column;
    }
  }
</style>
