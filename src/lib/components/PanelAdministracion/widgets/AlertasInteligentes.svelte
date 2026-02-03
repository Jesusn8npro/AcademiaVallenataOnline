<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  
  interface Alerta {
    id: string;
    tipo: 'warning' | 'info' | 'critical';
    titulo: string;
    mensaje: string;
    accion?: string;
    data?: any;
    timestamp: string;
  }
  
  let alertas: Alerta[] = [];
  let mostrarAlertas = false;
  let cargando = false;
  let contadorAlertas = 0;

  onMount(() => {
    verificarAlertas();
    // Verificar alertas cada 10 minutos (no muy frecuente)
    setInterval(verificarAlertas, 600000);
  });

  async function verificarAlertas() {
    if (cargando) return;
    
    try {
      cargando = true;
      alertas = [];
      
      await Promise.all([
        verificarUsuariosInactivos(),
        verificarNuevosUsuariosSinActividad(),
        verificarCaidaActividad(),
        verificarUsuariosSinCursos()
      ]);
      
      contadorAlertas = alertas.length;
      
    } catch (error) {
    } finally {
      cargando = false;
    }
  }

  async function verificarUsuariosInactivos() {
    try {
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Corregir la consulta para usar tablas existentes
      const { data: sesionesInactivas, error } = await supabase
        .from('sesiones_usuario')
        .select(`
          usuario_id,
          ultima_actividad,
          perfiles!usuario_id(nombre, apellido, correo_electronico)
        `)
        .lt('ultima_actividad', hace7Dias)
        .eq('esta_activo', false)
        .limit(10);

      if (error) {
        console.error('❌ [ALERTAS] Error verificando usuarios inactivos:', error);
        return;
      }

      if (sesionesInactivas && sesionesInactivas.length > 0) {
        alertas.push({
          id: 'usuarios_inactivos',
          tipo: 'warning',
          titulo: 'Usuarios Inactivos Detectados',
          mensaje: `${sesionesInactivas.length} usuarios no han iniciado sesión en los últimos 7 días`,
          accion: 'Enviar recordatorio',
          data: sesionesInactivas
        });
      }

    } catch (error) {
      console.error('❌ [ALERTAS] Error en verificarUsuariosInactivos:', error);
    }
  }

  async function verificarNuevosUsuariosSinActividad() {
    try {
      const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      // Usuarios registrados en los últimos 3 días pero sin actividad
      const { data: usuariosNuevos, error } = await supabase
        .from('perfiles')
        .select(`
                  id, nombre, apellido, correo_electronico, fecha_creacion,
        sesiones_usuario!left(usuario_id, created_at)
      `)
      .gte('fecha_creacion', hace3Dias)
        .eq('eliminado', false)
        .eq('rol', 'estudiante');

      if (error) {
        console.error('❌ [ALERTAS] Error verificando nuevos usuarios:', error);
        return;
      }

      const usuariosSinActividad = usuariosNuevos?.filter(u => 
        !u.sesiones_usuario || u.sesiones_usuario.length === 0
      ) || [];

      if (usuariosSinActividad.length > 0) {
        alertas.push({
          id: 'nuevos_sin_actividad',
          tipo: 'info',
          titulo: 'Nuevos Usuarios Sin Actividad',
          mensaje: `${usuariosSinActividad.length} usuarios nuevos no han iniciado sesión aún`,
          accion: 'Enviar bienvenida',
          data: usuariosSinActividad
        });
      }

    } catch (error) {
      console.error('❌ [ALERTAS] Error en verificarNuevosUsuariosSinActividad:', error);
    }
  }

  async function verificarCaidaActividad() {
    try {
      const hoy = new Date();
      const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
      const hace2Dias = new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Actividad de ayer vs hace 2 días
      const [{ count: actividadAyer }, { count: actividadAnteayer }] = await Promise.all([
        supabase
          .from('sesiones_usuario')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', ayer.toISOString().split('T')[0])
          .lt('created_at', hoy.toISOString().split('T')[0]),
        supabase
          .from('sesiones_usuario')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', hace2Dias.toISOString().split('T')[0])
          .lt('created_at', ayer.toISOString().split('T')[0])
      ]);

      if (actividadAnteayer > 0) {
        const cambio = ((actividadAyer - actividadAnteayer) / actividadAnteayer) * 100;
        
        if (cambio < -20) { // Caída del 20% o más
          alertas.push({
            id: 'caida_actividad',
            tipo: 'critical',
            titulo: 'Caída Significativa en Actividad',
            mensaje: `La actividad ha disminuido ${Math.abs(cambio).toFixed(1)}% respecto al día anterior`,
            accion: 'Analizar causas',
            data: { actividadAyer, actividadAnteayer, cambio }
          });
        }
      }

    } catch (error) {
      console.error('❌ [ALERTAS] Error en verificarCaidaActividad:', error);
    }
  }

  async function verificarUsuariosSinCursos() {
    try {
      // Usuarios sin inscripciones activas
      const { data: usuariosSinCursos, error } = await supabase
        .from('perfiles')
        .select(`
          id, nombre, apellido, correo_electronico,
          inscripciones!left(usuario_id, completado)
        `)
        .eq('eliminado', false)
        .eq('rol', 'estudiante')
        .limit(20);

      if (error) {
        console.error('❌ [ALERTAS] Error verificando usuarios sin cursos:', error);
        return;
      }

      const sinCursosActivos = usuariosSinCursos?.filter(u => 
        !u.inscripciones || u.inscripciones.length === 0
      ) || [];

      if (sinCursosActivos.length > 0) {
        alertas.push({
          id: 'usuarios_sin_cursos',
          tipo: 'warning',
          titulo: 'Usuarios Sin Cursos Asignados',
          mensaje: `${sinCursosActivos.length} usuarios no tienen cursos asignados`,
          accion: 'Asignar cursos',
          data: sinCursosActivos
        });
      }

    } catch (error) {
      console.error('❌ [ALERTAS] Error en verificarUsuariosSinCursos:', error);
    }
  }

  function toggleAlertas() {
    mostrarAlertas = !mostrarAlertas;
  }

  function cerrarAlerta(alertaId: string) {
    alertas = alertas.filter(a => a.id !== alertaId);
    contadorAlertas = alertas.length;
  }

  function manejarAccion(alerta: Alerta) {
    console.log('🎯 [ACCIÓN ALERTA]:', alerta);
    
    switch (alerta.id) {
      case 'usuarios_inactivos':
        // Abrir página de usuarios con filtro inactivos
        window.open('/administrador/usuarios?filtro=inactivos', '_blank');
        break;
      case 'nuevos_sin_actividad':
        // TODO: Implementar envío de emails
        alert('Funcionalidad de email próximamente');
        break;
      case 'usuarios_sin_cursos':
        // Abrir gestión de cursos
        window.open('/administrador/usuarios?filtro=sin_cursos', '_blank');
        break;
      default:
        console.log('Acción no implementada para:', alerta.id);
    }
    
    cerrarAlerta(alerta.id);
  }

  function getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  function getColorTipo(tipo: string): string {
    switch (tipo) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }
