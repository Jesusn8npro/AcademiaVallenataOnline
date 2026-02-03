<!-- Barra de navegación principal con efectos de audio de Rhythm Plus -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { audioManager, TipoEfectoUI } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';
  import { page } from '$app/stores';
  
  export let navegacionJuego = false;
  
  let textoPrevio: string | null = null;
  let audioSilenciado = false;
  let enPantallaCompleta = false;
  
  // Función para manejar click (exacta de Rhythm Plus)
  function manejarClick() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_GENERAL);
  }
  
  // Función para manejar hover (exacta de Rhythm Plus)
  function manejarHover(event: Event) {
    const target = event.target as HTMLElement;
    const texto = target.innerText;
    if (!texto || texto === textoPrevio) return;
    audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
    textoPrevio = texto;
  }
  
  // Función específica para hover de navegación
  function hoverNavegacion() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
  }
  
  // Función para alternar mute de música de fondo (exacta de Rhythm Plus)
  function toggleMute() {
    audioManager.toggleBgMute();
    audioSilenciado = audioManager.isMuted;
    manejarClick();
  }
  
  // Función para alternar fullscreen
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          enPantallaCompleta = true;
        }).catch((err) => {
          console.log('Error al entrar en fullscreen:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          enPantallaCompleta = false;
        }).catch((err) => {
          console.log('Error al salir de fullscreen:', err);
        });
      }
    } catch (error) {
      console.log('Fullscreen no soportado:', error);
    }
    manejarClick();
  }
  
  // Función para mostrar login
  function mostrarLogin() {
    console.log("Mostrar login");
    manejarClick();
    // Redirigir a página de cuenta
    window.location.href = '/simulador-gaming/cuenta';
  }
  
  // Detectar cambios en fullscreen
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', () => {
      enPantallaCompleta = !!document.fullscreenElement;
    });
  }
  
  onMount(() => {
    // Sincronizar estado del botón con el audio manager
    audioSilenciado = audioManager.isMuted;
    
    // Limpiar el texto previo cuando se desmonte
    return () => {
      textoPrevio = null;
    };
  });
</script>

