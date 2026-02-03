<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';

  interface EstadisticasUsuarios {
    totalUsuarios: number;
    nuevosEsteMes: number;
    activosUltimos7Dias: number;
    estudiantesActivos: number;
    administradores: number;
    usuariosConCursos: number;
    promedioTiempoPlataforma: number;
    tasaRetencion: number;
  }

  let estadisticas: EstadisticasUsuarios = {
    totalUsuarios: 0,
    nuevosEsteMes: 0,
    activosUltimos7Dias: 0,
    estudiantesActivos: 0,
    administradores: 0,
    usuariosConCursos: 0,
    promedioTiempoPlataforma: 0,
    tasaRetencion: 0
  };

  let usuariosRecientes: any[] = [];
  let cargando = false;

  onMount(() => {
    cargarEstadisticasUsuarios();
  });

  async function cargarEstadisticasUsuarios() {
    try {
      cargando = true;
      console.log('👥 [USUARIOS] Cargando estadísticas...');

      await Promise.all([
        cargarEstadisticasGenerales(),
        cargarUsuariosRecientes()
      ]);

    } catch (error) {
      console.error('❌ [USUARIOS] Error:', error);
    } finally {
      cargando = false;
    }
  }

  async function cargarEstadisticasGenerales() {
    // Total usuarios
    const { count: totalUsuarios } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .eq('eliminado', false);

    // Nuevos este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const { count: nuevosEsteMes } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes.toISOString())
      .eq('eliminado', false);

    // Activos últimos 7 días
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activosUltimos7Dias } = await supabase
      .from('sesiones_usuario')
      .select('usuario_id', { count: 'exact', head: true })
      .gte('ultima_actividad', hace7Dias);

    // Estudiantes y administradores
    const { count: estudiantesActivos } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'estudiante')
      .eq('eliminado', false);

    const { count: administradores } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'administrador')
      .eq('eliminado', false);

    // Usuarios con cursos
    const { count: usuariosConCursos } = await supabase
      .from('inscripciones')
      .select('usuario_id', { count: 'exact', head: true });

    // Tiempo promedio en plataforma
    const { data: tiemposSesiones } = await supabase
      .from('sesiones_usuario')
      .select('tiempo_total_minutos')
      .not('tiempo_total_minutos', 'is', null);

    let promedioTiempoPlataforma = 0;
    if (tiemposSesiones && tiemposSesiones.length > 0) {
      const tiempoTotal = tiemposSesiones.reduce((sum, s) => sum + (s.tiempo_total_minutos || 0), 0);
      promedioTiempoPlataforma = Math.round(tiempoTotal / tiemposSesiones.length);
    }

    // Tasa de retención (usuarios activos en los últimos 30 días vs total)
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activosUltimos30Dias } = await supabase
      .from('sesiones_usuario')
      .select('usuario_id', { count: 'exact', head: true })
      .gte('ultima_actividad', hace30Dias);

    const tasaRetencion = totalUsuarios > 0 ? Math.round((activosUltimos30Dias / totalUsuarios) * 100) : 0;

    estadisticas = {
      totalUsuarios: totalUsuarios || 0,
      nuevosEsteMes: nuevosEsteMes || 0,
      activosUltimos7Dias: activosUltimos7Dias || 0,
      estudiantesActivos: estudiantesActivos || 0,
      administradores: administradores || 0,
      usuariosConCursos: usuariosConCursos || 0,
      promedioTiempoPlataforma,
      tasaRetencion
    };
  }

  async function cargarUsuariosRecientes() {
    const { data: usuarios } = await supabase
      .from('perfiles')
      .select(`
        id, nombre, apellido, correo_electronico, rol, created_at, url_foto_perfil,
        sesiones_usuario!left(ultima_actividad, esta_activo)
      `)
      .eq('eliminado', false)
      .order('created_at', { ascending: false })
      .limit(8);

    usuariosRecientes = usuarios || [];
  }

  function irAGestionCompleta() {
    goto('/administrador/usuarios');
  }

  function irAUsuarioEspecifico(usuarioId: string) {
    window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatearTiempo(minutos: number): string {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  }

  function obtenerEstadoUsuario(usuario: any): { texto: string; color: string } {
    if (!usuario.sesiones_usuario || usuario.sesiones_usuario.length === 0) {
      return { texto: 'Sin actividad', color: '#6b7280' };
    }

    const sesion = usuario.sesiones_usuario[0];
    if (sesion.esta_activo) {
      return { texto: 'En línea', color: '#10b981' };
    }

    const ultimaActividad = new Date(sesion.ultima_actividad);
    const horasDesdeActividad = (Date.now() - ultimaActividad.getTime()) / (1000 * 60 * 60);

    if (horasDesdeActividad < 1) {
      return { texto: 'Hace poco', color: '#f59e0b' };
    } else if (horasDesdeActividad < 24) {
      return { texto: 'Hoy', color: '#3b82f6' };
    } else {
      return { texto: 'Inactivo', color: '#6b7280' };
    }
  }
</script>

<div class="pestaña-usuarios">
  <div class="encabezado-pestaña">
    <h2>👥 Gestión de Usuarios</h2>
    <p>Estadísticas de usuarios y acceso rápido a la gestión completa</p>
  </div>

  <!-- ESTADÍSTICAS PRINCIPALES -->
  <div class="estadisticas-usuarios">
    <div class="stat-card">
      <div class="stat-icono">👥</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticas.totalUsuarios}</div>
        <div class="stat-label">Total Usuarios</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">🆕</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticas.nuevosEsteMes}</div>
        <div class="stat-label">Nuevos Este Mes</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">⚡</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticas.activosUltimos7Dias}</div>
        <div class="stat-label">Activos (7 días)</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">📚</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticas.usuariosConCursos}</div>
        <div class="stat-label">Con Cursos</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">⏱️</div>
      <div class="stat-info">
        <div class="stat-numero">{formatearTiempo(estadisticas.promedioTiempoPlataforma)}</div>
        <div class="stat-label">Tiempo Promedio</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icono">📈</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticas.tasaRetencion}%</div>
        <div class="stat-label">Tasa Retención</div>
      </div>
    </div>
  </div>

  <div class="contenido-usuarios">
    <!-- USUARIOS RECIENTES -->
    <div class="seccion-usuarios-recientes">
      <div class="seccion-header">
        <h3>🆕 Usuarios Recientes</h3>
        <button class="btn-gestion-completa" on:click={irAGestionCompleta}>
          <i class="fas fa-users-cog"></i>
          Gestión Completa
        </button>
      </div>

      {#if cargando}
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      {:else if usuariosRecientes.length === 0}
        <div class="sin-usuarios">
          👥 No hay usuarios recientes
        </div>
      {:else}
        <div class="usuarios-grid">
          {#each usuariosRecientes as usuario}
            {@const estado = obtenerEstadoUsuario(usuario)}
            <div class="usuario-card" on:click={() => irAUsuarioEspecifico(usuario.id)}>
              <div class="usuario-avatar">
                {#if usuario.url_foto_perfil}
                  <img src={usuario.url_foto_perfil} alt={usuario.nombre} />
                {:else}
                  <div class="avatar-placeholder">
                    <i class="fas fa-user"></i>
                  </div>
                {/if}
                <div class="estado-indicator" style="background-color: {estado.color}"></div>
              </div>
              
              <div class="usuario-info">
                <div class="usuario-nombre">{usuario.nombre} {usuario.apellido}</div>
                <div class="usuario-email">{usuario.correo_electronico}</div>
                <div class="usuario-meta">
                  <span class="usuario-rol">{usuario.rol}</span>
                  <span class="usuario-estado" style="color: {estado.color}">{estado.texto}</span>
                </div>
                <div class="usuario-fecha">Registrado: {formatearFecha(usuario.created_at)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- ACCIONES RÁPIDAS -->
    <div class="seccion-acciones-rapidas">
      <h3>⚡ Acciones Rápidas</h3>
      
      <div class="acciones-grid">
        <button class="accion-card" on:click={() => goto('/administrador/usuarios')}>
          <div class="accion-icono">👥</div>
          <div class="accion-info">
            <div class="accion-titulo">Gestionar Usuarios</div>
            <div class="accion-descripcion">Ver todos los usuarios registrados</div>
          </div>
        </button>

        <button class="accion-card" on:click={() => goto('/administrador/usuarios?filtro=nuevos')}>
          <div class="accion-icono">🆕</div>
          <div class="accion-info">
            <div class="accion-titulo">Usuarios Nuevos</div>
            <div class="accion-descripcion">Revisar registros recientes</div>
          </div>
        </button>

        <button class="accion-card" on:click={() => goto('/administrador/usuarios?filtro=inactivos')}>
          <div class="accion-icono">😴</div>
          <div class="accion-info">
            <div class="accion-titulo">Usuarios Inactivos</div>
            <div class="accion-descripcion">Identificar usuarios sin actividad</div>
          </div>
        </button>

        <button class="accion-card" on:click={() => goto('/administrador/usuarios')}>
          <div class="accion-icono">📚</div>
          <div class="accion-info">
            <div class="accion-titulo">Asignar Cursos</div>
            <div class="accion-descripcion">Inscribir usuarios en paquetes</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .pestaña-usuarios {
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

  /* ESTADÍSTICAS */
  .estadisticas-usuarios {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  .stat-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .stat-numero {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  /* CONTENIDO */
  .contenido-usuarios {
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

  .btn-gestion-completa {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .btn-gestion-completa:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  /* USUARIOS RECIENTES */
  .usuarios-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .usuario-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    gap: 1rem;
  }

  .usuario-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .usuario-avatar {
    position: relative;
  }

  .usuario-avatar img,
  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  .avatar-placeholder {
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .estado-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(15, 23, 42, 1);
  }

  .usuario-info {
    flex: 1;
  }

  .usuario-nombre {
    font-weight: 600;
    color: white;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .usuario-email {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .usuario-meta {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .usuario-rol {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .usuario-estado {
    font-size: 0.7rem;
    font-weight: 500;
  }

  .usuario-fecha {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
  }

  /* ACCIONES RÁPIDAS */
  .seccion-acciones-rapidas h3 {
    margin: 0 0 1.5rem 0;
    color: white;
    font-size: 1.1rem;
  }

  .acciones-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .accion-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
  }

  .accion-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .accion-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .accion-titulo {
    font-weight: 600;
    color: white;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .accion-descripcion {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .loading {
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

  .sin-usuarios {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
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
    .estadisticas-usuarios {
      grid-template-columns: repeat(3, 1fr);
    }

    .contenido-usuarios {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .usuarios-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .estadisticas-usuarios {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-card {
      padding: 1rem;
    }

    .seccion-header {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style> 