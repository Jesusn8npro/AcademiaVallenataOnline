<!-- 🌍 COMPONENTE DE GEOLOCALIZACIÓN LIMPIO - IPAPI.CO -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { servicioGeoEspanol } from '$lib/services/servicioGeolocalizacionEspanol';

  // Interfaces
  interface UbicacionUsuario {
    usuario_id: string;
    usuario_nombre: string;
    ip: string;
    pais: string;
    ciudad: string;
    bandera_url: string;
    ultima_visita: string;
    visitas_totales: number;
  }

  interface Estadisticas {
    totalUsuarios: number;
    paisesUnicos: number;
    totalVisitas: number;
    usuariosMoviles: number;
    usuariosVPN: number;
    paisesPrincipales: Array<{pais: string, total_usuarios: number}>;
  }

  // Variables de estado
  let ubicaciones: UbicacionUsuario[] = [];
  let estadisticas: Estadisticas = {
    totalUsuarios: 0,
    paisesUnicos: 0,
    totalVisitas: 0,
    usuariosMoviles: 0,
    usuariosVPN: 0,
    paisesPrincipales: []
  };
  let cargando = true;
  let error = '';
  let hayDatosReales = false;

  onMount(() => {
    cargarDatos();
  });

  async function cargarDatos() {
    try {
      cargando = true;
      error = '';
      
  
      
      await Promise.all([
        cargarUbicaciones(),
        cargarEstadisticas()
      ]);

    } catch (err) {
      error = 'Error cargando datos de geolocalización';
    } finally {
      cargando = false;
    }
  }

  async function cargarUbicaciones() {
    try {
      // Obtener ubicaciones desde Supabase
      const { data: geoData, error: geoError } = await supabase
        .from('geolocalizacion_usuarios')
        .select('*')
        .order('ultima_visita', { ascending: false })
        .limit(10);

      if (geoError) {
        console.error('❌ [GEO-WIDGET] Error en consulta:', geoError);
        return;
      }

      if (!geoData || geoData.length === 0) {
        console.log('📋 [GEO-WIDGET] No hay datos de geolocalización');
        ubicaciones = [];
        hayDatosReales = false;
        return;
      }

      // Obtener información de usuarios
      const usuarioIds = geoData.map(g => g.usuario_id);
      const { data: perfiles, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, nombre_completo')
        .in('id', usuarioIds);

      if (perfilError) {
        console.error('❌ [GEO-WIDGET] Error consultando perfiles:', perfilError);
      }

      // Combinar datos
      ubicaciones = geoData.map((geo: any) => {
        const perfil = perfiles?.find(p => p.id === geo.usuario_id);
        const nombreCompleto = perfil?.nombre_completo || 
                               (perfil?.nombre && perfil?.apellido ? `${perfil.nombre} ${perfil.apellido}` : null) ||
                               perfil?.nombre || 
                               'Usuario';

        return {
          usuario_id: geo.usuario_id,
          usuario_nombre: nombreCompleto,
          ip: geo.ip,
          pais: geo.pais || 'Desconocido',
          ciudad: geo.ciudad || 'Desconocida',
          bandera_url: geo.bandera_url || `https://flagcdn.com/32x24/xx.png`,
          ultima_visita: geo.ultima_visita,
          visitas_totales: geo.visitas_totales || 1
        };
      });

      hayDatosReales = true;
      console.log('✅ [GEO-WIDGET] Datos cargados:', ubicaciones.length, 'ubicaciones');

    } catch (error) {
      console.error('❌ [GEO-WIDGET] Error cargando ubicaciones:', error);
    }
  }

  async function cargarEstadisticas() {
    try {
      const stats = await servicioGeoEspanol.obtenerEstadisticas();
      
      if (stats && stats.length > 0) {
        const totalUsuarios = stats.reduce((sum: number, s: any) => sum + parseInt(s.total_usuarios), 0);
        const totalVisitas = stats.reduce((sum: number, s: any) => sum + parseInt(s.total_visitas), 0);
        
        estadisticas = {
          totalUsuarios,
          paisesUnicos: stats.length,
          totalVisitas,
          usuariosMoviles: stats.reduce((sum: number, s: any) => sum + parseInt(s.usuarios_moviles), 0),
          usuariosVPN: stats.reduce((sum: number, s: any) => sum + parseInt(s.usuarios_vpn), 0),
          paisesPrincipales: stats.slice(0, 5).map((s: any) => ({
            pais: s.pais,
            total_usuarios: parseInt(s.total_usuarios)
          }))
        };
        
        console.log('📊 [GEO-WIDGET] Estadísticas cargadas:', estadisticas);
      }

    } catch (error) {
      console.error('❌ [GEO-WIDGET] Error cargando estadísticas:', error);
    }
  }

  function formatearTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaVisita = new Date(fecha);
    const diferencia = ahora.getTime() - fechaVisita.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    
    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    return fechaVisita.toLocaleDateString('es-ES');
  }

  async function actualizarDatos() {
    await cargarDatos();
  }
