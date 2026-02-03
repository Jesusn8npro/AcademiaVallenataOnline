<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { audioManager, TipoEfectoUI } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';

  // Estados del modal
  let mostrarModal = false;
  let cargando = false;
  let mostrarPersonalizacion = false;

  // Preferencias
  let preferencias = {
    esenciales: true, // Siempre habilitadas
    notificaciones: false,
    marketing: false
  };

  onMount(async () => {
    // CORRECCIÓN: Proteger código browser-only para evitar hydration mismatch
    if (!browser) return;
    
    // 🚫 TEMPORALMENTE DESHABILITADO - Modal muy intrusivo
    console.log('🍪 [MODAL PERMISOS] Temporalmente deshabilitado por ser intrusivo');
    return;
    
    // Verificar si ya se configuraron las preferencias
    const preferenciasGuardadas = localStorage.getItem('preferencias-usuario');
    
    if (!preferenciasGuardadas) {
      // Mostrar modal después de 2 segundos si no hay preferencias
      setTimeout(() => {
        // 🔧 VERIFICAR QUE NO HAYA OTROS MODALES ABIERTOS
        if (!hayModalAbierto()) {
        abrirModal();
        }
      }, 2000);
    } else {
      // Cargar preferencias guardadas
      try {
        const guardadas = JSON.parse(preferenciasGuardadas);
        preferencias = { ...preferencias, ...guardadas };
        
        // Si las notificaciones están habilitadas, verificar permisos del navegador
        if (preferencias.notificaciones && 'Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error cargando preferencias:', error);
      }
    }
  });

  // 🔧 FUNCIÓN PARA DETECTAR SI HAY OTROS MODALES ABIERTOS
  function hayModalAbierto() {
    if (!browser) return false;
    
    // Buscar específicamente modales de login y pago que tienen z-index alto
    const modalLogin = document.querySelector('.modal-overlay-inicio-sesion, .overlay-inicio-sesion');
    const modalPago = document.querySelector('[class*="modal-pago"], [class*="ModalPago"]');
    
    // Si hay modales importantes abiertos, no mostrar cookies
    return !!(modalLogin || modalPago);
  }

  // 🔧 FUNCIÓN PARA OCULTAR MODAL SI APARECE OTRO MÁS IMPORTANTE
  function verificarJerarquiaModales() {
    if (!browser || !mostrarModal) return;
    
    if (hayModalAbierto()) {
      console.log('🍪 [COOKIES] Ocultando por modal de mayor prioridad');
      mostrarModal = false;
    }
  }

  // 🔧 VERIFICAR CADA 500ms SI HAY CONFLICTOS DE MODALES
  onMount(() => {
    if (!browser) return;
    
    const intervalo = setInterval(verificarJerarquiaModales, 500);
    
    return () => {
      clearInterval(intervalo);
    };
  });

  async function aceptarTodo() {
    clickBoton();
    sonidoExito();
    cargando = true;
    
    preferencias = {
      esenciales: true,
      notificaciones: true,
      marketing: true
    };

    await guardarPreferencias();
    cerrarModal();
  }

  async function soloEsenciales() {
    clickBoton();
    cargando = true;
    
    preferencias = {
      esenciales: true,
      notificaciones: false,
      marketing: false
    };

    await guardarPreferencias();
    cerrarModal();
  }

  async function guardarPersonalizacion() {
    clickBoton();
    sonidoExito();
    cargando = true;
    await guardarPreferencias();
    cerrarModal();
  }

  async function guardarPreferencias() {
    try {
      // CORRECCIÓN: Proteger acceso a localStorage en SSR
      if (!browser) return;
      
      // Guardar en localStorage
      localStorage.setItem('preferencias-usuario', JSON.stringify(preferencias));

      // Si se habilitaron notificaciones, solicitar permisos del navegador
      if (preferencias.notificaciones && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const resultado = await Notification.requestPermission();
          
          if (resultado === 'granted') {
            // Mostrar notificación de confirmación
            new Notification('¡Configuración guardada!', {
              body: 'Recibirás notificaciones de Academia Vallenata Online',
              icon: '/favicon.ico'
            });
          } else {
            // Si rechaza, desactivar notificaciones en preferencias
            preferencias.notificaciones = false;
            if (browser) {
              localStorage.setItem('preferencias-usuario', JSON.stringify(preferencias));
            }
          }
        }
      }

      // Configurar cookies de marketing si está habilitado
      if (preferencias.marketing) {
        // Aquí puedes inicializar Google Analytics u otros servicios
        console.log('Marketing habilitado');
      }

    } catch (error) {
      console.error('Error guardando preferencias:', error);
    }
    
    cargando = false;
  }

  function cerrarModal() {
    mostrarModal = false;
    mostrarPersonalizacion = false;
    cargando = false;
    // MEJORADO: Restaurar scroll del body y html de manera más efectiva
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-abierto');
      document.documentElement.classList.remove('modal-abierto');
    }
  }

  // NUEVO: Función para abrir modal de manera más efectiva
  function abrirModal() {
    mostrarModal = true;
    // Prevenir scroll del body y html de manera más efectiva
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-abierto');
      document.documentElement.classList.add('modal-abierto');
    }
  }

  function togglePersonalizacion() {
    clickBoton();
    mostrarPersonalizacion = !mostrarPersonalizacion;
  }

  // ===== FUNCIONES DE SONIDO =====
  function hoverBoton() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_SUTIL);
  }

  function clickBoton() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
  }

  function hoverToggle() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
  }

  function clickToggle() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_GENERAL);
  }

  function sonidoExito() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
  }
