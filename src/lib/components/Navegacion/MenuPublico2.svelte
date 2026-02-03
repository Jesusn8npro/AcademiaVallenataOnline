<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { usuario, limpiarUsuario } from '$lib/UsuarioActivo/usuario';
  import { cerrarSesion as cerrarSesionSupabase } from '$lib/supabase/autenticacionSupabase';
  import ModalDeInicioDeSesion from '$lib/components/Autenticacion/ModalDeInicioDeSesion.svelte';
  import ModalBusqueda from '$lib/components/Busqueda/ModalBusqueda.svelte';
  import MenuLateralResponsive from './MenuLateralResponsive.svelte';
  
  interface ArticuloBlog {
    id: number;
    titulo: string;
    resumen: string;
    imagen_url: string;
    creado_en: string;
    slug: string;
  }
  
  // Variables de estado
  let mostrarModalBusqueda = false;
  let mostrarModalMenu = false;
  let mostrarMenuLateralResponsive = false;
  let mostrarModalLogin = false;
  let mostrarIdiomas = false;
  let articulosBlog: ArticuloBlog[] = [];
  let cargandoArticulos = false;
  let esMovil = false;
  let cerrandoSesion = false;
  let scrollY = 0;
  let isSticky = false;
  
  $: usuarioActual = $usuario;
  
  // Función para cerrar sesión
  async function cerrarSesion() {
    if (cerrandoSesion) return;
    cerrandoSesion = true;
    try {
      await cerrarSesionSupabase();
      limpiarUsuario();
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    } finally {
      cerrandoSesion = false;
    }
  }
  
  // Función para cargar artículos del blog
  async function cargarArticulosBlog() {
    if (articulosBlog.length > 0) return;
    cargandoArticulos = true;
    try {
      const { data, error } = await supabase
        .from('blog_articulos')
        .select('id, titulo, resumen, imagen_url, creado_en, slug')
        .eq('estado', 'publicado')
        .order('creado_en', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('Error al cargar artículos:', error);
        articulosBlog = [];
      } else {
        articulosBlog = data || [];
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      articulosBlog = [];
    } finally {
      cargandoArticulos = false;
    }
  }
  
  // Función para formatear fecha
  function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  // Funciones para manejar modales
  function abrirModalBusqueda() {
    mostrarModalBusqueda = true;
    document.body.style.overflow = 'hidden';
  }
  
  function abrirModalMenu() {
    if (esMovil) {
      mostrarMenuLateralResponsive = true;
    } else {
      mostrarModalMenu = true;
      cargarArticulosBlog();
    }
    document.body.style.overflow = 'hidden';
  }
  
  function abrirModalLogin() {
    mostrarModalLogin = true;
    document.body.style.overflow = 'hidden';
  }
  
  function cerrarModalLogin() {
    mostrarModalLogin = false;
    document.body.style.overflow = 'auto';
  }
  
  function cerrarModales() {
    mostrarModalBusqueda = false;
    mostrarModalMenu = false;
    mostrarMenuLateralResponsive = false;
    mostrarModalLogin = false;
    document.body.style.overflow = 'auto';
  }
  
  // Función para manejar clicks fuera del selector de idiomas
  function manejarClicFuera(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.selector-idioma')) {
      mostrarIdiomas = false;
    }
  }
  
  function manejarTeclaEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cerrarModales();
    }
  }
  
  function manejarClicModal(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      cerrarModales();
    }
  }
  
  function detectarMovil() {
    esMovil = window.innerWidth <= 1000;
  }
  
  function manejarScroll() {
    scrollY = window.scrollY;
    isSticky = scrollY > 80;
  }

  onMount(() => {
    document.addEventListener('mousedown', manejarClicFuera);
    document.addEventListener('keydown', manejarTeclaEscape);
    window.addEventListener('scroll', manejarScroll, { passive: true });
    detectarMovil();
    window.addEventListener('resize', detectarMovil);

    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
      document.removeEventListener('keydown', manejarTeclaEscape);
      window.removeEventListener('scroll', manejarScroll);
      window.removeEventListener('resize', detectarMovil);
    };
  });
  
  onDestroy(() => {
    document.body.style.overflow = 'auto';
  });
</script>