<!-- Botones superiores (desktop y mobile) -->
<div class="botones-superiores">
  <button 
    class="boton-superior" 
    on:click={toggleMute}
    on:mouseenter={hoverNavegacion}
    title="Silenciar/Activar sonido"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {#if audioSilenciado}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
      {/if}
    </svg>
  </button>
  
  <button 
    class="boton-superior" 
    on:click={toggleFullscreen}
    on:mouseenter={hoverNavegacion}
    title="Pantalla completa"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {#if enPantallaCompleta}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 15v4.5M15 15h4.5M15 15l5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15H4.5M9 15v4.5M9 15l-5.5 5.5"/>
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7V4a1 1 0 011-1h3m0 0L3 7m4-4v1m0 3h1m11-4h-3a1 1 0 00-1 1v3m0 0L21 7m-4-4h1m0 3v1m-4 11h3a1 1 0 001-1v-3m0 0L17 17m4 4v-1m0-3h-1m-11 4H4a1 1 0 01-1-1v-3m0 0L7 17M3 21v-1m0-3h1"/>
      {/if}
    </svg>
  </button>
  
  <button 
    class="boton-superior boton-login" 
    on:click={mostrarLogin}
    on:mouseenter={hoverNavegacion}
    title="Iniciar Sesión"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
    </svg>
    <span class="texto-login">Iniciar Sesión</span>
  </button>
</div>

<!-- Navegación principal -->
<div class="navbar {navegacionJuego ? 'gameNav' : 'mainNav'}" on:click={manejarClick}>
  {#if !navegacionJuego}
    <!-- Navegación principal -->
    <a href="/simulador-gaming" class="nav {$page.url.pathname === '/simulador-gaming' ? 'active' : ''}" data-nav="home" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      <div class="navtext">Inicio</div>
    </a>
    
    <a href="/simulador-gaming/seleccion-canciones" class="nav {$page.url.pathname === '/simulador-gaming/seleccion-canciones' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
      </svg>
      <div class="navtext">Selección de Canciones</div>
    </a>
    
    <a href="/simulador-gaming/juego" class="nav {$page.url.pathname === '/simulador-gaming/juego' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a1 1 0 011-1h4a1 1 0 011 1v1M9 10H6a1 1 0 00-1 1v4a1 1 0 001 1h3m9-6V9a1 1 0 00-1-1H10"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <div class="navtext">Juego de Acordeón</div>
    </a>
    
    <a href="/simulador-gaming/simulador" class="nav {$page.url.pathname === '/simulador-gaming/simulador' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
      </svg>
      <div class="navtext">Simulador Libre</div>
    </a>
    
    <a href="/simulador-gaming/estudio" class="nav {$page.url.pathname === '/simulador-gaming/estudio' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
      </svg>
      <div class="navtext">Mi Estudio</div>
    </a>
    
    <!-- Editor Max removido - funcionalidad no disponible -->
    
    <a href="/simulador-gaming/rankings" class="nav {$page.url.pathname === '/simulador-gaming/rankings' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
      </svg>
      <div class="navtext">Rankings</div>
    </a>
    
    <a href="/simulador-gaming/cuenta" class="nav {$page.url.pathname === '/simulador-gaming/cuenta' ? 'active' : ''}" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <div class="navtext">Cuenta y Configuración</div>
    </a>
  {:else}
    <!-- Navegación del juego -->
    <a href="/simulador-gaming/seleccion-canciones" class="nav" on:mouseenter={hoverNavegacion}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      <div class="navtext">Volver</div>
    </a>
    
    <div class="nav" on:click={toggleFullscreen} on:mouseenter={hoverNavegacion} role="button" tabindex="0">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if enPantallaCompleta}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 15v4.5M15 15h4.5M15 15l5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15H4.5M9 15v4.5M9 15l-5.5 5.5"/>
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7V4a1 1 0 011-1h3m0 0L3 7m4-4v1m0 3h1m11-4h-3a1 1 0 00-1 1v3m0 0L21 7m-4-4h1m0 3v1m-4 11h3a1 1 0 001-1v-3m0 0L17 17m4 4v-1m0-3h-1m-11 4H4a1 1 0 01-1-1v-3m0 0L7 17M3 21v-1m0-3h1"/>
        {/if}
      </svg>
      <div class="navtext">Alternar Pantalla Completa</div>
    </div>
  {/if}
</div>

<style>
  /* Botones superiores */
  .botones-superiores {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 900;
  }
  
  .boton-superior {
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .boton-superior:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  .boton-login {
    border-radius: 25px;
    width: auto;
    padding: 0 15px;
    min-width: 140px;
  }
  
  .texto-login {
    margin-left: 8px;
    font-size: 14px;
    font-weight: 500;
  }
  
  /* Navegación principal */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    max-width: 80%;
    overflow: hidden;
    z-index: 800;
    scrollbar-width: none;
  }
  
  .mainNav {
    background: rgba(0, 0, 0, 0.5);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.2) 0%,
      rgba(0, 0, 0, 0) 100%
    );
  }
  
  .nav {
    padding: 20px;
    opacity: 0.5;
    align-items: center;
    overflow: hidden;
    display: flex;
    transition: 0.5s;
    cursor: pointer;
    box-sizing: border-box;
    min-width: 68px;
    width: 68px;
    max-width: 68px;
    color: white;
    text-align: center;
    text-decoration: none;
  }
  
  .nav:hover {
    text-decoration: none;
  }
  
  .gameNav .nav {
    min-width: 48px;
    width: 48px;
    max-width: 48px;
  }
  
  .nav.active {
    opacity: 0.9;
  }
  
  .navtext {
    padding-left: 0;
    max-width: 0;
    box-sizing: border-box;
    white-space: nowrap;
    opacity: 0;
    transition: padding-left 0.5s, max-width 0.5s, opacity 0.5s;
    pointer-events: none;
  }
  
  /* Desktop */
  @media only screen and (min-width: 1000px) {
    .nav:hover {
      background: rgba(255, 255, 255, 0.7);
      color: black;
      opacity: 1;
      width: auto;
      max-width: 100%;
    }
    
    .nav:hover .navtext {
      padding-left: 10px;
      max-width: 100%;
      width: 100%;
      opacity: 1;
    }
  }
  
  /* Estilos especiales para Editor Max */
  .editor-max-nav {
    background: linear-gradient(45deg, 
      rgba(6, 182, 212, 0.3) 0%, 
      rgba(139, 92, 246, 0.3) 50%, 
      rgba(236, 72, 153, 0.3) 100%
    );
    border: 1px solid rgba(6, 182, 212, 0.5);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .editor-max-nav:hover {
    background: linear-gradient(45deg, 
      rgba(6, 182, 212, 0.6) 0%, 
      rgba(139, 92, 246, 0.6) 50%, 
      rgba(236, 72, 153, 0.6) 100%
    ) !important;
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
    transform: scale(1.05);
  }
  
  .editor-max-nav.active {
    background: linear-gradient(45deg, 
      rgba(6, 182, 212, 0.8) 0%, 
      rgba(139, 92, 246, 0.8) 50%, 
      rgba(236, 72, 153, 0.8) 100%
    ) !important;
    box-shadow: 0 0 40px rgba(6, 182, 212, 0.8);
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
    }
  }

  /* Mobile */
  @media only screen and (max-width: 1000px) {
    .mainNav {
      top: auto;
      bottom: 0;
      left: 0;
      display: flex;
      justify-content: space-evenly;
      width: 100%;
      max-width: 100%;
      background: rgba(0, 0, 0, 0.7);
      background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 0.6) 60%,
        rgba(0, 0, 0, 0) 100%
      );
    }
    
    .boton-login .texto-login {
      display: none;
    }
    
    .boton-login {
      min-width: 48px;
      border-radius: 50%;
    }
    
    .editor-max-nav {
      border-radius: 12px;
    }
  }
</style> 