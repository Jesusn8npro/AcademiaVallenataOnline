<script lang="ts">
  import { registrarUsuario, iniciarSesionConCorreo, obtenerPerfil } from '$lib/supabase/autenticacionSupabase';
  import { setUsuario } from '$lib/UsuarioActivo/usuario';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { actividadService } from '$lib/services/actividadTiempoRealService';
  import { trackearUbicacionUsuario } from '$lib/services/geoLocationService';
  import { ocultarChatWidget, mostrarChatWidget } from '$lib/stores/chatWidgetStore';
  export let abierto = false;
  export let onCerrar = () => {};
  let usuario = '';
  let contrasena = '';
  let vistaRegistro = false;
  let vistaRecuperar = false;
  // Campos de registro
  let nombre = '';
  let apellido = '';
  let whatsapp = '';
  let correoRegistro = '';
  let contrasenaRegistro = '';
  // Estado para login
  let cargando = false;
  let errorLogin = '';
  // Recuperar contraseña
  let correoRecuperar = '';
  let mensajeRecuperar = '';
  
  // Estados para mostrar/ocultar contraseñas
  let mostrarContrasena = false;
  let mostrarContrasenaRegistro = false;
  
  // ✅ NUEVO: Reactive statement para controlar chat widget
  $: if (abierto) {
    ocultarChatWidget();
  }
  
  // Selector de país para WhatsApp
  let codigoPais = '+57'; // Colombia por defecto
  
  // Lista de países comunes
  const paises = [
    { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴' },
    { codigo: '+52', nombre: 'México', bandera: '🇲🇽' },
    { codigo: '+1', nombre: 'Estados Unidos', bandera: '🇺🇸' },
    { codigo: '+34', nombre: 'España', bandera: '🇪🇸' },
    { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
    { codigo: '+56', nombre: 'Chile', bandera: '🇨🇱' },
    { codigo: '+51', nombre: 'Perú', bandera: '🇵🇪' },
    { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪' },
    { codigo: '+593', nombre: 'Ecuador', bandera: '🇪🇨' },
    { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦' }
  ];

  function cerrarModal() {
    onCerrar();
    vistaRegistro = false;
    vistaRecuperar = false;
    usuario = '';
    contrasena = '';
    errorLogin = '';
    cargando = false; // 🔒 GARANTIZAR QUE SE RESETEE EL ESTADO DE CARGA
    correoRecuperar = '';
    mensajeRecuperar = '';
    mostrarContrasena = false;
    mostrarContrasenaRegistro = false;
    codigoPais = '+57';
    // Limpiar campos de registro
    nombre = '';
    apellido = '';
    whatsapp = '';
    correoRegistro = '';
    contrasenaRegistro = '';
    
    // ✅ NUEVO: Mostrar chat widget cuando se cierra el modal
    mostrarChatWidget();
  }
  function detenerPropagacion(e: Event) {
    e.stopPropagation();
  }

  // 🔄 FUNCIÓN DE LOGIN OPTIMIZADA - REDIRECCIÓN INMEDIATA
  async function manejarLogin(e: Event) {
    e.preventDefault();
    errorLogin = '';
    cargando = true;
    
    try {
      console.log('🚀 [LOGIN] Iniciando autenticación para:', usuario);
      
      // 1️⃣ AUTENTICACIÓN BÁSICA (SOLO LO ESENCIAL)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena
      });
      
      if (error) {
        console.error('❌ [LOGIN] Error de autenticación:', error);
        errorLogin = error.message;
        cargando = false;
        return;
      }
      
      if (!data.user) {
        console.error('❌ [LOGIN] No se obtuvo usuario');
        errorLogin = 'Error en la autenticación';
        cargando = false;
        return;
      }
      
      console.log('✅ [LOGIN] Usuario autenticado:', data.user.email);
      
      // 2️⃣ OBTENER PERFIL BÁSICO (SOLO LO NECESARIO PARA REDIRIGIR)
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, rol, correo_electronico')
        .eq('id', data.user.id)
        .single();
      
      if (perfilError) {
        console.error('❌ [LOGIN] Error obteniendo perfil:', perfilError);
        errorLogin = 'Error obteniendo perfil de usuario';
        cargando = false;
        return;
      }
      
      if (!perfilData) {
        console.error('❌ [LOGIN] No se encontró perfil');
        errorLogin = 'Perfil de usuario no encontrado';
        cargando = false;
        return;
      }
      
      console.log('✅ [LOGIN] Perfil obtenido:', perfilData.nombre);
      
      // 3️⃣ GUARDAR USUARIO EN STORE (INMEDIATO)
      const usuarioCompleto = {
        id: perfilData.id,
        nombre: perfilData.nombre,
        apellido: perfilData.apellido,
        rol: perfilData.rol,
        correo_electronico: perfilData.correo_electronico
      };
      
      setUsuario(usuarioCompleto);
      console.log('✅ [LOGIN] Usuario guardado en store');
      
      // 4️⃣ REDIRECCIÓN INMEDIATA (SIN ESPERAR OPERACIONES LENTAS)
      cerrarModal();
      cargando = false;
      
      // 🚀 REDIRECCIÓN INMEDIATA SEGÚN ROL
      if (perfilData.rol && perfilData.rol.toLowerCase() === 'admin') {
        console.log('🚀 [LOGIN] Redirigiendo a panel admin INMEDIATAMENTE');
        goto('/panel-administracion');
      } else {
        console.log('🚀 [LOGIN] Redirigiendo a panel estudiante INMEDIATAMENTE');
        goto('/panel-estudiante');
      }
      
      // 5️⃣ CARGAR DATOS EN SEGUNDO PLANO (SIN BLOQUEAR)
      setTimeout(async () => {
        try {
          console.log('📊 [LOGIN-BG] Cargando datos en segundo plano...');
          
          // Actualizar timestamp de actividad
          const ahora = new Date().toISOString();
          await supabase
            .from('perfiles')
            .update({ updated_at: ahora })
            .eq('id', perfilData.id);
          
          // Inicializar tracking de actividad
          await actividadService.inicializarTracking(perfilData.id, window.location.pathname);
          
          // Tracking de geolocalización
          try {
            const datosGeo = await trackearUbicacionUsuario(perfilData.id);
            if (datosGeo) {
              console.log(`🌍 [LOGIN-BG] Ubicación detectada: ${datosGeo.ciudad}, ${datosGeo.pais}`);
            }
          } catch (geoError) {
            console.warn('⚠️ [LOGIN-BG] Error en geolocalización (no crítico):', geoError);
          }
          
          console.log('✅ [LOGIN-BG] Datos cargados en segundo plano');
          
        } catch (error) {
          console.warn('⚠️ [LOGIN-BG] Error cargando datos en segundo plano:', error);
        }
      }, 100); // 100ms después de la redirección
      
    } catch (error) {
      console.error('❌ [LOGIN] Error general:', error);
      errorLogin = 'Error inesperado durante el login';
      cargando = false;
    }
  }

  async function manejarRegistro(e: Event) {
    e.preventDefault();
    errorLogin = '';
    cargando = true;
    const { usuario, error } = await registrarUsuario(
      correoRegistro,
      contrasenaRegistro,
      { nombre, apellido, whatsapp: `${codigoPais}${whatsapp}` }
    );
    cargando = false;
    if (error) {
      errorLogin = error;
      return;
    }
    if (usuario) {
      setUsuario(usuario); // Guardar usuario global
      
      // 🚀 REGISTRAR ACTIVIDAD DE REGISTRO
      try {
        // Actualizar updated_at en perfiles para detectar actividad
        await supabase
          .from('perfiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', usuario.id);
        
        // Inicializar tracking si está disponible
        await actividadService.inicializarTracking(usuario.id, window.location.pathname);
        console.log('✅ [REGISTRO] Actividad registrada para usuario:', usuario.nombre);
      } catch (error) {
        console.warn('⚠️ [REGISTRO] Error registrando actividad:', error);
      }
      
      // Redirección explícita según el rol
      if (usuario.rol && usuario.rol.toLowerCase() === 'admin') {
        cerrarModal();
        goto('/panel-administracion');
        return;
      }
    }
    cerrarModal();
    goto('/panel-estudiante');
  }

  // 🔄 FUNCIÓN SIMPLIFICADA Y MEJORADA PARA RECUPERACIÓN DE CONTRASEÑA
  async function enviarRecuperacion(e: Event) {
    e.preventDefault();
    mensajeRecuperar = '';
    cargando = true;
    
    // 🛡️ TIMEOUT DE SEGURIDAD PARA PREVENIR BLOQUEO INDEFINIDO
    const timeoutId = setTimeout(() => {
      if (cargando) {
        cargando = false;
        mensajeRecuperar = '⏰ La solicitud está tardando mucho. El email puede enviarse con retraso. Revisa tu correo en unos minutos.';
        console.warn('⏰ [RECUPERACIÓN] Timeout de seguridad activado');
      }
    }, 15000); // 15 segundos máximo
    
    try {
      console.log('🔄 [RECUPERACIÓN] Iniciando proceso para:', correoRecuperar);
      
      // 🔧 URL más robusta para recuperación
      const isProduction = window.location.hostname === 'academiavallenataonline.com';
      const redirectURL = isProduction 
        ? 'https://academiavallenataonline.com/recuperar-contrasena'
        : window.location.origin + '/recuperar-contrasena';
      
      console.log('🔗 [RECUPERACIÓN] Redirect URL:', redirectURL);
      
      // ✨ Enviar email de recuperación (versión simplificada)
      const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperar, {
        redirectTo: redirectURL
      });
      
      if (error) {
        console.error('❌ [RECUPERACIÓN] Error:', error);
        
        // 🎯 Manejo de errores específico para desarrollo local vs producción
        const isLocalhost = window.location.hostname === 'localhost';
        
        if (error.message?.includes('rate') || error.message?.includes('limit') || error.status === 429) {
          mensajeRecuperar = '⏰ Demasiados intentos. Espera 5 minutos antes de intentar nuevamente.';
        } else if (error.message?.includes('timeout') || error.message?.includes('S04')) {
          mensajeRecuperar = '⏰ El servidor está ocupado. El email puede enviarse con retraso. Revisa tu correo en unos minutos.';
        } else if (error.message?.includes('invalid') || error.message?.includes('not authorized') || error.message?.includes('email_address_not_authorized')) {
          mensajeRecuperar = '🚨 PROBLEMA DETECTADO: Servicio de email predeterminado de Supabase\n\n' +
            '❌ CAUSA: Supabase por defecto SOLO envía emails a miembros de tu organización.\n\n' +
            '✅ SOLUCIÓN OBLIGATORIA: Configurar proveedor SMTP personalizado\n' +
            '   1. Ve a Supabase Dashboard > Authentication > Settings\n' +
            '   2. Scroll hasta "SMTP Settings"\n' +
            '   3. Habilita "Enable custom SMTP"\n' +
            '   4. Configura Gmail, Resend, SendGrid, etc.\n\n' +
            '📖 Guía completa en: src/lib/utils/configuracionSMTP.md';
        } else {
          mensajeRecuperar = isLocalhost
            ? `⚠️ ERROR EN LOCALHOST: ${error.message}\n\n💡 NOTA: Este error es común en desarrollo local. La funcionalidad funciona correctamente en producción.`
            : `❌ Error: ${error.message}. Si persiste, contacta soporte.`;
        }
      } else {
        // ✅ ÉXITO
        console.log('✅ [RECUPERACIÓN] Email enviado exitosamente');
        const isLocalhost = window.location.hostname === 'localhost';
        mensajeRecuperar = isLocalhost
          ? '📨 ¡Email enviado! Revisa tu bandeja de entrada, spam y promociones.\n\n⚠️ NOTA: Si no recibes el email en localhost, es normal. Configura SMTP personalizado o prueba en producción.'
          : '📨 ¡Email enviado! Revisa tu bandeja de entrada, spam y promociones. El enlace expira en 1 hora.';
      }
      
    } catch (err) {
      console.error('❌ [RECUPERACIÓN] Error inesperado:', err);
      const isLocalhost = window.location.hostname === 'localhost';
      const error = err as any;
      
      // Manejo específico de AuthRetryableFetchError
      if (error.name === 'AuthRetryableFetchError' || error.message?.includes('AuthRetryableFetchError')) {
        mensajeRecuperar = isLocalhost
          ? '🚨 AUTHRETRYABLEFETCHERROR\n\n⚠️ Este es un error MUY común en localhost con Supabase.\n\n✅ SOLUCIÓN: Este error NO ocurre en producción. La funcionalidad funciona perfectamente cuando despliegas tu app.\n\n💡 Para desarrollo local, configura SMTP personalizado o usa herramientas como ngrok.'
          : '❌ Error de conectividad con Supabase. Verifica tu conexión a internet.';
      } else {
        mensajeRecuperar = isLocalhost
          ? `⚠️ ERROR EN DESARROLLO LOCAL: ${error.message || 'Error inesperado'}\n\n💡 NOTA: Muchos errores de auth son normales en localhost. Prueba en producción para verificar el funcionamiento real.`
          : '❌ Error inesperado. Verifica tu conexión a internet e intenta nuevamente.';
      }
    } finally {
      // 🔒 GARANTIZAR QUE SIEMPRE SE RESETEE EL ESTADO DE CARGA
      clearTimeout(timeoutId);
      cargando = false;
    }
  }

  // 🔐 GOOGLE SIGN-IN
  async function iniciarSesionConGoogle() {
    try {
      cargando = true;
      errorLogin = '';
      
      console.log('🔐 [GOOGLE] Iniciando autenticación con Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/panel-estudiante`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ [GOOGLE] Error en autenticación:', error);
        errorLogin = 'Error al conectar con Google. Inténtalo de nuevo.';
        cargando = false;
        return;
      }

      console.log('✅ [GOOGLE] Redirigiendo a Google Auth...');
      // El usuario será redirigido a Google y luego de vuelta a la app
      
    } catch (error) {
      console.error('❌ [GOOGLE] Error inesperado:', error);
      errorLogin = 'Error inesperado. Inténtalo de nuevo.';
      cargando = false;
    }
  }
