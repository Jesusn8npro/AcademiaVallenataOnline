<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  // Componentes modularizados
  import TablaDeContenidos from './TablaDeContenidos.svelte';
  import ResumenArticulo from './ResumenArticulo.svelte';
  import BotonesSociales from './BotonesSociales.svelte';
  
  // Utilidades SEO
  import {
    type EncabezadoArticulo,
    agregarIdsAEncabezados,
    extraerEncabezados,
    calcularTiempoLectura,
    generarDatosEstructurados,
    optimizarContenidoSEO
  } from '$lib/utils/seoUtils';

  // Props del componente
  export let titulo = 'Título del artículo';
  export let autor = 'Jesús González';
  export let fecha = '';
  export let imagen_url = '';
  export let resumen = '';
  export let contenidoHtml = '';
  export let slug = '';

  // Estados reactivos
  let headers: EncabezadoArticulo[] = [];
  let contenidoConIds = '';
  let tiempoEstimadoLectura = 0;
  let urlCompleta = '';

  // Procesamiento reactivo del contenido
  $: if (contenidoHtml && browser) {
    // Optimizar contenido para SEO
    const contenidoOptimizado = optimizarContenidoSEO(contenidoHtml);
    
    // Agregar IDs a encabezados
    contenidoConIds = agregarIdsAEncabezados(contenidoOptimizado);
    
    // Extraer encabezados para TOC
    headers = extraerEncabezados(contenidoOptimizado);
    
    // Calcular tiempo de lectura
    tiempoEstimadoLectura = calcularTiempoLectura(contenidoOptimizado);
  }

  // URL completa para compartir
  $: if (browser && $page?.url) {
    urlCompleta = $page.url.href;
  }

  // Datos estructurados para SEO
  $: datosEstructurados = browser && titulo && contenidoHtml ? 
    generarDatosEstructurados(titulo, resumen, contenidoHtml, autor, fecha, urlCompleta, imagen_url) : 
    null;

  // Insertar datos estructurados en el head
  onMount(() => {
    if (datosEstructurados) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(datosEstructurados);
      document.head.appendChild(script);

      // Limpiar al desmontar
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  });
</script>


