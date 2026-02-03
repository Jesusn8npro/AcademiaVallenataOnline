<script lang="ts">
  import { onMount } from 'svelte';
  import { geoLocationService, type DatosGeolocalizacion } from '$lib/services/geoLocationService';
  import { trackingGeoReal } from '$lib/services/trackingGeolocalizacionReal';

  export let usuario: any;

  interface HistorialGeolocalizacion {
    id: string;
    ip: string;
    pais: string;
    ciudad: string;
    isp: string;
    tipo_conexion: string;
    es_movil: boolean;
    es_vpn: boolean;
    primera_visita: string;
    ultima_visita: string;
    visitas_totales: number;
    bandera_url: string;
  }

  let historialGeo: HistorialGeolocalizacion[] = [];
  let ubicacionActual: HistorialGeolocalizacion | null = null;
  let estadisticasUsuario = {
    totalUbicaciones: 0,
    paisesVisitados: 0,
    ciudadesVisitadas: 0,
    conexionMovil: 0,
    usoVPN: 0,
    isp_principal: '',
    totalVisitas: 0
  };
  let cargandoGeo = false;

  onMount(() => {
    if (usuario?.id) {
      cargarHistorialGeolocalizacion();
    }
  });

  // 🔥 FUNCIÓN PARA FORZAR TRACKING MANUAL
  let ejecutandoTracking = false;
  
  async function forzarTrackingManual() {
    try {
      ejecutandoTracking = true;
      console.log('🚀 [MANUAL] Iniciando tracking manual de geolocalización...');
      
      // Ejecutar tracking completo
      const exito = await trackingGeoReal.ejecutarTrackingCompleto();
      
      if (exito) {
        console.log('✅ [MANUAL] Tracking completado exitosamente');
        // Recargar el historial para mostrar los nuevos datos
        await cargarHistorialGeolocalizacion();
      } else {
        console.log('❌ [MANUAL] Error en el tracking manual');
      }
      
    } catch (error) {
      console.error('❌ [MANUAL] Error ejecutando tracking manual:', error);
    } finally {
      ejecutandoTracking = false;
    }
  }

  async function cargarHistorialGeolocalizacion() {
    try {
      cargandoGeo = true;
      console.log(`🌍 [GEO-USER] Cargando historial REAL para usuario: ${usuario.id}`);

      // 🔥 CARGAR HISTORIAL REAL DE LA BASE DE DATOS
      const historial = await geoLocationService.obtenerHistorialUsuario(usuario.id);
      
      if (historial && historial.length > 0) {
        console.log(`✅ [GEO-USER] Historial REAL encontrado: ${historial.length} ubicaciones`);
        
        historialGeo = historial.map(h => ({
          id: h.ip + '_' + h.fecha_registro,
          ip: h.ip,
          pais: h.pais,
          ciudad: h.ciudad,
          isp: h.isp,
          tipo_conexion: h.tipo_conexion,
          es_movil: h.es_movil,
          es_vpn: h.es_vpn,
          primera_visita: h.fecha_registro,
          ultima_visita: h.fecha_registro, // En el futuro será diferente
          visitas_totales: 1, // En el futuro será el total real
          bandera_url: h.bandera_url
        }));
        
        // La ubicación más reciente es la primera
        ubicacionActual = historialGeo[0];
        
        console.log(`📍 [GEO-USER] Ubicación actual REAL: ${ubicacionActual.ciudad}, ${ubicacionActual.pais}`);
        
      } else {
        console.log(`⚠️ [GEO-USER] No hay historial real de geolocalización`);
        historialGeo = [];
        ubicacionActual = null;
      }

      calcularEstadisticasUsuario();

    } catch (error) {
      console.error('❌ [GEO-USER] Error cargando historial REAL:', error);
      historialGeo = [];
      ubicacionActual = null;
    } finally {
      cargandoGeo = false;
    }
  }

  function cargarDatosEjemplo() {
    // Simular historial de ubicaciones del usuario
    historialGeo = [
      {
        id: '1',
        ip: '190.144.200.123',
        pais: 'Colombia',
        ciudad: 'Valledupar',
        isp: 'Tigo Colombia',
        tipo_conexion: 'Móvil',
        es_movil: true,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        visitas_totales: 45,
        bandera_url: 'https://flagcdn.com/32x24/co.png'
      },
      {
        id: '2',
        ip: '201.158.45.78',
        pais: 'Colombia',
        ciudad: 'Bogotá',
        isp: 'Claro Colombia',
        tipo_conexion: 'Fija',
        es_movil: false,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 23,
        bandera_url: 'https://flagcdn.com/32x24/co.png'
      },
      {
        id: '3',
        ip: '186.97.156.89',
        pais: 'Colombia',
        ciudad: 'Medellín',
        isp: 'Movistar Colombia',
        tipo_conexion: 'Móvil',
        es_movil: true,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 8,
        bandera_url: 'https://flagcdn.com/32x24/co.png'
      },
      {
        id: '4',
        ip: '172.68.146.92',
        pais: 'Estados Unidos',
        ciudad: 'Miami',
        isp: 'Cloudflare',
        tipo_conexion: 'Fija',
        es_movil: false,
        es_vpn: true,
        primera_visita: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 3,
        bandera_url: 'https://flagcdn.com/32x24/us.png'
      },
      {
        id: '5',
        ip: '185.199.108.153',
        pais: 'España',
        ciudad: 'Madrid',
        isp: 'GitHub',
        tipo_conexion: 'Fija',
        es_movil: false,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 6,
        bandera_url: 'https://flagcdn.com/32x24/es.png'
      },
      {
        id: '6',
        ip: '177.54.173.98',
        pais: 'Brasil',
        ciudad: 'São Paulo',
        isp: 'Vivo Brasil',
        tipo_conexion: 'Móvil',
        es_movil: true,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 4,
        bandera_url: 'https://flagcdn.com/32x24/br.png'
      },
      {
        id: '7',
        ip: '190.216.208.72',
        pais: 'Colombia',
        ciudad: 'Cartagena',
        isp: 'ETB',
        tipo_conexion: 'Fija',
        es_movil: false,
        es_vpn: false,
        primera_visita: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        ultima_visita: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        visitas_totales: 11,
        bandera_url: 'https://flagcdn.com/32x24/co.png'
      }
    ];

    ubicacionActual = historialGeo[0];
    calcularEstadisticasUsuario();
  }

  function calcularEstadisticasUsuario() {
    const paisesUnicos = [...new Set(historialGeo.map(h => h.pais))];
    const ciudadesUnicas = [...new Set(historialGeo.map(h => h.ciudad))];
    const conexionesMoviles = historialGeo.filter(h => h.es_movil);
    const conexionesVPN = historialGeo.filter(h => h.es_vpn);
    
    // ISP más utilizado
    const ispCount: { [key: string]: number } = {};
    historialGeo.forEach(h => {
      ispCount[h.isp] = (ispCount[h.isp] || 0) + h.visitas_totales;
    });
    const ispPrincipal = Object.entries(ispCount).sort(([,a], [,b]) => b - a)[0];

    estadisticasUsuario = {
      totalUbicaciones: historialGeo.length,
      paisesVisitados: paisesUnicos.length,
      ciudadesVisitadas: ciudadesUnicas.length,
      conexionMovil: conexionesMoviles.length,
      usoVPN: conexionesVPN.length,
      isp_principal: ispPrincipal ? ispPrincipal[0] : 'Desconocido',
      totalVisitas: historialGeo.reduce((sum, h) => sum + h.visitas_totales, 0)
    };
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaEvento = new Date(fecha);
    const diferencia = ahora.getTime() - fechaEvento.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 60) {
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas}h`;
    } else {
      return `Hace ${dias}d`;
    }
  }

  function obtenerIconoConexion(ubicacion: HistorialGeolocalizacion): string {
    if (ubicacion.es_vpn) return '🛡️';
    if (ubicacion.es_movil) return '📱';
    return '💻';
  }

  function obtenerColorSeguridad(ubicacion: HistorialGeolocalizacion): string {
    if (ubicacion.es_vpn) return '#f59e0b'; // Amarillo para VPN
    if (ubicacion.pais !== 'Colombia') return '#ef4444'; // Rojo para internacional
    return '#10b981'; // Verde para nacional normal
  }

  function exportarHistorialGeo() {
    const datosExport = {
      usuario_id: usuario.id,
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
      fecha_reporte: new Date().toISOString(),
      estadisticas: estadisticasUsuario,
      ubicacion_actual: ubicacionActual,
      historial_completo: historialGeo
    };

    const jsonData = JSON.stringify(datosExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geolocalizacion_${usuario.nombre}_${usuario.apellido}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function detectarRiesgo(ubicacion: HistorialGeolocalizacion): 'alto' | 'medio' | 'bajo' {
    if (ubicacion.es_vpn && ubicacion.pais !== 'Colombia') return 'alto';
    if (ubicacion.es_vpn || ubicacion.pais !== 'Colombia') return 'medio';
    return 'bajo';
  }

  function obtenerColorRiesgo(riesgo: string): string {
    switch (riesgo) {
      case 'alto': return '#ef4444';
      case 'medio': return '#f59e0b';
      case 'bajo': return '#10b981';
      default: return '#6b7280';
    }
  }
</script>

<div class="pestaña-geolocalizacion">
  <div class="header-geo">
    <div class="titulo-geo">
      <h3>🌍 Geolocalización de {usuario.nombre}</h3>
      <p>Historial de ubicaciones e información de conectividad</p>
    </div>
    <div class="botones-geo">
      <button 
        class="btn-tracking-manual" 
        on:click={forzarTrackingManual}
        disabled={ejecutandoTracking}
      >
        {#if ejecutandoTracking}
          <div class="spinner-small"></div>
          Capturando IP...
        {:else}
          <i class="fas fa-location-arrow"></i>
          Capturar Ubicación Real
        {/if}
      </button>
      <button class="btn-exportar" on:click={exportarHistorialGeo}>
        <i class="fas fa-download"></i>
        Exportar Historial
      </button>
    </div>
  </div>

  {#if cargandoGeo}
    <div class="loading-geo">
      <div class="spinner"></div>
      <p>Cargando datos de geolocalización...</p>
    </div>
  {:else}
    
    <!-- UBICACIÓN ACTUAL -->
    {#if ubicacionActual}
      {@const riesgo = detectarRiesgo(ubicacionActual)}
      <div class="ubicacion-actual">
        <div class="ubicacion-header">
          <h4>📍 Ubicación Actual</h4>
          <div class="estado-conexion" style="background-color: {obtenerColorSeguridad(ubicacionActual)}20; color: {obtenerColorSeguridad(ubicacionActual)}">
            {obtenerIconoConexion(ubicacionActual)} Conectado
          </div>
        </div>
        
        <div class="ubicacion-details">
          <div class="detalle-principal">
            <img src={ubicacionActual.bandera_url} alt={ubicacionActual.pais} />
            <div class="lugar-info">
              <div class="lugar-nombre">{ubicacionActual.ciudad}, {ubicacionActual.pais}</div>
              <div class="lugar-ip">{ubicacionActual.ip}</div>
            </div>
          </div>
          
          <div class="detalles-conexion">
            <div class="detalle-item">
              <span class="detalle-label">ISP:</span>
              <span class="detalle-valor">{ubicacionActual.isp}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Conexión:</span>
              <span class="detalle-valor">{ubicacionActual.tipo_conexion}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Última actividad:</span>
              <span class="detalle-valor">{formatearTiempoRelativo(ubicacionActual.ultima_visita)}</span>
            </div>
            <div class="detalle-item">
              <span class="detalle-label">Visitas desde esta IP:</span>
              <span class="detalle-valor">{ubicacionActual.visitas_totales}</span>
            </div>
          </div>
        </div>
        
        <!-- Indicador de riesgo -->
        <div class="indicador-riesgo" style="border-color: {obtenerColorRiesgo(riesgo)}">
          <div class="riesgo-icono" style="color: {obtenerColorRiesgo(riesgo)}">
            {riesgo === 'alto' ? '🚨' : riesgo === 'medio' ? '⚠️' : '✅'}
          </div>
          <div class="riesgo-info">
            <div class="riesgo-nivel" style="color: {obtenerColorRiesgo(riesgo)}">
              Riesgo {riesgo.toUpperCase()}
            </div>
            <div class="riesgo-descripcion">
              {riesgo === 'alto' ? 'VPN desde el extranjero' : 
               riesgo === 'medio' ? 'Conexión internacional o VPN' : 
               'Conexión local normal'}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- ESTADÍSTICAS RÁPIDAS -->
    <div class="estadisticas-usuario">
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.totalUbicaciones}</div>
        <div class="stat-label">Ubicaciones</div>
      </div>
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.paisesVisitados}</div>
        <div class="stat-label">Países</div>
      </div>
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.ciudadesVisitadas}</div>
        <div class="stat-label">Ciudades</div>
      </div>
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.totalVisitas}</div>
        <div class="stat-label">Total Visitas</div>
      </div>
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.conexionMovil}</div>
        <div class="stat-label">Conexiones Móviles</div>
      </div>
      <div class="stat-item">
        <div class="stat-numero">{estadisticasUsuario.usoVPN}</div>
        <div class="stat-label">Uso de VPN</div>
      </div>
    </div>

    <!-- HISTORIAL COMPLETO -->
    <div class="historial-geo">
      <h4>📋 Historial de Ubicaciones ({historialGeo.length})</h4>
      
      <div class="lista-historial">
        {#each historialGeo as ubicacion, index}
          <div class="historial-item" class:actual={index === 0}>
            <div class="historial-orden">
              {index === 0 ? '🟢' : index + 1}
            </div>
            
            <div class="historial-lugar">
              <div class="lugar-principal">
                <img src={ubicacion.bandera_url} alt={ubicacion.pais} />
                <div class="lugar-datos">
                  <div class="lugar-nombre">{ubicacion.ciudad}, {ubicacion.pais}</div>
                  <div class="lugar-ip">{ubicacion.ip}</div>
                </div>
              </div>
            </div>
            
            <div class="historial-conexion">
              <div class="conexion-tipo">
                {obtenerIconoConexion(ubicacion)} {ubicacion.tipo_conexion}
              </div>
              <div class="conexion-isp">{ubicacion.isp}</div>
            </div>
            
            <div class="historial-tiempo">
              <div class="tiempo-fecha">{formatearFecha(ubicacion.primera_visita)}</div>
              <div class="tiempo-relativo">{formatearTiempoRelativo(ubicacion.ultima_visita)}</div>
            </div>
            
            <div class="historial-visitas">
              <div class="visitas-numero">{ubicacion.visitas_totales}</div>
              <div class="visitas-label">visitas</div>
            </div>
            
            <div class="historial-riesgo">
              <div class="riesgo-badge" style="background-color: {obtenerColorRiesgo(detectarRiesgo(ubicacion))}20; color: {obtenerColorRiesgo(detectarRiesgo(ubicacion))}">
                {detectarRiesgo(ubicacion)}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

  {/if}
</div>

<style>
  .pestaña-geolocalizacion {
    width: 100%;
    animation: fadeIn 0.3s ease;
  }

  .header-geo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .titulo-geo h3 {
    margin: 0 0 0.25rem 0;
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .titulo-geo p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }

  .botones-geo {
    display: flex;
    gap: 1rem;
  }

  .btn-tracking-manual {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    flex: 1; /* Allow buttons to grow */
  }

  .btn-tracking-manual:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  .btn-tracking-manual:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.1);
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-exportar {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    flex: 1;
  }

  .btn-exportar:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  /* UBICACIÓN ACTUAL */
  .ubicacion-actual {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .ubicacion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .ubicacion-header h4 {
    margin: 0;
    color: white;
    font-size: 1rem;
  }

  .estado-conexion {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .ubicacion-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .detalle-principal {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .detalle-principal img {
    border-radius: 4px;
  }

  .lugar-nombre {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .lugar-ip {
    color: rgba(255, 255, 255, 0.6);
    font-family: monospace;
    font-size: 0.85rem;
  }

  .detalles-conexion {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detalle-item {
    display: flex;
    justify-content: space-between;
  }

  .detalle-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }

  .detalle-valor {
    color: white;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .indicador-riesgo {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid;
    background: rgba(255, 255, 255, 0.02);
  }

  .riesgo-icono {
    font-size: 1.2rem;
  }

  .riesgo-nivel {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .riesgo-descripcion {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }

  /* ESTADÍSTICAS */
  .estadisticas-usuario {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    transition: transform 0.2s ease;
  }

  .stat-item:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  .stat-numero {
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  /* HISTORIAL */
  .historial-geo h4 {
    margin: 0 0 1rem 0;
    color: white;
    font-size: 1rem;
  }

  .lista-historial {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .historial-item {
    display: grid;
    grid-template-columns: auto 2fr 1.5fr 1.5fr auto auto;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 8px;
    align-items: center;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .historial-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }

  .historial-item.actual {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  .historial-orden {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .lugar-principal {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .lugar-datos .lugar-nombre {
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .lugar-datos .lugar-ip {
    font-size: 0.75rem;
  }

  .historial-conexion {
    text-align: center;
  }

  .conexion-tipo {
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .conexion-isp {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .historial-tiempo {
    text-align: center;
  }

  .tiempo-fecha {
    color: white;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .tiempo-relativo {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .historial-visitas {
    text-align: center;
  }

  .visitas-numero {
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .visitas-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
  }

  .riesgo-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .loading-geo {
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
    .estadisticas-usuario {
      grid-template-columns: repeat(3, 1fr);
    }

    .ubicacion-details {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .historial-item {
      grid-template-columns: 1fr;
      gap: 0.75rem;
      text-align: center;
    }
  }

  @media (max-width: 768px) {
    .header-geo {
      flex-direction: column;
      gap: 1rem;
    }

    .botones-geo {
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-tracking-manual {
      width: 100%;
    }

    .estadisticas-usuario {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style> 