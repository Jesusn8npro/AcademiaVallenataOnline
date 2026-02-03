<script lang="ts">
  import { goto } from '$app/navigation';

  // Props
  export let modalAbierto = false;
  export let modoPublico = false;
  export let slugUsuario: string | null = null;

  // Iconos SVG
  const iconos = {
    perfil: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5'/><path d='M4 20c0-3.5 8-3.5 8-3.5s8 0 8 3.5' stroke='currentColor' stroke-width='1.5'/></svg>`,
    cursos: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='4' y='4' width='16' height='16' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M8 9h8M8 14h5' stroke='currentColor' stroke-width='1.5'/></svg>`,
    comunidad: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='8' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5'/><circle cx='16' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5'/><path d='M2 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5M10 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5' stroke='currentColor' stroke-width='1.5'/></svg>`,
    publicaciones: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='6' y='4' width='12' height='16' rx='2' stroke='currentColor' stroke-width='1.5'/><path d='M9 9h6M9 13h6' stroke='currentColor' stroke-width='1.5'/></svg>`,
    actividad: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5'/><path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' stroke='currentColor' stroke-width='1.5'/></svg>`,
    configuracion: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1 1.51V5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' stroke='currentColor' stroke-width='1.5'/></svg>`,
    eventos: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='18' rx='2' ry='2' stroke='currentColor' stroke-width='1.5' fill='none'/><line x1='16' y1='2' x2='16' y2='6' stroke='currentColor' stroke-width='1.5'/><line x1='8' y1='2' x2='8' y2='6' stroke='currentColor' stroke-width='1.5'/><line x1='3' y1='10' x2='21' y2='10' stroke='currentColor' stroke-width='1.5'/><circle cx='8' cy='14' r='1.5' fill='currentColor'/><circle cx='12' cy='18' r='1.5' fill='currentColor'/><circle cx='16' cy='14' r='1.5' fill='currentColor'/></svg>`
  };

  // Icono para grabaciones
  const iconoGrabaciones = `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='3' stroke='currentColor' stroke-width='1.5'/><path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' stroke='currentColor' stroke-width='1.5'/><circle cx='12' cy='12' r='9' stroke='currentColor' stroke-width='1.5' fill='none'/></svg>`;

  // Pestañas dinámicas según el modo
  $: pestañas = modoPublico && slugUsuario ? [
    // Pestañas para perfil público
    { label: 'Información', icon: iconos.perfil, route: `/usuarios/${slugUsuario}` },
    { label: 'Publicaciones', icon: iconos.publicaciones, route: `/usuarios/${slugUsuario}/publicaciones` },
    { label: 'Grabaciones', icon: iconoGrabaciones, route: `/usuarios/${slugUsuario}/grabaciones` },
    { label: 'Actividad', icon: iconos.actividad, route: `/usuarios/${slugUsuario}/actividad` }
  ] : [
    // Pestañas para perfil privado
    { label: 'Perfil', icon: iconos.perfil, route: '/mi-perfil' },
    { label: 'Mis Cursos', icon: iconos.cursos, route: '/mis-cursos' },
    { label: 'Eventos', icon: iconos.eventos, route: '/mis-eventos' },
    { label: 'Publicaciones', icon: iconos.publicaciones, route: '/publicaciones' },
    { label: 'Grabaciones', icon: iconoGrabaciones, route: '/grabaciones' },
    { label: 'Configuración', icon: iconos.configuracion, route: '/configuracion' }
  ];

  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let indiceActivo = 0;
  let contenedorNav: HTMLElement;
  let puedeScrollIzquierda = false;
  let puedeScrollDerecha = false;

  $: {
    const rutaActual = $page.url.pathname;
    
    // Buscar coincidencia exacta primero
    const coincidenciaExacta = pestañas.findIndex(pestaña => pestaña.route === rutaActual);
    
    if (coincidenciaExacta !== -1) {
      indiceActivo = coincidenciaExacta;
    } else {
      // Fallback: encontrar la mejor coincidencia por prefijo (más específica primero)
      const mejorCoincidencia = pestañas.findIndex(pestaña => 
        rutaActual.startsWith(pestaña.route) && pestaña.route !== '/'
      );
      indiceActivo = mejorCoincidencia !== -1 ? mejorCoincidencia : 0;
    }
  }

  function actualizarEstadoScroll() {
    if (!contenedorNav) return;
    const { scrollLeft, scrollWidth, clientWidth } = contenedorNav;
    puedeScrollIzquierda = scrollLeft > 0;
    puedeScrollDerecha = scrollLeft < scrollWidth - clientWidth - 1; // -1 for precision
  }

  function scrollHorizontal(direccion: 'izquierda' | 'derecha') {
    if (!contenedorNav) return;
    const cantidadScroll = contenedorNav.clientWidth * 0.7; // Scroll del 70% del ancho visible
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
    // Timeout para asegurar que el DOM está renderizado y las dimensiones son correctas
    setTimeout(actualizarEstadoScroll, 100);
    window.addEventListener('resize', actualizarEstadoScroll);
    return () => window.removeEventListener('resize', actualizarEstadoScroll);
  });
</script>