</script>

<div class="widget-geolocalizacion">
  <!-- HEADER -->
  <div class="widget-header">
    <div class="header-info">
      <h3>🌍 Geolocalización de Usuarios</h3>
      <p class="header-subtitle">
        {#if hayDatosReales}
          <span class="badge-real">DATOS REALES</span> Ubicaciones reales de usuarios conectados
        {:else}
          <span class="badge-vacio">SIN DATOS</span> Esperando usuarios con geolocalización
        {/if}
      </p>
    </div>
    
    <div class="header-acciones">
      <button class="btn-actualizar" on:click={actualizarDatos} disabled={cargando}>
        <i class="fas fa-sync-alt" class:fa-spin={cargando}></i>
        Actualizar
      </button>
    </div>
  </div>

  {#if cargando}
    <div class="estado-carga">
      <div class="spinner"></div>
      <p>Cargando datos de geolocalización...</p>
    </div>
  {:else if error}
    <div class="estado-error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{error}</p>
    </div>
  {:else}
    <!-- ESTADÍSTICAS -->
    <div class="estadisticas-grid">
      <div class="stat-card">
        <div class="stat-numero">{estadisticas.totalUsuarios}</div>
        <div class="stat-label">Usuarios</div>
      </div>
      <div class="stat-card">
        <div class="stat-numero">{estadisticas.paisesUnicos}</div>
        <div class="stat-label">Países</div>
      </div>
      <div class="stat-card">
        <div class="stat-numero">{estadisticas.totalVisitas}</div>
        <div class="stat-label">Visitas</div>
      </div>
    </div>

    <!-- LISTA DE UBICACIONES -->
    <div class="ubicaciones-contenedor">
      <h4>📍 Ubicaciones Recientes ({ubicaciones.length})</h4>
      
      {#if ubicaciones.length > 0}
        <div class="ubicaciones-lista">
          {#each ubicaciones as ubicacion}
            <div class="ubicacion-item">
              <div class="usuario-info">
                <div class="usuario-avatar">
                  {ubicacion.usuario_nombre.charAt(0).toUpperCase()}
                </div>
                <div class="usuario-detalles">
                  <div class="usuario-nombre">{ubicacion.usuario_nombre}</div>
                  <div class="usuario-ip">{ubicacion.ip}</div>
                </div>
              </div>

              <div class="ubicacion-geo">
                <div class="geo-principal">
                  <img src={ubicacion.bandera_url} alt={ubicacion.pais} class="bandera" />
                  <span class="ubicacion-texto">{ubicacion.ciudad}, {ubicacion.pais}</span>
                </div>
                <div class="geo-tiempo">
                  {formatearTiempoRelativo(ubicacion.ultima_visita)} • {ubicacion.visitas_totales} visitas
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="sin-datos">
          <div class="sin-datos-icono">🌍</div>
          <h4>No hay datos de geolocalización</h4>
          <p>Las ubicaciones aparecerán cuando los usuarios visiten el sitio.</p>
          <p><strong>✅ El tracking automático está activado con ipapi.co</strong></p>
        </div>
      {/if}
    </div>

    <!-- PAÍSES PRINCIPALES -->
    {#if estadisticas.paisesPrincipales.length > 0}
      <div class="paises-principales">
        <h4>🏆 Países Principales</h4>
        <div class="paises-lista">
          {#each estadisticas.paisesPrincipales as pais}
            <div class="pais-item">
              <div class="pais-info">
                <img src="https://flagcdn.com/24x18/{pais.pais.toLowerCase().slice(0,2)}.png" alt={pais.pais} />
                <span class="pais-nombre">{pais.pais}</span>
              </div>
              <div class="pais-usuarios">{pais.total_usuarios} usuarios</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .widget-geolocalizacion {
    background: #ffffff !important;
    border-radius: 16px;
    padding: 2rem;
    border: 2px solid #e2e8f0 !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .widget-header h3 {
    margin: 0 0 0.5rem 0;
    color: #1a202c !important;
    font-size: 1.4rem;
    font-weight: 800;
  }

  .header-subtitle {
    margin: 0;
    font-size: 1rem;
    color: #4a5568 !important;
    font-weight: 500;
  }

  .badge-real {
    background: #38a169 !important;
    color: #ffffff !important;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-vacio {
    background: #e2e8f0 !important;
    color: #2d3748 !important;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-actualizar {
    background: #3182ce !important;
    color: #ffffff !important;
    border: 2px solid #2c5282 !important;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-actualizar:hover:not(:disabled) {
    background: #2c5282 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }

  .btn-actualizar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .estado-carga, .estado-error {
    text-align: center;
    padding: 3rem;
    color: #2d3748 !important;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3182ce;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .estadisticas-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: #f7fafc !important;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 2px solid #e2e8f0 !important;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3182ce !important;
  }

  .stat-numero {
    font-size: 2rem;
    font-weight: 900;
    color: #1a202c !important;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #4a5568 !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ubicaciones-contenedor h4, .paises-principales h4 {
    color: #1a202c !important;
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ubicaciones-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ubicacion-item {
    background: #f8fafc !important;
    border-radius: 12px;
    padding: 1.5rem;
    border: 2px solid #e2e8f0 !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
  }

  .ubicacion-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3182ce !important;
  }

  .usuario-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .usuario-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3182ce, #1e40af) !important;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff !important;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);
  }

  .usuario-nombre {
    color: #1a202c !important;
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .usuario-ip {
    color: #4a5568 !important;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .ubicacion-geo {
    text-align: right;
  }

  .geo-principal {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
  }

  .bandera {
    width: 28px;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .ubicacion-texto {
    color: #1a202c !important;
    font-size: 1rem;
    font-weight: 600;
  }

  .geo-tiempo {
    color: #4a5568 !important;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .sin-datos {
    text-align: center;
    padding: 3rem;
    background: #f8fafc !important;
    border-radius: 16px;
    border: 2px dashed #cbd5e1 !important;
  }

  .sin-datos-icono {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.7;
  }

  .sin-datos h4 {
    color: #1a202c !important;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .sin-datos p {
    color: #4a5568 !important;
    margin: 0.75rem 0;
    font-size: 1rem;
    line-height: 1.6;
  }

  .sin-datos p strong {
    color: #38a169 !important;
    font-weight: 700;
  }

  .paises-principales {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
  }

  .paises-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pais-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc !important;
    border-radius: 12px;
    border: 2px solid #e2e8f0 !important;
    transition: all 0.3s ease;
  }

  .pais-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #3182ce !important;
  }

  .pais-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pais-info img {
    width: 28px;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .pais-nombre {
    color: #1a202c !important;
    font-size: 1rem;
    font-weight: 600;
  }

  .pais-usuarios {
    color: #3182ce !important;
    font-size: 0.9rem;
    font-weight: 700;
    background: #eff6ff;
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .widget-header {
      flex-direction: column;
      gap: 1rem;
    }

    .estadisticas-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .ubicacion-item {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
      padding: 1.25rem;
    }

    .geo-principal {
      justify-content: center;
    }

    .ubicacion-geo {
      text-align: center;
    }

    .usuario-info {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }

    .widget-geolocalizacion {
      padding: 1.5rem;
    }
  }
</style> 