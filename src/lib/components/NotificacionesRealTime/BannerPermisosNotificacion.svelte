<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { notificacionesService } from '$lib/services/notificacionesService';

  let mostrarBanner = false;
  let permisoNotificacion: NotificationPermission = 'default';
  let cargando = false;

  onMount(() => {
    // Verificar si el navegador soporta notificaciones
    if (typeof window !== 'undefined' && 'Notification' in window) {
      permisoNotificacion = Notification.permission;
      
      // Mostrar banner si no se han configurado los permisos
      if (permisoNotificacion === 'default') {
        // Esperar un poco antes de mostrar para no ser intrusivo
        setTimeout(() => {
          mostrarBanner = true;
        }, 3000);
      }
    }
  });

  async function solicitarPermisos() {
    cargando = true;
    
    try {
      // Verificar si el navegador soporta notificaciones
      if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        mostrarBanner = false;
        cargando = false;
        return;
      }

      // Si ya están concedidos, no hacer nada
      if (Notification.permission === 'granted') {
        permisoNotificacion = 'granted';
        mostrarBanner = false;
        cargando = false;
        return;
      }

      // Solicitar permisos
      const resultado = await Notification.requestPermission();
      
      if (resultado === 'granted') {
        permisoNotificacion = 'granted';
        mostrarBanner = false;
        
        // Guardar que ya se concedieron para no volver a preguntar
        localStorage.setItem('notificaciones-concedidas', 'true');
        
        // Mostrar notificación de confirmación
        new Notification('¡Notificaciones activadas!', {
          body: 'Ahora recibirás actualizaciones en tiempo real de Academia Vallenata.',
          icon: '/favicon.ico'
        });
        
      } else {
        permisoNotificacion = 'denied';
        mostrarBanner = false;
        // Recordar que se rechazó
        localStorage.setItem('notificaciones-rechazadas', 'true');
      }
      
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      mostrarBanner = false;
    }
    
    cargando = false;
  }

  function cerrarBanner() {
    mostrarBanner = false;
    // No volver a mostrar en esta sesión
    sessionStorage.setItem('banner-notificaciones-cerrado', 'true');
  }

  function rechazarPermisos() {
    mostrarBanner = false;
    // Recordar que el usuario rechazó
    localStorage.setItem('notificaciones-rechazadas', 'true');
  }

  // No mostrar si ya se cerró en esta sesión
  $: if (typeof window !== 'undefined' && sessionStorage.getItem('banner-notificaciones-cerrado')) {
    mostrarBanner = false;
  }

  // No mostrar si el usuario ya rechazó antes
  $: if (typeof window !== 'undefined' && localStorage.getItem('notificaciones-rechazadas')) {
    mostrarBanner = false;
  }

  // No mostrar si ya se concedieron antes
  $: if (typeof window !== 'undefined' && localStorage.getItem('notificaciones-concedidas')) {
    mostrarBanner = false;
  }
</script>

{#if mostrarBanner && permisoNotificacion === 'default'}
  <div class="banner-notificaciones" transition:slide={{ duration: 300 }}>
    <div class="contenido-banner">
      <div class="icono-banner">🔔</div>
      <div class="texto-banner">
        <h4>¡Mantente al día con notificaciones en tiempo real!</h4>
        <p>Recibe notificaciones instantáneas sobre nuevos comentarios, likes, cursos y más.</p>
      </div>
      <div class="acciones-banner">
        <button 
          class="boton-permitir" 
          on:click={solicitarPermisos}
          disabled={cargando}
        >
          {#if cargando}
            <span class="spinner-mini"></span>
          {:else}
            ✅ Permitir
          {/if}
        </button>
        <button class="boton-rechazar" on:click={rechazarPermisos}>
          ❌ No gracias
        </button>
        <button class="boton-cerrar" on:click={cerrarBanner} title="Cerrar">
          ✖️
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .banner-notificaciones {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  }

  .contenido-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .icono-banner {
    font-size: 2rem;
    animation: campanilla 2s ease-in-out infinite;
  }

  @keyframes campanilla {
    0%, 100% { transform: rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
    20%, 40%, 60%, 80% { transform: rotate(10deg); }
  }

  .texto-banner {
    flex: 1;
  }

  .texto-banner h4 {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .texto-banner p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .acciones-banner {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .boton-permitir,
  .boton-rechazar,
  .boton-cerrar {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .boton-permitir {
    background: white;
    color: #3b82f6;
  }

  .boton-permitir:hover:not(:disabled) {
    background: #f1f5f9;
    transform: translateY(-1px);
  }

  .boton-permitir:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .boton-rechazar {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .boton-rechazar:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .boton-cerrar {
    background: transparent;
    color: white;
    padding: 0.5rem;
    opacity: 0.7;
  }

  .boton-cerrar:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .spinner-mini {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .contenido-banner {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      text-align: center;
    }

    .acciones-banner {
      justify-content: center;
      flex-wrap: wrap;
    }

    .texto-banner h4 {
      font-size: 1rem;
    }

    .texto-banner p {
      font-size: 0.85rem;
    }
  }
</style> 