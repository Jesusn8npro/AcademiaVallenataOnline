<script lang="ts">
  import { onMount } from 'svelte';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Props para personalizar el mensaje
  export let titulo: string = "🔒 ACCESO RESTRINGIDO";
  export let mensajePrincipal: string = "Esta área requiere que inicies sesión en tu cuenta";
  export let mostrarRegistro: boolean = true;
  export let redirigirA: string = "/";
  export let tiempoRedirección: number = 2000; // Reducido a 2 segundos

  let usuarioActual: any = null;
  let cargandoAuth = false; // Cambiado a false para ser más rápido
  let accesoDenegado = false;

  // ⚡ VERIFICACIÓN RÁPIDA DE AUTENTICACIÓN
  onMount(() => {
    // Verificar inmediatamente si ya hay usuario
    const usuarioInicial = $usuario;
    if (usuarioInicial) {
      usuarioActual = usuarioInicial;
      cargandoAuth = false;
      accesoDenegado = false;
      return;
    }

    // Si no hay usuario, verificar en store
    const unsubscribe = usuario.subscribe((u) => {
      usuarioActual = u;
      
      if (u) {
        // ✅ USUARIO AUTENTICADO - ACCESO INMEDIATO
        cargandoAuth = false;
        accesoDenegado = false;
        console.log('✅ [GUARD] Usuario autenticado, acceso permitido:', u.nombre);
      } else {
        // ❌ SIN USUARIO - ACCESO DENEGADO
        cargandoAuth = false;
        accesoDenegado = true;
        console.log('❌ [GUARD] Sin usuario, acceso denegado');
        
        // Redirigir más rápido
        setTimeout(() => {
          goto(redirigirA);
        }, tiempoRedirección);
      }
    });

    return unsubscribe;
  });

  function irAInicio() {
    goto('/');
  }

  function irALogin() {
    // Redirigir al inicio donde está el modal de login
    // Guardamos la URL actual para redirigir después del login
    const urlActual = $page.url.pathname;
    goto(`/?redirigir=${encodeURIComponent(urlActual)}`);
  }
</script>

<svelte:head>
  <title>Acceso Restringido - Academia Vallenata Online</title>
</svelte:head>

<!-- Mostrar loading mientras se verifica autenticación -->
{#if cargandoAuth}
  <div class="auth-verificacion">
    <div class="spinner"></div>
    <h2>Verificando sesión...</h2>
    <p>Comprobando tu acceso</p>
  </div>

<!-- Si acceso denegado, mostrar mensaje de error -->
{:else if accesoDenegado}
  <div class="acceso-denegado">
    <div class="error-icono">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z" fill="#dc2626"/>
      </svg>
    </div>
    <h1>{titulo}</h1>
    <p class="mensaje-principal">{mensajePrincipal}</p>
    
    <div class="info-simple">
      <p><strong>⚠️ Necesitas iniciar sesión</strong></p>
      <p>Para acceder a este contenido debes tener una cuenta activa en la Academia Vallenata Online</p>
    </div>

    <div class="beneficios">
      <h3>✨ Al iniciar sesión tendrás acceso a:</h3>
      <ul>
        <li>🎵 Todo el contenido de acordeón</li>
        <li>🏆 Sistema de ranking y logros</li>
        <li>👥 Comunidad de estudiantes</li>
        <li>📊 Seguimiento de tu progreso</li>
        <li>🎮 Simulador interactivo</li>
      </ul>
    </div>

    <div class="acciones">
      <button class="btn-login" on:click={irALogin}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v12z" fill="currentColor"/>
        </svg>
        Iniciar Sesión
      </button>
      <button class="btn-inicio" on:click={irAInicio}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        Volver al Inicio
      </button>
    </div>
    
    <div class="countdown">
      <p>Redirigiendo automáticamente...</p>
    </div>
  </div>

<!-- Si todo está bien, mostrar contenido -->
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
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
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
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    text-align: center;
    padding: 2rem;
    gap: 1.5rem;
  }

  .error-icono {
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .acceso-denegado h1 {
    font-size: 2.8rem;
    font-weight: 900;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
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
  }

  .info-simple p {
    margin: 0.8rem 0;
    font-size: 1rem;
    line-height: 1.4;
  }

  .beneficios {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    padding: 2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    margin: 1.5rem 0;
    max-width: 600px;
  }

  .beneficios h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .beneficios ul {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
  }

  .beneficios li {
    margin: 0.8rem 0;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .acciones {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn-inicio, .btn-login {
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
    opacity: 0.8;
  }

  .countdown p {
    font-size: 0.9rem;
    animation: pulse 2s ease-in-out infinite;
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

    .btn-inicio, .btn-login {
      justify-content: center;
      width: 100%;
      padding: 1rem;
    }

    .info-simple, .beneficios {
      font-size: 0.9rem;
      padding: 1.5rem;
      max-width: 100%;
    }

    .mensaje-principal {
      font-size: 1.1rem;
    }

    .beneficios ul {
      text-align: center;
    }
  }
</style> 