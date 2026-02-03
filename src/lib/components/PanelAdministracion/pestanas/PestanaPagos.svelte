<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  interface EstadisticasPagos {
    totalIngresos: number;
    ingresosEsteMes: number;
    transaccionesExitosas: number;
    transaccionesPendientes: number;
    transaccionesRechazadas: number;
    ticketPromedio: number;
    crecimientoMensual: number;
    tasaExito: number;
  }

  interface TransaccionPago {
    id: string;
    usuario_nombre: string;
    usuario_email: string;
    monto: number;
    estado: string;
    fecha_transaccion: string;
    metodo_pago: string;
    referencia_pago: string;
    paquete_nombre?: string;
    moneda: string;
  }

  let estadisticasPagos: EstadisticasPagos = {
    totalIngresos: 0,
    ingresosEsteMes: 0,
    transaccionesExitosas: 0,
    transaccionesPendientes: 0,
    transaccionesRechazadas: 0,
    ticketPromedio: 0,
    crecimientoMensual: 0,
    tasaExito: 0
  };

  let transaccionesRecientes: TransaccionPago[] = [];
  let ingresosPorMes: any[] = [];
  let cargandoPagos = false;
  let periodoSeleccionado = '30d';

  onMount(() => {
    cargarDatosPagos();
  });

  async function cargarDatosPagos() {
    try {
      cargandoPagos = true;
      console.log('💰 [PAGOS] Cargando datos financieros...');

      await Promise.all([
        cargarEstadisticasPagos(),
        cargarTransaccionesRecientes(),
        cargarIngresosPorMes()
      ]);

    } catch (error) {
      console.error('❌ [PAGOS] Error:', error);
    } finally {
      cargandoPagos = false;
    }
  }

  async function cargarEstadisticasPagos() {
    try {
      // Fechas de referencia
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

      // Total ingresos y transacciones exitosas
      const { data: pagosExitosos } = await supabase
        .from('pagos_epayco')
        .select('monto, created_at')
        .eq('estado', 'exitoso');

      const totalIngresos = pagosExitosos?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;
      const transaccionesExitosas = pagosExitosos?.length || 0;

      // Ingresos este mes
      const { data: pagosEsteMes } = await supabase
        .from('pagos_epayco')
        .select('monto')
        .eq('estado', 'exitoso')
        .gte('created_at', inicioMes.toISOString());

      const ingresosEsteMes = pagosEsteMes?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

      // Ingresos mes anterior para calcular crecimiento
      const { data: pagosMesAnterior } = await supabase
        .from('pagos_epayco')
        .select('monto')
        .eq('estado', 'exitoso')
        .gte('created_at', inicioMesAnterior.toISOString())
        .lte('created_at', finMesAnterior.toISOString());

      const ingresosMesAnterior = pagosMesAnterior?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

      // Transacciones por estado
      const [{ count: pendientes }, { count: rechazadas }] = await Promise.all([
        supabase
          .from('pagos_epayco')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente'),
        supabase
          .from('pagos_epayco')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'rechazado')
      ]);

      // Calcular métricas
      const totalTransacciones = transaccionesExitosas + (pendientes || 0) + (rechazadas || 0);
      const ticketPromedio = transaccionesExitosas > 0 ? totalIngresos / transaccionesExitosas : 0;
      const tasaExito = totalTransacciones > 0 ? (transaccionesExitosas / totalTransacciones) * 100 : 0;
      const crecimientoMensual = ingresosMesAnterior > 0 
        ? ((ingresosEsteMes - ingresosMesAnterior) / ingresosMesAnterior) * 100 
        : 0;

      estadisticasPagos = {
        totalIngresos,
        ingresosEsteMes,
        transaccionesExitosas,
        transaccionesPendientes: pendientes || 0,
        transaccionesRechazadas: rechazadas || 0,
        ticketPromedio,
        crecimientoMensual,
        tasaExito
      };

      console.log('💰 [PAGOS] Estadísticas cargadas:', estadisticasPagos);

    } catch (error) {
      console.error('❌ [PAGOS] Error en estadísticas:', error);
    }
  }

  async function cargarTransaccionesRecientes() {
    try {
      const { data: transacciones } = await supabase
        .from('pagos_epayco')
        .select(`
          id, monto, estado, created_at, metodo_pago, referencia_pago, moneda,
          usuario_id,
          perfiles!usuario_id(nombre, apellido, correo_electronico),
          paquete_id,
          paquetes_tutoriales!paquete_id(titulo)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      transaccionesRecientes = transacciones?.map(t => ({
        id: t.id,
        usuario_nombre: t.perfiles ? `${t.perfiles.nombre} ${t.perfiles.apellido}` : 'Usuario desconocido',
        usuario_email: t.perfiles?.correo_electronico || 'No disponible',
        monto: parseFloat(t.monto) || 0,
        estado: t.estado,
        fecha_transaccion: t.created_at,
        metodo_pago: t.metodo_pago || 'No especificado',
        referencia_pago: t.referencia_pago || '',
        paquete_nombre: t.paquetes_tutoriales?.titulo || 'Sin paquete',
        moneda: t.moneda || 'COP'
      })) || [];

      console.log('💰 [PAGOS] Transacciones recientes:', transaccionesRecientes.length);

    } catch (error) {
      console.error('❌ [PAGOS] Error en transacciones:', error);
    }
  }

  async function cargarIngresosPorMes() {
    try {
      // Últimos 6 meses
      const mesesIngresos = [];
      
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        const { data: pagosMes } = await supabase
          .from('pagos_epayco')
          .select('monto')
          .eq('estado', 'exitoso')
          .gte('created_at', inicioMes.toISOString())
          .lte('created_at', finMes.toISOString());

        const ingresosMes = pagosMes?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

        mesesIngresos.push({
          mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          ingresos: ingresosMes,
          transacciones: pagosMes?.length || 0
        });
      }

      ingresosPorMes = mesesIngresos;

    } catch (error) {
      console.error('❌ [PAGOS] Error en ingresos por mes:', error);
    }
  }

  function obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'exitoso': return '#10b981';
      case 'pendiente': return '#f59e0b';
      case 'rechazado': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function obtenerIconoEstado(estado: string): string {
    switch (estado) {
      case 'exitoso': return '✅';
      case 'pendiente': return '⏳';
      case 'rechazado': return '❌';
      default: return '❓';
    }
  }

  function formatearMonto(monto: number, moneda: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0
    }).format(monto);
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

  function verDetalleTransaccion(transaccionId: string) {
    // En una implementación real, esto abriría un modal con detalles
    alert(`Ver detalles de transacción: ${transaccionId}`);
  }

  function exportarDatosFinancieros() {
    const datosFinancieros = {
      fecha_reporte: new Date().toISOString(),
      estadisticas: estadisticasPagos,
      ingresosPorMes: ingresosPorMes,
      transacciones_recientes: transaccionesRecientes.map(t => ({
        ...t,
        monto_formateado: formatearMonto(t.monto, t.moneda)
      }))
    };

    const jsonData = JSON.stringify(datosFinancieros, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function obtenerTendenciaIngresos(): { valor: number; esPositiva: boolean } {
    if (ingresosPorMes.length < 2) return { valor: 0, esPositiva: true };
    
    const mesActual = ingresosPorMes[ingresosPorMes.length - 1];
    const mesAnterior = ingresosPorMes[ingresosPorMes.length - 2];
    
    if (mesAnterior.ingresos === 0) return { valor: 0, esPositiva: true };
    
    const cambio = ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100;
    return { valor: Math.abs(cambio), esPositiva: cambio >= 0 };
  }
</script>

<div class="pestaña-pagos">
  <div class="encabezado-pestaña">
    <div class="header-content">
      <div class="header-text">
        <h2>💰 Gestión de Pagos</h2>
        <p>Análisis financiero completo y transacciones de la academia</p>
      </div>
      <button class="btn-exportar-financiero" on:click={exportarDatosFinancieros}>
        <i class="fas fa-download"></i>
        Exportar Reporte
      </button>
    </div>
  </div>

  <!-- ESTADÍSTICAS FINANCIERAS -->
  <div class="estadisticas-financieras">
    <div class="stat-card ingresos-totales">
      <div class="stat-icono">💰</div>
      <div class="stat-info">
        <div class="stat-numero">{formatearMonto(estadisticasPagos.totalIngresos)}</div>
        <div class="stat-label">Total Ingresos</div>
      </div>
    </div>
    
    <div class="stat-card ingresos-mes">
      <div class="stat-icono">📅</div>
      <div class="stat-info">
        <div class="stat-numero">{formatearMonto(estadisticasPagos.ingresosEsteMes)}</div>
        <div class="stat-label">Ingresos Este Mes</div>
        <div class="stat-cambio" class:positivo={estadisticasPagos.crecimientoMensual >= 0} class:negativo={estadisticasPagos.crecimientoMensual < 0}>
          {estadisticasPagos.crecimientoMensual >= 0 ? '↗️' : '↘️'} {Math.abs(estadisticasPagos.crecimientoMensual).toFixed(1)}%
        </div>
      </div>
    </div>

    <div class="stat-card ticket-promedio">
      <div class="stat-icono">🎯</div>
      <div class="stat-info">
        <div class="stat-numero">{formatearMonto(estadisticasPagos.ticketPromedio)}</div>
        <div class="stat-label">Ticket Promedio</div>
      </div>
    </div>

    <div class="stat-card tasa-exito">
      <div class="stat-icono">✅</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasPagos.tasaExito.toFixed(1)}%</div>
        <div class="stat-label">Tasa de Éxito</div>
      </div>
    </div>

    <div class="stat-card transacciones-exitosas">
      <div class="stat-icono">✅</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasPagos.transaccionesExitosas}</div>
        <div class="stat-label">Exitosas</div>
      </div>
    </div>

    <div class="stat-card transacciones-pendientes">
      <div class="stat-icono">⏳</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasPagos.transaccionesPendientes}</div>
        <div class="stat-label">Pendientes</div>
      </div>
    </div>
  </div>

  <div class="contenido-pagos">
    <!-- GRÁFICO DE INGRESOS -->
    <div class="seccion-grafico-ingresos">
      <div class="grafico-header">
        <h3>📊 Ingresos por Mes</h3>
        <div class="grafico-controles">
          <select bind:value={periodoSeleccionado} on:change={cargarDatosPagos}>
            <option value="30d">Últimos 30 días</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último año</option>
          </select>
        </div>
      </div>

      {#if cargandoPagos}
        <div class="loading-grafico">
          <div class="spinner"></div>
          <p>Cargando datos financieros...</p>
        </div>
      {:else}
        <div class="grafico-barras">
          {#each ingresosPorMes as mes}
            {@const alturaRelativa = ingresosPorMes.length > 0 ? (mes.ingresos / Math.max(...ingresosPorMes.map(m => m.ingresos))) * 100 : 0}
            <div class="barra-mes">
              <div class="barra-ingresos" style="height: {alturaRelativa}%">
                <div class="tooltip-ingresos">
                  <strong>{mes.mes}</strong><br>
                  {formatearMonto(mes.ingresos)}<br>
                  {mes.transacciones} transacciones
                </div>
              </div>
              <div class="etiqueta-mes">{mes.mes}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- TRANSACCIONES RECIENTES -->
    <div class="seccion-transacciones">
      <div class="transacciones-header">
        <h3>💳 Transacciones Recientes</h3>
        <button class="btn-actualizar" on:click={cargarDatosPagos} disabled={cargandoPagos}>
          <i class="fas fa-sync-alt" class:girando={cargandoPagos}></i>
          Actualizar
        </button>
      </div>

      {#if cargandoPagos}
        <div class="loading-transacciones">
          <div class="spinner"></div>
          <p>Cargando transacciones...</p>
        </div>
      {:else if transaccionesRecientes.length === 0}
        <div class="sin-transacciones">
          💳 No hay transacciones registradas
        </div>
      {:else}
        <div class="tabla-transacciones">
          <div class="tabla-header">
            <div>Usuario</div>
            <div>Monto</div>
            <div>Estado</div>
            <div>Método</div>
            <div>Fecha</div>
            <div>Acciones</div>
          </div>

          {#each transaccionesRecientes as transaccion}
            <div class="tabla-fila">
              <div class="usuario-info">
                <div class="usuario-nombre">{transaccion.usuario_nombre}</div>
                <div class="usuario-email">{transaccion.usuario_email}</div>
                {#if transaccion.paquete_nombre !== 'Sin paquete'}
                  <div class="paquete-nombre">{transaccion.paquete_nombre}</div>
                {/if}
              </div>
              
              <div class="monto-transaccion">
                {formatearMonto(transaccion.monto, transaccion.moneda)}
              </div>
              
              <div class="estado-transaccion">
                <span class="estado-badge" style="background-color: {obtenerColorEstado(transaccion.estado)}20; color: {obtenerColorEstado(transaccion.estado)}">
                  {obtenerIconoEstado(transaccion.estado)} {transaccion.estado}
                </span>
              </div>
              
              <div class="metodo-pago">
                {transaccion.metodo_pago}
              </div>
              
              <div class="fecha-transaccion">
                {formatearFecha(transaccion.fecha_transaccion)}
              </div>
              
              <div class="acciones-transaccion">
                <button class="btn-ver-detalle" on:click={() => verDetalleTransaccion(transaccion.id)}>
                  <i class="fas fa-eye"></i>
                  Ver
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
  .pestaña-pagos {
    width: 100%;
    animation: fadeIn 0.3s ease;
  }

  .encabezado-pestaña {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .header-text {
    text-align: center;
    flex: 1;
  }

  .header-text h2 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-text p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .btn-exportar-financiero {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .btn-exportar-financiero:hover {
    background: rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-1px);
  }

  /* ESTADÍSTICAS FINANCIERAS */
  .estadisticas-financieras {
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

  .stat-cambio {
    font-size: 0.7rem;
    font-weight: 500;
    margin-top: 0.25rem;
  }

  .stat-cambio.positivo { color: #10b981; }
  .stat-cambio.negativo { color: #ef4444; }

  /* CONTENIDO */
  .contenido-pagos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  /* GRÁFICO DE INGRESOS */
  .seccion-grafico-ingresos {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .grafico-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .grafico-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .grafico-controles select {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .grafico-barras {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 200px;
    padding: 1rem 0;
  }

  .barra-mes {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .barra-ingresos {
    background: linear-gradient(to top, #3b82f6, #8b5cf6);
    border-radius: 4px 4px 0 0;
    min-height: 10px;
    width: 100%;
    position: relative;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
  }

  .barra-ingresos:hover {
    filter: brightness(1.2);
  }

  .tooltip-ingresos {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .barra-ingresos:hover .tooltip-ingresos {
    opacity: 1;
  }

  .etiqueta-mes {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    text-align: center;
  }

  /* TRANSACCIONES */
  .seccion-transacciones {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .transacciones-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .transacciones-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .btn-actualizar {
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

  .btn-actualizar:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn-actualizar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .girando {
    animation: girar 1s linear infinite;
  }

  .tabla-transacciones {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .tabla-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 0.8fr;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
    font-weight: 600;
    color: white;
    font-size: 0.85rem;
  }

  .tabla-fila {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 0.8fr;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    transition: background 0.2s ease;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tabla-fila:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .usuario-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .usuario-nombre {
    color: white;
    font-weight: 500;
    font-size: 0.85rem;
  }

  .usuario-email {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  .paquete-nombre {
    color: rgba(139, 92, 246, 0.8);
    font-size: 0.7rem;
    font-weight: 500;
  }

  .monto-transaccion {
    color: #10b981;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .estado-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .metodo-pago {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
  }

  .fecha-transaccion {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
  }

  .btn-ver-detalle {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .btn-ver-detalle:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  .loading-grafico,
  .loading-transacciones {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .sin-transacciones {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
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

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* RESPONSIVE */
  @media (max-width: 1400px) {
    .estadisticas-financieras {
      grid-template-columns: repeat(3, 1fr);
    }

    .contenido-pagos {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  @media (max-width: 900px) {
    .estadisticas-financieras {
      grid-template-columns: repeat(2, 1fr);
    }

    .tabla-header,
    .tabla-fila {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }
  }

  @media (max-width: 600px) {
    .estadisticas-financieras {
      grid-template-columns: 1fr;
    }

    .grafico-header {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style> 