<script lang="ts">
  import { onMount } from 'svelte';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { goto } from '$app/navigation';
  
  let usuarioActual: any = null;
  let cargandoAuth = true;
  let accesoDenegado = false;

  // Verificar autenticación inmediatamente (EXACTO AL ADMINISTRADOR)
  onMount(() => {
    const unsubscribe = usuario.subscribe((u) => {
      usuarioActual = u;
      cargandoAuth = false;

      // Si no hay usuario o no es admin, denegar acceso
      if (!u || u.rol !== 'admin') {
        accesoDenegado = true;
        // Redirigir después de un breve momento para mostrar el mensaje
        setTimeout(() => {
          goto('/');
        }, 2000);
      } else {
        accesoDenegado = false;
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Panel de Administración - Academia Vallenata Online</title>
</svelte:head>

<!-- Mostrar loading mientras se verifica autenticación -->
{#if cargandoAuth}
  <div class="auth-verificacion">
    <div class="spinner"></div>
    <h2>Verificando permisos...</h2>
    <p>Comprobando acceso de administrador</p>
  </div>

<!-- Si acceso denegado, mostrar mensaje de error -->
{:else if accesoDenegado}
  <div class="acceso-denegado">
    <div class="error-icono">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#dc2626"/>
      </svg>
    </div>
    <h1>🔒 ACCESO RESTRINGIDO</h1>
    <p class="mensaje-principal">Esta área es exclusiva para administradores de la Academia Vallenata</p>
    
    <div class="info-simple">
      {#if !usuarioActual}
        <p><strong>⚠️ No has iniciado sesión</strong></p>
        <p>Debes iniciar sesión como administrador para acceder a esta página</p>
      {:else}
        <p><strong>⚠️ No tienes permisos de administrador</strong></p>
        <p>Tu cuenta de estudiante no tiene acceso a esta área</p>
      {/if}
    </div>

    <div class="mensaje-firme">
      <p>🛡️ Esta área está protegida y monitoreada</p>
      <p>Solo el personal autorizado puede acceder al panel de administración</p>
    </div>

    <div class="acciones">
      <button class="btn-inicio" on:click={() => goto('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        Volver al Inicio
      </button>
      {#if !usuarioActual}
        <button class="btn-login" on:click={() => goto('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v12z" fill="currentColor"/>
          </svg>
          Iniciar Sesión
        </button>
      {/if}
    </div>
    <div class="countdown">
      <p>Redirigiendo en unos segundos...</p>
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    text-align: center;
    padding: 2rem;
    gap: 1.5rem;
  }

  .error-icono {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
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
    margin: 1.5rem 0;
    max-width: 500px;
  }

  .info-simple p {
    margin: 0.8rem 0;
    font-size: 1rem;
    line-height: 1.4;
  }

  .mensaje-firme {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    margin: 1.5rem 0;
    max-width: 600px;
  }

  .mensaje-firme p {
    margin: 0.8rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.5;
  }

  .acciones {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .btn-inicio, .btn-login {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
  }

  .btn-inicio {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .btn-inicio:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .btn-login {
    background: #f59e0b;
    color: white;
  }

  .btn-login:hover {
    background: #d97706;
    transform: translateY(-2px);
  }

  .countdown {
    margin-top: 1rem;
    opacity: 0.7;
  }

  .countdown p {
    font-size: 0.9rem;
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .acceso-denegado {
      padding: 1rem;
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
    }

    .info-simple, .mensaje-firme {
      font-size: 0.9rem;
      padding: 1rem;
      max-width: 100%;
    }

    .mensaje-principal {
      font-size: 1.1rem;
    }
  }
</style> 