</script>

{#if abierto}
  <div class="fondo-modal" on:click={cerrarModal} on:keydown={(e) => e.key === 'Escape' && cerrarModal()} role="presentation">
    <div class="modal-inicio-sesion" on:click={detenerPropagacion} role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <div class="logo-container">
          <img src="/logo academia vallenata.png" alt="Logo Academia Vallenata" class="logo-modal" />
        </div>
        <button class="boton-cerrar" aria-label="Cerrar" on:click={cerrarModal}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      {#if vistaRecuperar}
        <h2 class="titulo-modal">Recuperar contraseña</h2>
        <p class="login-desc">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
        <form class="formulario-inicio-sesion" on:submit={enviarRecuperacion}>
          <div class="campo-formulario">
            <label for="recuperarCorreo">Correo electrónico</label>
            <div class="input-icono">
              <input id="recuperarCorreo" type="email" bind:value={correoRecuperar} placeholder="ejemplo@correo.com" required />
              <span class="icono-input">📧</span>
            </div>
          </div>
          {#if mensajeRecuperar}
            <div class="mensaje-recuperar" class:es-diagnostico={mensajeRecuperar.includes('DIAGNÓSTICO')}>
              {mensajeRecuperar}
            </div>
          {/if}
          <button type="submit" class="boton-enviar" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        
        <div class="enlaces-extra">
          <button type="button" class="enlace-olvido" on:click={() => { vistaRecuperar = false; mensajeRecuperar = ''; correoRecuperar = ''; }}>Volver al inicio de sesión</button>
        </div>
      {:else if !vistaRegistro}
        <h2 class="titulo-modal">¡Bienvenido de nuevo!</h2>
        <p class="login-desc">Accede a tu cuenta para disfrutar de todos los beneficios de la Academia Vallenata Online.</p>
        <form class="formulario-inicio-sesion" autocomplete="off" on:submit={manejarLogin}>
          <div class="campo-formulario">
            <label for="usuario">Correo electrónico o usuario</label>
            <div class="input-icono">
              <input id="usuario" type="text" bind:value={usuario} placeholder="ejemplo@correo.com o usuario" required />
              <span class="icono-input">📧</span>
            </div>
          </div>
          <div class="campo-formulario">
            <label for="contrasena">Contraseña</label>
            <div class="input-icono">
              <input 
                id="contrasena" 
                type={mostrarContrasena ? 'text' : 'password'} 
                bind:value={contrasena} 
                placeholder="Tu contraseña" 
                required 
              />
              <button 
                type="button" 
                class="boton-mostrar-contrasena"
                on:click={() => mostrarContrasena = !mostrarContrasena}
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasena ? '👁️' : '🙈'}
              </button>
            </div>
          </div>
          {#if errorLogin}
            <div class="mensaje-error">{errorLogin}</div>
          {/if}
          <button type="submit" class="boton-enviar" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
        
        <!-- 🔐 SEPARADOR Y GOOGLE SIGN-IN -->
        <div class="separador-o">
          <div class="linea"></div>
          <span class="texto-o">o continúa con</span>
          <div class="linea"></div>
        </div>
        
        <div class="botones-sociales">
          <button type="button" class="boton-google" on:click={iniciarSesionConGoogle} disabled={cargando}>
            <svg class="google-icon" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span class="google-texto">{cargando ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>
        </div>
        
        <div class="enlaces-extra">
          <button type="button" class="enlace-olvido" on:click={() => { vistaRecuperar = true; }}>¿Olvidaste tu contraseña?</button>
          <button type="button" class="enlace-registrarse" on:click={() => vistaRegistro = true}>¿No tienes cuenta? <b>Regístrate</b></button>
        </div>
      {:else}
        <h2 class="titulo-modal">Crear cuenta nueva</h2>
        <p class="login-desc">Únete a la comunidad y accede a todos los cursos, eventos y beneficios exclusivos.</p>
        <form class="formulario-inicio-sesion" autocomplete="off" on:submit={manejarRegistro}>
          <div class="fila-nombre-apellido">
            <div class="campo-formulario">
              <label for="nombre">Nombre</label>
              <div class="input-icono">
                <input id="nombre" type="text" bind:value={nombre} placeholder="Ejem: Omar" required />
                <span class="icono-input">👤</span>
              </div>
            </div>
            <div class="campo-formulario">
              <label for="apellido">Apellido</label>
              <div class="input-icono">
                <input id="apellido" type="text" bind:value={apellido} placeholder="Ejem: Geles" required />
                <span class="icono-input">👤</span>
              </div>
            </div>
          </div>
          <div class="campo-formulario">
            <label for="whatsapp">WhatsApp</label>
            <div class="input-whatsapp">
              <div class="selector-pais-container">
              <select class="selector-pais" bind:value={codigoPais}>
                {#each paises as pais}
                  <option value={pais.codigo}>
                    {pais.bandera} {pais.codigo}
                  </option>
                {/each}
              </select>
                <span class="flecha-selector">▼</span>
              </div>
              <div class="input-numero">
                <input 
                  id="whatsapp" 
                  type="tel" 
                  bind:value={whatsapp} 
                  placeholder="Número sin código de país" 
                  required 
                />
                <span class="icono-input">📱</span>
              </div>
            </div>
          </div>
          <div class="campo-formulario">
            <label for="correoRegistro">Correo electrónico</label>
            <div class="input-icono">
              <input id="correoRegistro" type="email" bind:value={correoRegistro} placeholder="ejemplo@correo.com" required />
              <span class="icono-input">📧</span>
            </div>
          </div>
          <div class="campo-formulario">
            <label for="contrasenaRegistro">Contraseña</label>
            <div class="input-icono">
              <input 
                id="contrasenaRegistro" 
                type={mostrarContrasenaRegistro ? 'text' : 'password'} 
                bind:value={contrasenaRegistro} 
                placeholder="Crea una contraseña segura" 
                required 
              />
              <button 
                type="button" 
                class="boton-mostrar-contrasena"
                on:click={() => mostrarContrasenaRegistro = !mostrarContrasenaRegistro}
                aria-label={mostrarContrasenaRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasenaRegistro ? '👁️' : '🙈'}
              </button>
            </div>
          </div>
          {#if errorLogin}
            <div class="mensaje-error">{errorLogin}</div>
          {/if}
          <button type="submit" class="boton-enviar" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>
        <div class="enlaces-extra">
          <button type="button" class="enlace-olvido" on:click={() => vistaRegistro = false}>¿Ya tienes cuenta? <b>Inicia sesión</b></button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* === VARIABLES CSS === */
  :root {
    --modal-primary: #ff6600;
    --modal-primary-hover: #e55a00;
    --modal-secondary: #1a73e8;
    --modal-bg: #ffffff;
    --modal-bg-gradient: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --modal-shadow-hover: 0 35px 60px -12px rgba(0, 0, 0, 0.35);
    --modal-border-radius: 24px;
    --input-bg: #f8fafc;
    --input-border: #e2e8f0;
    --input-focus: #3b82f6;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --error-bg: #fef2f2;
    --error-color: #dc2626;
    --success-bg: #f0fdf4;
    --success-color: #16a34a;
  }

  /* === FONDO MODAL === */
  .fondo-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
    padding: 16px;
  }

  /* === MODAL PRINCIPAL === */
  .modal-inicio-sesion {
    width: 100%;
    max-width: 420px;
    background: var(--modal-bg-gradient);
    border-radius: var(--modal-border-radius);
    box-shadow: var(--modal-shadow);
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    transform: translateY(30px);
    opacity: 0;
    animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* === HEADER DEL MODAL === */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px 12px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.3);
    background: linear-gradient(135deg, rgba(255, 102, 0, 0.03) 0%, rgba(255, 102, 0, 0.08) 100%);
  }

  .logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-modal {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);
    transition: transform 0.3s ease;
  }

  .logo-modal:hover {
    transform: scale(1.05);
  }

  .boton-cerrar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 102, 0, 0.1);
    color: var(--modal-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .boton-cerrar:hover {
    background: var(--modal-primary);
    color: white;
    transform: scale(1.05);
  }

  /* === CONTENIDO DEL MODAL === */
  .titulo-modal {
    font-size: 1.875rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--modal-primary) 0%, #ff8c42 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 16px 24px 6px;
    text-align: center;
    line-height: 1.2;
  }

  .login-desc {
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0 24px 20px;
    text-align: center;
    line-height: 1.5;
  }

  /* === FORMULARIO === */
  .formulario-inicio-sesion {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 24px 20px;
  }

  .fila-nombre-apellido {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* ✅ NUEVO: Asegurar que los campos no se salgan */
  .fila-nombre-apellido .campo-formulario {
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }
  
  .fila-nombre-apellido .input-icono {
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }
  
  .fila-nombre-apellido .input-icono input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .campo-formulario {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
  }

  .campo-formulario label {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 600;
    margin: 0;
    padding: 0;
  }

  /* === INPUTS MEJORADOS === */
  .input-icono {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--input-bg);
    border: 2px solid var(--input-border);
    border-radius: 12px;
    padding: 0;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .input-icono:focus-within {
    border-color: var(--input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }

  .input-icono input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 16px;
    font-size: 1rem;
    color: var(--text-primary);
    outline: none;
    min-height: 48px;
  }

  .input-icono input::placeholder {
    color: var(--text-secondary);
  }

  .icono-input {
    padding: 0 16px;
    font-size: 1.25rem;
    color: var(--modal-primary);
  }

  /* === BOTÓN MOSTRAR CONTRASEÑA === */
  .boton-mostrar-contrasena {
    background: none;
    border: none;
    padding: 12px;
    cursor: pointer;
    font-size: 1.25rem;
    color: var(--text-secondary);
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .boton-mostrar-contrasena:hover {
    color: var(--modal-primary);
  }

  /* === SELECTOR DE PAÍS WHATSAPP === */
  .input-whatsapp {
    display: flex;
    background: var(--input-bg);
    border: 2px solid var(--input-border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    width: 100%;
    gap: 0;
  }

  .input-whatsapp:focus-within {
    border-color: var(--input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }

  .selector-pais-container {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 90px;
  }

  .selector-pais {
    background: rgba(255, 102, 0, 0.05);
    border: none;
    padding: 6px 4px;
    padding-right: 20px;
    font-size: 0.875rem;
    color: var(--text-primary);
    cursor: pointer;
    outline: none;
    width: 100%;
    border-right: 1px solid var(--input-border);
    appearance: none;
  }
  
  .flecha-selector {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    font-size: 10px;
    pointer-events: none;
    z-index: 1;
  }

  .input-numero {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .input-numero input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 8px;
    font-size: 1rem;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  /* === BOTÓN PRINCIPAL === */
  .boton-enviar {
    background: linear-gradient(135deg, var(--modal-primary) 0%, #ff8c42 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 4px;
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
    position: relative;
    overflow: hidden;
    min-height: 52px;
  }

  .boton-enviar:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 102, 0, 0.4);
  }

  .boton-enviar:active {
    transform: translateY(0);
  }

  .boton-enviar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* === MENSAJES === */
  .mensaje-error {
    background: var(--error-bg);
    color: var(--error-color);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 0.875rem;
    text-align: center;
    margin: -8px 0 8px;
  }

  .mensaje-recuperar {
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 0.875rem;
    margin: -8px 0 8px;
    line-height: 1.4;
  }

  .mensaje-recuperar:not(.es-diagnostico) {
    background: var(--success-bg);
    color: var(--success-color);
    text-align: center;
  }

  .mensaje-recuperar.es-diagnostico {
    background: #f8fafc;
    color: #334155;
    text-align: left;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    white-space: pre-line;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
  }

  /* === SEPARADOR === */
  .separador-o {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 16px 24px 12px;
  }
  
  /* ✅ NUEVO: SEPARADOR OPTIMIZADO PARA ESCRITORIO */
  @media (min-width: 1024px) {
    .separador-o {
      margin: 20px 32px 16px;
      gap: 20px;
    }
    
    .botones-sociales {
      padding: 0 32px 16px;
    }
    
    .enlaces-extra {
      padding: 0 32px 20px;
      padding-top: 16px;
    }
  }
  
  @media (min-width: 1440px) {
    .separador-o {
      margin: 24px 40px 20px;
      gap: 24px;
    }
    
    .botones-sociales {
      padding: 0 40px 20px;
    }
    
    .enlaces-extra {
      padding: 0 40px 24px;
      padding-top: 20px;
    }
  }

  .linea {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--input-border) 50%, transparent 100%);
  }

  .texto-o {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
  }

  /* === BOTONES SOCIALES === */
  .botones-sociales {
    padding: 0 24px 8px;
  }

  .boton-google {
    width: 100%;
    background: white;
    border: 2px solid var(--input-border);
    border-radius: 12px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
  }

  .boton-google:hover {
    border-color: #4285F4;
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
    transform: translateY(-1px);
  }

  .boton-google:active {
    transform: translateY(0);
  }

  .boton-google:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .google-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .google-texto {
    color: var(--text-primary);
    font-weight: 600;
  }



  /* === ENLACES EXTRA === */
  .enlaces-extra {
    padding: 0 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    border-top: 1px solid rgba(226, 232, 240, 0.3);
    margin-top: 4px;
    padding-top: 12px;
  }

  .enlace-olvido,
  .enlace-registrarse {
    background: none;
    border: none;
    color: var(--modal-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: inherit;
    text-decoration: none;
  }

  .enlace-olvido:hover,
  .enlace-registrarse:hover {
    color: var(--modal-primary);
    background: rgba(255, 102, 0, 0.05);
  }

  /* === ANIMACIONES === */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ✅ NUEVO: CSS GLOBAL PARA ELIMINAR PADDING INTERNO */
  .modal-inicio-sesion * {
    box-sizing: border-box;
  }
  
  /* ✅ NUEVO: PREVENIR DESBORDAMIENTO EN FORMULARIOS */
  .modal-inicio-sesion .formulario-inicio-sesion {
    overflow: hidden;
    width: 100%;
  }
  
  .modal-inicio-sesion .fila-nombre-apellido {
    overflow: hidden;
    width: 100%;
    max-width: 100%;
  }
  
  .modal-inicio-sesion .campo-formulario {
    overflow: hidden;
    width: 100%;
    max-width: 100%;
  }
  
  .modal-inicio-sesion .input-icono {
    overflow: hidden;
    width: 100%;
    max-width: 100%;
  }
  
  .modal-inicio-sesion .input-icono input {
    overflow: visible;
    width: 100%;
    max-width: 100%;
    text-overflow: clip;
  }
  
  /* ✅ NUEVO: Asegurar que los placeholders se vean completos */
  .modal-inicio-sesion .input-icono input::placeholder {
    white-space: nowrap;
    overflow: visible;
    text-overflow: clip;
  }
  
  /* ✅ NUEVO: FORZAR PADDING MÍNIMO EN SELECTOR DE PAÍS */
  .modal-inicio-sesion .selector-pais {
    padding: 6px 4px !important;
    padding-right: 20px !important;
    min-width: 90px !important;
  }
  
  .modal-inicio-sesion .flecha-selector {
    right: 4px !important;
  }
  
  .modal-inicio-sesion .selector-pais-container {
    min-width: 90px !important;
  }
  
  .modal-inicio-sesion .campo-formulario,
  .modal-inicio-sesion .input-icono,
  .modal-inicio-sesion .input-whatsapp,
  .modal-inicio-sesion .boton-enviar,
  .modal-inicio-sesion .boton-google,
  .modal-inicio-sesion .enlaces-extra {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .modal-inicio-sesion .campo-formulario {
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .modal-inicio-sesion .input-icono input,
  .modal-inicio-sesion .input-numero input,
  .modal-inicio-sesion .selector-pais,
  .modal-inicio-sesion .boton-mostrar-contrasena {
    padding: 10px 12px !important;
    margin: 0 !important;
  }
  
  .modal-inicio-sesion .boton-enviar {
    padding: 12px 20px !important;
    margin: 2px 0 0 0 !important;
  }
  
  .modal-inicio-sesion .separador-o {
    margin: 8px 24px 6px !important;
  }
  
  .modal-inicio-sesion .botones-sociales {
    padding: 0 24px 4px !important;
  }
  
  .modal-inicio-sesion .enlaces-extra {
    padding: 0 24px 12px !important;
    padding-top: 8px !important;
  }

  /* ✅ NUEVO: MEDIA QUERIES PARA ESCRITORIO */
  @media (min-width: 1024px) {
    .modal-inicio-sesion {
      max-width: 500px;
      min-height: auto;
    }
    
    .formulario-inicio-sesion {
      gap: 20px;
      padding: 0 32px 24px;
    }
    
    .fila-nombre-apellido {
      gap: 24px;
    }
    
    .campo-formulario {
      gap: 10px;
    }
    
    .input-icono input,
    .input-numero input,
    .selector-pais {
      padding: 16px 20px;
    }
    
    .boton-enviar {
      padding: 18px 28px;
      font-size: 1.1rem;
    }
    
    .titulo-modal {
      font-size: 2rem;
      margin: 20px 32px 10px;
    }
    
    .login-desc {
      margin: 0 32px 24px;
      font-size: 1.1rem;
    }
    
    .modal-header {
      padding: 20px 32px 16px;
    }
    
    .logo-modal {
      width: 64px;
      height: 64px;
    }
  }
  
  @media (min-width: 1440px) {
    .modal-inicio-sesion {
      max-width: 550px;
    }
    
    .formulario-inicio-sesion {
      gap: 24px;
      padding: 0 40px 28px;
    }
    
    .fila-nombre-apellido {
      gap: 28px;
    }
    
    .campo-formulario {
      gap: 12px;
    }
    
    .input-icono input,
    .input-numero input,
    .selector-pais {
      padding: 18px 24px;
    }
    
    .boton-enviar {
      padding: 20px 32px;
      font-size: 1.2rem;
    }
    
    .titulo-modal {
      font-size: 2.25rem;
      margin: 24px 40px 12px;
    }
    
    .login-desc {
      margin: 0 40px 28px;
      font-size: 1.15rem;
    }
    
    .modal-header {
      padding: 24px 40px 20px;
    }
    
    .logo-modal {
      width: 72px;
      height: 72px;
    }
  }

  /* ✅ NUEVO: MEDIA QUERY PARA PANTALLAS MEDIANAS */
  @media (max-width: 900px) and (min-width: 769px) {
    .fila-nombre-apellido {
      gap: 16px;
    }
    
    .fila-nombre-apellido .campo-formulario {
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    
    .fila-nombre-apellido .input-icono {
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    
    .fila-nombre-apellido .input-icono input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      font-size: 0.9rem;
    }
  }

  /* === RESPONSIVE === */
  @media (max-width: 768px) {
    .modal-inicio-sesion {
      max-width: 95vw;
      margin: 8px;
    }

    .modal-header,
    .formulario-inicio-sesion,
    .enlaces-extra {
      padding-left: 16px;
      padding-right: 16px;
    }

    .titulo-modal,
    .login-desc {
      margin-left: 16px;
      margin-right: 16px;
    }
    
    /* ✅ NUEVO: Reducir espaciado general en móviles */
    .formulario-inicio-sesion {
      gap: 12px;
      padding-bottom: 16px;
    }
    
    .campo-formulario {
      gap: 4px;
    }
    
    .enlaces-extra {
      padding-top: 12px;
      margin-top: 4px;
    }

    .fila-nombre-apellido {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    /* ✅ NUEVO: Asegurar que en móviles se vean bien en 2 columnas */
    .fila-nombre-apellido .campo-formulario {
      width: 100%;
      min-width: 0;
    }
    
    /* ✅ NUEVO: Reducir padding de inputs en móviles para ahorrar espacio */
    .fila-nombre-apellido .input-icono input {
      padding: 10px 8px;
      font-size: 0.85rem;
    }

    .titulo-modal {
      font-size: 1.5rem;
    }

    .login-desc {
      font-size: 0.875rem;
    }

    .selector-pais {
      min-width: 90px;
      font-size: 0.8rem;
      padding-right: 30px;
    }
    
    .flecha-selector {
      font-size: 9px;
      right: 8px;
    }
  }
  
  /* ✅ NUEVO: MEDIA QUERY PARA PANTALLAS MUY PEQUEÑAS */
  @media (max-width: 480px) {
    .fila-nombre-apellido {
      gap: 8px;
    }
    
    .fila-nombre-apellido .input-icono input {
      padding: 8px 6px;
      font-size: 0.8rem;
    }
    
    /* ✅ NUEVO: Optimizar selector de país en móviles */
    .selector-pais {
      padding: 4px 3px;
      padding-right: 16px;
      min-width: 70px;
    }
    
    .flecha-selector {
      font-size: 8px;
      right: 3px;
    }
    
    .input-numero input {
      padding: 8px 6px;
    }
    
    .titulo-modal {
      font-size: 1.3rem;
      margin-bottom: 8px;
    }
    
    .login-desc {
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    
    /* ✅ NUEVO: Reducir espaciado general */
    .formulario-inicio-sesion {
      gap: 10px;
      padding-bottom: 12px;
    }
    
    .campo-formulario {
      gap: 3px;
    }
    
    .enlaces-extra {
      padding-top: 8px;
      margin-top: 2px;
    }
  }
  
  /* ✅ NUEVO: MEDIA QUERY PARA PANTALLAS ULTRA PEQUEÑAS */
  @media (max-width: 360px) {
    .fila-nombre-apellido {
      gap: 6px;
    }
    
    .fila-nombre-apellido .input-icono input {
      padding: 6px 4px;
      font-size: 0.75rem;
    }
    
    /* ✅ NUEVO: Optimizar selector de país en pantallas ultra pequeñas */
    .selector-pais {
      padding: 3px 2px;
      padding-right: 14px;
      min-width: 60px;
      font-size: 0.75rem;
    }
    
    .flecha-selector {
      font-size: 7px;
      right: 2px;
    }
    
    .input-numero input {
      padding: 6px 4px;
      font-size: 0.9rem;
    }
    
    .titulo-modal {
      font-size: 1.2rem;
      margin-bottom: 6px;
    }
    
    .login-desc {
      font-size: 0.75rem;
      margin-bottom: 12px;
    }
    
    /* ✅ NUEVO: Reducir espaciado general al máximo */
    .formulario-inicio-sesion {
      gap: 8px;
      padding-bottom: 8px;
    }
    
    .campo-formulario {
      gap: 2px;
    }
    
    .enlaces-extra {
      padding-top: 6px;
      margin-top: 1px;
    }
    
    .modal-header,
    .formulario-inicio-sesion,
    .enlaces-extra {
      padding-left: 12px;
      padding-right: 12px;
    }
    
    .titulo-modal,
    .login-desc {
      margin-left: 12px;
      margin-right: 12px;
    }
  }

  @media (max-width: 480px) {
    .fondo-modal {
      padding: 8px;
    }

    .modal-header {
      padding: 8px 12px 6px;
    }

    .logo-modal {
      width: 48px;
      height: 48px;
    }

    .titulo-modal {
      font-size: 1.25rem;
      margin: 8px 12px 4px;
    }

    .login-desc {
      margin: 0 12px 8px;
    }

    .formulario-inicio-sesion {
      padding: 0 12px 8px;
      gap: 6px;
    }

    .enlaces-extra {
      padding: 0 12px 8px;
      padding-top: 4px;
      gap: 4px;
    }

    .separador-o {
      margin: 4px 12px 2px;
    }

    .botones-sociales {
      padding: 0 12px 2px;
    }

    .input-icono input,
    .boton-mostrar-contrasena,
    .selector-pais,
    .input-numero input {
      padding: 8px 8px;
    }

    .boton-enviar {
      padding: 8px 12px;
      margin-top: 1px;
      margin-bottom: 0;
    }
    
    /* ✅ FORZAR COMPACTACIÓN ULTRA EN MÓVILES */
    .campo-formulario {
      gap: 2px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .campo-formulario label {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 0.8rem;
    }
    
    .input-icono {
      margin: 0 !important;
      padding: 0 !important;
    }
  }


</style>