<!-- Barra superior negra -->
<div class="barra-superior-negra">
  <div class="contenedor-barra-superior">
    <!-- Información de contacto -->
    <div class="zona-izquierda">
      <div class="item-contacto">
        <span class="icono-circulo">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path fill="#ff6600" d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11ZM4.5 6a.5.5 0 0 0-.5.5v.27l8 5.21 8-5.21V6.5a.5.5 0 0 0-.5-.5h-15Zm15 2.98-7.5 4.89a.5.5 0 0 1-.54 0L4 8.98V17.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V8.98Z"/>
          </svg>
        </span>
        <span class="texto-contacto">contacto@academiavallenata.com</span>
      </div>
      <div class="item-contacto">
        <span class="icono-circulo">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path fill="#ff6600" d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2Z"/>
          </svg>
        </span>
        <span class="texto-contacto">+57 3212587616</span>
      </div>
    </div>
    
    <!-- Redes sociales, idioma y login -->
    <div class="zona-derecha">
      <div class="redes-sociales">
        <a href="https://www.facebook.com/academiavallenataonlineoficial" class="icono-red icono-facebook" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="#fff" d="M17 2.05H15c-2.76 0-5 2.24-5 5v2H7a1 1 0 0 0-1 1v3c0 .55.45 1 1 1h3v7a1 1 0 0 0 1 1h3c.55 0 1-.45 1-1v-7h2.29a1 1 0 0 0 .99-1.14l-.38-3A1 1 0 0 0 18.23 9H16V7c0-.55.45-1 1-1h1a1 1 0 0 0 1-1V3.05a1 1 0 0 0-1-1z"/>
          </svg>
        </a>
        <a href="https://www.instagram.com/academiavallenataonline/" class="icono-red" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="17" cy="7" r="1.5" fill="#fff"/>
          </svg>
        </a>
        <a href="https://wa.me/573212587616?text=Hola,%20quiero%20información%20sobre%20la%20Academia%20Vallenata%20Online" class="icono-red" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
          </svg>
        </a>
        <a href="https://www.youtube.com/@AcademiaVallenataONLINE" class="icono-red" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="#fff" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
      </div>
      
      <div class="contenedor-idioma-login">
        <div class="selector-idioma" tabIndex="0">
          <button class="boton-idioma" aria-haspopup="listbox" aria-expanded={mostrarIdiomas} on:click={() => mostrarIdiomas = !mostrarIdiomas}>
            Español
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style="margin-left: 0.5rem;">
              <path d="M7 10l5 5 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          {#if mostrarIdiomas}
            <ul class="lista-idiomas" role="listbox">
              <li role="option" aria-selected="true">Español</li>
              <li role="option" aria-selected="false">Inglés</li>
              <li role="option" aria-selected="false">Portugués</li>
              <li role="option" aria-selected="false">Francés</li>
            </ul>
          {/if}
        </div>

        <button class="boton-login" aria-label="Iniciar sesión" on:click={abrirModalLogin}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" fill="#fff"/>
            <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Barra principal de navegación -->
<div class="barra-principal-navegacion {isSticky ? 'sticky' : ''}">
  <div class="contenedor-barra-principal">
    		<!-- Logo -->
		<a href="/" class="logo-navegacion" aria-label="Ir a la página de inicio">
			<img src="/logo academia vallenata.png" alt="Logo Academia Vallenata" />
    </a>
    
    <!-- Menú de navegación -->
    <nav class="menu-enlaces">
      <a href="/" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <path d="M3 12L12 3l9 9"/>
            <path d="M9 21V9h6v12"/>
          </svg>
        </span>
        <span class="enlace-texto">Inicio</span>
        <div class="enlace-underline"></div>
      </a>
      <a href="/blog" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M7 7h10M7 11h10M7 15h6"/>
          </svg>
        </span>
        <span class="enlace-texto">Blog</span>
        <div class="enlace-underline"></div>
      </a>
      <a href="/cursos" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <rect x="2" y="7" width="20" height="13" rx="2"/>
            <path d="M16 3v4M8 3v4"/>
          </svg>
        </span>
        <span class="enlace-texto">Cursos</span>
        <div class="enlace-underline"></div>
      </a>
      <a href="/paquetes" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <rect x="3" y="7" width="18" height="13" rx="2"/>
            <path d="M3 7l9 6 9-6"/>
          </svg>
        </span>
        <span class="enlace-texto">Paquetes</span>
        <div class="enlace-underline"></div>
      </a>
      <a href="/eventos" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M16 3v4M8 3v4M3 10h18"/>
          </svg>
        </span>
        <span class="enlace-texto">Eventos</span>
        <div class="enlace-underline"></div>
      </a>
      <a href="/nuestra-academia" class="enlace-nav">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2">
            <path d="M12 3l9 6-9 6-9-6 9-6z"/>
            <path d="M3 9v6a9 9 0 0 0 18 0V9"/>
          </svg>
        </span>
        <span class="enlace-texto">Nuestra Academia</span>
        <div class="enlace-underline"></div>
      </a>
      <!-- 🎵 SIMULADOR REMOVIDO DEL MENÚ PÚBLICO -->
      <!-- Solo admins autenticados pueden ver y acceder al simulador -->
    </nav>
    
    <!-- Botones de acción -->
    <div class="botones-accion">
      <button class="boton-busqueda" aria-label="Buscar contenido" on:click={abrirModalBusqueda}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <button class="menu-hamburguesa" aria-label="Abrir menú" on:click={abrirModalMenu}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <rect y="4" width="24" height="2" rx="1" fill="currentColor"/>
          <rect y="11" width="24" height="2" rx="1" fill="currentColor"/>
          <rect y="18" width="24" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</div>

