<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  let articulos: any[] = [];
  let cargandoArticulos = true;
  let estadisticasArticulos = {
    totalArticulos: 0,
    articulosPublicados: 0,
    borradores: 0,
    articulosRecientes: 0
  };

  onMount(() => {
    cargarArticulos();
  });

  async function cargarArticulos() {
    try {
      cargandoArticulos = true;
      
      const { data: articulosData, error } = await supabase
        .from('blog_articulos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(3);

      if (error) {
        return;
      }

      articulos = articulosData || [];
      calcularEstadisticas();

    } catch (error) {
    } finally {
      cargandoArticulos = false;
    }
  }

  function calcularEstadisticas() {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    estadisticasArticulos = {
      totalArticulos: articulos.length,
      articulosPublicados: articulos.filter(a => a.estado === 'publicado').length,
      borradores: articulos.filter(a => a.estado === 'borrador').length,
      articulosRecientes: articulos.filter(a => new Date(a.creado_en) > hace7Dias).length
    };
  }

  // Obtener color según estado
  function obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'publicado': return '#10b981';
      case 'borrador': return '#f59e0b';
      case 'revision': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  // Obtener icono según estado
  function obtenerIconoEstado(estado: string): string {
    switch (estado) {
      case 'publicado': return 'fas fa-check-circle';
      case 'borrador': return 'fas fa-edit';
      case 'revision': return 'fas fa-clock';
      default: return 'fas fa-file';
    }
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    const fechaArticulo = new Date(fecha);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - fechaArticulo.getTime();
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias <= 7) return `Hace ${dias} días`;
    
    return fechaArticulo.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Truncar texto
  function truncarTexto(texto: string, maxLength: number = 100): string {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  }

  function irAGestionBlog() {
    window.location.href = '/blog';
  }

  function crearNuevoArticulo() {
    window.location.href = '/administrador/blog/nuevo';
  }

  function editarArticulo(articuloId: string) {
    window.location.href = `/administrador/blog/${articuloId}`;
  }
</script>

<div class="contenedor-blog">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <div class="titulo-con-accion">
      <h3>📝 Gestión de Blog</h3>
      <button class="boton-crear" on:click={crearNuevoArticulo} title="Crear nuevo artículo">
        <i class="fas fa-plus"></i>
        Nuevo
      </button>
    </div>
    <p>Administra tus artículos y contenido del blog</p>
  </div>

  {#if cargandoArticulos}
    <!-- 🔄 CARGANDO -->
    <div class="estado-carga">
      <div class="spinner"></div>
      <p>Cargando artículos...</p>
    </div>
  {:else}
    <!-- 📊 ESTADÍSTICAS RÁPIDAS -->
    <div class="estadisticas-rapidas">
      <div class="stat-item">
        <div class="stat-icono">
          <i class="fas fa-newspaper"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasArticulos.totalArticulos}</div>
          <div class="stat-label">Total Artículos</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono publicado">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasArticulos.articulosPublicados}</div>
          <div class="stat-label">Publicados</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono borrador">
          <i class="fas fa-edit"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasArticulos.borradores}</div>
          <div class="stat-label">Borradores</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icono recientes">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <div class="stat-valor">{estadisticasArticulos.articulosRecientes}</div>
          <div class="stat-label">Esta Semana</div>
        </div>
      </div>
    </div>

    <!-- 📋 LISTA DE ARTÍCULOS -->
    <div class="lista-articulos">
      {#if articulos.length > 0}
        {#each articulos as articulo}
          <div class="item-articulo" on:click={() => editarArticulo(articulo.id)}>
            
            <!-- 📰 HEADER DEL ARTÍCULO -->
            <div class="articulo-header">
              <div class="articulo-titulo">
                <h4>{articulo.titulo}</h4>
                <div class="estado-badge" style="background-color: {obtenerColorEstado(articulo.estado)}20; color: {obtenerColorEstado(articulo.estado)}">
                  <i class="{obtenerIconoEstado(articulo.estado)}"></i>
                  {articulo.estado}
                </div>
              </div>
              <div class="articulo-fecha">
                {formatearFecha(articulo.creado_en)}
              </div>
            </div>

            <!-- 📝 RESUMEN -->
            {#if articulo.resumen}
              <div class="articulo-resumen">
                {truncarTexto(articulo.resumen, 120)}
              </div>
            {/if}

            <!-- 🖼️ IMAGEN PREVIEW -->
            {#if articulo.imagen_url}
              <div class="articulo-imagen">
                <img src={articulo.imagen_url} alt={articulo.titulo} />
              </div>
            {/if}

            <!-- 📊 METADATOS -->
            <div class="articulo-metadatos">
              <div class="metadato-item">
                <i class="fas fa-link"></i>
                <span>{articulo.slug || 'Sin slug'}</span>
              </div>
              
              <div class="metadato-item">
                <i class="fas fa-calendar"></i>
                <span>Actualizado {formatearFecha(articulo.actualizado_en)}</span>
              </div>
            </div>

          </div>
        {/each}
      {:else}
        <!-- 😴 SIN ARTÍCULOS -->
        <div class="sin-articulos">
          <div class="icono-sin-datos">
            <i class="fas fa-file-alt"></i>
          </div>
          <h4>No hay artículos creados</h4>
          <p>Comienza a escribir tu primer artículo</p>
          <button class="boton-crear-primero" on:click={crearNuevoArticulo}>
            <i class="fas fa-plus"></i>
            Escribir Primer Artículo
          </button>
        </div>
      {/if}
    </div>

    <!-- 🔗 PIE DE SECCIÓN -->
    <div class="pie-seccion">
      <button class="boton-ver-todos" on:click={irAGestionBlog}>
        <i class="fas fa-blog"></i>
        Ver todos los artículos
      </button>
    </div>
  {/if}

</div>

<style>
  /* 📝 CONTENEDOR PRINCIPAL */
  .contenedor-blog {
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
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-crear:hover {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
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
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }

  .stat-icono.publicado {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .stat-icono.borrador {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .stat-icono.recientes {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
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

  /* 📋 LISTA DE ARTÍCULOS */
  .lista-articulos {
    flex: 1;
    overflow-y: visible;
    padding-right: 0.5rem;
    min-height: auto;
  }

  .lista-articulos::-webkit-scrollbar {
    width: 6px;
  }

  .lista-articulos::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .lista-articulos::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .lista-articulos::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 📰 ITEMS DE ARTÍCULOS */
  .item-articulo {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .item-articulo:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .articulo-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .articulo-titulo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .articulo-titulo h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    line-height: 1.2;
  }

  .estado-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .articulo-fecha {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .articulo-resumen {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }

  .articulo-imagen {
    width: 100%;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .articulo-imagen img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .articulo-metadatos {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .metadato-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .metadato-item i {
    font-size: 0.625rem;
  }

  /* 😴 SIN ARTÍCULOS */
  .sin-articulos {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-datos {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-articulos h4 {
    margin: 0 0 0.5rem 0;
    color: white;
  }

  .sin-articulos p {
    margin: 0 0 1.5rem 0;
    font-size: 0.875rem;
  }

  .boton-crear-primero {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-crear-primero:hover {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
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
    border-top: 3px solid #a78bfa;
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
    .contenedor-blog {
      padding: 1rem;
      height: auto;
      min-height: 300px;
    }

    .estadisticas-rapidas {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .articulo-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .articulo-metadatos {
      flex-direction: column;
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