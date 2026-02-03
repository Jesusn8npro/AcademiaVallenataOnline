<script lang="ts">
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  // ✅ NUEVO: Importar sistema de routing inteligente
  import { navegarInteligente, esRutaActiva, logRouting } from '$lib/utils/routingUtils';
  
  // 🎯 COMPORTAMIENTO INTELIGENTE SOLO EN PÁGINAS DE CLASES
  let menuVisible = true; // ✅ VISIBLE POR DEFECTO
  let timeoutInactividad: NodeJS.Timeout;
  let ultimaActividad = Date.now();
  const TIEMPO_INACTIVIDAD = 2000; // 2 segundos de inactividad

  // Determinar el tipo de usuario y ruta actual
  $: tipoUsuario = $usuario?.rol === 'admin' ? 'admin' : 'estudiante';
  $: rutaActual = $page.url.pathname;

  // 🎯 DETECTAR SI ESTAMOS EN PÁGINA DE CLASE/LECCIÓN
  $: esPaginaClase = rutaActual.includes('/clase/') || rutaActual.includes('/leccion/');
  
  // 🎯 COMPORTAMIENTO INTELIGENTE SOLO EN PÁGINAS DE CLASES
  $: if (esPaginaClase) {
    // En páginas de clases: oculto por defecto, pero se muestra con actividad
    menuVisible = false; // Oculto por defecto en páginas de clases
  } else {
    // En resto del sitio: siempre visible
    menuVisible = true;
  }

  // ✅ NUEVO: Función de verificación de ruta activa usando utilidades
  function verificarRutaActiva(ruta: string): boolean {
    return esRutaActiva(ruta);
  }

  // Navegación para administradores
  const menuAdmin = [
    {
      id: 'dashboard',
      icono: 'dashboard',
      texto: 'Panel',
      		ruta: '/panel-administracion',
      badge: '3'
    },
    {
      id: 'contenido',
      icono: 'contenido',
      texto: 'Contenido',
      ruta: '/administrador/panel-contenido',
      badge: null
    },
    {
      id: 'mensajes',
      icono: 'mensajes',
      texto: 'Mensajes',
      ruta: '/mensajes',
      badge: '5'
    },
    {
      id: 'comunidad',
      icono: 'comunidad',
      texto: 'Comunidad',
      ruta: '/comunidad',
      badge: '12'
    },
    {
      id: 'perfil',
      icono: 'perfil',
      texto: 'Perfil',
      ruta: '/mi-perfil',
      badge: null
    }
  ];

  // Navegación para estudiantes
  const menuEstudiante = [
    {
      id: 'panel',
      icono: 'dashboard',
      texto: 'Inicio',
      ruta: '/panel-estudiante',
      badge: null
    },
    {
      id: 'comunidad',
      icono: 'comunidad',
      texto: 'Comunidad',
      ruta: '/comunidad',
      badge: '5'
    },
    {
      id: 'cursos',
      icono: 'cursos',
      texto: 'Mis Cursos',
      ruta: '/mis-cursos',
      badge: '75%'
    },
    {
      id: 'blog',
      icono: 'blog',
      texto: 'Blog',
      ruta: '/blog',
      badge: null
    },
    {
      id: 'perfil',
      icono: 'perfil',
      texto: 'Perfil',
      ruta: '/mi-perfil',
      badge: null
    }
  ];

  $: menuItems = tipoUsuario === 'admin' ? menuAdmin : menuEstudiante;

  // ✅ NUEVO: Función de navegación inteligente
  async function navegarA(ruta: string) {
    try {
      logRouting('Iniciando navegación desde menú inferior a:', ruta);
      await navegarInteligente(ruta);
    } catch (error) {
      console.warn('⚠️ [MENU] Error en navegación inteligente, usando fallback:', error);
      // ✅ SOLUCIÓN: Fallback a navegación estándar
    goto(ruta);
    }
  }
  
  // 🎯 COMPORTAMIENTO INTELIGENTE SOLO EN PÁGINAS DE CLASES
  function detectarActividad() {
    if (!esPaginaClase) return; // Solo en páginas de clases
    
    ultimaActividad = Date.now();
    if (!menuVisible) {
      mostrarMenu();
    }
    reiniciarTimeoutInactividad();
  }
  
  function ocultarMenu() {
    if (!esPaginaClase) return; // Solo en páginas de clases
    
    menuVisible = false;
    console.log('📱 [MENU] Ocultando menu por inactividad');
  }
  
  function mostrarMenu() {
    if (!esPaginaClase) return; // Solo en páginas de clases
    
    menuVisible = true;
    console.log('📱 [MENU] Mostrando menu por actividad');
  }
  
  function reiniciarTimeoutInactividad() {
    if (!esPaginaClase) return; // Solo en páginas de clases
    
    if (timeoutInactividad) {
      clearTimeout(timeoutInactividad);
    }
    
    timeoutInactividad = setTimeout(() => {
      if (Date.now() - ultimaActividad >= TIEMPO_INACTIVIDAD) {
        ocultarMenu();
      }
    }, TIEMPO_INACTIVIDAD);
  }
  
  // 🎯 CONFIGURAR DETECTORES SOLO EN PÁGINAS DE CLASES
  function configurarDetectoresActividad() {
    if (!esPaginaClase) return; // Solo en páginas de clases
    
    console.log('🚀 [MENU] Configurando detectores de actividad para página de clase...');
    
    // ✅ SOLUCIÓN: Eventos básicos del usuario con manejo seguro
    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    eventos.forEach(evento => {
      document.addEventListener(evento, detectarActividad, { passive: true });
    });
    
    // ✅ SOLUCIÓN: Detección de video con delay seguro
    setTimeout(() => {
      const videos = document.querySelectorAll('video, iframe');
      videos.forEach((video, index) => {
        video.addEventListener('play', detectarActividad);
        video.addEventListener('pause', detectarActividad);
        video.addEventListener('seeking', detectarActividad);
      });
    }, 1000);
  }

  function obtenerIcono(tipo: string) {
    const iconos: { [key: string]: string } = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="9"/>
        <rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/>
        <rect x="3" y="16" width="7" height="5"/>
      </svg>`,
      contenido: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>`,
      cursos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`,
      comunidad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      perfil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`,
      mensajes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
      blog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <path d="M10 9h4"/>
      </svg>`
    };
    return iconos[tipo] || iconos.dashboard;
  }
  
  // 🎯 INICIALIZAR COMPORTAMIENTO INTELIGENTE
  onMount(() => {
    console.log('🚀 [MENU] MenuInferiorResponsivo montado');
    console.log('🚀 [MENU] Usuario:', $usuario);
    console.log('🚀 [MENU] Es página de clase:', esPaginaClase);
    console.log('🚀 [MENU] Menu visible:', menuVisible);
    
    // Configurar detectores de actividad solo si es necesario
    if (esPaginaClase) {
      configurarDetectoresActividad();
    }
  });
  
  onDestroy(() => {
    console.log('❌ [MENU] Menu inferior responsivo desmontando');
    if (timeoutInactividad) {
      clearTimeout(timeoutInactividad);
    }
    
    // Limpiar event listeners solo si estaban configurados
    if (esPaginaClase) {
    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    eventos.forEach(evento => {
      document.removeEventListener(evento, detectarActividad);
    });
    }
  });
</script>

<!-- Solo mostrar para usuarios logueados y en pantallas móviles -->
{#if $usuario}
  <nav class="menu-inferior-responsivo" class:visible={menuVisible}>
    <div class="menu-container">
      {#each menuItems as item}
        <button 
          class="menu-item cursor-hover" 
          class:activo={esRutaActiva(item.ruta)}
          on:click={() => navegarA(item.ruta)}
          aria-label={item.texto}
        >
          <div class="item-icon">
            {@html obtenerIcono(item.icono)}
          </div>
          <span class="item-text">{item.texto}</span>
          {#if item.badge}
            <div class="item-badge" class:progreso={item.badge.includes('%')} class:nuevo={item.badge === 'Nuevo'}>
              {item.badge}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </nav>
{/if}

<style>
  .menu-inferior-responsivo {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    border-top: 1px solid #e2e8f0 !important;
    z-index: 999999 !important;
    padding: 0 !important;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08) !important;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  /* 🎯 COMPORTAMIENTO INTELIGENTE SOLO EN PÁGINAS DE CLASES */
  @media (max-width: 900px) {
    .menu-inferior-responsivo {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      transform: translateY(0) !important; /* Visible por defecto */
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 999999 !important;
      background: rgba(255, 255, 255, 0.95) !important; /* ✅ FONDO NORMAL */
      backdrop-filter: blur(20px) !important;
      border-top: 1px solid #e2e8f0 !important; /* ✅ BORDE NORMAL */
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08) !important; /* ✅ SOMBRA NORMAL */
      min-height: 60px !important; /* ✅ REDUCIDO: de 80px a 60px */
      /* ✅ COMPORTAMIENTO INTELIGENTE RESTAURADO */
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    /* ✅ COMPORTAMIENTO INTELIGENTE: Mostrar/ocultar con transform */
    .menu-inferior-responsivo.visible {
      transform: translateY(0) !important; /* Visible */
      opacity: 1 !important;
    }
    
    .menu-inferior-responsivo:not(.visible) {
      transform: translateY(100%) !important; /* Oculto */
      opacity: 0 !important;
    }
  }
  
  /* 🎯 EN ESCRITORIO - SIEMPRE OCULTO */
  @media (min-width: 901px) {
    .menu-inferior-responsivo {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      transform: translateY(100%) !important;
      pointer-events: none !important;
    }
  }

  .menu-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 4px 8px; /* ✅ REDUCIDO: de 8px 16px a 4px 8px */
    max-width: 100%;
    margin: 0 auto;
    gap: 2px; /* ✅ REDUCIDO: de 4px a 2px */
  }

  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px 6px; /* ✅ REDUCIDO: de 8px 12px a 4px 6px */
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px; /* ✅ REDUCIDO: de 16px a 12px */
    position: relative;
    min-width: 50px; /* ✅ REDUCIDO: de 60px a 50px */
    flex: 1;
    max-width: 70px; /* ✅ REDUCIDO: de 80px a 70px */
  }

  .menu-item:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
  }

  .menu-item.activo {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .menu-item.activo:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  .item-icon {
    width: 20px; /* ✅ REDUCIDO: de 24px a 20px */
    height: 20px; /* ✅ REDUCIDO: de 24px a 20px */
    margin-bottom: 2px; /* ✅ REDUCIDO: de 4px a 2px */
    color: #64748b;
    transition: color 0.3s ease;
  }

  .menu-item.activo .item-icon {
    color: white;
  }

  .menu-item:hover .item-icon {
    color: #667eea;
  }

  .menu-item.activo:hover .item-icon {
    color: white;
  }

  .item-text {
    font-size: 10px; /* ✅ REDUCIDO: de 11px a 10px */
    font-weight: 600;
    color: #64748b;
    text-align: center;
    line-height: 1.1; /* ✅ REDUCIDO: de 1.2 a 1.1 */
    transition: color 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .menu-item.activo .item-text {
    color: white;
  }

  .menu-item:hover .item-text {
    color: #667eea;
  }

  .menu-item.activo:hover .item-text {
    color: white;
  }

  .item-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    background: #ef4444;
    color: white;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
    line-height: 1.2;
    transform: scale(0.9);
    animation: badge-pulse 2s infinite;
  }

  .item-badge.progreso {
    background: #3b82f6;
    animation: none;
  }

  .item-badge.nuevo {
    background: #22c55e;
    animation: badge-bounce 1s ease-in-out infinite alternate;
  }

  .menu-item.activo .item-badge {
    background: rgba(255, 255, 255, 0.9);
    color: #667eea;
  }

  /* Animaciones */
  @keyframes badge-pulse {
    0% { transform: scale(0.9); }
    50% { transform: scale(1.1); }
    100% { transform: scale(0.9); }
  }

  @keyframes badge-bounce {
    0% { transform: scale(0.9) translateY(0); }
    100% { transform: scale(1) translateY(-2px); }
  }

  /* Ajustes para pantallas muy pequeñas */
  @media (max-width: 480px) {
    .menu-container {
      padding: 6px 8px;
      gap: 2px;
    }

    .menu-item {
      padding: 6px 8px;
      min-width: 50px;
      max-width: 70px;
    }

    .item-icon {
      width: 20px;
      height: 20px;
      margin-bottom: 2px;
    }

    .item-text {
      font-size: 10px;
    }

    .item-badge {
      font-size: 8px;
      padding: 1px 4px;
      top: 2px;
      right: 4px;
    }
  }

  /* 🎯 PADDING EFECTIVO para evitar que el contenido se oculte detrás del menú - SOLO EN MÓVIL */
  @media (max-width: 900px) {
    :global(body) {
      padding-bottom: 80px !important; /* REDUCIDO de 130px a 80px */
    }
    
    /* Asegurar padding en containers principales */
    :global(.pantalla-completa),
    :global(.main-content),
    :global(main),
    :global(.contenido-principal) {
      padding-bottom: 60px !important; /* REDUCIDO de 110px a 60px */
    }
    
    /* Específico para páginas de clases y lecciones */
    :global(.pantalla-completa) {
      min-height: calc(100vh - 60px) !important; /* AJUSTADO */
    }
  }
  
  /* 🎯 EN ESCRITORIO - SIN PADDING ADICIONAL */
  @media (min-width: 901px) {
    :global(body) {
      padding-bottom: 0 !important;
    }
    
    :global(.pantalla-completa),
    :global(.main-content),
    :global(main),
    :global(.contenido-principal) {
      padding-bottom: 0 !important;
    }
  }
</style> 