<section class="hero-articulo">
  {#if imagen_url}
    <img class="hero-imagen" src={imagen_url} alt={titulo} loading="eager" />
  {/if}
  <div class="hero-contenido">
    <h1>{titulo}</h1>
    <div class="meta-autor">
      <span class="autor">{autor}</span>
      {#if fecha}
        <span class="fecha">· {new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      {/if}
      {#if tiempoEstimadoLectura > 0}
        <span class="tiempo-lectura">· {tiempoEstimadoLectura} min de lectura</span>
      {/if}
    </div>

    <!-- Componente de resumen modularizado -->
    <ResumenArticulo {resumen} {titulo} />

    <!-- Componente de botones sociales modularizado -->
    <BotonesSociales {titulo} url={urlCompleta} />

    <!-- Componente de tabla de contenidos modularizado -->
    <TablaDeContenidos {headers} />
  </div>
</section>

<style>
:global(h1),
:global(h2),
:global(h3),
:global(p),
:global(ul),
:global(ol),
:global(li),
:global(blockquote),
:global(img),
:global(pre),
:global(code),
:global(strong),
:global(b) {
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  color: #232323;
  font-size: 1.09rem;
  line-height: 1.75;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}
:global(h1) {
  font-size: 2.1rem;
  font-weight: 800;
  border-bottom: 2.5px solid #13b67a22;
  padding-bottom: 0.18em;
}
:global(h2) {
  font-size: 1.5rem;
  font-weight: 800;
  border-bottom: 2px solid #13b67a22;
  padding-bottom: 0.13em;
}
:global(h3) {
  font-size: 1.18rem;
  font-weight: 700;
  color: #1976d2;
}
:global(strong),
:global(b) {
  font-weight: bold;
  color: #222;
}
:global(p) {
  margin-bottom: 1.1em;
}
:global(ul) {
  margin-left: 2em;
  margin-bottom: 1.1em;
  padding-left: 1.2em;
  list-style-type: disc;
  list-style-position: inside;
}
:global(ul li)::marker {
  color: #13b67a;
  font-size: 1.15em;
}
:global(ol) {
  margin-left: 2em;
  margin-bottom: 1.1em;
  padding-left: 1.2em;
  list-style-type: decimal;
  list-style-position: inside;
}
:global(ol li)::marker {
  color: #1976d2;
  font-size: 1.1em;
}
:global(li) {
  margin-bottom: 0.45em;
}
:global(blockquote) {
  border-left: 4px solid #b6e7a0;
  background: #f8fff3;
  margin: 1.2em 0;
  padding: 0.9em 1.3em;
  color: #3a5c3c;
  font-style: italic;
  border-radius: 0 14px 14px 0;
}
:global(img) {
  display: block;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0001;
}
:global(pre) {
  background: #f4fcff;
  border-radius: 7px;
  padding: 1em;
  overflow-x: auto;
  margin-bottom: 1.2em;
}
:global(code) {
  background: #eafbe6;
  border-radius: 4px;
  padding: 0.15em 0.5em;
  font-size: 0.97em;
}
.hero-imagen {
  display: block;
  width: 100%;
  height: 400px;
  border-radius: 22px 22px 20px 20px;
  object-fit: cover;
  box-shadow: 0 4px 18px rgba(44,85,48,0.13);
  max-width: none;
  max-height: none;
  padding: 0;
}
.hero-contenido {
  padding: 36px 32px 22px 32px;
}
.hero-contenido h1 {
  font-size: 2.2rem;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 12px;
  color: #2c5530;
}
.meta-autor {
  font-size: 1.02rem;
  color: #7a7a7a;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tiempo-lectura {
  color: #ff6b35;
  font-weight: 600;
  background: linear-gradient(135deg, #fff3e0, #ffefd1);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid #ffcc80;
}
/* === RESPONSIVE MOBILE === */
@media (max-width: 700px) {
  .hero-contenido { 
    padding: 18px 5px 5px 5px; 
  }
  
  .hero-contenido h1 { 
    font-size: 1.3rem; 
  }
  
  .hero-imagen { 
    min-height: 120px; 
  }

  /* Resumen móvil */
  .resumen-preview {
    padding: 15px;
    border-radius: 12px;
  }

  .boton-expandir-resumen {
    padding: 10px 20px;
    font-size: 0.9rem;
  }

  .resumen-expandido {
    border-radius: 15px;
  }

  .resumen-header {
    padding: 15px 20px;
  }

  .resumen-header h3 {
    font-size: 1.1rem;
  }

  .resumen-completo {
    padding: 20px;
    font-size: 1rem;
  }

  .boton-leer-articulo {
    padding: 15px 25px;
    font-size: 1rem;
  }

  /* TOC móvil */
  .contenedor-toc {
    margin: 20px 0 25px 0;
  }

  .boton-toc-toggle {
    padding: 15px 20px;
    font-size: 1rem;
    border-radius: 12px;
  }

  .toc {
    border-radius: 0 0 12px 12px;
    font-size: 0.95rem;
  }

  .toc-desc {
    margin: 15px 20px 12px 20px;
    font-size: 0.9rem;
  }

  .toc ul {
    padding: 0 15px 10px 15px; /* Padding reducido */
  }

  .toc li {
    min-height: 30px; /* Altura mínima reducida */
  }

  .toc a {
    padding: 6px 8px; /* Padding reducido */
    font-size: 0.85rem;
  }

  .toc-h2 > a {
    font-size: 0.9rem;
  }

  .toc-h3 > a {
    font-size: 0.8rem;
    margin-left: 15px;
  }

  .toc-h3::before {
    margin-left: 15px;
  }

  /* Botón expandir TOC móvil */
  .toc-expandir-todo {
    padding: 10px 20px 12px 20px; /* Padding reducido */
  }

  .boton-expandir-toc {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style>
