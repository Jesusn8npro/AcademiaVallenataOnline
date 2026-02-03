<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { GestorEfectosCursor } from './gestorEfectosCursor';
  import { UtilidadesCursor } from './utilidadesCursor';
  import { audioManager, TipoEfectoUI } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';

  // Variables de estado del cursor
  let cursorPrincipal: HTMLElement;
  let anilloExterno: HTMLElement;
  let efectoRipple: HTMLElement;
  let gestorEfectos: GestorEfectosCursor;
  
  // Estados reactivos
  let posicionX = 0;
  let posicionY = 0;
  let escalaAnillo = 1;
  let opacidadAnillo = 0.8;
  let colorCursor = 'var(--color-primary)';
  let tipoContexto = 'normal'; // normal, hover, texto, arrastrar
  let mostrarRipple = false;
  let mostrarCursor = false;
  let rippleX = 0;
  let rippleY = 0;

  // Control de sonidos para evitar reproducción múltiple
  let elementosYaSonaron: Set<HTMLElement> = new Set();
  let elementoActualHover: HTMLElement | null = null;

  // Variables de animación
  let animacionFrame: number = 0;
  let ultimaActualizacion = 0;
  const FPS_TARGET = 60;
  const INTERVALO_FRAME = 1000 / FPS_TARGET;

  onMount(async () => {
    if (!browser) return;

    // ✅ DETECCIÓN INTELIGENTE: Verificar si es dispositivo móvil/táctil REAL
    const esDispositivoTactilReal = UtilidadesCursor.esDispositivoTactil();
    
    // 🔧 MODO DESARROLLO: Forzar cursor en desarrollo
    const esModoDesarrollo = import.meta.env.DEV;
    
    if (esDispositivoTactilReal && !esModoDesarrollo) {
      console.log('🖱️ Cursor personalizado deshabilitado en dispositivo táctil real');
      return;
    }
    
    if (esModoDesarrollo && esDispositivoTactilReal) {
      console.log('🔧 MODO DESARROLLO: Forzando cursor personalizado para pruebas');
    }
    
    // ✅ MODO PRUEBAS: Cursor más visible en pantallas pequeñas con mouse
    const esPantallaPequenaConMouse = window.innerWidth <= 768 && window.matchMedia('(any-hover: hover)').matches;
    if (esPantallaPequenaConMouse) {
      console.log('🔍 MODO PRUEBAS: Cursor optimizado para pantalla pequeña con mouse');
      document.documentElement.style.setProperty('--cursor-test-mode', 'active');
    }

    // Inicializar gestor de efectos
    gestorEfectos = new GestorEfectosCursor({
      onCambioContexto: manejarCambioContexto,
      onClick: manejarClick,
      onHover: manejarHover,
      onMovimiento: manejarMovimiento
    });

    // Ocultar cursor nativo
    document.body.style.cursor = 'none';
    document.body.classList.add('cursor-personalizado-activo');

    // Mostrar cursor personalizado
    mostrarCursor = true;

    // Iniciar seguimiento
    gestorEfectos.iniciar();

    console.log('🎯 Cursor personalizado inicializado');
  });

  onDestroy(() => {
    if (!browser) return;
    
    // Limpiar y restaurar cursor nativo
    if (gestorEfectos) {
      gestorEfectos.destruir();
    }
    
    if (animacionFrame) {
      cancelAnimationFrame(animacionFrame);
    }

    document.body.style.cursor = '';
    document.body.classList.remove('cursor-personalizado-activo');
  });

  // Manejadores de eventos del cursor
  function manejarMovimiento(x: number, y: number) {
    const ahora = performance.now();
    if (ahora - ultimaActualizacion < INTERVALO_FRAME) return;
    
    ultimaActualizacion = ahora;
    posicionX = x;
    posicionY = y;
  }

  function manejarCambioContexto(contexto: string, elemento?: HTMLElement) {
    tipoContexto = contexto;
    
    switch (contexto) {
      case 'hover':
        escalaAnillo = 2.2;
        opacidadAnillo = 0.9;
        colorCursor = 'var(--color-accent)';
        break;
      case 'texto':
        escalaAnillo = 1.1;
        opacidadAnillo = 0.7;
        colorCursor = 'var(--color-text)';
        break;
      case 'arrastrar':
        escalaAnillo = 1.6;
        opacidadAnillo = 0.85;
        colorCursor = 'var(--color-warning)';
        break;
      case 'presionado':
        escalaAnillo = 0.6;
        opacidadAnillo = 1;
        colorCursor = 'var(--color-accent)';
        break;
      default:
        escalaAnillo = 1;
        opacidadAnillo = 0.8;
        colorCursor = 'var(--color-primary)';
    }
  }

  function manejarHover(entrando: boolean, elemento?: HTMLElement) {
    if (entrando && elemento) {
      // Buscar el elemento interactivo principal (botón, enlace, etc.)
      const elementoPrincipal = encontrarElementoInteractivoPadre(elemento);
      
      if (elementoPrincipal) {
        // Obtener tipo de sonido específico según el elemento
        const tipoSonido = obtenerTipoSonidoElemento(elementoPrincipal);
        
        // Solo reproducir sonido si es un botón nuevo que no ha sonado en esta sesión
        if (!elementosYaSonaron.has(elementoPrincipal)) {
          audioManager.reproducirEfectoUI(tipoSonido);
          elementosYaSonaron.add(elementoPrincipal);
        }
        elementoActualHover = elementoPrincipal;
      }
    } else if (!entrando && elementoActualHover) {
      // Verificar si realmente salimos del elemento principal
      const elementoSalida = elemento;
      if (elementoSalida && elementoActualHover && !elementoActualHover.contains(elementoSalida)) {
        // Para elementos de menú, permitir sonido más frecuentemente
        if (elementoActualHover && elementoActualHover.classList.contains('menu-item')) {
          setTimeout(() => {
            if (elementoActualHover) {
              elementosYaSonaron.delete(elementoActualHover);
            }
          }, 1000); // 1 segundo para menú
        } else {
          // Ya no estamos en el botón principal, resetear para que pueda sonar de nuevo
          elementosYaSonaron.delete(elementoActualHover);
        }
        elementoActualHover = null;
      }
    }
  }

  // Función para determinar el tipo de sonido según el elemento
  function obtenerTipoSonidoElemento(elemento: HTMLElement): TipoEfectoUI {
    // Menú inferior responsivo - sonido específico de navegación
    if (elemento.classList.contains('menu-item')) {
      return TipoEfectoUI.HOVER_NAVEGACION;
    }
    
    // Elementos de curso/tutorial - sonidos más sutiles
    if (elemento.classList.contains('leccion-item')) {
      return TipoEfectoUI.SLIDE_1; // Usar slide para elementos de curso
    }
    
    if (elemento.classList.contains('modulo-header')) {
      return TipoEfectoUI.SLIDE_2; // Usar slide para módulos
    }
    
    if (elemento.classList.contains('tab-btn')) {
      return TipoEfectoUI.POP; // Usar pop para tabs
    }
    
    // Botones generales
    if (elemento.tagName === 'BUTTON' || elemento.classList.contains('btn') || elemento.classList.contains('boton')) {
      return TipoEfectoUI.HOVER_SUTIL;
    }
    
    // Enlaces
    if (elemento.tagName === 'A' || elemento.classList.contains('enlace')) {
      return TipoEfectoUI.HOVER_NAVEGACION;
    }
    
    // Por defecto - hover sutil
    return TipoEfectoUI.HOVER_SUTIL;
  }

  // Función para encontrar el elemento interactivo padre más cercano
  function encontrarElementoInteractivoPadre(elemento: HTMLElement): HTMLElement | null {
    let elementoActual: HTMLElement | null = elemento;
    
    while (elementoActual && elementoActual !== document.body) {
      // Verificar si es un elemento interactivo
      if (
        elementoActual.tagName === 'BUTTON' ||
        elementoActual.tagName === 'A' ||
        elementoActual.hasAttribute('role') && elementoActual.getAttribute('role') === 'button' ||
        elementoActual.classList.contains('boton') ||
        elementoActual.classList.contains('btn') ||
        elementoActual.classList.contains('enlace') ||
        elementoActual.classList.contains('clickeable') ||
        elementoActual.hasAttribute('tabindex') ||
        // ✅ ELEMENTOS ESPECÍFICOS DE LA ACADEMIA
        elementoActual.classList.contains('menu-item') ||
        elementoActual.classList.contains('leccion-item') ||
        elementoActual.classList.contains('modulo-header') ||
        elementoActual.classList.contains('tab-btn') ||
        elementoActual.classList.contains('tarjeta-curso') ||
        elementoActual.classList.contains('tarjeta-tutorial') ||
        elementoActual.classList.contains('cerrar-sidebar')
      ) {
        return elementoActual;
      }
      elementoActual = elementoActual.parentElement;
    }
    
    return null;
  }

  function manejarClick(x: number, y: number, elemento?: HTMLElement) {
    // Centrar el ripple de 80px restando 40px de cada coordenada
    rippleX = x - 40;
    rippleY = y - 40;
    
    // Efecto visual de ripple
    mostrarRipple = true;
    
    // Sonido de clic según el tipo de elemento con más especificidad
    if (elemento?.classList.contains('menu-item')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
    } else if (elemento?.classList.contains('leccion-item')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.POWER);
    } else if (elemento?.classList.contains('tab-btn')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.POP);
    } else if (elemento?.classList.contains('modulo-header')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.SLIDE_1);
    } else if (elemento?.tagName === 'BUTTON' || elemento?.classList.contains('boton')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
    } else if (elemento?.tagName === 'A' || elemento?.classList.contains('enlace')) {
      audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
    } else {
      audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_GENERAL);
    }

    // Eliminar ripple después de la animación
    setTimeout(() => {
      mostrarRipple = false;
    }, 600); // Coincide con la nueva duración de 0.6s
  }
