<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { goto } from '$app/navigation';

  let articulos: any[] = [];
  let cargando = true;
  let error: string | null = null;

  onMount(async () => {
    await cargarArticulos();
  });

  async function cargarArticulos() {
    try {
      console.log('🔍 Intentando cargar artículos del blog desde la tabla correcta...');
      
      const { data, error: queryError } = await supabase
        .from('blog_articulos')
        .select(`
          id,
          titulo,
          resumen,
          imagen_url,
          creado_en,
          slug
        `)
        .eq('estado', 'publicado')
        .order('creado_en', { ascending: false })
        .limit(3);

      console.log('📊 Respuesta de Supabase:', { data, error: queryError });

      if (queryError) {
        console.error('❌ Error en la consulta:', queryError);
        error = `Error: ${queryError.message}`;
        return;
      }

      if (!data) {
        console.log('⚠️ No hay datos devueltos');
        articulos = [];
        return;
      }

      console.log(`✅ Se encontraron ${data.length} artículos:`, data);
      articulos = data;

    } catch (err) {
      console.error('💥 Error inesperado:', err);
      const e = err as Error;
      error = `Error inesperado: ${e.message}`;
    } finally {
      cargando = false;
    }
  }

  function irAlBlog() {
    window.location.href = '/blog';
  }

  function formatearFecha(fecha: string) {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function truncarTexto(texto: string, limite: number = 80) {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  function verArticulo(articulo: any) {
    if (!articulo || !articulo.slug) return;
    goto(`/blog/${articulo.slug}`);
  }
</script>

<div class="banner-articulos" in:fly={{ y: 20, duration: 500, delay: 200 }}>
  <div class="header-banner">
    <h3 class="titulo-banner">📝 Últimos del Blog</h3>
    <button class="btn-ver-todo" on:click={irAlBlog}>
      Ver todo
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  {#if cargando}
    <div class="skeleton">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>
  {:else if error}
    <div class="error-estado">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="icono-error">
        <circle cx="24" cy="24" r="20" stroke="#ef4444" stroke-width="2"/>
        <path d="M16 16L32 32M32 16L16 32" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p class="mensaje-error">{error}</p>
      <button class="btn-reintentar" on:click={cargarArticulos}>
        Reintentar
      </button>
    </div>
  {:else if articulos.length > 0}
    <div class="lista-articulos">
      {#each articulos as articulo, index}
        <article 
          class="articulo-item" 
          in:fly={{ y: 10, duration: 300, delay: index * 100 }}
          on:click={() => verArticulo(articulo)}
          on:keydown={(e) => e.key === 'Enter' && verArticulo(articulo)}
          role="link"
          tabindex="0"
          aria-label={`Ver artículo: ${articulo.titulo}`}
        >
          <div class="contenido-articulo">
            <h4 class="titulo-articulo">{truncarTexto(articulo.titulo, 55)}</h4>
            <div class="meta-articulo">
              <span class="fecha">{formatearFecha(articulo.creado_en)}</span>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <div class="sin-articulos">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="icono-vacio">
        <path d="M8 8H40L38 40H10L8 8Z" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 20V24" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <path d="M24 20V24" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <path d="M32 20V24" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>No hay artículos publicados todavía.</p>
      <button class="btn-ir-blog" on:click={irAlBlog}>Explorar Blog</button>
    </div>
  {/if}
</div>

<style>
  .banner-articulos {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    margin-top: 1.5rem;
    max-width: 320px;
    margin-left: auto;
  }

  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .titulo-banner {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .btn-ver-todo {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  .btn-ver-todo:hover {
    background-color: #eff6ff;
    color: #2563eb;
  }

  .lista-articulos {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .articulo-item {
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    transition: all 0.2s;
    cursor: pointer;
  }

  .articulo-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: #e2e8f0;
  }

  .contenido-articulo {
    min-width: 0;
  }

  .titulo-articulo {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
    line-height: 1.4;
  }

  .meta-articulo {
    display: flex;
  }

  .fecha {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-item {
    height: 80px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 12px;
  }

  .sin-articulos {
    text-align: center;
    padding: 2rem 1rem;
    color: #64748b;
  }

  .icono-vacio {
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .sin-articulos p {
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .btn-ir-blog {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-ir-blog:hover {
    background: #2563eb;
  }

  .error-estado {
    text-align: center;
    padding: 2rem 1rem;
    color: #ef4444;
  }

  .icono-error {
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .mensaje-error {
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    color: #dc2626;
    background: #fef2f2;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #fecaca;
  }

  .btn-reintentar {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-reintentar:hover {
    background: #dc2626;
  }

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (max-width: 768px) {
    .banner-articulos {
      margin-left: 0;
      max-width: 100%;
    }
  }
</style> 