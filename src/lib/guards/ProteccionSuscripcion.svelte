<script lang="ts">
  import { onMount } from 'svelte';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Props para personalizar el contenido
  export let nombreContenido: string = "contenido premium";
  export let tipoContenido: string = "curso"; // curso o tutorial
  export let mostrarPrevisualizacion: boolean = false;
  
  let usuarioActual: any = null;
  let cargandoAuth = true;
  let accesoDenegado = false;
  let tieneAcceso = false;
  let tiempoRestante = 10; // ✅ NUEVO: CONTADOR REGRESIVO

  // Verificar autenticación y suscripción
  onMount(() => {
    const unsubscribe = usuario.subscribe((u) => {
      usuarioActual = u;
      cargandoAuth = false;

      if (!u) {
        // No está logueado
        accesoDenegado = true;
        iniciarContadorRegresivo(); // ✅ NUEVO: INICIAR CONTADOR
      } else {
        // ✅ NUEVO: VERIFICAR SI TIENE SUSCRIPCIÓN ACTIVA
        verificarSuscripcion(u);
      }
    });

    return unsubscribe;
  });

  function irAMembresias() {
    goto('/membresias');
  }

  function irAInicio() {
    goto('/');
  }

  // ✅ NUEVO: FUNCIÓN PARA INICIAR CONTADOR REGRESIVO
  function iniciarContadorRegresivo() {
    const intervalo = setInterval(() => {
      tiempoRestante--;
      if (tiempoRestante <= 0) {
        clearInterval(intervalo);
        goto('/');
      }
    }, 1000);
  }

  // ✅ NUEVO: FUNCIÓN PARA VERIFICAR SUSCRIPCIÓN
  async function verificarSuscripcion(usuario: any) {
    try {
      // Por ahora verificamos solo si está logueado
      // TODO: Aquí agregarías la lógica real de verificación de suscripción
      // Por ejemplo: verificar en base de datos si tiene plan activo
      
      if (usuario && usuario.id) {
        // ✅ USUARIO AUTENTICADO - ACCESO PERMITIDO
        tieneAcceso = true;
        accesoDenegado = false;
        console.log('✅ [GUARD] Usuario autenticado, acceso permitido:', usuario.nombre);
      } else {
        // ❌ SIN USUARIO - ACCESO DENEGADO
        tieneAcceso = false;
        accesoDenegado = true;
        setTimeout(() => {
          goto('/');
        }, 10000); // ✅ 10 SEGUNDOS
      }
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      // En caso de error, denegar acceso
      tieneAcceso = false;
      accesoDenegado = true;
      setTimeout(() => {
        goto('/');
      }, 10000);
    }
  }

  function irALogin() {
    const urlActual = $page.url.pathname;
    goto(`/?redirigir=${encodeURIComponent(urlActual)}`);
  }
</script>

<svelte:head>
  <title>Contenido Premium - Academia Vallenata Online</title>
</svelte:head>