<!-- Modales -->
{#if mostrarModalBusqueda}
  <ModalBusqueda abierto={mostrarModalBusqueda} onCerrar={cerrarModales} />
{/if}

{#if mostrarMenuLateralResponsive}
  <MenuLateralResponsive 
    abierto={mostrarMenuLateralResponsive}
    usuario={usuarioActual} 
    onCerrar={() => mostrarMenuLateralResponsive = false}
    cerrarSesion={cerrarSesion}
    cerrandoSesion={cerrandoSesion}
    abrirModalLogin={abrirModalLogin}
  />
{/if}

{#if mostrarModalMenu}
  <div class="modal-menu-overlay" on:click={manejarClicModal} role="dialog" aria-modal="true" aria-label="Modal de menú" tabindex="-1">
    <div class="modal-menu-panel">
      <button class="boton-cerrar-menu" on:click={cerrarModales} aria-label="Cerrar menú">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="#ff6600" stroke-width="2" stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      
      <div class="encabezado-menu">
        			<a href="/" class="logo-menu-link" aria-label="Ir a la página de inicio" on:click={cerrarModales}>
        			<img src="/logo academia vallenata.png" alt="Academia Vallenata" class="logo-menu" />
        			</a>
        <p class="descripcion-menu">
          La mejor academia para aprender acordeón vallenato online. Aprende con los mejores maestros desde la comodidad de tu hogar.
        </p>
      </div>
      
      <div class="redes-menu">
        <a href="https://www.facebook.com/academiavallenataonlineoficial" class="icono-red-menu" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="#ff6600" d="M17 2.05H15c-2.76 0-5 2.24-5 5v2H7a1 1 0 0 0-1 1v3c0 .55.45 1 1 1h3v7a1 1 0 0 0 1 1h3c.55 0 1-.45 1-1v-7h2.29a1 1 0 0 0 .99-1.14l-.38-3A1 1 0 0 0 18.23 9H16V7c0-.55.45-1 1-1h1a1 1 0 0 0 1-1V3.05a1 1 0 0 0-1-1z"/>
          </svg>
        </a>
        <a href="https://www.instagram.com/academiavallenataonline/" class="icono-red-menu" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="#ff6600" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="#ff6600" stroke-width="2"/>
            <circle cx="17" cy="7" r="1.5" fill="#ff6600"/>
          </svg>
        </a>
        <a href="https://www.youtube.com/@AcademiaVallenataONLINE" class="icono-red-menu" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="#ff6600" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
        <a href="https://wa.me/573212587616?text=Hola,%20quiero%20información%20sobre%20la%20Academia%20Vallenata%20Online" class="icono-red-menu" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path fill="#ff6600" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
          </svg>
        </a>
      </div>
      
      <div class="articulos-recientes">
        <h3>Artículos Recientes</h3>
        {#if cargandoArticulos}
          <p>Cargando artículos...</p>
        {:else if articulosBlog.length > 0}
          {#each articulosBlog as articulo}
            <article class="articulo-item">
              <img src={articulo.imagen_url} alt="Artículo" class="imagen-articulo" />
              <div class="contenido-articulo">
                <span class="fecha-articulo">{formatearFecha(articulo.creado_en)}</span>
                <h4 class="titulo-articulo">{articulo.titulo}</h4>
              </div>
            </article>
          {/each}
        {:else}
          <p>No hay artículos disponibles</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if mostrarModalLogin}
  <ModalDeInicioDeSesion abierto={mostrarModalLogin} onCerrar={cerrarModalLogin} />
{/if}

<style>
/* Barra superior negra */
.barra-superior-negra {
  background: #181818;
  padding: 0px 2rem;
  z-index: 1000;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.contenedor-barra-superior {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  overflow-x: hidden;
  box-sizing: border-box;
  align-items: center;
}

.zona-izquierda, .zona-derecha {
  display: flex;
  align-items: center;
}

.item-contacto {
  display: flex;
  align-items: center;
  margin-right: 2.2rem;
}

.item-contacto:last-child {
  margin-right: 0;
}

.icono-circulo {
  width: 35px;
  height: 35px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.7rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.texto-contacto {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.redes-sociales {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-right: 1.2rem;
  margin-left: 0;
  flex-shrink: 0;
}

.icono-red {
  color: #fff;
  text-decoration: none;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icono-red:hover {
  transform: translateY(-2px);
}

.contenedor-idioma-login {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  margin-right: 0;
  flex-shrink: 0;
}

.selector-idioma {
  position: relative;
}

.boton-idioma {
  background: #19d1c3;
  color: #fff;
  border: none;
  padding: 15px 15px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(25,209,195,0.08);
  transition: background 0.18s;
}

.boton-login {
  background: #df0909;
  color: #fff;
  border: none;
  padding: 16px 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(25,209,195,0.08);
  transition: background 0.18s;
}

.lista-idiomas {
  position: absolute;
  top: 110%;
  left: 0;
  background: #fff;
  color: #222;
  min-width: 160px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.13);
  border-radius: 7px;
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  z-index: 2000;
}

.lista-idiomas li {
  padding: 0.55rem 1.2rem;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 1rem;
}

.lista-idiomas li:hover {
  background: #19d1c3;
  color: #fff;
}

/* Barra principal de navegación */
.barra-principal-navegacion {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  box-shadow: 0 4px 20px 0 rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.05);
  border-bottom: 3px solid #ff6600;
  padding: 8px 2rem;
  position: relative;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

.barra-principal-navegacion.sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.12), 0 2px 6px 0 rgba(0,0,0,0.08);
  border-bottom: 2px solid #ff6600;
  padding: 6px 2rem;
  animation: slideDown 0.3s ease-out;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.contenedor-barra-principal {
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  flex-wrap: wrap;
  overflow-x: hidden;
  box-sizing: border-box;
  gap: 1rem;
}

.logo-navegacion {
  display: flex;
  align-items: center;
  text-decoration: none;
  border-radius: 8px;
  padding: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-left: 0;
  margin-right: auto;
  flex-shrink: 0;
}

.logo-navegacion:hover {
  transform: scale(1.05);
  background: rgba(255, 102, 0, 0.1);
  box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
}

.logo-navegacion:active {
  transform: scale(0.98);
}

.logo-navegacion img {
  width: 100%;
  max-width: 135px;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
  transition: all 0.3s ease;
  height: auto;
  object-fit: contain;
}

.logo-navegacion:hover img {
  filter: drop-shadow(0 4px 15px rgba(255, 102, 0, 0.3));
}

.menu-enlaces {
  display: flex;
  align-items: center;
  gap: 1.8rem;
  flex: 1 1 auto;
  justify-content: center;
  padding: 0 2rem;
}

.enlace-nav {
  position: relative;
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.05rem;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  letter-spacing: 0.025em;
}

.enlace-texto {
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  font-size: 1.01rem;
  font-weight: 500;
  color: #222;
  margin-top: 0.1rem;
}

.enlace-underline {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 3px;
  background: linear-gradient(90deg, #ff6600, #ff8c42);
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.enlace-nav:hover {
  background: linear-gradient(135deg, rgba(255,102,0,0.08) 0%, rgba(255,140,66,0.05) 100%);
  color: #ff6600;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255,102,0,0.15);
}

.enlace-nav:hover .enlace-underline {
  transform: translateX(-50%) scaleX(1);
}

.enlace-nav:hover .enlace-texto {
  transform: translateY(-1px);
}

.icono-enlace-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 0.2rem 0;
}

.botones-accion {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-left: auto;
  margin-right: 0;
  flex-shrink: 0;
}

.boton-busqueda, .menu-hamburguesa {
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  color: #fff;
  background: linear-gradient(135deg, #ff6600 0%, #ff8c42 100%);
  box-shadow: 0 4px 15px rgba(255,102,0,0.3), 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.boton-busqueda {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-hamburguesa {
  border-radius: 12px;
  padding: 10px 14px;
  margin-left: 1rem;
}

.boton-busqueda:hover, .menu-hamburguesa:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255,102,0,0.4), 0 4px 8px rgba(0,0,0,0.15);
  background: linear-gradient(135deg, #e55a00 0%, #ff6600 100%);
}

.boton-busqueda:active, .menu-hamburguesa:active {
  transform: translateY(0);
}

/* Modal de menú */
.modal-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.50);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  z-index: 3000;
}

.modal-menu-panel {
  width: 400px;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  animation: deslizarDesdeDerechaq 0.3s ease-out;
}

@keyframes deslizarDesdeDerechaq {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.boton-cerrar-menu {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
  z-index: 10;
}

.boton-cerrar-menu:hover {
  background: rgba(255, 102, 0, 0.1);
}

.encabezado-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem 2rem 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.logo-menu-link {
  display: inline-block;
  text-decoration: none;
  border-radius: 8px;
  padding: 8px;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.logo-menu-link:hover {
  transform: scale(1.05);
  background: rgba(255, 102, 0, 0.1);
  box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
}

.logo-menu-link:active {
  transform: scale(0.98);
}

.logo-menu {
  width: 120px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
  transition: all 0.3s ease;
}

.logo-menu-link:hover .logo-menu {
  filter: drop-shadow(0 4px 15px rgba(255, 102, 0, 0.3));
}

.descripcion-menu {
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.6;
  color: #666;
  margin: 0;
  max-width: 280px;
}

.redes-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.icono-red-menu {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 102, 0, 0.1);
  transition: all 0.2s;
  text-decoration: none;
}

.icono-red-menu:hover {
  background: #ff6600;
  transform: translateY(-2px);
}

.icono-red-menu:hover svg path,
.icono-red-menu:hover svg rect,
.icono-red-menu:hover svg circle {
  fill: #fff;
  stroke: #fff;
}

.articulos-recientes {
  padding: 2rem;
  flex: 1;
}

.articulos-recientes h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
  border-bottom: 2px solid #ff6600;
  padding-bottom: 0.5rem;
  display: inline-block;
}

.articulo-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f5f5f5;
}

.articulo-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.imagen-articulo {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.contenido-articulo {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fecha-articulo {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.5rem;
  font-weight: 400;
}

.titulo-articulo {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  transition: color 0.2s;
}

.articulo-item:hover .titulo-articulo {
  color: #ff6600;
}

/* Diseño responsivo */
@media (max-width: 1600px) {
  .barra-superior-negra {
    padding: 0px 2rem;
  }
  .barra-principal-navegacion {
    padding: 6px 2rem;
  }
  .barra-principal-navegacion.sticky {
    padding: 5px 2rem;
  }
}

@media (max-width: 1600px) {
  .zona-izquierda {
    display: none !important;
  }

  .barra-superior-negra {
    padding: 0px 1rem;
  }

  .contenedor-barra-superior {
    width: 100%;
    position: relative;
  }

  .zona-derecha {
    justify-content: space-between;
    width: 100%;
    position: relative;
  }

  .botones-accion {
    gap: 0.3rem;
  }

  .menu-hamburguesa {
    margin-left: 0;
  }

  .contenedor-barra-principal {
    gap: 1rem;
  }

  .barra-principal-navegacion {
    padding: 6px 1rem;
  }

  .barra-principal-navegacion.sticky {
    padding: 4px 1rem;
  }

  .menu-enlaces {
    display: none !important;
  }
}

/* ✅ NUEVO: Media queries específicos para móviles Android */
@media (max-width: 768px) {
  .barra-superior-negra {
    padding: 0px 0.75rem;
  }
  
  .barra-principal-navegacion {
    padding: 6px 0.75rem;
  }
  
  .barra-principal-navegacion.sticky {
    padding: 4px 0.75rem;
  }
  
  .contenedor-barra-principal {
    gap: 0.5rem;
  }
  
  .botones-accion {
    gap: 0.2rem;
  }
  
  /* ✅ FORZAR POSICIONAMIENTO EN ANDROID */
  .redes-sociales {
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  
  .contenedor-idioma-login {
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  
  .logo-navegacion {
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  
  .botones-accion {
    margin-left: auto !important;
    margin-right: 0 !important;
  }
}

@media (max-width: 480px) {
  .barra-superior-negra {
    padding: 0px 0.5rem;
  }
  
  .barra-principal-navegacion {
    padding: 6px 0.5rem;
  }
  
  .barra-principal-navegacion.sticky {
    padding: 4px 0.5rem;
  }
  
  .contenedor-barra-principal {
    gap: 0.3rem;
  }
  
  .botones-accion {
    gap: 0.1rem;
  }
  
  .logo-navegacion img {
    max-width: 100px;
  }
  
  /* ✅ FORZAR POSICIONAMIENTO EN ANDROID MÓVILES PEQUEÑOS */
  .redes-sociales {
    margin-left: 0 !important;
    margin-right: auto !important;
    gap: 0.8rem;
  }
  
  .contenedor-idioma-login {
    margin-left: auto !important;
    margin-right: 0 !important;
    gap: 0.3rem;
  }
  
  .logo-navegacion {
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  
  .botones-accion {
    margin-left: auto !important;
    margin-right: 0 !important;
    gap: 0.1rem;
  }
}

/* ✅ NUEVO: Media query específico para pantallas muy pequeñas */
@media (max-width: 390px) {
  .redes-sociales {
    gap: 0.5rem !important;
    align-items: center;
    justify-content: flex-start;
  }
  
  .icono-red {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .contenedor-idioma-login {
    gap: 0.2rem;
  }
  
  .boton-idioma {
    padding: 12px 12px;
    font-size: 0.9rem;
  }
  
  .boton-login {
    padding: 12px 12px;
  }
}

/* ✅ NUEVO: Media query para pantallas extra pequeñas */
@media (max-width: 360px) {
  .redes-sociales {
    gap: 0.3rem !important;
  }
  
  .contenedor-idioma-login {
    gap: 0.1rem;
  }
  
  .boton-idioma {
    padding: 10px 10px;
    font-size: 0.85rem;
  }
  
  .boton-login {
    padding: 10px 10px;
  }
  
  .logo-navegacion img {
    max-width: 80px;
  }
}

/* ✅ NUEVO: Media query específico para pantallas < 340px */
@media (max-width: 340px) {
  /* Ocultar Facebook en pantallas muy pequeñas */
  .icono-facebook {
    display: none !important;
  }
  
  .redes-sociales {
    gap: 0.2rem !important;
    margin-right: 0.8rem;
  }
  
  .contenedor-idioma-login {
    gap: 0.1rem;
  }
  
  .boton-idioma {
    padding: 8px 8px;
    font-size: 0.8rem;
  }
  
  .boton-login {
    padding: 8px 8px;
  }
  
  .logo-navegacion img {
    max-width: 70px;
  }
  
  .barra-superior-negra {
    padding: 0px 0.3rem;
  }
  
  .barra-principal-navegacion {
    padding: 4px 0.3rem;
  }
  
  .barra-principal-navegacion.sticky {
    padding: 3px 0.3rem;
  }
}

/* ✅ NUEVO: Media query para pantallas extremadamente pequeñas */
@media (max-width: 300px) {
  .redes-sociales {
    gap: 0.15rem !important;
    margin-right: 0.5rem;
  }
  
  .contenedor-idioma-login {
    gap: 0.05rem;
  }
  
  .boton-idioma {
    padding: 6px 6px;
    font-size: 0.75rem;
  }
  
  .boton-login {
    padding: 6px 6px;
  }
  
  .logo-navegacion img {
    max-width: 60px;
  }
  
  .barra-superior-negra {
    padding: 0px 0.2rem;
  }
  
  .barra-principal-navegacion {
    padding: 3px 0.2rem;
  }
  
  .barra-principal-navegacion.sticky {
    padding: 2px 0.2rem;
  }
}

/* ✅ NUEVO: Media query para pantallas ultra pequeñas */
@media (max-width: 280px) {
  .redes-sociales {
    gap: 0.1rem !important;
    margin-right: 0.3rem;
  }
  
  .contenedor-idioma-login {
    gap: 0.02rem;
  }
  
  .boton-idioma {
    padding: 5px 5px;
    font-size: 0.7rem;
  }
  
  .boton-login {
    padding: 5px 5px;
  }
  
  .logo-navegacion img {
    max-width: 50px;
  }
  
  .barra-superior-negra {
    padding: 0px 0.15rem;
  }
  
  .barra-principal-navegacion {
    padding: 2px 0.15rem;
  }
  
  .barra-principal-navegacion.sticky {
    padding: 1px 0.15rem;
  }
}
</style>
