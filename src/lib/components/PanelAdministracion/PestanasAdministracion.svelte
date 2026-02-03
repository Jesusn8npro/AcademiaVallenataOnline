<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  // Props para recibir datos del componente padre
  export let actividadTiempoReal: any[] = [];
  export let alumnosActivos: any[] = [];
  export let estadisticasGenerales: any = null;
  export let onGestionarTodos: () => void = () => {};

  // Iconos SVG para cada pestaña
  const iconos = {
    actividad: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5'/><path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' stroke='currentColor' stroke-width='1.5'/></svg>`,
    geolocalizacion: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='10' r='3' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z' stroke='currentColor' stroke-width='1.5' fill='none'/><circle cx='12' cy='10' r='2' fill='currentColor'/></svg>`,
    blog: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='6' y='4' width='12' height='16' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M9 9h6M9 13h6M9 17h4' stroke='currentColor' stroke-width='1.5'/></svg>`,
    paquetes: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='4' y='6' width='16' height='12' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M8 10h8M8 14h5' stroke='currentColor' stroke-width='1.5'/><circle cx='18' cy='8' r='2' stroke='currentColor' stroke-width='1.5'/></svg>`,
    retencion: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' stroke='currentColor' stroke-width='1.5'/><path d='M12 6v6l4 2' stroke='currentColor' stroke-width='1.5'/><path d='M16 2v4M8 2v4' stroke='currentColor' stroke-width='1.5'/></svg>`,
    usuarios: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='8' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5'/><circle cx='16' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5'/><path d='M2 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5M10 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5' stroke='currentColor' stroke-width='1.5'/></svg>`,
    reportes: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='15' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M7 10l2 2 4-4' stroke='currentColor' stroke-width='1.5'/><path d='M7 14h10M7 17h6' stroke='currentColor' stroke-width='1.5'/></svg>`,
    pagos: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='1' y='4' width='22' height='16' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M1 10h22' stroke='currentColor' stroke-width='1.5'/><path d='M8 14h.01M12 14h2' stroke='currentColor' stroke-width='1.5'/></svg>`,
    comunicaciones: `<svg width='24' height='24' viewBox='0 0 24 24'><path d='M7 8.5L12 12l5-3.5' stroke='currentColor' stroke-width='1.5'/><rect x='3' y='6' width='18' height='12' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M3 7l7.5 5.5a2 2 0 002 0L20 7' stroke='currentColor' stroke-width='1.5'/></svg>`,
    configuracion: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1 1.51V5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' stroke='currentColor' stroke-width='1.5'/></svg>`
  };

  // Configuración de pestañas
  const pestañas = [
    { label: 'Actividad', icon: iconos.actividad, id: 'actividad' },
    { label: 'Geolocalización', icon: iconos.geolocalizacion, id: 'geolocalizacion' },
    { label: 'Blog & Contenido', icon: iconos.blog, id: 'blog' },
    { label: 'Paquetes', icon: iconos.paquetes, id: 'paquetes' },
    { label: 'Retención', icon: iconos.retencion, id: 'retencion' },
    { label: 'Usuarios', icon: iconos.usuarios, id: 'usuarios' },
    { label: 'Pagos', icon: iconos.pagos, id: 'pagos' },
    { label: 'Comunicaciones', icon: iconos.comunicaciones, id: 'comunicaciones' },
    { label: 'Reportes', icon: iconos.reportes, id: 'reportes' },
    { label: 'Configuración', icon: iconos.configuracion, id: 'configuracion' }
  ];

  let pestañaActiva = 'actividad'; // Primera pestaña por defecto
  let contenedorNav: HTMLElement;
  let puedeScrollIzquierda = false;
  let puedeScrollDerecha = false;

  function cambiarPestaña(nuevaPestaña: string) {
    pestañaActiva = nuevaPestaña;
    console.log(`📂 [PESTAÑAS] Cambiando a: ${nuevaPestaña}`);
  }

  function actualizarEstadoScroll() {
    if (!contenedorNav) return;
    const { scrollLeft, scrollWidth, clientWidth } = contenedorNav;
    puedeScrollIzquierda = scrollLeft > 0;
    puedeScrollDerecha = scrollLeft < scrollWidth - clientWidth - 1;
  }

  function scrollHorizontal(direccion: 'izquierda' | 'derecha') {
    if (!contenedorNav) return;
    const cantidadScroll = contenedorNav.clientWidth * 0.7;
    const nuevoScrollLeft =
      direccion === 'izquierda'
        ? contenedorNav.scrollLeft - cantidadScroll
        : contenedorNav.scrollLeft + cantidadScroll;
    
    contenedorNav.scrollTo({
      left: nuevoScrollLeft,
      behavior: 'smooth'
    });
  }

  onMount(() => {
    setTimeout(actualizarEstadoScroll, 100);
    window.addEventListener('resize', actualizarEstadoScroll);
    return () => window.removeEventListener('resize', actualizarEstadoScroll);
  });