<!-- Mostrar loading mientras se verifica acceso -->
{#if cargandoAuth}
  <div class="auth-verificacion">
    <div class="spinner"></div>
    <h2>Verificando acceso...</h2>
    <p>Comprobando tu suscripción</p>
  </div>

<!-- Si acceso denegado, mostrar mensaje -->
{:else if accesoDenegado}
  <div class="acceso-denegado">
    <div class="error-icono">
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C13.1 2 14 2.9 14 4V6C15.1 6 16 6.9 16 8V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V8C8 6.9 8.9 6 10 6V4C10 2.9 10.9 2 12 2ZM12 4V6H12V4ZM10 8V20H14V8H10Z" fill="#fbbf24"/>
      </svg>
    </div>
    <h1>🔒 ACCESO RESTRINGIDO</h1>
    <p class="mensaje-principal">Este {tipoContenido} "{nombreContenido}" requiere acceso premium</p>
    
    <div class="info-simple">
      {#if !usuarioActual}
        <p><strong>🚪 Inicia sesión para continuar</strong></p>
        <p>Necesitas una cuenta en la Academia Vallenata Online para acceder a este contenido premium</p>
        <p><strong>🔒 Este contenido está protegido y solo es accesible para estudiantes registrados</strong></p>
      {:else}
        <p><strong>⭐ Contenido exclusivo para miembros premium</strong></p>
        <p>Tu cuenta actual no tiene acceso a este contenido. Necesitas una suscripción activa</p>
        <p><strong>🎯 Únete a nuestros planes premium para desbloquear todo el contenido</strong></p>
      {/if}
    </div>

    <div class="mensaje-seguridad">
      <div class="seguridad-icono">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#fbbf24"/>
        </svg>
      </div>
      <p><strong>🛡️ CONTENIDO PROTEGIDO</strong></p>
      <p>Esta área está monitoreada y solo es accesible para estudiantes autorizados</p>
    </div>

    <div class="beneficios-premium">
      <h3>🎯 Con tu suscripción premium obtienes:</h3>
      <div class="beneficios-grid">
        <div class="beneficio-item">
          <span class="beneficio-icono">🎵</span>
          <p>Acceso a todos los cursos de acordeón</p>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icono">🎥</span>
          <p>Tutoriales paso a paso en HD</p>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icono">📱</span>
          <p>Simulador interactivo premium</p>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icono">📊</span>
          <p>Seguimiento de progreso detallado</p>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icono">🏆</span>
          <p>Certificados de completación</p>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icono">👨‍🏫</span>
          <p>Soporte directo del instructor</p>
        </div>
      </div>
    </div>

    <div class="acciones">
      {#if !usuarioActual}
        <button class="btn-login" on:click={irALogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v12z" fill="currentColor"/>
          </svg>
          Iniciar Sesión
        </button>
      {:else}
        <button class="btn-premium" on:click={irAMembresias}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3.09 8.26L4.5 9.67L12 4.33L19.5 9.67L20.91 8.26L12 2ZM12 22L3.09 15.74L4.5 14.33L12 19.67L19.5 14.33L20.91 15.74L12 22Z" fill="currentColor"/>
          </svg>
          Ver Planes Premium
        </button>
      {/if}
      <button class="btn-inicio" on:click={irAInicio}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        Volver al Inicio
      </button>
    </div>
    
    <div class="countdown">
      <p>⏰ Redirigiendo automáticamente en <strong>{tiempoRestante}</strong> segundos...</p>
    </div>

    <div class="advertencia-final">
      <p><strong>⚠️ IMPORTANTE:</strong> Este contenido está protegido por derechos de autor</p>
      <p>Acceso no autorizado será registrado y monitoreado</p>
    </div>
  </div>

<!-- Si tiene acceso, mostrar contenido -->
{:else}
  <slot />
{/if}

<style>
  .auth-verificacion {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    text-align: center;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .acceso-denegado {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
    color: white;
    text-align: center;
    padding: 2rem;
    gap: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .acceso-denegado::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
    animation: grain 8s linear infinite;
    z-index: 0;
  }

  @keyframes grain {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-5%, -5%); }
    20% { transform: translate(-10%, 5%); }
    30% { transform: translate(5%, -10%); }
    40% { transform: translate(-5%, 15%); }
    50% { transform: translate(-10%, 5%); }
    60% { transform: translate(15%, 0%); }
    70% { transform: translate(0%, 10%); }
    80% { transform: translate(3%, 15%); }
    90% { transform: translate(-10%, 10%); }
  }

  .error-icono {
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.6));
    position: relative;
    z-index: 1;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-15px) rotate(2deg); }
    50% { transform: translateY(-20px) rotate(0deg); }
    75% { transform: translateY(-15px) rotate(-2deg); }
  }

  .acceso-denegado h1 {
    font-size: 3.2rem;
    font-weight: 900;
    margin: 0;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(251, 191, 36, 0.3);
    letter-spacing: 3px;
    animation: titleGlow 3s ease-in-out infinite alternate;
    position: relative;
    z-index: 1;
  }

  @keyframes titleGlow {
    from { text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(251, 191, 36, 0.3); }
    to { text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 30px rgba(251, 191, 36, 0.6); }
  }

  .mensaje-principal {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 1rem 0;
    opacity: 0.95;
  }

  .info-simple {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin: 1rem 0;
    max-width: 500px;
    position: relative;
    z-index: 1;
  }

  .info-simple p {
    margin: 0.8rem 0;
    font-size: 1rem;
    line-height: 1.4;
  }

  .mensaje-seguridad {
    background: rgba(251, 191, 36, 0.2);
    border: 2px solid rgba(251, 191, 36, 0.4);
    border-radius: 16px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    max-width: 600px;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: securityPulse 3s ease-in-out infinite;
    position: relative;
    z-index: 1;
  }

  .seguridad-icono {
    flex-shrink: 0;
    animation: securityRotate 4s linear infinite;
  }

  .mensaje-seguridad p {
    margin: 0.5rem 0;
    font-size: 1rem;
    line-height: 1.4;
  }

  @keyframes securityPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  @keyframes securityRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .beneficios-premium {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    padding: 2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    margin: 1.5rem 0;
    max-width: 700px;
    position: relative;
    z-index: 1;
  }

  .beneficios-premium h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .beneficios-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .beneficio-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    text-align: left;
  }

  .beneficio-icono {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .beneficio-item p {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .acciones {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    position: relative;
    z-index: 1;
  }

  .btn-inicio, .btn-login, .btn-premium {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .btn-premium {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  }

  .btn-premium:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  }

  .btn-login {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .btn-login:hover {
    background: #059669;
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .btn-inicio {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.4);
  }

  .btn-inicio:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .countdown {
    margin-top: 1.5rem;
    opacity: 0.9;
    background: rgba(0, 0, 0, 0.4);
    padding: 1rem 2rem;
    border-radius: 25px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    animation: glow 2s ease-in-out infinite alternate;
    position: relative;
    z-index: 1;
  }

  .countdown p {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes glow {
    from { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
    to { box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
  }

  .advertencia-final {
    background: rgba(220, 38, 38, 0.3);
    border: 2px solid rgba(220, 38, 38, 0.5);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
    max-width: 500px;
    animation: warningBlink 2s ease-in-out infinite;
    position: relative;
    z-index: 1;
  }

  .advertencia-final p {
    margin: 0.3rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
  }

  @keyframes warningBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .acceso-denegado {
      padding: 1rem;
      gap: 1rem;
    }

    .acceso-denegado h1 {
      font-size: 2rem;
    }

    .acciones {
      flex-direction: column;
      width: 100%;
      max-width: 300px;
    }

    .btn-inicio, .btn-login, .btn-premium {
      justify-content: center;
      width: 100%;
      padding: 1rem;
    }

    .beneficios-grid {
      grid-template-columns: 1fr;
    }

    .beneficios-premium {
      padding: 1.5rem;
      max-width: 100%;
    }

    .mensaje-principal {
      font-size: 1.1rem;
    }
  }
</style> 