</script>

<!-- 🚨 INDICADOR DE ALERTAS -->
<div class="alertas-container">
  <button 
    class="alertas-toggle" 
    on:click={toggleAlertas}
    class:hay-alertas={contadorAlertas > 0}
    class:cargando={cargando}
  >
    <i class="fas fa-bell"></i>
    {#if contadorAlertas > 0}
      <span class="contador-alertas">{contadorAlertas}</span>
    {/if}
  </button>

  <!-- 📋 PANEL DE ALERTAS -->
  {#if mostrarAlertas}
    <div class="panel-alertas">
      <div class="alertas-header">
        <h4>🚨 Alertas del Sistema</h4>
        <button class="btn-refresh-alertas" on:click={verificarAlertas} disabled={cargando}>
          <i class="fas fa-sync-alt" class:girando={cargando}></i>
        </button>
      </div>

      <div class="alertas-lista">
        {#if alertas.length === 0}
          <div class="sin-alertas">
            ✅ Todo funcionando correctamente
          </div>
        {:else}
          {#each alertas as alerta (alerta.id)}
            <div class="alerta-item" style="border-left-color: {getColorTipo(alerta.tipo)}">
              <div class="alerta-contenido">
                <div class="alerta-header-item">
                  <span class="alerta-icono">{getIconoTipo(alerta.tipo)}</span>
                  <span class="alerta-titulo">{alerta.titulo}</span>
                  <button class="btn-cerrar-alerta" on:click={() => cerrarAlerta(alerta.id)}>
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                
                <p class="alerta-mensaje">{alerta.mensaje}</p>
                
                {#if alerta.accion}
                  <button 
                    class="btn-accion-alerta" 
                    on:click={() => manejarAccion(alerta)}
                    style="background-color: {getColorTipo(alerta.tipo)}20; color: {getColorTipo(alerta.tipo)}"
                  >
                    {alerta.accion}
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .alertas-container {
    position: relative;
  }

  .alertas-toggle {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s ease;
  }

  .alertas-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .alertas-toggle.hay-alertas {
    color: #f59e0b;
    animation: pulso-alerta 2s ease-in-out infinite;
  }

  .alertas-toggle.cargando {
    animation: girar 1s linear infinite;
  }

  .contador-alertas {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .panel-alertas {
    position: absolute;
    top: 60px;
    right: 0;
    width: 320px;
    background: rgba(15, 23, 42, 0.95);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    max-height: 400px;
    overflow: hidden;
  }

  .alertas-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .alertas-header h4 {
    margin: 0;
    color: white;
    font-size: 0.9rem;
  }

  .btn-refresh-alertas {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .btn-refresh-alertas:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .alertas-lista {
    max-height: 300px;
    overflow-y: auto;
  }

  .sin-alertas {
    padding: 2rem;
    text-align: center;
    color: #10b981;
    font-size: 0.9rem;
  }

  .alerta-item {
    border-left: 4px solid;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .alerta-header-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .alerta-icono {
    font-size: 1rem;
  }

  .alerta-titulo {
    flex: 1;
    color: white;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .btn-cerrar-alerta {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .btn-cerrar-alerta:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .alerta-mensaje {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }

  .btn-accion-alerta {
    background: transparent;
    border: 1px solid;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .btn-accion-alerta:hover {
    background: currentColor;
    color: white !important;
  }

  @keyframes pulso-alerta {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .panel-alertas {
      width: 280px;
      right: -120px;
    }
  }
</style> 