</script>

<!-- Cursor personalizado -->
{#if mostrarCursor && browser}
  <!-- Punto central del cursor -->
  <div 
    bind:this={cursorPrincipal}
    class="cursor-punto-central"
    style="
      transform: translate3d({posicionX}px, {posicionY}px, 0);
      background-color: {colorCursor};
    "
  ></div>

  <!-- Anillo externo con seguimiento suave -->
  <div 
    bind:this={anilloExterno}
    class="cursor-anillo-externo {tipoContexto}"
    style="
      transform: translate3d({posicionX}px, {posicionY}px, 0) scale({escalaAnillo});
      border-color: {colorCursor};
      opacity: {opacidadAnillo};
    "
  ></div>

  <!-- Efecto Ripple al hacer clic -->
  {#if mostrarRipple}
    <div 
      bind:this={efectoRipple}
      class="cursor-ripple"
      style="
        transform: translate3d({rippleX}px, {rippleY}px, 0);
        border-color: {colorCursor};
      "
    ></div>
  {/if}
{/if}

<style>
  :global(body.cursor-personalizado-activo) {
    cursor: none !important;
  }

  :global(body.cursor-personalizado-activo *) {
    cursor: none !important;
  }

  /* Asegurar que el cursor esté visible incluso sobre modales y overlays */
  :global(.modal-overlay) {
    cursor: none !important;
  }

  :global(.modal-overlay *) {
    cursor: none !important;
  }

  /* Punto central del cursor */
  .cursor-punto-central {
    position: fixed;
    top: -4px;
    left: -4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 999999; /* Máximo z-index para estar sobre modales */
    will-change: transform;
    transition: background-color 0.15s ease;
    box-shadow: 
      0 0 10px currentColor,
      0 0 20px rgba(var(--color-primary-rgb), 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  }

  /* Anillo externo con seguimiento suave */
  .cursor-anillo-externo {
    position: fixed;
    top: -18px;
    left: -18px;
    width: 36px;
    height: 36px;
    border: 3px solid;
    border-radius: 50%;
    pointer-events: none;
    z-index: 999998; /* Máximo z-index para estar sobre modales */
    will-change: transform, opacity;
    transition: 
      transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      opacity 0.2s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease;
    box-shadow: 
      0 0 15px rgba(var(--color-primary-rgb), 0.3),
      0 0 30px rgba(var(--color-primary-rgb), 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  /* Estados contextuales del anillo */
  .cursor-anillo-externo.hover {
    border-width: 4px;
    box-shadow: 
      0 0 25px rgba(var(--color-accent-rgb), 0.6),
      0 0 40px rgba(var(--color-accent-rgb), 0.3),
      0 0 60px rgba(var(--color-accent-rgb), 0.1),
      inset 0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  .cursor-anillo-externo.texto {
    border-radius: 8px;
    transform-origin: center;
    border-width: 4px;
    box-shadow: 
      0 0 20px rgba(var(--color-text-rgb), 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  }

  .cursor-anillo-externo.arrastrar {
    border-style: dashed;
    border-width: 4px;
    animation: cursor-rotate 2s linear infinite;
    box-shadow: 
      0 0 30px rgba(var(--color-warning-rgb), 0.6),
      0 0 50px rgba(var(--color-warning-rgb), 0.3);
  }

  .cursor-anillo-externo.presionado {
    border-width: 5px;
    box-shadow: 
      0 0 35px rgba(var(--color-accent-rgb), 0.8),
      0 0 60px rgba(var(--color-accent-rgb), 0.4),
      inset 0 0 0 3px rgba(255, 255, 255, 0.3);
  }

  /* Efecto Ripple al hacer clic */
  .cursor-ripple {
    position: fixed;
    top: 0;
    left: 0;
    width: 80px; /* Aumentado para mejor visibilidad */
    height: 80px; /* Aumentado para mejor visibilidad */
    border: 3px solid; /* Más delgado y elegante */
    border-radius: 50%;
    pointer-events: none;
    z-index: 999997; /* Máximo z-index para estar sobre modales */
    opacity: 1;
    animation: cursor-ripple-expand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    box-shadow: 
      0 0 20px rgba(var(--color-accent-rgb), 0.4),
      0 0 40px rgba(var(--color-accent-rgb), 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  }

  /* Animaciones */
  @keyframes cursor-ripple-expand {
    0% {
      transform: scale(0.1);
      opacity: 1;
      border-width: 3px;
      box-shadow: 
        0 0 15px rgba(var(--color-accent-rgb), 0.8),
        0 0 30px rgba(var(--color-accent-rgb), 0.4),
        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    20% {
      transform: scale(0.4);
      opacity: 0.9;
      border-width: 4px;
      box-shadow: 
        0 0 25px rgba(var(--color-accent-rgb), 0.7),
        0 0 50px rgba(var(--color-accent-rgb), 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    60% {
      transform: scale(1.5);
      opacity: 0.4;
      border-width: 2px;
      box-shadow: 
        0 0 40px rgba(var(--color-accent-rgb), 0.3),
        0 0 80px rgba(var(--color-accent-rgb), 0.1),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
      border-width: 1px;
      box-shadow: 
        0 0 60px rgba(var(--color-accent-rgb), 0),
        0 0 120px rgba(var(--color-accent-rgb), 0),
        inset 0 0 0 1px rgba(255, 255, 255, 0);
    }
  }

  @keyframes cursor-rotate {
    from { 
      transform: rotate(0deg); 
    }
    to { 
      transform: rotate(360deg); 
    }
  }

  /* ✅ OPTIMIZADO: Solo ocultar en móviles REALES sin mouse */
  @media (max-width: 768px) and (hover: none) and (pointer: coarse) {
    .cursor-punto-central,
    .cursor-anillo-externo,
    .cursor-ripple {
      display: none !important;
    }
  }
  
     /* ✅ PANTALLAS PEQUEÑAS CON MOUSE: Cursor más visible para pruebas */
  @media (max-width: 768px) and (any-hover: hover) {
    .cursor-punto-central {
      width: 10px !important;
      height: 10px !important;
      background: var(--color-accent, #FF6B35) !important;
      box-shadow: 
        0 0 20px currentColor,
        0 0 40px rgba(var(--color-accent-rgb), 0.8),
        inset 0 0 0 1px rgba(255, 255, 255, 0.6) !important;
      animation: cursor-pulse-enhanced 2s ease-in-out infinite !important;
    }
    
    .cursor-anillo-externo {
      width: 40px !important;
      height: 40px !important;
      border: 3px solid var(--color-accent, #FF6B35) !important;
      box-shadow: 
        0 0 30px rgba(var(--color-accent-rgb), 0.8),
        0 0 60px rgba(var(--color-accent-rgb), 0.4) !important;
    }
  }
  
  /* ✅ MODO PRUEBAS ACTIVADO: Cursor súper visible */
  :root[style*="--cursor-test-mode: active"] .cursor-punto-central {
    background: #00FF88 !important;
    box-shadow: 
      0 0 25px #00FF88,
      0 0 50px rgba(0, 255, 136, 0.6),
      inset 0 0 0 2px rgba(255, 255, 255, 0.8) !important;
  }
  
  :root[style*="--cursor-test-mode: active"] .cursor-anillo-externo {
    border-color: #00FF88 !important;
    box-shadow: 
      0 0 35px rgba(0, 255, 136, 0.8),
      0 0 70px rgba(0, 255, 136, 0.4) !important;
  }
  
  /* Animación mejorada para modo pruebas */
  @keyframes cursor-pulse-enhanced {
    0%, 100% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  /* Modo oscuro - Efectos mejorados */
  :global(.dark) .cursor-punto-central {
    box-shadow: 
      0 0 15px currentColor,
      0 0 30px rgba(var(--color-primary-rgb), 0.6),
      inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  :global(.dark) .cursor-anillo-externo {
    box-shadow: 
      0 0 20px rgba(var(--color-primary-rgb), 0.5),
      0 0 40px rgba(var(--color-primary-rgb), 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  }

  :global(.dark) .cursor-anillo-externo.hover {
    box-shadow: 
      0 0 35px rgba(var(--color-accent-rgb), 0.8),
      0 0 60px rgba(var(--color-accent-rgb), 0.4),
      0 0 100px rgba(var(--color-accent-rgb), 0.2),
      inset 0 0 0 2px rgba(255, 255, 255, 0.3);
  }

  /* Animación de pulso sutil para el punto central */
  .cursor-punto-central {
    animation: cursor-pulse 4s ease-in-out infinite;
  }

  @keyframes cursor-pulse {
    0%, 100% {
      filter: brightness(1) saturate(1);
    }
    50% {
      filter: brightness(1.2) saturate(1.3);
    }
  }
</style> 