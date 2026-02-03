<script lang="ts">
  import { LimpiadorDatosCorruptos } from '$lib/utils/limpiarDatosCorruptos';

  export let datos: any = null;

  // Estado para el modal de inscripciones
  let mostrarModalInscripciones = false;
  
  // Estado para limpieza de datos corruptos
  let limpiandoDatos = false;
  let mensajeLimpieza = '';

  // Formatear números grandes
  function formatearNumero(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  // Formatear moneda en pesos colombianos (igual que /administrador/pagos/)
  function formatearMoneda(monto: number): string {
    if (monto >= 1000000000) return '$' + (monto / 1000000000).toFixed(1) + 'B';
    if (monto >= 1000000) return '$' + (monto / 1000000).toFixed(1) + 'M';
    if (monto >= 1000) return '$' + (monto / 1000).toFixed(0) + 'K';
    if (monto >= 100) return '$' + Math.round(monto).toLocaleString('es-CO');
    return '$' + monto.toFixed(0);
  }

  // Calcular porcentaje de crecimiento (simulado para demo)
  function obtenerCrecimiento(): number {
    return Math.floor(Math.random() * 20) + 5; // 5-25% crecimiento
  }

  function mostrarDetalleInscripciones() {
    mostrarModalInscripciones = true;
    alert(`Se encontraron ${datos.inscripcionesRecientes} inscripciones en los últimos 30 días.\n\nFuncionalidad de detalle próximamente.`);
  }

  function irAGestionUsuarios() {
    window.location.href = '/gestión-usuarios';
  }

  function irAGestionContenidos(filtro = '') {
    if (filtro === 'cursos') {
      window.location.href = '/administrador/cursos';
    } else if (filtro === 'tutoriales') {
      window.location.href = '/administrador/tutoriales';
    } else {
      window.location.href = '/administrador/panel-contenido';
    }
  }

  function irAMembresias() {
    window.location.href = '/membresias';
  }

  function irAPagos() {
    window.location.href = '/administrador/pagos';
  }

  // 🧹 LIMPIAR DATOS CORRUPTOS DE TIEMPO
  async function limpiarDatosCorruptos() {
    if (!confirm('🧹 ¿Estás seguro de que quieres limpiar los datos corruptos de tiempo?\n\nEsto reseteará valores imposibles (> 16.6 horas) a 0.')) {
      return;
    }
    
    try {
      limpiandoDatos = true;
      mensajeLimpieza = '🧹 Limpiando datos corruptos...';
      
      const resultado = await LimpiadorDatosCorruptos.ejecutarLimpiezaCompleta();
      
      if (resultado.exito) {
        mensajeLimpieza = resultado.mensaje;
        alert(`✅ LIMPIEZA COMPLETADA\n\n${resultado.mensaje}\n\nLos valores de tiempo ahora serán realistas.`);
      } else {
        mensajeLimpieza = resultado.mensaje;
        alert(`❌ ERROR EN LIMPIEZA\n\n${resultado.mensaje}`);
      }
      
    } catch (error) {
      console.error('❌ Error limpiando datos corruptos:', error);
      mensajeLimpieza = `❌ Error inesperado: ${error}`;
      alert(`❌ ERROR INESPERADO\n\n${error}`);
    } finally {
      limpiandoDatos = false;
    }
  }

  // 💎 Gestionar usuarios premium y membresías
  function gestionarUsuariosPremium() {
    if (datos.usuariosPremium === 0) {
      // Preguntar si quiere ir a membresías para configurar planes
      const quiereIrAMembresias = confirm(`💎 Usuarios Premium: ${datos.usuariosPremium}\n\n` +
            `📊 No tienes usuarios premium actualmente.\n\n` +
            `¿Quieres ir a la página de membresías para configurar planes premium?\n\n` +
            `• Configura precios y beneficios\n` +
            `• Gestiona suscripciones\n` +
            `• Activa membresías premium`);
      
      if (quiereIrAMembresias) {
        irAMembresias();
      } else {
        irAGestionUsuarios();
      }
    } else {
      // Si hay usuarios premium, ir directo a membresías
      irAMembresias();
    }
  }

  // Mostrar detalle de ventas del mes (DATOS REALES DE EPAYCO)
  function mostrarDetalleVentas() {
    
    const promedioVenta = datos.transaccionesDelMes > 0 
      ? (datos.ventasTotalesMes || 0) / datos.transaccionesDelMes 
      : 0;
    
    alert(`💰 VENTAS REALES DEL MES: ${formatearMoneda(datos.ventasTotalesMes || 0)}\n\n` +
          `📊 Total transacciones: ${datos.transaccionesDelMes || 0}\n` +
          `💳 Promedio por venta: ${formatearMoneda(promedioVenta)}\n\n` +
          `📈 Estados de pagos:\n` +
          `✅ Pagos aceptados: ${datos.pagosAceptados || 0}\n` +
          `⏳ Pagos pendientes: ${datos.pagosPendientes || 0}\n` +
          `❌ Pagos rechazados: ${datos.pagosRechazados || 0}\n\n` +
          `🎯 Desglose por producto:\n` +
          `📚 Cursos vendidos: ${datos.ventasCursos || 0}\n` +
          `🎥 Tutoriales vendidos: ${datos.ventasTutoriales || 0}\n` +
          `🔗 Otros servicios: ${datos.ventasOtros || 0}\n\n` +
          `📄 Ver reporte completo en: /administrador/pagos/`);
  }
</script>

{#if datos}
  <div class="contenedor-estadisticas">
    
    <!-- 🎯 TÍTULO DE SECCIÓN -->
    <div class="encabezado-seccion">
      <h2>📊 Estadísticas Generales</h2>
      <p>Métricas principales de la Academia Vallenata</p>
    </div>

    <!-- 📈 GRID DE MÉTRICAS -->
    <div class="grid-metricas">
      
      <!-- 👥 TOTAL USUARIOS -->
      <div class="tarjeta-metrica usuarios clickeable" on:click={() => irAGestionUsuarios()}>
        <div class="icono-metrica">
          <i class="fas fa-users"></i>
        </div>
        <div class="contenido-metrica">
          <div class="numero-principal">{formatearNumero(datos.totalUsuarios)}</div>
          <div class="etiqueta-metrica">Total Estudiantes</div>
          <div class="indicador-crecimiento positivo">
            <i class="fas fa-arrow-up"></i>
            +{obtenerCrecimiento()}% este mes
          </div>
        </div>
        <div class="icono-click">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="fondo-decorativo usuarios-bg"></div>
      </div>

      <!-- 💎 USUARIOS PREMIUM -->
      <div class="tarjeta-metrica premium clickeable" on:click={() => gestionarUsuariosPremium()}>
        <div class="icono-metrica">
          <i class="fas fa-crown"></i>
        </div>
        <div class="contenido-metrica">
          <div class="numero-principal">{formatearNumero(datos.usuariosPremium)}</div>
          <div class="etiqueta-metrica">Usuarios Premium</div>
          <div class="porcentaje-stat">{datos.porcentajePremium}% del total</div>
        </div>
        {#if datos.usuariosPremium === 0}
          <div class="icono-click">
            <i class="fas fa-info-circle"></i>
          </div>
        {/if}
        <div class="fondo-decorativo premium-bg"></div>
      </div>

      <!-- 📚 CONTENIDO TOTAL -->
      <div class="tarjeta-metrica contenido clickeable" on:click={() => irAGestionContenidos()}>
        <div class="icono-metrica">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="contenido-metrica">
          <div class="numero-principal">{formatearNumero(datos.totalContenido)}</div>
          <div class="etiqueta-metrica">Cursos y Tutoriales</div>
          <div class="desglose-contenido">
            <span class="item-clickeable" on:click|stopPropagation={() => irAGestionContenidos('cursos')}>{datos.cursosActivos} cursos</span>
            <span class="item-clickeable" on:click|stopPropagation={() => irAGestionContenidos('tutoriales')}>{datos.tutorialesActivos} tutoriales</span>
          </div>
        </div>
        <div class="icono-click">
          <i class="fas fa-cog"></i>
        </div>
        <div class="fondo-decorativo contenido-bg"></div>
      </div>

      <!-- 🚀 INSCRIPCIONES RECIENTES -->
      <div class="tarjeta-metrica crecimiento clickeable" on:click={() => irAGestionUsuarios()}>
        <div class="icono-metrica">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="contenido-metrica">
          <div class="numero-principal">{formatearNumero(datos.inscripcionesRecientes)}</div>
          <div class="etiqueta-metrica">Inscripciones Recientes</div>
          <div class="indicador-crecimiento positivo">
            <i class="fas fa-trending-up"></i>
            Últimos 30 días
          </div>
        </div>
        <div class="icono-click">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="fondo-decorativo crecimiento-bg"></div>
      </div>

      <!-- 💰 VENTAS TOTALES DEL MES -->
      <div class="tarjeta-metrica ventas clickeable" on:click={() => irAPagos()}>
        <div class="icono-metrica">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="contenido-metrica">
          <div class="numero-principal">{formatearMoneda(datos.ventasTotalesMes || 0)}</div>
          <div class="etiqueta-metrica">Ventas del Mes</div>
          <div class="indicador-crecimiento positivo">
            <i class="fas fa-coins"></i>
            {datos.transaccionesDelMes || 0} transacciones
          </div>
        </div>
        <div class="icono-click">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="fondo-decorativo ventas-bg"></div>
      </div>

      <div class="estadistica-card">
        <div class="estadistica-icon">🧹</div>
        <div class="estadistica-info">
          <h3>Limpiar Datos Corruptos</h3>
          <p>Resetear valores imposibles de tiempo</p>
          <button 
            class="btn-limpieza" 
            on:click={limpiarDatosCorruptos}
            disabled={limpiandoDatos}
          >
            {limpiandoDatos ? '🧹 Limpiando...' : '🧹 Limpiar Ahora'}
          </button>
          {#if mensajeLimpieza}
            <p class="mensaje-limpieza">{mensajeLimpieza}</p>
          {/if}
        </div>
      </div>

    </div>
  </div>

{:else}
  <div class="estado-sin-datos">
    <div class="icono-sin-datos">
      <i class="fas fa-chart-bar"></i>
    </div>
    <h3>Cargando estadísticas...</h3>
    <p>Obteniendo métricas de la academia</p>
  </div>
{/if}

<style>
  /* 📊 CONTENEDOR PRINCIPAL */
  .contenedor-estadisticas {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 20px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
  }

  /* 🎯 ENCABEZADO DE SECCIÓN */
  .encabezado-seccion {
    margin-bottom: 2rem;
  }

  .encabezado-seccion h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .encabezado-seccion p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.875rem;
  }

  /* 📈 GRID DE MÉTRICAS - 5 COLUMNAS */
  .grid-metricas {
    display: grid;
    grid-template-columns: repeat(5, minmax(220px, 1fr));
    gap: 1rem;
    overflow-x: auto;
  }

  /* 📱 Ajuste para pantallas medianas */
  @media (max-width: 1400px) {
    .grid-metricas {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
  }

  @media (max-width: 1024px) {
    .grid-metricas {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
  }

  /* 🎮 TARJETAS DE MÉTRICAS */
  .tarjeta-metrica {
    position: relative;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 0.875rem;
    overflow: hidden;
    min-height: 120px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .tarjeta-metrica:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .tarjeta-metrica.clickeable {
    cursor: pointer;
    position: relative;
  }

  .tarjeta-metrica.clickeable:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  .icono-click {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 3;
  }

  .tarjeta-metrica.clickeable:hover .icono-click {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  /* 🎨 VARIANTES DE COLOR */
  .tarjeta-metrica.usuarios {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%);
  }

  .tarjeta-metrica.usuarios:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
  }

  .tarjeta-metrica.premium {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
  }

  .tarjeta-metrica.contenido {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  }

  .tarjeta-metrica.crecimiento {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%);
  }

  /* ⭐ ICONOS DE MÉTRICAS */
  .icono-metrica {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
    z-index: 2;
  }

  .usuarios .icono-metrica {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  }

  .premium .icono-metrica {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
  }

  .contenido .icono-metrica {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  }

  .crecimiento .icono-metrica {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  }

  /* 📊 CONTENIDO DE MÉTRICAS */
  .contenido-metrica {
    flex: 1;
    z-index: 2;
  }

  .numero-principal {
    font-size: 1.875rem;
    font-weight: 800;
    color: white;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  /* 📱 Ajuste para pantallas grandes */
  @media (min-width: 1600px) {
    .numero-principal {
      font-size: 2.25rem;
    }
  }

  .etiqueta-metrica {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .indicador-crecimiento {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    width: fit-content;
  }

  .indicador-crecimiento.positivo {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .porcentaje-stat {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .desglose-contenido {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .desglose-contenido span {
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .item-clickeable {
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .item-clickeable:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: scale(1.05);
  }

  /* 🎨 FONDOS DECORATIVOS */
  .fondo-decorativo {
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    opacity: 0.1;
    z-index: 1;
  }

  .usuarios-bg {
    background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  }

  .premium-bg {
    background: radial-gradient(circle, #f59e0b 0%, transparent 70%);
  }

  .contenido-bg {
    background: radial-gradient(circle, #10b981 0%, transparent 70%);
  }

  .crecimiento-bg {
    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  }

  .ventas-bg {
    background: radial-gradient(circle, #059669 0%, transparent 70%);
  }

  /* 💰 ESTILOS ESPECÍFICOS PARA VENTAS */
  .tarjeta-metrica.ventas {
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
    border: 1px solid rgba(5, 150, 105, 0.3);
  }

  .tarjeta-metrica.ventas:hover {
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
    border-color: rgba(5, 150, 105, 0.5);
    transform: translateY(-2px);
  }

  .tarjeta-metrica.ventas .icono-metrica {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
  }

  .tarjeta-metrica.ventas .numero-principal {
    color: #059669;
    font-weight: 800;
    text-shadow: 0 1px 3px rgba(5, 150, 105, 0.3);
  }

  /* 😴 ESTADO SIN DATOS */
  .estado-sin-datos {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-datos {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .estado-sin-datos h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .estado-sin-datos p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .contenedor-estadisticas {
      padding: 1.5rem;
    }

    .grid-metricas {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .tarjeta-metrica {
      padding: 1.25rem;
    }

    .icono-metrica {
      width: 50px;
      height: 50px;
      font-size: 1.25rem;
    }

    .numero-principal {
      font-size: 1.875rem;
    }

    .encabezado-seccion h2 {
      font-size: 1.25rem;
    }
  }

  /* 🧹 BOTÓN DE LIMPIEZA */
  .btn-limpieza {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 12px;
    font-size: 14px;
  }

  .btn-limpieza:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }

  .btn-limpieza:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .mensaje-limpieza {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-style: italic;
  }
</style> 