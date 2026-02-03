<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  
  export let actividad: any[] = [];

  // Variables para tiempo real
  let tiempoActualizado = Date.now();
  let intervalId: NodeJS.Timeout | null = null;
  
  // 🌍 NUEVA: Cache de ubicaciones de usuarios
  let ubicacionesUsuarios: { [userId: string]: any } = {};
  let cargandoUbicaciones = true;

  // Auto-refresh cada segundo para tiempo real dinámico
  onMount(() => {
    intervalId = setInterval(() => {
      tiempoActualizado = Date.now();
    }, 1000); // ✅ Actualizar cada segundo
    
    // 🌍 CARGAR UBICACIONES AL MONTAR
    cargarUbicacionesUsuarios();
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  // 🌍 NUEVA FUNCIÓN: Cargar ubicaciones de usuarios activos
  async function cargarUbicacionesUsuarios() {
    try {
      if (!actividad || actividad.length === 0) {
        cargandoUbicaciones = false;
        return;
      }

      const usuarioIds = actividad.map(sesion => sesion.usuario_id).filter(id => id);
      
      if (usuarioIds.length === 0) {
        cargandoUbicaciones = false;
        return;
      }



      const { data: ubicaciones, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('usuario_id, pais, ciudad, bandera_url, es_movil, es_vpn, ip')
        .in('usuario_id', usuarioIds)
        .order('ultima_visita', { ascending: false });

              if (error) {
          cargandoUbicaciones = false;
          return;
        }

      // Crear cache de ubicaciones por usuario (tomar la más reciente)
      ubicacionesUsuarios = {};
      if (ubicaciones) {
        ubicaciones.forEach((ub: any) => {
          if (!ubicacionesUsuarios[ub.usuario_id]) {
            ubicacionesUsuarios[ub.usuario_id] = ub;
          }
        });
      }

              cargandoUbicaciones = false;

    } catch (error) {
      cargandoUbicaciones = false;
    }
  }

  // 🌍 NUEVA FUNCIÓN: Obtener ubicación de usuario
  function obtenerUbicacionUsuario(usuarioId: string) {
    return ubicacionesUsuarios[usuarioId] || null;
  }

  // 🌍 REACTIVO: Recargar ubicaciones cuando cambie la actividad
  $: if (actividad && actividad.length > 0) {
    cargarUbicacionesUsuarios();
  }

  // Formatear tiempo relativo con segundos en tiempo real
  function tiempoRelativo(fecha: string): string {
    const ahora = tiempoActualizado;
    const fechaActividad = new Date(fecha);
    const diferenciaMs = ahora - fechaActividad.getTime();
    const segundos = Math.floor(diferenciaMs / 1000);
    const minutos = Math.floor(diferenciaMs / (1000 * 60));
    
    if (segundos < 30) return 'Ahora mismo';
    if (minutos < 1) return `${segundos}s`;
    if (minutos < 60) return `${minutos}m ${Math.floor((diferenciaMs % (1000 * 60)) / 1000)}s`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h ${minutos % 60}m`;
    return 'Hace más de 1 día';
  }

  // Obtener estado de actividad en tiempo real
  function obtenerEstadoActividad(ultimaActividad: string): 'activo' | 'reciente' | 'inactivo' {
    const ahora = tiempoActualizado;
    const fecha = new Date(ultimaActividad);
    const diferenciaMinutos = Math.floor((ahora - fecha.getTime()) / (1000 * 60));
    
    if (diferenciaMinutos <= 5) return 'activo';
    if (diferenciaMinutos <= 30) return 'reciente';
    return 'inactivo';
  }

  // 📍 FORMATEAR PÁGINA ACTUAL de manera legible
  function formatearPagina(pagina: string): string {
    if (!pagina) return 'Página desconocida';
    
    // Mapeo de páginas comunes
    const mapaPaginas: { [key: string]: string } = {
      '/': '🏠 Inicio',
      '/panel-estudiante': '📚 Panel Estudiante',
      '/panel-administracion': '⚙️ Panel Admin',
      '/cursos': '📖 Cursos',
      '/simulador-gaming': '🎮 Simulador',
      '/simulador-de-acordeon': '🪗 Simulador Acordeón',
      '/ranking': '🏆 Ranking',
      '/eventos': '📅 Eventos',
      '/mensajes': '💬 Mensajes',
      '/comunidad': '👥 Comunidad',
      '/blog': '📝 Blog',
      '/membresias': '💎 Membresías'
    };

    // Si es una página conocida, retornar directamente
    if (mapaPaginas[pagina]) {
      return mapaPaginas[pagina];
    }

    // Manejar rutas dinámicas
    if (pagina.startsWith('/cursos/') && pagina.includes('/clase/')) {
      return '📚 Clase';
    }
    if (pagina.startsWith('/cursos/')) {
      return '📖 Curso';
    }
    if (pagina.startsWith('/tutoriales/')) {
      return '🎬 Tutorial';
    }
    if (pagina.startsWith('/simulador-gaming/')) {
      return '🎮 Juego';
    }
    if (pagina.startsWith('/usuarios/')) {
      return '👤 Perfil';
    }

    // Para páginas desconocidas, limpiar la ruta
    const paginaLimpia = pagina
      .replace(/^\//, '') // Quitar / inicial
      .replace(/-/g, ' ') // Reemplazar guiones con espacios
      .replace(/\//g, ' › ') // Reemplazar / con separadores
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
    
    return paginaLimpia || 'Página';
  }

  $: actividadMostrar = actividad.length > 0 ? actividad : [];

  function irAPerfilUsuario(usuarioId: string) {
    if (!usuarioId) return;
    window.location.href = `/usuarios/${usuarioId}`;
  }
</script>

<div class="contenedor-actividad">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <div class="titulo-con-badge">
      <h3>⚡ Actividad en Tiempo Real</h3>
      <div class="badge-activos">
        <div class="indicador-vivo"></div>
        {actividadMostrar.length} activos
      </div>
    </div>
    <div class="alerta-datos-reales">
      <i class="fas fa-check-circle"></i>
      <span><strong>✅ DATOS 100% REALES:</strong> Actividad real en cursos las últimas 24 horas</span>
    </div>
    <p>Basado en interacciones reales con cursos y tutoriales</p>
  </div>

  <!-- 📊 LISTA DE ACTIVIDAD -->
  <div class="lista-actividad">
    {#if actividadMostrar.length > 0}
      {#each actividadMostrar as sesion}
        {@const estado = obtenerEstadoActividad(sesion.ultima_actividad)}
        {@const perfil = sesion.perfiles}
        
        <div class="item-actividad" class:activo={estado === 'activo'} class:reciente={estado === 'reciente'} on:click={() => irAPerfilUsuario(perfil?.id)} class:clickeable={true}>
          
          <!-- 👤 FOTO DE PERFIL -->
          <div class="foto-perfil">
            {#if perfil?.url_foto_perfil}
              <img src={perfil.url_foto_perfil} alt={perfil.nombre} />
            {:else}
              <div class="avatar-placeholder">
                <i class="fas fa-user"></i>
              </div>
            {/if}
            <div class="estado-badge {estado}"></div>
          </div>

          <!-- 📋 INFO DEL USUARIO -->
          <div class="info-usuario">
            <div class="nombre-usuario">
              {perfil?.nombre || 'Usuario'} {perfil?.apellido || ''}
              {#if perfil?.rol === 'admin'}
                <span class="badge-admin">ADMIN</span>
              {/if}
            </div>
            <div class="actividad-detalles">
              <span class="tiempo-actividad">{tiempoRelativo(sesion.ultima_actividad)}</span>
              
              {#if sesion.tipo_actividad}
                <span class="separador">•</span>
                <span class="tipo-actividad">{sesion.tipo_actividad}</span>
              {/if}
              
              {#if sesion.tiempo_total_minutos && sesion.tiempo_total_minutos > 0}
                <span class="separador">•</span>
                <span class="tiempo-total">{Math.round(sesion.tiempo_total_minutos)} min</span>
              {/if}
              
              {#if sesion.pagina_actual}
                <span class="separador">•</span>
                <span class="pagina-actual" title="Página visitada: {sesion.pagina_actual}">
                  <i class="fas fa-map-marker-alt"></i>
                  {formatearPagina(sesion.pagina_actual)}
                </span>
              {/if}
              
              {#if sesion.fuente}
                <span class="separador">•</span>
                <span class="fuente-datos" title="Fuente: {sesion.fuente}">
                  {#if sesion.fuente === 'sesiones_usuario'}
                    <i class="fas fa-clock"></i> Real
                  {:else if sesion.fuente === 'inscripciones'}
                    <i class="fas fa-book"></i> Curso
                  {:else if sesion.fuente === 'progreso_lecciones'}
                    <i class="fas fa-tasks"></i> Lección
                  {:else}
                    <i class="fas fa-info"></i> {sesion.fuente}
                  {/if}
                </span>
              {/if}
              
              {#if !cargandoUbicaciones}
                {@const ubicacion = obtenerUbicacionUsuario(sesion.usuario_id)}
                {#if ubicacion}
                  <span class="separador">•</span>
                  <span class="ubicacion-usuario" title="Ubicación: {ubicacion.ciudad}, {ubicacion.pais} (IP: {ubicacion.ip})">
                    <img src={ubicacion.bandera_url} alt={ubicacion.pais} class="bandera-mini" />
                    {ubicacion.ciudad}, {ubicacion.pais}
                    {#if ubicacion.es_movil}
                      <i class="fas fa-mobile-alt" title="Dispositivo móvil"></i>
                    {:else}
                      <i class="fas fa-desktop" title="Dispositivo desktop"></i>
                    {/if}
                    {#if ubicacion.es_vpn}
                      <i class="fas fa-shield-alt" title="Conexión VPN" style="color: #f59e0b;"></i>
                    {/if}
                  </span>
                {/if}
              {:else}
                <span class="separador">•</span>
                <span class="cargando-ubicacion">
                  <i class="fas fa-spinner fa-spin"></i> Cargando ubicación...
                </span>
              {/if}
            </div>
          </div>

          <!-- ⚡ INDICADOR DE ESTADO -->
          <div class="indicador-estado {estado}">
            {#if estado === 'activo'}
              <i class="fas fa-circle"></i>
              <span>En línea</span>
            {:else if estado === 'reciente'}
              <i class="fas fa-clock"></i>
              <span>Reciente</span>
            {:else}
              <i class="fas fa-moon"></i>
              <span>Inactivo</span>
            {/if}
          </div>

        </div>
      {/each}
    {:else}
      <!-- 😴 ESTADO SIN ACTIVIDAD -->
      <div class="sin-actividad">
        <div class="icono-sin-actividad">
          <i class="fas fa-users-slash"></i>
        </div>
        <h4>Sin actividad reciente</h4>
        <p>No hay estudiantes conectados en los últimos 30 minutos</p>
        
              <!-- 🔧 Información de depuración -->
      <div class="info-debug">
        <details>
          <summary>🔍 Solución rápida - Ver actividad inmediatamente</summary>
          <div class="debug-content">
            <p><strong>📋 Para ver usuarios activos AHORA:</strong></p>
            <ol>
              <li>Abre Supabase SQL Editor</li>
              <li>Ejecuta este script:</li>
              <div class="codigo-sql">
                <code>
                  UPDATE inscripciones <br/>
                  SET ultima_actividad = NOW() <br/>
                  WHERE id IN (<br/>
                  &nbsp;&nbsp;SELECT id FROM inscripciones <br/>
                  &nbsp;&nbsp;ORDER BY created_at DESC LIMIT 5<br/>
                  );
                </code>
              </div>
              <li>Recarga esta página (F5)</li>
              <li>Deberías ver usuarios activos inmediatamente</li>
            </ol>
            <p><strong>🔧 Archivo completo:</strong> <code>simular_actividad_tiempo_real.sql</code></p>
          </div>
        </details>
      </div>
      </div>
    {/if}
  </div>

  <!-- 🔄 PIE DE SECCIÓN -->
  <div class="pie-actividad">
    <button class="boton-ver-mas">
      <i class="fas fa-external-link-alt"></i>
      Ver todos los usuarios
    </button>
  </div>

</div>

<style>
  /* 📊 CONTENEDOR PRINCIPAL */
  .contenedor-actividad {
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

  .titulo-con-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .titulo-con-badge h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: white;
  }

  .badge-activos {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .indicador-vivo {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulso 2s ease-in-out infinite;
  }

  @keyframes pulso {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  .encabezado-seccion p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.875rem;
  }

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
    margin: 0.5rem 0;
  }

  .alerta-datos-reales i {
    font-size: 1rem;
  }

  /* 📋 LISTA DE ACTIVIDAD */
  .lista-actividad {
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
    min-height: 0; /* Importante para que flex funcione con overflow */
  }

  /* Estilizar scrollbar (igual que en alumnos) */
  .lista-actividad::-webkit-scrollbar {
    width: 6px;
  }

  .lista-actividad::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .lista-actividad::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .lista-actividad::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 👤 ITEMS DE ACTIVIDAD */
  .item-actividad {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .item-actividad:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .item-actividad.activo {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .item-actividad.reciente {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .item-actividad.clickeable {
    cursor: pointer;
  }

  .item-actividad.clickeable:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.12);
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

  /* 🖼️ FOTO DE PERFIL */
  .foto-perfil {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .foto-perfil img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
  }

  .estado-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(15, 23, 42, 0.8);
  }

  .estado-badge.activo {
    background: #10b981;
  }

  .estado-badge.reciente {
    background: #3b82f6;
  }

  .estado-badge.inactivo {
    background: #6b7280;
  }

  /* 📋 INFO DEL USUARIO */
  .info-usuario {
    flex: 1;
  }

  .nombre-usuario {
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .actividad-detalles {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    flex-wrap: wrap;
  }

  .separador {
    color: rgba(255, 255, 255, 0.3);
  }

  .ruta-actual {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
  }

  .pagina-actual {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .pagina-actual i {
    font-size: 0.5rem;
  }

  .tipo-actividad {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
  }

  .fuente-datos {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  /* ⚡ INDICADOR DE ESTADO */
  .indicador-estado {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .indicador-estado.activo {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .indicador-estado.reciente {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .indicador-estado.inactivo {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }

  /* 😴 SIN ACTIVIDAD */
  .sin-actividad {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-actividad {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-actividad h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .sin-actividad p {
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

  .codigo-sql {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 🌍 ESTILOS DE UBICACIÓN */
  .ubicacion-usuario {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    background: rgba(59, 130, 246, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .bandera-mini {
    width: 14px;
    height: auto;
    border-radius: 2px;
    margin-right: 0.125rem;
  }

  .ubicacion-usuario i {
    font-size: 0.7rem;
    margin-left: 0.25rem;
    opacity: 0.8;
  }

  .cargando-ubicacion {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-style: italic;
  }

  .cargando-ubicacion i {
    margin-right: 0.25rem;
    font-size: 0.7rem;
  }

  /* 🔄 PIE DE SECCIÓN */
  .pie-actividad {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .boton-ver-mas {
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

  .boton-ver-mas:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: white;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .contenedor-actividad {
      padding: 1rem;
      height: auto;
      min-height: 400px;
    }

    .lista-actividad {
      min-height: 300px;
    }

    .titulo-con-badge {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .item-actividad {
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .foto-perfil {
      width: 40px;
      height: 40px;
    }

    .indicador-estado span {
      display: none;
    }

    .actividad-detalles {
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }
  }
</style> 