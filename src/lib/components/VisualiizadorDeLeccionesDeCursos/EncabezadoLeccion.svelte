<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import BarraProgresoGeneral from '$lib/components/VisualiizadorDeLeccionesDeCursos/BarraProgresoGeneral.svelte';
  import BarraLateralCurso from '$lib/components/VisualiizadorDeLeccionesDeCursos/BarraLateralCurso.svelte';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  
  // Props
  export let cursoTitulo: string = '';
  export let leccionTitulo: string = '';
  export let cursoId: string = '';
  export let leccionId: string = '';
  export let tipo: 'leccion' | 'clase' = 'leccion';
  export let mostrarSidebar: boolean = true;
  export let curso: any = null;
  export let moduloActivo: string = '';
  export let progreso: any = {};
  export let onToggleSidebar: () => void = () => {};
  export let usuarioActual: any = null;
  export let leccionAnterior: any = null;
  export let leccionSiguiente: any = null;
  
  // Estado
  let isFullscreen = false;
  let isScrolled = false;
  let isDesktop = true;
  let sidebarMobileOpen = false;
  let menuOpcionesOpen = false;
  let modalAvancesOpen = false;
  let menuAnimated = false;
  
  const dispatch = createEventDispatcher();
  
  // ✅ NUEVO: Funciones seguras con browser check
  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    
    try {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.() || 
      (document.documentElement as any).webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || 
      (document as any).webkitExitFullscreen?.();
      }
    } catch (error) {
      console.warn('⚠️ [ENCABEZADO] Error en fullscreen:', error);
    }
  }

  function navegarLeccion(leccion: any, direccion: 'anterior' | 'siguiente') {
    if (!leccion) return;
    
    if (tipo === 'leccion') {
      dispatch(`${direccion}-leccion`, { leccion });
    } else {
      const slug = leccion.slug || (leccion.titulo ? generateSlug(leccion.titulo) : leccion.id);
      const cursoSlug = curso?.slug || (curso?.titulo ? generateSlug(curso.titulo) : curso?.id);
      if (cursoSlug && slug) {
        window.location.href = `/tutoriales/${cursoSlug}/clase/${slug}`;
      }
    }
  }

  // ✅ NUEVO: Función segura de actualización de estado
  function actualizarEstado() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    
    try {
    const wasFullscreen = isFullscreen;
    const wasScrolled = isScrolled;
    const wasDesktop = isDesktop;
    
    isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    isScrolled = window.scrollY > 10;
    isDesktop = window.innerWidth > 1024;
    
      // ✅ SOLUCIÓN: Logging reducido para mejor rendimiento
      if (wasFullscreen !== isFullscreen || wasScrolled !== isScrolled || wasDesktop !== isDesktop) {
        console.log('🔍 [ENCABEZADO] Estado actualizado:', { isFullscreen, isScrolled, isDesktop });
    }
    } catch (error) {
      console.warn('⚠️ [ENCABEZADO] Error actualizando estado:', error);
    }
  }

  function toggleMenuOpciones() {
    menuOpcionesOpen = !menuOpcionesOpen;
    menuAnimated = !menuAnimated;
  }

  function navegarA(ruta: string) {
    window.location.href = ruta;
    menuOpcionesOpen = false;
  }

  function cerrarSesion() {
    window.location.href = '/sesion_cerrada';
    menuOpcionesOpen = false;
  }

  function mostrarAvances() {
    modalAvancesOpen = true;
  }

  function cerrarAvances() {
    modalAvancesOpen = false;
  }

  onMount(() => {
    console.log('🚀 [ENCABEZADO] Componente montado');
    console.log('🚀 [ENCABEZADO] Props iniciales:', {
      cursoTitulo,
      leccionTitulo,
      cursoId,
      leccionId,
      tipo,
      mostrarSidebar,
      usuarioActual: !!usuarioActual
    });
    
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'scroll', 'resize'];
    events.forEach(event => {
      document.addEventListener(event, actualizarEstado);
      window.addEventListener(event, actualizarEstado);
    });
    actualizarEstado();
    
    // Cerrar menú al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuOpcionesOpen && !target.closest('.options-container')) {
        menuOpcionesOpen = false;
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    // ✅ ELIMINADO: Verificación de visibilidad que causaba el problema
    // El encabezado debe mantenerse visible siempre
    
    return () => {
      console.log('❌ [ENCABEZADO] Componente desmontando');
      events.forEach(event => {
        document.removeEventListener(event, actualizarEstado);
        window.removeEventListener(event, actualizarEstado);
      });
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Computadas
  $: etiquetaContenido = tipo === 'leccion' ? 'Lección:' : 'Clase:';
  $: urlCurso = tipo === 'leccion' ? `/cursos/${curso?.slug || cursoId}` : `/tutoriales/${curso?.slug || cursoId}`;
  
  // Lógica para calcular "Clase X de Y"
  let leccionActual = 1;
  let totalLecciones = 1;
  
  $: {
    if (curso) {
      if (tipo === 'leccion' && curso.modulos && Array.isArray(curso.modulos)) {
        // Para cursos: contar todas las lecciones de todos los módulos
        let contador = 0;
        totalLecciones = 0;
        
        for (const modulo of curso.modulos) {
          if (modulo.lecciones && Array.isArray(modulo.lecciones)) {
            for (const leccion of modulo.lecciones) {
              totalLecciones++;
              if (leccion.id === leccionId || leccion.slug === leccionId) {
                leccionActual = totalLecciones;
              }
            }
          }
        }
      } else if (tipo === 'clase' && curso.clases && Array.isArray(curso.clases)) {
        // Para tutoriales: contar las clases directamente
        totalLecciones = curso.clases.length;
        const index = curso.clases.findIndex((clase: any) => 
          clase.id === leccionId || clase.slug === leccionId
        );
        leccionActual = index >= 0 ? index + 1 : 1;
      }
    }
  }
</script>

<header class="lesson-header" class:scrolled={isScrolled}>
  <div class="header-left">
    {#if !isDesktop}
      <button class="sidebar-mobile-btn" on:click={() => sidebarMobileOpen = !sidebarMobileOpen} aria-label="Mostrar menú del curso">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    {/if}
    
    		<a href="/" class="logo-link">
			<img 
				src="/logo academia vallenata.png" 
				alt="Academia Vallenata" 
				class="logo"
      />
    </a>
    
    <!-- Información del curso - Desktop -->
    {#if isDesktop}
      <div class="curso-info">
        <div class="breadcrumb-container">
          <a href="/mis-cursos/{curso?.slug || cursoId}" class="curso-titulo-breadcrumb" title="Ver información del curso">
            {cursoTitulo}
          </a>
          <span class="breadcrumb-separator">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 6 15 12 9 18"/>
            </svg>
          </span>
          <span class="leccion-contador">
            {tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}
          </span>
        </div>
        <h1 class="leccion-titulo-desktop">
          {leccionTitulo}
        </h1>
      </div>
    {/if}
    
    <!-- Información para tablet (769px-1024px) -->
    {#if !isDesktop && window.innerWidth > 768}
      <div class="curso-info-tablet">
        <a href={urlCurso} class="curso-titulo" title="Ver información del curso">
          {cursoTitulo}
        </a>
        <span class="separador">|</span>
        <span class="leccion-titulo">
          <span class="clase-label">{etiquetaContenido}</span> {leccionTitulo}
        </span>
      </div>
    {/if}
    
    <!-- Información para móvil estilo Platzi (≤768px) -->
    {#if !isDesktop && window.innerWidth <= 768}
      <div class="info-mobile-platzi">
        <div class="clase-contador">
          {tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}
        </div>
        <div class="leccion-titulo-mobile">
          {leccionTitulo}
        </div>
      </div>
    {/if}
  </div>

  <!-- Sidebar móvil -->
  {#if sidebarMobileOpen && !isDesktop}
    <div class="sidebar-mobile-overlay" on:click={() => sidebarMobileOpen = false}>
      <div class="sidebar-mobile-panel" on:click|stopPropagation>
        <BarraLateralCurso
          curso={curso}
          moduloActivo={moduloActivo}
          leccionActiva={leccionId}
          progreso={progreso}
        />
      </div>
    </div>
  {/if}
  
  <div class="header-right">
    <!-- Navegación entre lecciones - Solo desktop -->
    <div class="mini-nav desktop-only">
      <button 
        class="mini-nav-btn" 
        on:click={() => navegarLeccion(leccionAnterior, 'anterior')} 
        disabled={!leccionAnterior} 
        aria-label={tipo === 'leccion' ? 'Lección anterior' : 'Clase anterior'}
        title={leccionAnterior ? `Anterior: ${leccionAnterior.titulo}` : `No hay ${tipo === 'leccion' ? 'lección' : 'clase'} anterior`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      
      <button 
        class="mini-nav-btn" 
        on:click={() => navegarLeccion(leccionSiguiente, 'siguiente')} 
        disabled={!leccionSiguiente} 
        aria-label={tipo === 'leccion' ? 'Siguiente lección' : 'Siguiente clase'}
        title={leccionSiguiente ? `Siguiente: ${leccionSiguiente.titulo}` : `No hay ${tipo === 'leccion' ? 'lección' : 'clase'} siguiente`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 6 15 12 9 18"/>
        </svg>
      </button>
    </div>
    
    <!-- Barra de progreso -->
    <div class="progress-wrapper" on:click={mostrarAvances} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') mostrarAvances(); }} tabindex="0" role="button" aria-label="Ver detalles de avances">
      <div class="progress-label-mobile">Tus avances</div>
      <BarraProgresoGeneral 
        tipo={tipo === 'leccion' ? 'curso' : 'tutorial'} 
        contenidoId={cursoId} 
      />
    </div>
    
    <!-- Botón pantalla completa - Solo desktop -->
    {#if isDesktop}
      <button 
        class="header-btn fullscreen-btn" 
        on:click={toggleFullscreen}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={isFullscreen ? 'Salir de pantalla completa (F11)' : 'Pantalla completa (F11)'}
      >
        {#if isFullscreen}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 9L5 5m0 4V5h4"/><path d="M15 9l4-4m0 4V5h-4"/><path d="M15 15l4 4m0-4v4h-4"/><path d="M9 15l-4 4m0-4v4h4"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        {/if}
      </button>
    {/if}
    
    <!-- Área de acciones - Solo desktop -->
    <div class="actions-container desktop-only">
      <!-- Toggle sidebar -->
      <button 
        class="toggle-sidebar-btn" 
        on:click={onToggleSidebar}
        aria-label={mostrarSidebar ? 'Ocultar contenido del curso' : 'Mostrar contenido del curso'}
        title={mostrarSidebar ? 'Ocultar contenido del curso' : 'Mostrar contenido del curso'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span class="toggle-text">{mostrarSidebar ? 'Ocultar contenido' : 'Ver contenido'}</span>
      </button>
      
      <!-- Opciones desktop -->
      <div class="options-container">
        <button class="options-btn" on:click={toggleMenuOpciones} aria-label="Opciones" title="Más opciones">
          <div class="hamburger-menu" class:active={menuAnimated}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <!-- Menú desplegable -->
        {#if menuOpcionesOpen}
          <div class="options-menu">
            <div class="options-menu-header">Regresar a:</div>
            <button class="options-menu-item" on:click={() => navegarA('/estudiante')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Mis cursos
            </button>
            <button class="options-menu-item" on:click={() => navegarA('/perfil')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Mi perfil
            </button>
            <button class="options-menu-item" on:click={() => navegarA('/blog')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Publicaciones
            </button>
            <button class="options-menu-item" on:click={() => navegarA('/cursos')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Cursos
            </button>
            <button class="options-menu-item" on:click={() => navegarA('/ranking')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Ranking
            </button>
            <div class="options-menu-divider"></div>
            <button class="options-menu-item danger" on:click={cerrarSesion}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Opciones móvil -->
    <div class="options-container mobile-only">
      <button class="options-btn" on:click={toggleMenuOpciones} aria-label="Opciones">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
      
      <!-- Menú desplegable -->
      {#if menuOpcionesOpen}
        <div class="options-menu">
          <div class="options-menu-header">Regresar a:</div>
          <button class="options-menu-item" on:click={() => navegarA('/estudiante')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Mis cursos
          </button>
          <button class="options-menu-item" on:click={() => navegarA('/perfil')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Mi perfil
          </button>
          <button class="options-menu-item" on:click={() => navegarA('/blog')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Publicaciones
          </button>
          <button class="options-menu-item" on:click={() => navegarA('/cursos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Cursos
          </button>
          <button class="options-menu-item" on:click={() => navegarA('/ranking')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Ranking
          </button>
          <div class="options-menu-divider"></div>
          <button class="options-menu-item danger" on:click={cerrarSesion}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>

<!-- Modal de avances -->
{#if modalAvancesOpen}
  <div class="modal-overlay" on:click={cerrarAvances}>
    <div class="modal-avances" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Tus avances en este {tipo === 'leccion' ? 'curso' : 'tutorial'}</h3>
        <button class="modal-close" on:click={cerrarAvances} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="avances-info">
          <h4>{cursoTitulo}</h4>
          <div class="avances-stats">
            <div class="stat-item">
              <div class="stat-label">Progreso general</div>
              <BarraProgresoGeneral 
                tipo={tipo === 'leccion' ? 'curso' : 'tutorial'} 
                contenidoId={cursoId} 
              />
            </div>
            <div class="stat-item">
              <div class="stat-label">Lección actual</div>
              <div class="stat-value">{tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Tiempo estimado restante</div>
              <div class="stat-value">Calculando...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .lesson-header {
    width: 100%;
    min-height: 50px;
    display: flex !important; /* ✅ FORZAR VISIBILIDAD */
    justify-content: space-between;
    align-items: center;
    padding: 6px 20px;
    background-color: #1c1d1f;
    color: white;
    border-bottom: 0.5px solid #fff;
    transition: box-shadow 0.3s ease;
    z-index: 1000;
    visibility: visible !important; /* ✅ FORZAR VISIBILIDAD */
    opacity: 1 !important; /* ✅ FORZAR VISIBILIDAD */
  }
  
  .scrolled {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;
    flex: 1;
    min-width: 0;
  }
  
  .sidebar-mobile-btn {
    display: none;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 6px 8px 6px 0;
  }
  
  .logo {
    height: 35px;
    margin-right: 15px;
  }
  
  .curso-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  
  .curso-info-tablet {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 6px;
    font-size: 0.96rem;
  }
  
  .breadcrumb-container {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }
  
  .curso-titulo-breadcrumb {
    color: #a1a1a1;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .curso-titulo-breadcrumb:hover {
    color: #a435f0;
    background-color: rgba(164, 53, 240, 0.1);
  }
  
  .breadcrumb-separator {
    color: #666;
    display: flex;
    align-items: center;
  }
  
  .leccion-contador {
    color: #fbbf24;
    font-weight: 600;
    font-size: 0.9rem;
    background: rgba(251, 191, 36, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }
  
  .leccion-titulo-desktop {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #fff;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .curso-titulo {
    color: #a1a1a1;
    text-decoration: none;
    transition: color 0.2s ease;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45vw;
  }
  
  .curso-titulo:hover {
    color: #a435f0;
    text-decoration: underline;
  }
  
  .separador {
    margin: 0 10px;
    color: #666;
  }
  
  .leccion-titulo {
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0;
    color: #a1a1a1;
    font-size: 0.95rem;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45vw;
  }
  
  .clase-label {
    color: #a435f0;
    margin-right: 4px;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .mini-nav {
    display: flex;
    gap: 2px;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 2px;
  }
  
  .mini-nav-btn {
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #fff;
    padding: 8px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .mini-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .mini-nav-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }
  
  .mini-nav-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  .progress-wrapper {
    display: flex;
    flex-direction: column;
    gap: 3px;
    cursor: pointer;
    padding: 4px 8px;
    transition: all 0.2s ease;
    min-width: 180px;
  }
  
  .progress-wrapper:hover {
    opacity: 0.8;
  }
  
  .progress-label-mobile {
    font-size: 0.75rem;
    color: #ffffff;
    font-weight: 500;
    display: none;
  }
  
  .header-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .header-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  .fullscreen-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .fullscreen-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .actions-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .toggle-sidebar-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #3e4143;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .toggle-sidebar-btn:hover {
    background-color: #505356;
    transform: translateY(-1px);
  }
  
  .toggle-text {
    font-weight: 500;
  }
  
  /* Información para móvil estilo Platzi */
  .info-mobile-platzi {
    display: none;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  
  .clase-contador {
    font-size: 0.75rem;
    color: #a1a1a1;
    font-weight: 500;
  }
  
  .leccion-titulo-mobile {
    font-size: 0.9rem;
    color: #fff;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .options-container {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-right: -4px;
  }
  
  .options-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .options-btn:hover {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .options-btn:active {
    transform: translateY(0);
  }
  
  /* Hamburger menu animado para desktop */
  .hamburger-menu {
    width: 18px;
    height: 18px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
  }
  
  .hamburger-menu span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: #fff;
    border-radius: 1px;
    transition: all 0.3s ease;
    transform-origin: center;
  }
  
  .hamburger-menu.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .hamburger-menu.active span:nth-child(2) {
    opacity: 0;
  }
  
  .hamburger-menu.active span:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -5px);
  }
  
  .options-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    padding: 8px 0;
    min-width: 220px;
    z-index: 1000;
    animation: slideDown 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .options-menu-header {
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    padding: 10px 16px 8px 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 4px;
  }
  
  .options-menu-item {
    width: 100%;
    background: none;
    border: none;
    padding: 12px 16px;
    text-align: left;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .options-menu-item:hover {
    background-color: #f8f9fa;
    transform: translateX(2px);
  }
  
  .options-menu-item.danger {
    color: #e74c3c;
  }
  
  .options-menu-item.danger:hover {
    background-color: #fdf2f2;
    color: #c0392b;
  }
  
  .options-menu-divider {
    height: 1px;
    background: #e8e8e8;
    margin: 8px 0;
  }
  
  .mobile-only {
    display: none;
  }
  
  .desktop-only {
    display: flex;
  }
  
  /* Modal de avances */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .modal-avances {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .modal-close:hover {
    background-color: #f5f5f5;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .avances-info h4 {
    margin: 0 0 16px 0;
    font-size: 1.1rem;
    color: #333;
  }
  
  .avances-stats {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }
  
  /* Sidebar móvil */
  .sidebar-mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 2000;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }
  
  .sidebar-mobile-panel {
    width: 80vw;
    max-width: 320px;
    height: 100vh;
    background: #232323;
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.18);
    overflow-y: auto;
    animation: sidebarIn 0.2s ease;
  }
  
  @keyframes sidebarIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  /* Responsive Design */
  @media (max-width: 1024px) {
    .sidebar-mobile-btn {
      display: flex;
      margin-right: 2px;
    }
    
    .header-left {
      gap: 8px;
    }
    
    .logo {
      max-width: 36px;
      height: auto;
    }
    
    .curso-info {
      display: none;
    }
    
    .curso-info-tablet {
      display: flex;
    }
    
    .info-mobile-platzi {
      display: none;
    }
    
    .header-right {
      gap: 15px;
    }
    
    .progress-wrapper {
      min-width: 120px;
      padding: 4px 8px;
    }
    
    .progress-wrapper:hover {
      opacity: 0.8;
    }
    
    .actions-container {
      gap: 6px;
    }
  }
  
  /* Responsive estilo Platzi para móviles */
  @media (max-width: 768px) {
    .lesson-header {
      padding: 6px 8px;
    }
    
    .header-left {
      gap: 12px;
    }
    
    .sidebar-mobile-btn {
      padding: 6px 4px 6px 0;
      margin-right: 4px;
    }
    
    .logo {
      height: 45px;
      max-width: 45px;
      margin-right: 8px;
    }
    
    .curso-info-tablet {
      display: none;
    }
    
    .info-mobile-platzi {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: 2px;
    }
    
    .progress-wrapper {
      display: flex;
      min-width: 120px;
      margin-right: 4px;
      padding: 4px 6px;
      background: none;
      border: none;
    }
    
    .progress-wrapper:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: transparent;
      transform: none;
    }
    
    .progress-label-mobile {
      display: block;
    }
    
    .desktop-only {
      display: none !important;
    }
    
    .mobile-only {
      display: flex;
    }
    
    .header-right {
      gap: 6px;
    }
    
    .options-container {
      margin-right: -4px;
    }
    
    .options-btn {
      padding: 8px 4px;
      background: none;
      border: none;
    }
    
    .options-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: transparent;
      transform: none;
    }
  }
  
  @media (max-width: 800px) {
    .toggle-sidebar-btn {
      display: none !important;
    }
  }
  
  @media (max-width: 480px) {
    .lesson-header {
      padding: 4px 6px;
    }
    
    .header-left {
      gap: 8px;
    }
    
    .sidebar-mobile-btn {
      padding: 4px 2px 4px 0;
      margin-right: 2px;
    }
    
    .logo {
      height: 42px;
      max-width: 42px;
      margin-right: 6px;
    }
    
    .info-mobile-platzi {
      gap: 1px;
    }
    
    .clase-contador {
      font-size: 0.7rem;
    }
    
    .leccion-titulo-mobile {
      font-size: 0.85rem;
    }
    
    .progress-wrapper {
      min-width: 100px;
      margin-right: 2px;
      padding: 4px 6px;
      background: none;
      border: none;
    }
    
    .progress-wrapper:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: transparent;
      transform: none;
    }
    
    .header-right {
      gap: 4px;
    }
    
    .options-btn {
      padding: 8px 4px;
      background: none;
      border: none;
    }
    
    .options-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: transparent;
      transform: none;
    }
  }
</style> 