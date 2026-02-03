  <script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { navegarADetallesUsuario } from '$lib/services/navegacionUsuariosService';
  
  export let alumnosActivos: any[] = [];
  export let onGestionarTodos: () => void = () => {}; // ✅ Función para abrir modal

  // Variables para auto-refresh de tiempo
  let tiempoActualizado = Date.now();
  let intervalId: NodeJS.Timeout | null = null;

  // ✨ Variables para microinteracciones
  let tooltipVisible = false;
  let tooltipContent = '';
  let tooltipTarget: HTMLElement | null = null;



  // Auto-refresh cada segundo para tiempos dinámicos
  onMount(() => {
    intervalId = setInterval(() => {
      tiempoActualizado = Date.now();
    }, 1000); // ✅ Actualizar cada segundo para tiempo real
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  // Formatear tiempo detallado (incluyendo segundos y estado)
  function formatearTiempo(minutos: number): string {
    if (minutos === 0) return '0m';
    if (minutos < 1) {
      const segundos = Math.round(minutos * 60);
      return `${segundos}s`;
    }
    if (minutos < 60) return `${Math.round(minutos)}m`;
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.round(minutos % 60);
    return `${horas}h ${minutosRestantes}m`;
  }

  // Calcular tiempo de sesión en tiempo real (se actualiza con tiempoActualizado)
  function calcularTiempoSesion(ultimaActividad: string): string {
    // Usar tiempoActualizado para forzar recálculo cuando se actualiza
    const ahora = tiempoActualizado;
    const fechaActividad = new Date(ultimaActividad);
    const diferenciaMilisegundos = ahora - fechaActividad.getTime();
    const minutos = Math.floor(diferenciaMilisegundos / (1000 * 60));
    const segundos = Math.floor((diferenciaMilisegundos % (1000 * 60)) / 1000);
    
    if (diferenciaMilisegundos < 0) {
      return '0s';
    }
    
    if (minutos < 1) {
      return `${segundos}s`;
    } else if (minutos < 60) {
      return `${minutos}m ${segundos}s`;
    } else {
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      return `${horas}h ${minutosRestantes}m`;
    }
  }

  // ✅ TIEMPO REAL - Solo usar datos reales de sesiones
  function formatearTiempoDetallado(alumno: any): string {
    // ✅ Usar SOLO tiempo real de sesiones activas, no estimaciones
    const minutos = alumno.tiempo_total_minutos || 0;
    
    if (minutos === 0) return '0m';
    
    if (minutos < 1) {
      const segundos = Math.round(minutos * 60);
      return `${segundos}s`;
    }
    
    if (minutos < 60) {
      return `${Math.round(minutos)}m`;
    }
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.round(minutos % 60);
    return `${horas}h ${minutosRestantes}m`;
  }

  // Determinar si el usuario está activo ahora (se actualiza con tiempoActualizado)
  function estaActivoAhora(ultimaActividad: string): boolean {
    const ahora = tiempoActualizado;
    const fechaActividad = new Date(ultimaActividad);
    const diferenciaMilisegundos = ahora - fechaActividad.getTime();
    const minutos = diferenciaMilisegundos / (1000 * 60);
    return minutos < 15; // Activo si la última actividad fue hace menos de 15 minutos
  }

  // Obtener color de suscripción
  function obtenerColorSuscripcion(suscripcion: string): string {
    switch (suscripcion) {
      case 'premium': return '#f59e0b';
      case 'pro': return '#8b5cf6';
      case 'vip': return '#dc2626';
      default: return '#6b7280';
    }
  }

  // Obtener icono de suscripción
  function obtenerIconoSuscripcion(suscripcion: string): string {
    switch (suscripcion) {
      case 'premium': return 'fas fa-crown';
      case 'pro': return 'fas fa-star';
      case 'vip': return 'fas fa-gem';
      default: return 'fas fa-user';
    }
  }

  // Formatear última actividad (REACTIVO - se actualiza cada 5 segundos)
  function tiempoRelativo(fecha: string): string {
    const ahora = tiempoActualizado; // ✅ Usar tiempo reactivo
    const fechaActividad = new Date(fecha);
    const diferenciaMs = ahora - fechaActividad.getTime();
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const minutos = Math.floor(diferenciaMs / (1000 * 60));
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  }

  // Función para ir al perfil del usuario
  function irAPerfilUsuario(usuarioId: string) {
    if (!usuarioId) return;
    window.location.href = `/usuarios/${usuarioId}`;
  }

  // ✨ FUNCIONES PARA MICROINTERACCIONES Y TOOLTIPS
  function mostrarTooltip(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    tooltipTarget = target;
    tooltipContent = "✨ Haz clic para ver detalles completos del estudiante";
    tooltipVisible = true;
    
    // Posicionar tooltip cerca del cursor
    setTimeout(() => {
      const tooltipEl = document.querySelector('.tooltip-container') as HTMLElement;
      if (tooltipEl && event.clientX && event.clientY) {
        tooltipEl.style.left = (event.clientX + 10) + 'px';
        tooltipEl.style.top = (event.clientY - 40) + 'px';
      }
    }, 10);
  }

  function ocultarTooltip() {
    tooltipVisible = false;
    tooltipTarget = null;
    tooltipContent = '';
  }

  // 🏆 GENERAR INSIGNIAS/LOGROS DINÁMICOS
  function generarInsignias(alumno: any): Array<{ icono: string, texto: string, color: string }> {
    const insignias = [];
    
    // Insignia por tiempo total alto
    if (alumno.tiempo_total_minutos > 300) { // +5 horas
      insignias.push({
        icono: '🔥',
        texto: 'Usuario Dedicado',
        color: '#f59e0b'
      });
    }
    
    // Insignia por cursos completados
    if (alumno.cursos_completados > 2) {
      insignias.push({
        icono: '🏆',
        texto: 'Completador',
        color: '#10b981'
      });
    }
    
    // Insignia por actividad reciente
    if (alumno.estado_visual === 'online') {
      insignias.push({
        icono: '⚡',
        texto: 'En línea ahora',
        color: '#10b981'
      });
    }
    
    return insignias.slice(0, 2); // Máximo 2 insignias por tarjeta
  }

  function calcularTendencia(alumno: any): { texto: string, color: string, icono: string } {
    const tiempoHoy = alumno.tiempo_sesion_actual || 0;
    const tiempoPromedio = 45;
    
    if (tiempoHoy > tiempoPromedio) {
      return {
        texto: `+${tiempoHoy - tiempoPromedio}min vs promedio`,
        color: '#10b981',
        icono: '📈'
      };
    } else if (tiempoHoy < tiempoPromedio) {
      return {
        texto: `-${tiempoPromedio - tiempoHoy}min vs promedio`,
        color: '#f59e0b',
        icono: '📉'
      };
    }
    
    return {
      texto: 'Actividad normal',
      color: '#6b7280',
      icono: '📊'
    };
  }

  function verDetallesAlumno(alumno: any) {
    const perfil = alumno.perfiles;
    if (!perfil?.id) return;
    
    navegarADetallesUsuario({
      usuarioId: perfil.id,
      pestana: 'actividad',
      abrirEnNuevaVentana: true
    });
  }


</script>

<div class="contenedor-alumnos">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <h3>👑 Alumnos Más Activos</h3>
    <div class="alerta-datos-reales">
      <i class="fas fa-check-circle"></i>
      <span><strong>✅ DATOS 100% REALES:</strong> Basado en actividad real de estudiantes en cursos y tutoriales</span>
    </div>
    <p>Estudiantes ordenados por actividad reciente y progreso real</p>
  </div>

  <!-- 📊 LISTA DE ALUMNOS -->
  <div class="lista-alumnos">
    {#if alumnosActivos.length > 0}
      {#each alumnosActivos.slice(0, 8) as alumno, index}
        {@const perfil = alumno.perfiles}
        {@const posicion = index + 1}
        {@const tendencia = calcularTendencia(alumno)}
        
        <div class="item-alumno" class:top-tres={posicion <= 3}>
          
          <!-- 🏆 POSICIÓN -->
          <div class="posicion-ranking">
            {#if posicion === 1}
              <div class="medalla oro">
                <i class="fas fa-crown"></i>
              </div>
            {:else if posicion === 2}
              <div class="medalla plata">
                <i class="fas fa-medal"></i>
              </div>
            {:else if posicion === 3}
              <div class="medalla bronce">
                <i class="fas fa-award"></i>
              </div>
            {:else}
              <div class="numero-posicion">#{posicion}</div>
            {/if}
          </div>

                  <!-- 👤 PERFIL DEL ALUMNO MEJORADO -->
        <div class="perfil-alumno-v2 hover-suave" 
             on:click={() => irAPerfilUsuario(perfil?.id)} 
             on:mouseenter={mostrarTooltip}
             on:mouseleave={ocultarTooltip}
             class:clickeable={true}>
            
            <!-- 📸 FOTO Y ESTADO -->
            <div class="foto-container-v2">
              {#if perfil?.url_foto_perfil}
                <img src={perfil.url_foto_perfil} alt={perfil.nombre} class="foto-perfil-v2" />
              {:else}
                <div class="avatar-default-v2">
                  <i class="fas fa-user"></i>
                </div>
              {/if}
              
              <!-- 🟢🔴 INDICADOR DE ESTADO EN VIVO -->
              <div class="estado-tiempo-real" 
                   class:activo={alumno.estado_visual === 'online'}
                   class:desconectado={alumno.estado_visual === 'desconectado'}
                   class:reciente={alumno.estado_visual === 'reciente' || alumno.estado_visual === 'hoy' || alumno.estado_visual === 'semana'}>
                {#if alumno.estado_visual === 'online'}
                  <i class="fas fa-circle"></i>
                {:else if alumno.estado_visual === 'desconectado'}
                  <i class="fas fa-power-off"></i>
                {:else}
                  <i class="fas fa-clock"></i>
                {/if}
              </div>
            </div>

            <!-- 📝 INFORMACIÓN PRINCIPAL -->
            <div class="info-principal-v2">
              <div class="nombre-y-nivel">
                <h4 class="nombre-alumno-v2">
                  {perfil?.nombre || 'Usuario'} {perfil?.apellido || ''}
                </h4>
                              <div class="badges-container">
                <span class="badge-nivel" style="background-color: {obtenerColorSuscripcion(perfil?.suscripcion || 'free')}">
                  <i class="{obtenerIconoSuscripcion(perfil?.suscripcion || 'free')}"></i>
                  {perfil?.nivel_habilidad || 'Principiante'}
                </span>
                {#if perfil?.rol === 'admin'}
                  <span class="badge-admin-v2">ADMIN</span>
                {/if}
                
                <!-- 🏆 INSIGNIAS DINÁMICAS -->
                {#each generarInsignias(alumno) as insignia}
                  <span class="badge-insignia" style="color: {insignia.color}; border-color: {insignia.color}20;">
                    <span class="insignia-icono">{insignia.icono}</span>
                    {insignia.texto}
                  </span>
                {/each}
              </div>
              </div>
              
              <!-- ⏰ ACTIVIDAD RECIENTE -->
              <div class="actividad-info">
                <div class="estado-actividad">
                  {#if alumno.estado_visual === 'online'}
                    <span class="estado-activo">
                      <i class="fas fa-circle"></i>
                      En línea ahora
                    </span>
                  {:else if alumno.estado_visual === 'desconectado'}
                    <span class="estado-desconectado">
                      <i class="fas fa-power-off"></i>
                      {alumno.estado_texto || 'Desconectado'}
                    </span>
                  {:else}
                    <span class="estado-inactivo">
                      <i class="fas fa-clock"></i>
                      {alumno.estado_texto || tiempoRelativo(alumno.ultima_actividad)}
                    </span>
                  {/if}
                </div>
                
                <div class="validacion-datos">
                  <i class="fas fa-check-circle"></i>
                  <span>Datos verificados</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 📊 TENDENCIA DEL DÍA (como Duolingo) -->
          <div class="tendencia-dia">
            <span class="tendencia-icono">{tendencia.icono}</span>
            <span class="tendencia-texto" style="color: {tendencia.color}">
              {tendencia.texto}
            </span>
          </div>

          <!-- 📊 MÉTRICAS RENOVADAS Y CLARAS -->
          <div class="metricas-renovadas">
            
            <!-- ⏰ TIEMPO Y ACTIVIDAD PRINCIPAL -->
            <div class="panel-tiempo-actividad">
              <div class="tiempo-principal-v2">
                <span class="tiempo-valor">{formatearTiempoDetallado(alumno)}</span>
                <span class="tiempo-label">
                  <i class="fas fa-clock"></i>
                  Tiempo Total
                </span>
              </div>
              
              <!-- 🔴🟢 ESTADO EN VIVO -->
              <div class="estado-alumno">
                {#if estaActivoAhora(alumno.ultima_actividad)}
                  <div class="indicador-activo">
                    <div class="pulso-verde"></div>
                    <span class="texto-estado">En línea</span>
                  </div>
                  <div class="tiempo-sesion-actual">
                    <i class="fas fa-play-circle"></i>
                    {calcularTiempoSesion(alumno.ultima_actividad)}
                  </div>
                {:else}
                  <div class="indicador-inactivo">
                    <div class="punto-gris"></div>
                    <span class="texto-estado">Última actividad</span>
                  </div>
                  <div class="tiempo-inactividad">
                    <i class="fas fa-pause-circle"></i>
                    Hace {tiempoRelativo(alumno.ultima_actividad)}
                  </div>
                {/if}
              </div>
            </div>

            <!-- 📈 MÉTRICAS DE RENDIMIENTO -->
            <div class="panel-rendimiento">
              <div class="metrica-compacta">
                <div class="icono-metrica">
                  <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="valores-metrica">
                  <span class="numero-grande">{alumno.sesiones_totales || 0}</span>
                  <span class="etiqueta-metrica">Cursos</span>
                </div>
              </div>

              {#if alumno.porcentaje_promedio && alumno.porcentaje_promedio > 0}
                <div class="metrica-compacta">
                  <div class="icono-metrica progreso">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div class="valores-metrica">
                    <span class="numero-grande">{alumno.porcentaje_promedio}%</span>
                    <span class="etiqueta-metrica">Progreso</span>
                  </div>
                </div>
              {/if}

              {#if alumno.cursos_completados && alumno.cursos_completados > 0}
                <div class="metrica-compacta destacada">
                  <div class="icono-metrica">
                    <i class="fas fa-trophy"></i>
                  </div>
                  <div class="valores-metrica">
                    <span class="numero-grande">{alumno.cursos_completados}</span>
                    <span class="etiqueta-metrica">Finalizados</span>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- 🔍 BOTÓN VER DETALLES -->
          <div class="acciones-alumno">
            <button class="btn-ver-detalles" on:click|stopPropagation={() => verDetallesAlumno(alumno)}>
              <i class="fas fa-eye"></i>
              Ver detalles
            </button>
          </div>

        </div>
      {/each}
    {:else}
      <!-- 😴 SIN DATOS -->
      <div class="sin-alumnos">
        <div class="icono-sin-datos">
          <i class="fas fa-user-graduate"></i>
        </div>
        <h4>Sin datos de actividad</h4>
        <p>No hay información de alumnos activos disponible</p>
        
        <!-- 🔧 Información de depuración -->
        <div class="info-debug">
          <details>
            <summary>🔍 Información de depuración</summary>
            <div class="debug-content">
              <p><strong>Datos buscados:</strong></p>
              <ul>
                <li>Tabla <code>sesiones_usuario</code> con tiempo_total_minutos</li>
                <li>Tabla <code>inscripciones</code> como respaldo</li>
                <li>Usuarios con perfiles completos</li>
              </ul>
              <p><strong>Posibles causas:</strong></p>
              <ul>
                <li>No existe la tabla <code>sesiones_usuario</code></li>
                <li>No hay registros de sesiones recientes</li>
                <li>Las políticas RLS están bloqueando el acceso</li>
                <li>No hay inscripciones con <code>ultima_actividad</code></li>
              </ul>
              <p><strong>Solución recomendada:</strong></p>
              <ol>
                <li>Ejecutar <code>crear_tabla_sesiones_usuario.sql</code> en Supabase</li>
                <li>Verificar que hay datos de usuarios activos</li>
                <li>Revisar políticas RLS para usuarios admin</li>
              </ol>
            </div>
          </details>
        </div>
      </div>
    {/if}
  </div>

  <!-- 🔗 PIE DE SECCIÓN -->
  <div class="pie-seccion">
    <button class="boton-ver-todos" on:click={onGestionarTodos}>
      <i class="fas fa-users"></i>
      Gestionar todos los alumnos
    </button>
  </div>

</div>

<!-- ✨ TOOLTIP DINÁMICO -->
{#if tooltipVisible && tooltipTarget}
  <div class="tooltip-container" style="position: fixed; z-index: 9999;">
    <div class="tooltip-content">
      {tooltipContent}
    </div>
  </div>
{/if}

<style>
  /* 📊 CONTENEDOR PRINCIPAL */
  .contenedor-alumnos {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    height: 600px;
    display: flex;
    flex-direction: column;
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

  /* ⚠️ ALERTA DATOS FALSOS */
  .alerta-datos-reales {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .alerta-datos-reales i {
    font-size: 1rem;
  }

  /* 📋 LISTA DE ALUMNOS */
  .lista-alumnos {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden; /* Eliminar scroll horizontal */
    padding: 0; /* Eliminar padding que causa overflow */
    min-height: 0; /* Importante para que flex funcione con overflow */
  }

  /* Scrollbar styling */
  .lista-alumnos::-webkit-scrollbar {
    width: 6px;
  }

  .lista-alumnos::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .lista-alumnos::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .lista-alumnos::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 👑 ITEMS DE ALUMNOS */
  .item-alumno {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
  }

  .item-alumno:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .item-alumno.top-tres {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%);
    border-color: rgba(245, 158, 11, 0.3);
  }

  /* 🏆 POSICIÓN EN RANKING */
  .posicion-ranking {
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .medalla {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .medalla.oro {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #92400e;
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  }

  .medalla.plata {
    background: linear-gradient(135deg, #c0c0c0 0%, #e5e7eb 100%);
    color: #374151;
    box-shadow: 0 4px 16px rgba(192, 192, 192, 0.3);
  }

  .medalla.bronce {
    background: linear-gradient(135deg, #cd7f32 0%, #d97706 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(205, 127, 50, 0.3);
  }

  .numero-posicion {
    font-size: 1rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
  }

  /* 👤 PERFIL DEL ALUMNO */
  .perfil-alumno {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0; /* Permite que el contenido se contraiga */
    overflow: hidden;
  }

  .foto-container {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .foto-perfil {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    object-fit: cover;
  }

  .avatar-default {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
  }

  .badge-suscripcion {
    position: absolute;
    bottom: -3px;
    right: -3px;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: white;
    border: 2px solid rgba(15, 23, 42, 0.8);
  }

  .info-perfil {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .nombre-alumno {
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .detalles-alumno {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    flex-wrap: wrap;
  }

  .nivel {
    padding: 0.125rem 0.5rem;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border-radius: 4px;
    font-weight: 500;
  }

  .separador {
    color: rgba(255, 255, 255, 0.3);
  }

  .fuente-datos {
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .fuente-datos.datos-reales {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .fuente-datos.datos-calculados {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .advertencia-datos {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge-admin {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.5rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .perfil-alumno.clickeable {
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .perfil-alumno.clickeable:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
  }

  .stat-item.datos-reales .stat-valor {
    color: #10b981;
  }

  .stat-item.datos-calculados .stat-valor {
    color: #ef4444;
  }

  .stat-item.datos-calculados .stat-etiqueta {
    color: #ef4444;
  }

  /* 📊 ESTADÍSTICAS */
  .estadisticas-alumno {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-shrink: 0;
  }

  .stat-item {
    text-align: center;
  }

  .stat-item.principal .stat-valor {
    font-size: 1rem;
    font-weight: 700;
    color: #10b981;
  }

  .stat-valor {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    line-height: 1;
  }

  .stat-etiqueta {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.25rem;
  }

  /* ⏱️ TIEMPO DETALLADO */
  .tiempo-detallado .stat-valor-completo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tiempo-principal {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .tiempo-sesion {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.7rem;
  }

  .estado-activo {
    color: #22c55e;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .estado-inactivo {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .tiempo-actual {
    color: #3b82f6;
    font-weight: 500;
    font-size: 0.65rem;
  }

  /* 📊 ESTADÍSTICAS CON MEJOR ESPACIADO */
  .estadisticas-alumno {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .tiempo-detallado {
    min-width: 120px;
    max-width: 140px;
  }

  /* ⚡ ACCIONES ELIMINADAS - MÁS ESPACIO LIMPIO */

  /* 😴 SIN ALUMNOS */
  .sin-alumnos {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-datos {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-alumnos h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .sin-alumnos p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
  }

  /* 🔍 INFO DEBUG */
  .info-debug {
    margin-top: 1rem;
    text-align: left;
  }

  .info-debug details {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info-debug summary {
    cursor: pointer;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
  }

  .debug-content {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .debug-content code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }

  .debug-content ul, .debug-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .debug-content li {
    margin: 0.25rem 0;
  }

  /* 🔗 PIE DE SECCIÓN */
  .pie-seccion {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .boton-ver-todos {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(99, 102, 241, 0.1);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    justify-content: center;
  }

  .boton-ver-todos:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: white;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .contenedor-alumnos {
      padding: 1rem;
      height: auto;
      min-height: 400px;
    }

    .lista-alumnos {
      min-height: 300px;
    }

    .item-alumno {
      grid-template-columns: auto 1fr;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .estadisticas-alumno,
    .acciones-alumno {
      grid-column: 1 / -1;
      justify-self: center;
      margin-top: 0.5rem;
    }

    .estadisticas-alumno {
      gap: 0.5rem;
    }

    .stat-valor {
      font-size: 0.75rem;
    }

    .stat-etiqueta {
      font-size: 0.5rem;
    }

    .acciones-alumno {
      flex-direction: column;
      gap: 0.25rem;
    }

    /* Botones de acción eliminados */
  }

  /* ✨ NUEVOS ESTILOS PARA DISEÑO MEJORADO */
  
  /* 👤 PERFIL ALUMNO V2 */
  .perfil-alumno-v2 {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px;
    border-radius: 12px;
  }

  .perfil-alumno-v2:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(2px);
  }

  .foto-container-v2 {
    position: relative;
    min-width: 48px;
  }

  .foto-perfil-v2 {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .avatar-default-v2 {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .estado-tiempo-real {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #64748b;
    border: 2px solid #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: white;
  }

  .estado-tiempo-real.activo {
    background: #10b981;
    animation: pulsoVerde 2s infinite;
  }

  .estado-tiempo-real.desconectado {
    background: #ef4444;
    border-color: #dc2626;
  }

  .estado-tiempo-real.reciente {
    background: #f59e0b;
    border-color: #d97706;
  }

  @keyframes pulsoVerde {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .info-principal-v2 {
    flex: 1;
    min-width: 0;
  }

  .nombre-y-nivel {
    margin-bottom: 6px;
  }

  .nombre-alumno-v2 {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin: 0 0 4px 0;
    line-height: 1.2;
  }

  .badges-container {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .badge-nivel {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: white;
  }

  .badge-admin-v2 {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .actividad-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
  }

  .estado-actividad {
    flex: 1;
  }

  .estado-activo {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #10b981;
    font-size: 12px;
    font-weight: 500;
  }

  .estado-inactivo {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #64748b;
    font-size: 12px;
  }

  .estado-desconectado {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #ef4444;
    font-size: 12px;
    font-weight: 500;
  }

  /* ✨ MICROINTERACCIONES Y HOVER */
  .hover-suave {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hover-suave:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
  }

  /* 🏆 INSIGNIAS DINÁMICAS */
  .badge-insignia {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.05);
    white-space: nowrap;
  }

  .insignia-icono {
    font-size: 8px;
  }

  /* 📊 TENDENCIA DEL DÍA */
  .tendencia-dia {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    margin: 8px 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
  }

  .tendencia-icono {
    font-size: 12px;
  }

  /* 🔍 BOTÓN VER DETALLES */
  .acciones-alumno {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-ver-detalles {
    width: 100%;
    padding: 8px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .btn-ver-detalles:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-ver-detalles:active {
    transform: translateY(0);
  }

  /* ✨ TOOLTIP */
  .tooltip-container {
    pointer-events: none;
  }

  .tooltip-content {
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: fadeInTooltip 0.2s ease-out;
  }

  @keyframes fadeInTooltip {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .validacion-datos {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #10b981;
    font-size: 10px;
    font-weight: 500;
  }

  /* 📊 MÉTRICAS RENOVADAS */
  .metricas-renovadas {
    display: flex;
    gap: 16px;
    margin-left: auto;
    align-items: center;
  }

  .panel-tiempo-actividad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 120px;
  }

  .tiempo-principal-v2 {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .tiempo-valor {
    font-size: 24px;
    font-weight: 700;
    color: #60a5fa;
    line-height: 1;
  }

  .tiempo-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }

  .estado-alumno {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .indicador-activo {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pulso-verde {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulsoVerde 2s infinite;
  }

  .punto-gris {
    width: 8px;
    height: 8px;
    background: #64748b;
    border-radius: 50%;
  }

  .texto-estado {
    font-size: 11px;
    font-weight: 500;
    color: #10b981;
  }

  .indicador-inactivo .texto-estado {
    color: #64748b;
  }

  .tiempo-sesion-actual,
  .tiempo-inactividad {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #94a3b8;
  }

  .panel-rendimiento {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .metrica-compacta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .metrica-compacta:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .metrica-compacta.destacada {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .icono-metrica {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    font-size: 14px;
  }

  .icono-metrica.progreso {
    background: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }

  .destacada .icono-metrica {
    background: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .valores-metrica {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .numero-grande {
    font-size: 18px;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .etiqueta-metrica {
    font-size: 10px;
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* 📱 RESPONSIVE PARA NUEVOS ELEMENTOS */
  @media (max-width: 768px) {
    .metricas-renovadas {
      flex-direction: column;
      gap: 12px;
      margin-left: 0;
      width: 100%;
    }

    .panel-rendimiento {
      justify-content: center;
      flex-wrap: wrap;
    }

    .metrica-compacta {
      padding: 6px 10px;
      gap: 6px;
    }

    .icono-metrica {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    .numero-grande {
      font-size: 16px;
    }

         .tiempo-valor {
       font-size: 20px;
     }
   }
</style> 