<div class="contenedor-pestañas-wrapper" class:modal-abierto={modalAbierto}>
  <div class="nav-container-interno">
    <button
      class="boton-scroll izquierda"
      aria-label="Desplazar a la izquierda"
      on:click={() => scrollHorizontal('izquierda')}
      class:visible={puedeScrollIzquierda}
    >
      <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
    </button>

    <nav
      class="navegacion-pestañas"
      bind:this={contenedorNav}
      on:scroll={actualizarEstadoScroll}
    >
      {#each pestañas as pestaña, i}
        <a
          href={pestaña.route || '#'}
          class="pestaña-item"
          class:activo={indiceActivo === i}
          aria-label={pestaña.label}
          role="tab"
          on:click={(e) => {
            e.preventDefault(); // Prevenir navegación normal
            
            if (!pestaña.route) return;
            
            // Navegación inteligente según el modo
            if (modoPublico) {
              // Para perfiles públicos, mantener scroll
              goto(pestaña.route, { 
                keepFocus: true,
                noScroll: true,
                replaceState: false
              });
            } else {
              // Para perfil privado, navegación sin scroll para pestañas del perfil
              const rutasPerfilSinScroll = ['/mi-perfil', '/mis-cursos', '/mis-eventos', '/publicaciones', '/grabaciones', '/configuracion'];
              
              if (rutasPerfilSinScroll.includes(pestaña.route)) {
                goto(pestaña.route, { 
                  keepFocus: true,
                  noScroll: true,
                  replaceState: false
                });
              } else {
                goto(pestaña.route);
              }
            }
          }}
        >
          <div class="contenido-pestaña">
            <div class="icono">{@html pestaña.icon}</div>
            <span class="etiqueta">{pestaña.label}</span>
          </div>
        </a>
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
</div>

<style>
  .contenedor-pestañas-wrapper {
    position: relative;
    width: 100%;
    margin-top: -20px;
    z-index: 20;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  /* Ocultar suavemente cuando el modal está abierto */
  .contenedor-pestañas-wrapper.modal-abierto {
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
  }

  .nav-container-interno {
    position: relative;
    margin-top: 25px;
  }

  .navegacion-pestañas {
    display: flex;
    justify-content: center;
    background: #ffffff;
    border-radius: 16px;
    padding: 0;
    box-shadow: 0 6px 32px -4px rgba(0, 0, 0, 0.08);
    width: 100%;
    margin: 0;
  }
  .pestaña-item {
    display: flex;
    justify-content: center;
    padding: 6px 8px;
    color: #4b5563; /* Gris más oscuro para mejor lectura */
    text-decoration: none;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1; /* Distribución equitativa en escritorio */
    min-width: 70px;
    text-align: center;
  }
  .contenido-pestaña {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 3px;
    border-radius: 10px;
    width: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    top: 0;
  }

  .pestaña-item.activo .contenido-pestaña {
    color: #2563eb;
    transform: translateY(-4px);
  }
  .pestaña-item:hover:not(.activo) .contenido-pestaña {
    background-color: #f3f4f6; /* Fondo sutil al pasar el mouse */
    transform: translateY(-2px);
  }

  .icono {
    width: 22px;
    height: 22px;
  }
  .etiqueta {
    font-size: 0.65rem; /* 10.4px */
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .pestaña-item::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 25%;
    width: 50%;
    height: 3px;
    background: #2563eb;
    border-radius: 6px;
    transform: scaleX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }
  .pestaña-item.activo::after {
    transform: scaleX(1);
  }

  /* === BOTONES DE SCROLL RESPONSIVOS === */
  .boton-scroll {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: #2563eb; /* Azul primario */
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: none; /* Ocultos por defecto */
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 25;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    transition: all 0.2s ease;
    opacity: 0;
    pointer-events: none;
  }
  .boton-scroll.visible {
    opacity: 1;
    pointer-events: auto;
  }
  .boton-scroll:hover {
    background-color: #1d4ed8; /* Azul más oscuro */
    transform: translateY(-50%) scale(1.1);
  }
  .boton-scroll.izquierda {
    left: -15px;
  }
  .boton-scroll.derecha {
    right: -15px;
  }
  .boton-scroll svg {
    width: 16px;
    height: 16px;
    stroke: #ffffff; /* Blanco */
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* === DISEÑO RESPONSIVO PARA MÓVILES === */
  @media (max-width: 768px) {
    .navegacion-pestañas {
      justify-content: flex-start;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 0; /* Sin padding para que sea lado a lado */
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
    .navegacion-pestañas::-webkit-scrollbar {
      display: none; /* Chrome, Safari, and Opera */
    }
    .pestaña-item {
      flex: 0 0 auto; /* No crecen, no se encogen, tamaño automático */
      width: 32%; /* Muestra ~3 pestañas */
      scroll-snap-align: center;
      padding: 4px 6px;
    }
    .contenido-pestaña {
      padding: 4px 2px;
      gap: 2px;
    }
    .icono {
      width: 20px;
      height: 20px;
    }
    .etiqueta {
      font-size: 0.6rem;
    }
    .boton-scroll {
      display: flex; /* Muestra los botones en móvil */
    }
    .contenedor-pestañas-wrapper {
      margin-top: -20px;
      z-index: 10;
      width: 100%;
    }
    
    .nav-container-interno {
      width: 100%;
      padding: 0;
      margin-top: 15px;
    }
  }

  @media (max-width: 480px) {
    .pestaña-item {
      width: 35%; /* Muestra ~2.8 pestañas */
      padding: 3px 4px;
    }
    .contenido-pestaña {
      padding: 10px 1px;
    }
    .icono {
      width: 18px;
      height: 18px;
    }
    .etiqueta {
      font-size: 0.8rem;
      margin-top: 10px;
    }
    .contenedor-pestañas-wrapper {
      margin-top: -30px;
    }
    .nav-container-interno {
      margin-top: 10px;
    }
  }
</style>