</script>

{#if mostrarModal}
  <!-- Overlay -->
  <div class="modal-overlay" transition:fade={{ duration: 300 }} on:click={cerrarModal}>
    <!-- Modal -->
    <div class="modal-contenido" transition:slide={{ duration: 400 }} on:click|stopPropagation>
      
      {#if !mostrarPersonalizacion}
        <!-- Vista principal -->
        <div class="modal-header">
          <div class="icono-modal">🍪</div>
          <h3>Personaliza tu experiencia</h3>
          <p>Usamos cookies y notificaciones para ofrecerte la mejor experiencia en nuestra academia</p>
        </div>

        <div class="modal-body">
          <div class="permiso-item">
            <div class="permiso-info">
              <div class="permiso-icono">✅</div>
              <div>
                <h4>Cookies esenciales</h4>
                <p>Necesarias para el funcionamiento básico del sitio</p>
              </div>
            </div>
            <div class="permiso-toggle">
              <span class="toggle-obligatorio">Requeridas</span>
            </div>
          </div>

          <div class="permiso-item">
            <div class="permiso-info">
              <div class="permiso-icono">🔔</div>
              <div>
                <h4>Notificaciones</h4>
                <p>Recibe actualizaciones sobre cursos, mensajes y eventos</p>
              </div>
            </div>
                         <div class="permiso-toggle">
               <label class="toggle-switch" on:mouseenter={hoverToggle}>
                 <input type="checkbox" bind:checked={preferencias.notificaciones} on:change={clickToggle}>
                 <span class="toggle-slider"></span>
               </label>
             </div>
          </div>

          <div class="permiso-item">
            <div class="permiso-info">
              <div class="permiso-icono">🎯</div>
              <div>
                <h4>Marketing</h4>
                <p>Contenido personalizado y ofertas especiales</p>
              </div>
            </div>
                         <div class="permiso-toggle">
               <label class="toggle-switch" on:mouseenter={hoverToggle}>
                 <input type="checkbox" bind:checked={preferencias.marketing} on:change={clickToggle}>
                 <span class="toggle-slider"></span>
               </label>
             </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" on:click={soloEsenciales} on:mouseenter={hoverBoton} disabled={cargando}>
            Solo esenciales
          </button>
          <button class="btn-primario" on:click={aceptarTodo} on:mouseenter={hoverBoton} disabled={cargando}>
            {#if cargando}
              <span class="spinner"></span>
            {:else}
              Aceptar todo
            {/if}
          </button>
        </div>

        <button class="btn-personalizar" on:click={togglePersonalizacion} on:mouseenter={hoverBoton}>
          Personalizar configuración
        </button>

      {:else}
        <!-- Vista de personalización detallada -->
        <div class="modal-header">
                     <button class="btn-volver" on:click={togglePersonalizacion} on:mouseenter={hoverBoton}>← Volver</button>
          <h3>Configuración detallada</h3>
        </div>

        <div class="modal-body-personalizar">
          <div class="permiso-detalle">
            <h4>🍪 Cookies esenciales</h4>
            <p>Estas cookies son necesarias para que el sitio web funcione y no se pueden desactivar. Incluyen cookies de sesión, preferencias de idioma y funcionalidades básicas.</p>
            <div class="permiso-estado activo">Siempre activas</div>
          </div>

          <div class="permiso-detalle">
            <h4>🔔 Notificaciones push</h4>
            <p>Te permite recibir notificaciones en tiempo real sobre nuevos cursos, mensajes de la comunidad, eventos en vivo y actualizaciones importantes.</p>
                         <label class="toggle-switch" on:mouseenter={hoverToggle}>
               <input type="checkbox" bind:checked={preferencias.notificaciones} on:change={clickToggle}>
               <span class="toggle-slider"></span>
             </label>
          </div>

          <div class="permiso-detalle">
            <h4>🎯 Marketing y personalización</h4>
            <p>Nos ayuda a mostrarte contenido relevante, ofertas personalizadas y mejorar tu experiencia de aprendizaje basada en tus intereses.</p>
                         <label class="toggle-switch" on:mouseenter={hoverToggle}>
               <input type="checkbox" bind:checked={preferencias.marketing} on:change={clickToggle}>
               <span class="toggle-slider"></span>
             </label>
          </div>
        </div>

        <div class="modal-footer">
                     <button class="btn-guardar" on:click={guardarPersonalizacion} on:mouseenter={hoverBoton} disabled={cargando}>
            {#if cargando}
              <span class="spinner"></span> Guardando...
            {:else}
              Guardar preferencias
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* NUEVO: Estilos globales para asegurar que el modal funcione */
  :global(body.modal-abierto) {
    overflow: hidden !important;
    height: 100vh !important;
    position: fixed !important;
    width: 100% !important;
  }

  :global(html.modal-abierto) {
    overflow: hidden !important;
    height: 100vh !important;
  }

  /* NUEVO: Asegurar que el modal esté siempre visible y por encima de todo */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000; /* 🔧 MENOR que el modal de login */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow: hidden; /* Prevenir scroll interno */
  }

  .modal-contenido {
    background: white;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
    z-index: 1001; /* 🔧 MENOR que el modal de login */
    transform: translateZ(0); /* Forzar nueva capa de stacking */
  }

  .modal-header {
    padding: 2rem 2rem 1rem;
    text-align: center;
    position: relative;
  }

  .icono-modal {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .modal-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 0.5rem;
  }

  .modal-header p {
    color: #6b7280;
    font-size: 0.95rem;
    margin: 0;
    line-height: 1.5;
  }

  .modal-body {
    padding: 1rem 2rem;
  }

  .permiso-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .permiso-item:last-child {
    border-bottom: none;
  }

  .permiso-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .permiso-icono {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
  }

  .permiso-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 0.25rem;
  }

  .permiso-info p {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .toggle-obligatorio {
    background: #10b981;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #cbd5e1;
    transition: 0.3s;
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input:checked + .toggle-slider {
    background: #8b5cf6;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }

  .modal-footer {
    padding: 1rem 2rem 2rem;
    display: flex;
    gap: 1rem;
  }

  .btn-secundario,
  .btn-primario,
  .btn-guardar {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-secundario {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .btn-secundario:hover:not(:disabled) {
    background: #f1f5f9;
    color: #475569;
  }

  .btn-primario,
  .btn-guardar {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
  }

  .btn-primario:hover:not(:disabled),
  .btn-guardar:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
  }

  .btn-personalizar {
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    color: #8b5cf6;
    font-weight: 600;
    cursor: pointer;
    border-top: 1px solid #f3f4f6;
  }

  .btn-personalizar:hover {
    background: #faf5ff;
  }

  .btn-volver {
    position: absolute;
    left: 2rem;
    top: 2rem;
    background: transparent;
    border: none;
    color: #8b5cf6;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem;
  }

  .modal-body-personalizar {
    padding: 1rem 2rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .permiso-detalle {
    padding: 1.5rem 0;
    border-bottom: 1px solid #f3f4f6;
    position: relative;
  }

  .permiso-detalle:last-child {
    border-bottom: none;
  }

  .permiso-detalle h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 0.75rem;
  }

  .permiso-detalle p {
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  .permiso-estado {
    position: absolute;
    top: 1.5rem;
    right: 0;
  }

  .permiso-estado.activo {
    background: #10b981;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive - Mejorado para móvil */
  @media (max-width: 768px) {
    .modal-overlay {
      padding: 1rem; /* Padding uniforme */
      align-items: center; /* CAMBIADO: Centrado también en móvil */
      justify-content: center;
    }
    
    .modal-contenido {
      margin: 0;
      max-width: 100%;
      width: calc(100% - 2rem); /* Respeto del padding */
      border-radius: 20px; /* CAMBIADO: Bordes redondeados en todos lados */
      max-height: 85vh; /* Altura ajustada */
      animation: modalFadeIn 0.3s ease-out; /* CAMBIADO: Animación suave */
    }

    .modal-header {
      padding: 1.5rem 1.25rem 1rem;
    }

    .modal-header h3 {
      font-size: 1.3rem;
    }

    .modal-header p {
      font-size: 0.9rem;
    }

    .icono-modal {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .modal-body {
      padding: 0.75rem 1.25rem;
    }

    .modal-footer {
      padding: 1rem 1.25rem 1.5rem;
      gap: 0.75rem;
    }

    .modal-body-personalizar {
      padding: 0.75rem 1.25rem;
    }

    .btn-volver {
      left: 1.25rem;
      top: 1rem;
    }

    .permiso-item {
      padding: 1rem 0;
      gap: 0.75rem;
    }

    .permiso-info {
      gap: 0.75rem;
    }

    .permiso-info h4 {
      font-size: 0.95rem;
    }

    .permiso-info p {
      font-size: 0.8rem;
    }

    .permiso-icono {
      font-size: 1.3rem;
      width: 35px;
    }

    .btn-primario,
    .btn-secundario {
      padding: 0.875rem 1.5rem;
      font-size: 0.9rem;
    }

    .btn-personalizar {
      padding: 0.875rem;
      font-size: 0.85rem;
      margin: 0.75rem 1.25rem 1.25rem;
    }

    .toggle-switch {
      width: 45px;
      height: 22px;
    }

    .toggle-slider {
      border-radius: 22px;
    }

    .toggle-slider:before {
      height: 18px;
      width: 18px;
      left: 2px;
      bottom: 2px;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(23px);
    }
  }

  /* NUEVA animación más suave para el modal */
  @keyframes modalFadeIn {
    from {
      transform: scale(0.9) translateY(-20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  /* Para pantallas muy pequeñas */
  @media (max-width: 480px) {
    .modal-overlay {
      padding: 0.75rem; /* Menos padding en pantallas muy pequeñas */
    }
    
    .modal-contenido {
      width: calc(100% - 1.5rem); /* Ajuste del ancho */
      max-height: 90vh; /* Más altura disponible */
    }

    .modal-header {
      padding: 1.25rem 1rem 0.75rem;
    }

    .modal-body {
      padding: 0.5rem 1rem;
    }

    .modal-footer {
      padding: 0.75rem 1rem 1.25rem;
    }

    .modal-body-personalizar {
      padding: 0.5rem 1rem;
    }

    .btn-volver {
      left: 1rem;
    }

    .btn-personalizar {
      margin: 0.5rem 1rem 1rem;
    }

    .permiso-item {
      padding: 0.875rem 0;
    }

    .modal-header h3 {
      font-size: 1.2rem;
    }

    .icono-modal {
      font-size: 2.2rem;
    }
  }
</style> 