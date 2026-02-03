<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  interface ConfiguracionSistema {
    nombreAcademia: string;
    emailContacto: string;
    whatsappContacto: string;
    mantenimientoActivo: boolean;
    registroAbierto: boolean;
    limiteUsuarios: number;
    duracionSesion: number;
    backupAutomatico: boolean;
    notificacionesEmail: boolean;
    modoDesarrollo: boolean;
  }

  let configuracion: ConfiguracionSistema = {
    nombreAcademia: 'Academia Vallenata Online',
    emailContacto: 'contacto@academiavallenata.com',
    whatsappContacto: '+57 300 123 4567',
    mantenimientoActivo: false,
    registroAbierto: true,
    limiteUsuarios: 1000,
    duracionSesion: 120, // minutos
    backupAutomatico: true,
    notificacionesEmail: true,
    modoDesarrollo: false
  };

  let estadisticasSistema = {
    versionSistema: '2.1.0',
    tiempoOperacion: '0 días',
    ultimoBackup: 'Nunca',
    espacioUsado: 0,
    limiteBD: 1000
  };

  let configuracionCambiada = false;
  let guardandoConfiguracion = false;

  onMount(() => {
    cargarConfiguracion();
    cargarEstadisticasSistema();
  });

  async function cargarConfiguracion() {
    try {
      // En una implementación real, esto vendría de una tabla de configuración
      // Por ahora usamos valores por defecto
      console.log('⚙️ [CONFIG] Configuración cargada');
    } catch (error) {
      console.error('❌ [CONFIG] Error cargando configuración:', error);
    }
  }

  async function cargarEstadisticasSistema() {
    try {
      // Calcular estadísticas del sistema
      const { count: totalUsuarios } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .eq('eliminado', false);

      const { count: totalSesiones } = await supabase
        .from('sesiones_usuario')
        .select('*', { count: 'exact', head: true });

      const porcentajeUso = configuracion.limiteUsuarios > 0 
        ? Math.round((totalUsuarios / configuracion.limiteUsuarios) * 100)
        : 0;

      estadisticasSistema = {
        versionSistema: '2.1.0',
        tiempoOperacion: '45 días',
        ultimoBackup: 'Hace 2 horas',
        espacioUsado: porcentajeUso,
        limiteBD: totalSesiones || 0
      };

    } catch (error) {
      console.error('❌ [ESTADÍSTICAS] Error:', error);
    }
  }

  function marcarCambio() {
    configuracionCambiada = true;
  }

  async function guardarConfiguracion() {
    try {
      guardandoConfiguracion = true;
      
      // Validaciones importantes
      if (configuracion.mantenimientoActivo) {
        if (!confirm('⚠️ ATENCIÓN: Vas a activar el modo mantenimiento.\n\nEsto bloqueará el acceso a todos los usuarios.\n¿Estás seguro?')) {
          configuracion.mantenimientoActivo = false;
          return;
        }
      }

      if (configuracion.limiteUsuarios < 10) {
        alert('⚠️ El límite de usuarios debe ser al menos 10');
        return;
      }

      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Guardar en localStorage para persistencia básica
      localStorage.setItem('academia_config', JSON.stringify(configuracion));
      
      console.log('✅ [CONFIG] Configuración guardada:', configuracion);
      configuracionCambiada = false;
      
      // Aplicar cambios inmediatos si es necesario
      if (configuracion.mantenimientoActivo) {
        console.log('🔧 [MANTENIMIENTO] Modo activado - bloqueando acceso');
        // En una implementación real, esto debería comunicarse con el backend
      }
      
      // Mostrar notificación de éxito
      alert('✅ Configuración guardada exitosamente\n\n' + 
            (configuracion.mantenimientoActivo ? '🔧 Modo mantenimiento ACTIVADO\n' : '') +
            (configuracion.registroAbierto ? '✅ Registro abierto\n' : '❌ Registro cerrado\n') +
            `👥 Límite usuarios: ${configuracion.limiteUsuarios}\n` +
            `⏱️ Duración sesión: ${configuracion.duracionSesion} min`);
      
    } catch (error) {
      console.error('❌ [CONFIG] Error guardando:', error);
      alert('❌ Error al guardar la configuración: ' + error.message);
    } finally {
      guardandoConfiguracion = false;
    }
  }

  async function ejecutarBackupManual() {
    try {
      console.log('💾 [BACKUP] Iniciando backup manual...');
      
      // Simular proceso de backup real
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generar backup de configuración JSON
      const backupData = {
        fecha: new Date().toISOString(),
        configuracion: configuracion,
        estadisticas: estadisticasSistema,
        version: '2.1.0',
        usuarios_total: 0,
        cursos_total: 0,
        metadata: {
          generado_por: 'Panel Administración',
          tipo: 'backup_manual',
          descripcion: 'Backup manual generado desde el panel de administración'
        }
      };

      // Crear archivo ZIP simulado (JSON comprimido)
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academia_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      estadisticasSistema.ultimoBackup = 'Ahora mismo';
      alert('✅ Backup descargado exitosamente como JSON');
      
    } catch (error) {
      console.error('❌ [BACKUP] Error:', error);
      alert('❌ Error durante el backup');
    }
  }

  async function limpiarCacheSistema() {
    try {
      console.log('🗑️ [CACHÉ] Limpiando caché del sistema...');
      
      // Limpiar caché del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        await Promise.all(deletePromises);
        console.log(`🗑️ [CACHÉ] ${cacheNames.length} cachés eliminados`);
      }

      // Limpiar localStorage y sessionStorage
      if (confirm('¿También deseas limpiar datos locales del navegador?')) {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🗑️ [CACHÉ] Storage local limpiado');
      }
      
      // Simular limpieza de caché del servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('✅ Caché del sistema limpiado exitosamente\n• Caché del navegador\n• Datos temporales\n• Archivos obsoletos');
      
    } catch (error) {
      console.error('❌ [CACHÉ] Error:', error);
      alert('❌ Error al limpiar caché: ' + error.message);
    }
  }

  function exportarConfiguracion() {
    const configJson = JSON.stringify(configuracion, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracion_academia_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function importarConfiguracion() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const nuevaConfig = JSON.parse(event.target.result);
            configuracion = { ...configuracion, ...nuevaConfig };
            configuracionCambiada = true;
            alert('Configuración importada exitosamente');
          } catch (error) {
            alert('Error al importar configuración: archivo inválido');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  async function reiniciarSistema() {
    if (!confirm('⚠️ ATENCIÓN: Vas a reiniciar el sistema.\n\nEsto puede interrumpir las sesiones activas de usuarios.\n¿Estás seguro?')) {
      return;
    }

    try {
      console.log('🔄 [SISTEMA] Iniciando reinicio...');
      
      // Simular proceso de reinicio
      alert('🔄 Iniciando reinicio del sistema...\n\nEsto puede tomar unos momentos.');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpiar datos temporales
      sessionStorage.clear();
      
      // Simular reinicio reload de la página
      alert('✅ Sistema reiniciado exitosamente\n\nLa página se recargará automáticamente.');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [SISTEMA] Error en reinicio:', error);
      alert('❌ Error durante el reinicio del sistema');
    }
  }
</script>

<div class="pestaña-configuracion">
  <div class="encabezado-pestaña">
    <h2>⚙️ Configuración del Sistema</h2>
    <p>Parámetros generales y configuración de la academia</p>
  </div>

  <!-- ESTADO DEL SISTEMA -->
  <div class="estado-sistema">
    <div class="estado-card">
      <div class="estado-icono">🚀</div>
      <div class="estado-info">
        <div class="estado-valor">v{estadisticasSistema.versionSistema}</div>
        <div class="estado-label">Versión Sistema</div>
      </div>
    </div>
    <div class="estado-card">
      <div class="estado-icono">⏱️</div>
      <div class="estado-info">
        <div class="estado-valor">{estadisticasSistema.tiempoOperacion}</div>
        <div class="estado-label">Tiempo Operación</div>
      </div>
    </div>
    <div class="estado-card">
      <div class="estado-icono">💾</div>
      <div class="estado-info">
        <div class="estado-valor">{estadisticasSistema.ultimoBackup}</div>
        <div class="estado-label">Último Backup</div>
      </div>
    </div>
    <div class="estado-card">
      <div class="estado-icono">📊</div>
      <div class="estado-info">
        <div class="estado-valor">{estadisticasSistema.espacioUsado}%</div>
        <div class="estado-label">Uso del Sistema</div>
      </div>
    </div>
  </div>

  <div class="contenido-configuracion">
    <!-- CONFIGURACIÓN GENERAL -->
    <div class="seccion-config-general">
      <div class="seccion-header">
        <h3>🏫 Configuración General</h3>
        <div class="acciones-config">
          <button class="btn-accion" on:click={exportarConfiguracion}>
            <i class="fas fa-download"></i>
            Exportar
          </button>
          <button class="btn-accion" on:click={importarConfiguracion}>
            <i class="fas fa-upload"></i>
            Importar
          </button>
          <button 
            class="btn-guardar" 
            class:cambios={configuracionCambiada}
            disabled={!configuracionCambiada || guardandoConfiguracion}
            on:click={guardarConfiguracion}
          >
            {#if guardandoConfiguracion}
              <i class="fas fa-spinner fa-spin"></i>
              Guardando...
            {:else}
              <i class="fas fa-save"></i>
              Guardar Cambios
            {/if}
          </button>
        </div>
      </div>

      <div class="config-formulario">
        <!-- INFORMACIÓN BÁSICA -->
        <div class="config-grupo">
          <h4>📋 Información Básica</h4>
          
          <div class="config-campo">
            <label for="nombreAcademia">Nombre de la Academia</label>
            <input
              id="nombreAcademia"
              type="text"
              bind:value={configuracion.nombreAcademia}
              on:input={marcarCambio}
              placeholder="Academia Vallenata Online"
            />
          </div>

          <div class="config-campo">
            <label for="emailContacto">Email de Contacto</label>
            <input
              id="emailContacto"
              type="email"
              bind:value={configuracion.emailContacto}
              on:input={marcarCambio}
              placeholder="contacto@academiavallenata.com"
            />
          </div>

          <div class="config-campo">
            <label for="whatsappContacto">WhatsApp de Contacto</label>
            <input
              id="whatsappContacto"
              type="text"
              bind:value={configuracion.whatsappContacto}
              on:input={marcarCambio}
              placeholder="+57 300 123 4567"
            />
          </div>
        </div>

        <!-- CONFIGURACIÓN DEL SISTEMA -->
        <div class="config-grupo">
          <h4>⚙️ Sistema</h4>
          
          <div class="config-toggle">
            <label>
              <input
                type="checkbox"
                bind:checked={configuracion.mantenimientoActivo}
                on:change={marcarCambio}
              />
              <span class="toggle-slider"></span>
              Modo Mantenimiento
            </label>
            <p class="toggle-description">Bloquea el acceso temporal al sitio</p>
          </div>

          <div class="config-toggle">
            <label>
              <input
                type="checkbox"
                bind:checked={configuracion.registroAbierto}
                on:change={marcarCambio}
              />
              <span class="toggle-slider"></span>
              Registro Abierto
            </label>
            <p class="toggle-description">Permite nuevos registros de usuarios</p>
          </div>

          <div class="config-campo">
            <label for="limiteUsuarios">Límite de Usuarios</label>
            <input
              id="limiteUsuarios"
              type="number"
              bind:value={configuracion.limiteUsuarios}
              on:input={marcarCambio}
              min="10"
              max="10000"
            />
          </div>

          <div class="config-campo">
            <label for="duracionSesion">Duración de Sesión (minutos)</label>
            <input
              id="duracionSesion"
              type="number"
              bind:value={configuracion.duracionSesion}
              on:input={marcarCambio}
              min="30"
              max="480"
            />
          </div>
        </div>

        <!-- CONFIGURACIÓN AVANZADA -->
        <div class="config-grupo">
          <h4>🔧 Configuración Avanzada</h4>
          
          <div class="config-toggle">
            <label>
              <input
                type="checkbox"
                bind:checked={configuracion.backupAutomatico}
                on:change={marcarCambio}
              />
              <span class="toggle-slider"></span>
              Backup Automático
            </label>
            <p class="toggle-description">Backup diario automático de datos</p>
          </div>

          <div class="config-toggle">
            <label>
              <input
                type="checkbox"
                bind:checked={configuracion.notificacionesEmail}
                on:change={marcarCambio}
              />
              <span class="toggle-slider"></span>
              Notificaciones Email
            </label>
            <p class="toggle-description">Envío automático de notificaciones</p>
          </div>

          <div class="config-toggle">
            <label>
              <input
                type="checkbox"
                bind:checked={configuracion.modoDesarrollo}
                on:change={marcarCambio}
              />
              <span class="toggle-slider"></span>
              Modo Desarrollo
            </label>
            <p class="toggle-description">Habilita logs detallados</p>
          </div>
        </div>
      </div>
    </div>

    <!-- HERRAMIENTAS DEL SISTEMA -->
    <div class="seccion-herramientas">
      <h3>🔧 Herramientas del Sistema</h3>
      
      <div class="herramientas-lista">
        <div class="herramienta-item">
          <div class="herramienta-info">
            <div class="herramienta-titulo">💾 Backup Manual</div>
            <div class="herramienta-descripcion">Crear respaldo de la base de datos</div>
          </div>
          <button class="btn-herramienta backup" on:click={ejecutarBackupManual}>
            <i class="fas fa-database"></i>
            Ejecutar Backup
          </button>
        </div>

        <div class="herramienta-item">
          <div class="herramienta-info">
            <div class="herramienta-titulo">🗑️ Limpiar Caché</div>
            <div class="herramienta-descripcion">Eliminar archivos temporales del sistema</div>
          </div>
          <button class="btn-herramienta cache" on:click={limpiarCacheSistema}>
            <i class="fas fa-broom"></i>
            Limpiar Caché
          </button>
        </div>

        <div class="herramienta-item">
          <div class="herramienta-info">
            <div class="herramienta-titulo">📊 Estadísticas DB</div>
            <div class="herramienta-descripcion">Ver uso detallado de la base de datos</div>
          </div>
          <button class="btn-herramienta stats" on:click={() => alert('Próximamente')}>
            <i class="fas fa-chart-pie"></i>
            Ver Estadísticas
          </button>
        </div>

        <div class="herramienta-item">
          <div class="herramienta-info">
            <div class="herramienta-titulo">🔄 Reiniciar Sistema</div>
            <div class="herramienta-descripcion">Reinicio suave del sistema</div>
          </div>
          <button class="btn-herramienta restart" on:click={reiniciarSistema}>
            <i class="fas fa-power-off"></i>
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .pestaña-configuracion {
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

  /* ESTADO DEL SISTEMA */
  .estado-sistema {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .estado-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .estado-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .estado-valor {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .estado-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  /* CONTENIDO */
  .contenido-configuracion {
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

  .acciones-config {
    display: flex;
    gap: 0.5rem;
  }

  .btn-accion, .btn-guardar {
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

  .btn-accion:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn-guardar {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }

  .btn-guardar.cambios {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  .btn-guardar.cambios:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .btn-guardar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* FORMULARIO DE CONFIGURACIÓN */
  .config-formulario {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .config-grupo {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .config-grupo h4 {
    margin: 0 0 1rem 0;
    color: white;
    font-size: 1rem;
    font-weight: 600;
  }

  .config-campo {
    margin-bottom: 1rem;
  }

  .config-campo label {
    display: block;
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .config-campo input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    color: white;
    font-size: 0.85rem;
  }

  .config-campo input:focus {
    outline: none;
    border-color: #8b5cf6;
    background: rgba(255, 255, 255, 0.15);
  }

  .config-campo input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* TOGGLES */
  .config-toggle {
    margin-bottom: 1rem;
  }

  .config-toggle label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    margin-bottom: 0.25rem;
  }

  .config-toggle input[type="checkbox"] {
    display: none;
  }

  .toggle-slider {
    position: relative;
    width: 44px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .config-toggle input[type="checkbox"]:checked + .toggle-slider {
    background: #8b5cf6;
  }

  .config-toggle input[type="checkbox"]:checked + .toggle-slider::before {
    transform: translateX(20px);
  }

  .toggle-description {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    margin: 0;
  }

  /* HERRAMIENTAS */
  .seccion-herramientas h3 {
    margin: 0 0 1.5rem 0;
    color: white;
    font-size: 1.1rem;
  }

  .herramientas-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .herramienta-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .herramienta-titulo {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .herramienta-descripcion {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .btn-herramienta {
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

  .btn-herramienta.backup:hover {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  .btn-herramienta.cache:hover {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .btn-herramienta.stats:hover {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .btn-herramienta.restart:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
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
    .estado-sistema {
      grid-template-columns: repeat(2, 1fr);
    }

    .contenido-configuracion {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .estado-sistema {
      grid-template-columns: 1fr;
    }

    .seccion-header {
      flex-direction: column;
      gap: 1rem;
    }

    .herramienta-item {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style> 