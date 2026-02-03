<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import DetectorRetencion from '$lib/components/PanelAdministracion/widgets/DetectorRetencion.svelte';

  interface UsuarioInactivo {
    id: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    ultima_actividad: string;
    dias_inactivo: number;
    riesgo: 'alto' | 'medio' | 'bajo';
    tiempo_total_plataforma: number;
    cursos_inscritos: number;
    razon_principal: string;
  }

  let usuariosInactivos: UsuarioInactivo[] = [];
  let cargandoUsuariosInactivos = false;
  let estadisticasRetencion = {
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosInactivos: 0,
    tasaRetencion: 0,
    usuariosRiesgoAlto: 0,
    usuariosRiesgoMedio: 0
  };

  onMount(() => {
    cargarUsuariosInactivos();
  });

  async function cargarUsuariosInactivos() {
    try {
      cargandoUsuariosInactivos = true;
      console.log('⚠️ [RETENCIÓN] Cargando usuarios inactivos...');

      // Obtener usuarios que no han estado activos en los últimos 7 días
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: usuariosConActividad } = await supabase
        .from('perfiles')
        .select(`
          id, nombre, apellido, correo_electronico, created_at,
          sesiones_usuario!left(ultima_actividad, tiempo_total_minutos),
          inscripciones(id)
        `)
        .eq('eliminado', false)
        .eq('rol', 'estudiante');

      if (!usuariosConActividad) return;

      // Procesar usuarios para identificar inactivos
      const usuariosInactivosProcesados: UsuarioInactivo[] = [];
      let activosCount = 0;

      for (const usuario of usuariosConActividad) {
        const ultimaSesion = usuario.sesiones_usuario?.[0];
        const ultimaActividad = ultimaSesion?.ultima_actividad || usuario.created_at;
        const diasInactivo = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasInactivo >= 7) {
          // Usuario inactivo
          const tiempoTotal = ultimaSesion?.tiempo_total_minutos || 0;
          const cursosInscritos = usuario.inscripciones?.length || 0;
          
          let riesgo: 'alto' | 'medio' | 'bajo' = 'bajo';
          let razonPrincipal = 'Baja actividad general';

          // Calcular nivel de riesgo
          if (diasInactivo > 30) {
            riesgo = 'alto';
            razonPrincipal = 'Más de 30 días sin actividad';
          } else if (diasInactivo > 14) {
            riesgo = 'medio';
            razonPrincipal = 'Más de 2 semanas sin actividad';
          }

          if (cursosInscritos === 0) {
            riesgo = 'alto';
            razonPrincipal = 'No tiene cursos asignados';
          } else if (tiempoTotal < 30) {
            if (riesgo === 'bajo') riesgo = 'medio';
            razonPrincipal = 'Poco tiempo de uso de la plataforma';
          }

          usuariosInactivosProcesados.push({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo_electronico: usuario.correo_electronico,
            ultima_actividad: ultimaActividad,
            dias_inactivo: diasInactivo,
            riesgo,
            tiempo_total_plataforma: tiempoTotal,
            cursos_inscritos: cursosInscritos,
            razon_principal: razonPrincipal
          });
        } else {
          activosCount++;
        }
      }

      // Ordenar por riesgo y días de inactividad
      usuariosInactivos = usuariosInactivosProcesados.sort((a, b) => {
        const riesgoOrder = { alto: 3, medio: 2, bajo: 1 };
        if (riesgoOrder[a.riesgo] !== riesgoOrder[b.riesgo]) {
          return riesgoOrder[b.riesgo] - riesgoOrder[a.riesgo];
        }
        return b.dias_inactivo - a.dias_inactivo;
      });

      // Calcular estadísticas
      estadisticasRetencion = {
        totalUsuarios: usuariosConActividad.length,
        usuariosActivos: activosCount,
        usuariosInactivos: usuariosInactivos.length,
        tasaRetencion: Math.round((activosCount / usuariosConActividad.length) * 100),
        usuariosRiesgoAlto: usuariosInactivos.filter(u => u.riesgo === 'alto').length,
        usuariosRiesgoMedio: usuariosInactivos.filter(u => u.riesgo === 'medio').length
      };

      console.log(`✅ [RETENCIÓN] ${usuariosInactivos.length} usuarios inactivos identificados`);

    } catch (error) {
      console.error('❌ [RETENCIÓN] Error:', error);
    } finally {
      cargandoUsuariosInactivos = false;
    }
  }

  function obtenerColorRiesgo(riesgo: string): string {
    switch (riesgo) {
      case 'alto': return '#ef4444';
      case 'medio': return '#f59e0b';
      case 'bajo': return '#10b981';
      default: return '#6b7280';
    }
  }

  function obtenerIconoRiesgo(riesgo: string): string {
    switch (riesgo) {
      case 'alto': return '🚨';
      case 'medio': return '⚠️';
      case 'bajo': return '💡';
      default: return '❓';
    }
  }

  function formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffDias = Math.floor((ahora.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
    return `Hace ${Math.floor(diffDias / 30)} meses`;
  }

  function contactarUsuario(usuario: UsuarioInactivo) {
    const mensaje = `Hola ${usuario.nombre}, hemos notado que no has estado activo en nuestra academia. ¿Podemos ayudarte con algo?`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  function verDetallesUsuario(usuarioId: string) {
    window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
  }
</script>

<div class="pestaña-retencion">
  <div class="encabezado-pestaña">
    <h2>🎯 Herramientas de Retención</h2>
    <p>Detecta usuarios en riesgo y gestiona estrategias de retención</p>
  </div>

  <!-- ESTADÍSTICAS DE RETENCIÓN -->
  <div class="estadisticas-retencion">
    <div class="stat-card activos">
      <div class="stat-numero">{estadisticasRetencion.usuariosActivos}</div>
      <div class="stat-label">👥 Usuarios Activos</div>
    </div>
    <div class="stat-card inactivos">
      <div class="stat-numero">{estadisticasRetencion.usuariosInactivos}</div>
      <div class="stat-label">😴 Usuarios Inactivos</div>
    </div>
    <div class="stat-card retencion">
      <div class="stat-numero">{estadisticasRetencion.tasaRetencion}%</div>
      <div class="stat-label">📈 Tasa de Retención</div>
    </div>
    <div class="stat-card riesgo-alto">
      <div class="stat-numero">{estadisticasRetencion.usuariosRiesgoAlto}</div>
      <div class="stat-label">🚨 Riesgo Alto</div>
    </div>
  </div>

  <div class="contenido-retencion">
    <!-- DETECTOR DE RETENCIÓN ORIGINAL -->
    <div class="seccion-detector">
      <DetectorRetencion />
    </div>

    <!-- USUARIOS INACTIVOS REALES -->
    <div class="seccion-usuarios-inactivos">
      <div class="header-inactivos">
        <h3>👥 Usuarios Inactivos (Datos Reales)</h3>
        <button class="btn-refresh" on:click={cargarUsuariosInactivos} disabled={cargandoUsuariosInactivos}>
          <i class="fas fa-sync-alt" class:girando={cargandoUsuariosInactivos}></i>
          Actualizar
        </button>
      </div>

      {#if cargandoUsuariosInactivos}
        <div class="loading-usuarios">
          <div class="spinner"></div>
          <p>Analizando usuarios inactivos...</p>
        </div>
      {:else if usuariosInactivos.length === 0}
        <div class="sin-usuarios-inactivos">
          🎉 ¡Excelente! No hay usuarios inactivos
        </div>
      {:else}
        <div class="lista-usuarios-inactivos">
          {#each usuariosInactivos as usuario}
            <div class="usuario-inactivo-card">
              <div class="usuario-info">
                <div class="usuario-header">
                  <div class="usuario-nombre">{usuario.nombre} {usuario.apellido}</div>
                  <div class="riesgo-badge" style="background-color: {obtenerColorRiesgo(usuario.riesgo)}20; color: {obtenerColorRiesgo(usuario.riesgo)}">
                    {obtenerIconoRiesgo(usuario.riesgo)} {usuario.riesgo.toUpperCase()}
                  </div>
                </div>
                
                <div class="usuario-email">{usuario.correo_electronico}</div>
                
                <div class="usuario-stats">
                  <div class="stat-item">
                    <span class="stat-icon">⏰</span>
                    <span>Inactivo {usuario.dias_inactivo} días</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">📚</span>
                    <span>{usuario.cursos_inscritos} cursos</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span>{usuario.tiempo_total_plataforma}m total</span>
                  </div>
                </div>

                <div class="razon-principal">
                  <strong>Razón:</strong> {usuario.razon_principal}
                </div>

                <div class="ultima-actividad">
                  <strong>Última actividad:</strong> {formatearFecha(usuario.ultima_actividad)}
                </div>
              </div>

              <div class="usuario-acciones">
                <button class="btn-contactar" on:click={() => contactarUsuario(usuario)}>
                  <i class="fab fa-whatsapp"></i>
                  Contactar
                </button>
                <button class="btn-ver-detalles" on:click={() => verDetallesUsuario(usuario.id)}>
                  <i class="fas fa-eye"></i>
                  Ver Detalles
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pestaña-retencion {
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

  /* ESTADÍSTICAS DE RETENCIÓN */
  .estadisticas-retencion {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  .stat-numero {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .stat-card.activos .stat-numero { color: #10b981; }
  .stat-card.inactivos .stat-numero { color: #f59e0b; }
  .stat-card.retencion .stat-numero { color: #3b82f6; }
  .stat-card.riesgo-alto .stat-numero { color: #ef4444; }

  .contenido-retencion {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .seccion-detector {
    width: 100%;
  }

  /* USUARIOS INACTIVOS */
  .seccion-usuarios-inactivos {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-inactivos {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header-inactivos h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .btn-refresh {
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
    font-size: 0.85rem;
  }

  .btn-refresh:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn-refresh:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .girando {
    animation: girar 1s linear infinite;
  }

  .loading-usuarios {
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

  .sin-usuarios-inactivos {
    text-align: center;
    padding: 3rem;
    color: #10b981;
    font-size: 1.1rem;
    font-weight: 500;
  }

  /* LISTA DE USUARIOS INACTIVOS */
  .lista-usuarios-inactivos {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 600px;
    overflow-y: auto;
  }

  .usuario-inactivo-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 1.5rem;
    transition: all 0.2s ease;
  }

  .usuario-inactivo-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .usuario-info {
    flex: 1;
  }

  .usuario-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .usuario-nombre {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .riesgo-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .usuario-email {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .usuario-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
  }

  .stat-icon {
    opacity: 0.7;
  }

  .razon-principal,
  .ultima-actividad {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .razon-principal strong,
  .ultima-actividad strong {
    color: white;
  }

  /* ACCIONES DE USUARIO */
  .usuario-acciones {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-contactar,
  .btn-ver-detalles {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .btn-contactar {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .btn-contactar:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .btn-ver-detalles {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .btn-ver-detalles:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  /* RESPONSIVE */
  @media (max-width: 1200px) {
    .estadisticas-retencion {
      grid-template-columns: repeat(2, 1fr);
    }

    .usuario-inactivo-card {
      flex-direction: column;
      gap: 1rem;
    }

    .usuario-acciones {
      flex-direction: row;
    }
  }

  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .encabezado-pestaña p {
      font-size: 0.85rem;
    }

    .estadisticas-retencion {
      grid-template-columns: 1fr;
    }

    .header-inactivos {
      flex-direction: column;
      gap: 1rem;
    }

    .usuario-stats {
      flex-direction: column;
      gap: 0.5rem;
    }

    .lista-usuarios-inactivos {
      max-height: 400px;
    }
  }
</style> 