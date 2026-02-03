<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  let paquetes: any[] = [];
  let cargandoPaquetes = true;
  let estadisticasPaquetes = {
    totalPaquetes: 0,
    paquetesDestacados: 0,
    ingresosTotales: 0,
    promedioTutoriales: 0
  };

  onMount(() => {
    cargarPaquetes();
  });

  async function cargarPaquetes() {
    try {
      cargandoPaquetes = true;
      
      const { data: paquetesData, error } = await supabase
        .from('paquetes_tutoriales')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        return;
      }

      paquetes = paquetesData || [];
      calcularEstadisticas();

    } catch (error) {
    } finally {
      cargandoPaquetes = false;
    }
  }

  function calcularEstadisticas() {
    estadisticasPaquetes = {
      totalPaquetes: paquetes.length,
      paquetesDestacados: paquetes.filter(p => p.destacado).length,
      ingresosTotales: paquetes.reduce((sum, p) => sum + (parseFloat(p.precio_rebajado) || parseFloat(p.precio_normal) || 0), 0),
      promedioTutoriales: paquetes.length > 0 ? Math.round(paquetes.reduce((sum, p) => sum + (p.total_tutoriales || 0), 0) / paquetes.length) : 0
    };
  }

  // Formatear precio en pesos colombianos
  function formatearPrecio(precio: number): string {
    if (precio >= 1000000) return '$' + (precio / 1000000).toFixed(1) + 'M';
    if (precio >= 1000) return '$' + (precio / 1000).toFixed(0) + 'K';
    return '$' + precio.toLocaleString('es-CO');
  }

  // Calcular descuento
  function calcularDescuento(paquete: any): number {
    if (!paquete.precio_rebajado || !paquete.precio_normal) return 0;
    return Math.round(((paquete.precio_normal - paquete.precio_rebajado) / paquete.precio_normal) * 100);
  }

  function irAGestionPaquetes() {
    window.location.href = '/paquetes';
  }

  function crearNuevoPaquete() {
    window.location.href = '/administrador/paquetes/crear';
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
</script>

<div class="contenedor-paquetes">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <div class="titulo-con-accion">
      <h3>📦 Gestión de Paquetes</h3>
      <button class="boton-crear" on:click={crearNuevoPaquete} title="Crear nuevo paquete">
        <i class="fas fa-plus"></i>
        Nuevo
      </button>
    </div>
    <p>Administra tus paquetes de tutoriales y sus ventas</p>
  </div>

  {#if cargandoPaquetes}
    <!-- 🔄 CARGANDO -->
    <div class="estado-carga">
      <div class="spinner"></div>
      <p>Cargando paquetes...</p>
    </div>
  {:else}
    <!-- 📊 ESTADÍSTICAS RÁPIDAS -->
    <div class="estadisticas-rapidas">
      <div class="stat-item">
        <div class="stat-icono">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasPaquetes.totalPaquetes}</div>
          <div class="stat-label">Paquetes Activos</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono destacado">
          <i class="fas fa-star"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasPaquetes.paquetesDestacados}</div>
          <div class="stat-label">Destacados</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono ventas">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{formatearPrecio(estadisticasPaquetes.ingresosTotales)}</div>
          <div class="stat-label">Valor Total</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono contenido">
          <i class="fas fa-play-circle"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasPaquetes.promedioTutoriales}</div>
          <div class="stat-label">Promedio Tutoriales</div>
        </div>
      </div>
    </div>

    <!-- 📋 LISTA DE PAQUETES -->
    <div class="lista-paquetes">
      {#if paquetes.length > 0}
        {#each paquetes as paquete}
          <div class="item-paquete" class:destacado={paquete.destacado}>
            
            <!-- 📦 INFO PRINCIPAL -->
            <div class="paquete-header">
              <div class="paquete-titulo">
                <h4>{paquete.titulo}</h4>
                {#if paquete.destacado}
                  <span class="badge-destacado">
                    <i class="fas fa-star"></i>
                    Destacado
                  </span>
                {/if}
              </div>
              <div class="paquete-fecha">
                {formatearFecha(paquete.created_at)}
              </div>
            </div>

            <!-- 📊 DETALLES -->
            <div class="paquete-detalles">
              <div class="detalle-item">
                <i class="fas fa-play-circle"></i>
                <span>{paquete.total_tutoriales || 0} tutoriales</span>
              </div>
              
              <div class="detalle-item">
                <i class="fas fa-clock"></i>
                <span>{paquete.duracion_total_estimada || 0} min</span>
              </div>
              
              <div class="detalle-item tipo-acceso">
                <i class="fas fa-key"></i>
                <span>{paquete.tipo_acceso || 'premium'}</span>
              </div>
            </div>

            <!-- 💰 PRECIOS -->
            <div class="paquete-precios">
              {#if paquete.precio_rebajado && paquete.precio_rebajado < paquete.precio_normal}
                <div class="precio-oferta">
                  <span class="precio-original">{formatearPrecio(parseFloat(paquete.precio_normal))}</span>
                  <span class="precio-rebajado">{formatearPrecio(parseFloat(paquete.precio_rebajado))}</span>
                  <span class="descuento">-{calcularDescuento(paquete)}%</span>
                </div>
              {:else}
                <div class="precio-normal">
                  {formatearPrecio(parseFloat(paquete.precio_normal) || 0)}
                </div>
              {/if}
            </div>

          </div>
        {/each}
      {:else}
        <!-- 😴 SIN PAQUETES -->
        <div class="sin-paquetes">
          <div class="icono-sin-datos">
            <i class="fas fa-box-open"></i>
          </div>
          <h4>No hay paquetes creados</h4>
          <p>Crea tu primer paquete de tutoriales</p>
          <button class="boton-crear-primero" on:click={crearNuevoPaquete}>
            <i class="fas fa-plus"></i>
            Crear Primer Paquete
          </button>
        </div>
      {/if}
    </div>

    <!-- 🔗 PIE DE SECCIÓN -->
    <div class="pie-seccion">
      <button class="boton-ver-todos" on:click={irAGestionPaquetes}>
        <i class="fas fa-boxes"></i>
        Ver todos los paquetes
      </button>
    </div>
  {/if}

</div>

<style>
  /* 📦 CONTENEDOR PRINCIPAL */
  .contenedor-paquetes {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    height: auto;
    min-height: 600px;
    display: flex;
    flex-direction: column;
  }

  /* 🎯 ENCABEZADO */
  .encabezado-seccion {
    margin-bottom: 1.5rem;
  }

  .titulo-con-accion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .titulo-con-accion h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: white;
  }

  .encabezado-seccion p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.875rem;
  }

  .boton-crear {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-crear:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
  }

  /* 📊 ESTADÍSTICAS RÁPIDAS */
  .estadisticas-rapidas {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stat-icono {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .stat-icono.destacado {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .stat-icono.ventas {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .stat-icono.contenido {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }

  .stat-valor {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  /* 📋 LISTA DE PAQUETES */
  .lista-paquetes {
    flex: 1;
    overflow-y: visible;
    padding-right: 0.5rem;
    min-height: auto;
  }

  .lista-paquetes::-webkit-scrollbar {
    width: 6px;
  }

  .lista-paquetes::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .lista-paquetes::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .lista-paquetes::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 📦 ITEMS DE PAQUETES */
  .item-paquete {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
  }

  .item-paquete:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .item-paquete.destacado {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.05);
  }

  .paquete-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .paquete-titulo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .paquete-titulo h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    line-height: 1.2;
  }

  .badge-destacado {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .paquete-fecha {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .paquete-detalles {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .detalle-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .detalle-item i {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .tipo-acceso {
    color: #34d399;
  }

  .paquete-precios {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .precio-oferta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .precio-original {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: line-through;
  }

  .precio-rebajado {
    font-size: 1.125rem;
    font-weight: 700;
    color: #10b981;
  }

  .descuento {
    padding: 0.25rem 0.5rem;
    background: #dc2626;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .precio-normal {
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
  }

  /* 😴 SIN PAQUETES */
  .sin-paquetes {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-datos {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-paquetes h4 {
    margin: 0 0 0.5rem 0;
    color: white;
  }

  .sin-paquetes p {
    margin: 0 0 1.5rem 0;
    font-size: 0.875rem;
  }

  .boton-crear-primero {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-crear-primero:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
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

  /* 🔄 ESTADO DE CARGA */
  .estado-carga {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #60a5fa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 1200px) {
    .estadisticas-rapidas {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .contenedor-paquetes {
      padding: 1rem;
      height: auto;
      min-height: 300px;
    }

    .estadisticas-rapidas {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .paquete-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .paquete-detalles {
      gap: 0.5rem;
    }

    .stat-item {
      padding: 0.75rem;
    }

    .stat-valor {
      font-size: 1rem;
    }
  }
</style> 