</script>

<div class="contenedor-pestañas-admin">
  <div class="nav-container-admin">
    <button
      class="boton-scroll izquierda"
      aria-label="Desplazar a la izquierda"
      on:click={() => scrollHorizontal('izquierda')}
      class:visible={puedeScrollIzquierda}
    >
      <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
    </button>

    <nav
      class="navegacion-pestañas-admin"
      bind:this={contenedorNav}
      on:scroll={actualizarEstadoScroll}
    >
      {#each pestañas as pestaña, i}
        <button
          class="pestaña-item-admin"
          class:activo={pestañaActiva === pestaña.id}
          aria-label={pestaña.label}
          role="tab"
          on:click={() => cambiarPestaña(pestaña.id)}
        >
          <div class="contenido-pestaña-admin">
            <div class="icono-admin">{@html pestaña.icon}</div>
            <span class="etiqueta-admin">{pestaña.label}</span>
          </div>
        </button>
      {/each}
    </nav>

    <button
      class="boton-scroll derecha"
      aria-label="Desplazar a la derecha"
      on:click={() => scrollHorizontal('derecha')}
      class:visible={puedeScrollDerecha}
    >
      <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
    </button>
  </div>

  <!-- 📂 CONTENIDO DE LAS PESTAÑAS -->
  <div class="contenido-pestañas-admin">
    
    <!-- 📊 PESTAÑA ACTIVIDAD -->
    {#if pestañaActiva === 'actividad'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaActividad.svelte') then { default: PestanaActividad }}
        <PestanaActividad 
          {actividadTiempoReal} 
          {alumnosActivos} 
          {estadisticasGenerales}
          {onGestionarTodos} 
        />
      {/await}
    {/if}



    <!-- 🌍 PESTAÑA GEOLOCALIZACIÓN -->
    {#if pestañaActiva === 'geolocalizacion'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaGeolocalizacion.svelte') then { default: PestanaGeolocalizacion }}
        <PestanaGeolocalizacion />
      {/await}
    {/if}

    <!-- 📝 PESTAÑA BLOG & CONTENIDO -->
    {#if pestañaActiva === 'blog'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaBlog.svelte') then { default: PestanaBlog }}
        <PestanaBlog />
      {/await}
    {/if}

    <!-- 📦 PESTAÑA PAQUETES -->
    {#if pestañaActiva === 'paquetes'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaPaquetes.svelte') then { default: PestanaPaquetes }}
        <PestanaPaquetes />
      {/await}
    {/if}

    <!-- 🎯 PESTAÑA RETENCIÓN -->
    {#if pestañaActiva === 'retencion'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaRetencion.svelte') then { default: PestanaRetencion }}
        <PestanaRetencion />
      {/await}
    {/if}

    <!-- 👥 PESTAÑA USUARIOS -->
    {#if pestañaActiva === 'usuarios'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaUsuarios.svelte') then { default: PestanaUsuarios }}
        <PestanaUsuarios />
      {/await}
    {/if}

    <!-- 💰 PESTAÑA PAGOS -->
    {#if pestañaActiva === 'pagos'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaPagos.svelte') then { default: PestanaPagos }}
        <PestanaPagos />
      {/await}
    {/if}

    <!-- 📢 PESTAÑA COMUNICACIONES -->
    {#if pestañaActiva === 'comunicaciones'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaComunicaciones.svelte') then { default: PestanaComunicaciones }}
        <PestanaComunicaciones />
      {/await}
    {/if}

    <!-- 📊 PESTAÑA REPORTES -->
    {#if pestañaActiva === 'reportes'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaReportes.svelte') then { default: PestanaReportes }}
        <PestanaReportes />
      {/await}
    {/if}

    <!-- ⚙️ PESTAÑA CONFIGURACIÓN -->
    {#if pestañaActiva === 'configuracion'}
      {#await import('$lib/components/PanelAdministracion/pestanas/PestanaConfiguracion.svelte') then { default: PestanaConfiguracion }}
        <PestanaConfiguracion />
      {/await}
    {/if}

  </div>
</div>

<style>
  .contenedor-pestañas-admin {
    width: 100%;
    margin-bottom: 2rem;
  }

  .nav-container-admin {
    position: relative;
    margin-bottom: 2rem;
  }

  .navegacion-pestañas-admin {
    display: flex;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 0.5rem;
    box-shadow: 0 6px 32px -4px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    margin: 0;
  }

  .pestaña-item-admin {
    display: flex;
    justify-content: center;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1;
    min-width: 120px;
    text-align: center;
    border-radius: 12px;
  }

  .contenido-pestaña-admin {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 10px;
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .pestaña-item-admin.activo {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateY(-2px);
  }

  .pestaña-item-admin.activo .contenido-pestaña-admin {
    color: white;
  }

  .pestaña-item-admin:hover:not(.activo) {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }

  .icono-admin {
    width: 24px;
    height: 24px;
  }

  .etiqueta-admin {
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .pestaña-item-admin::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 25%;
    width: 50%;
    height: 3px;
    background: #8b5cf6;
    border-radius: 6px;
    transform: scaleX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .pestaña-item-admin.activo::after {
    transform: scaleX(1);
  }

  /* BOTONES DE SCROLL */
  .boton-scroll {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: #8b5cf6;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 25;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    transition: all 0.2s ease;
    opacity: 0;
    pointer-events: none;
  }

  .boton-scroll.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .boton-scroll:hover {
    background-color: #7c3aed;
    transform: translateY(-50%) scale(1.1);
  }

  .boton-scroll.izquierda {
    left: -20px;
  }

  .boton-scroll.derecha {
    right: -20px;
  }

  .boton-scroll svg {
    width: 18px;
    height: 18px;
    stroke: #ffffff;
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .contenido-pestañas-admin {
    min-height: 500px;
    width: 100%;
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .navegacion-pestañas-admin {
      justify-content: flex-start;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .navegacion-pestañas-admin::-webkit-scrollbar {
      display: none;
    }

    .pestaña-item-admin {
      flex: 0 0 auto;
      min-width: 100px;
      scroll-snap-align: center;
      padding: 0.5rem 0.75rem;
    }

    .contenido-pestaña-admin {
      gap: 0.25rem;
      padding: 0.25rem;
    }

    .icono-admin {
      width: 20px;
      height: 20px;
    }

    .etiqueta-admin {
      font-size: 0.75rem;
    }

    .boton-scroll {
      display: flex;
    }
  }

  @media (max-width: 480px) {
    .pestaña-item-admin {
      min-width: 70px;
      padding: 0.4rem;
    }

    .contenido-pestaña-admin {
      gap: 0.2rem;
      padding: 0.3rem;
    }

    .etiqueta-admin {
      font-size: 0.65rem;
    }

    .icono-admin {
      width: 16px;
      height: 16px;
    }
  }
</style> 