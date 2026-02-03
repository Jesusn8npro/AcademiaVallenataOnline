<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import Avatar from '$lib/components/ui/Avatar.svelte';

  export let abierto = false;
  export let onCerrar: () => void;
  export let usuario: any = null;
  export let cerrarSesion: () => Promise<void> = async () => {};
  export let cerrandoSesion = false;
  export let abrirModalLogin: () => void = () => {};

  // Determinar el tipo de usuario
  $: tipoUsuario = usuario ? (usuario.rol === 'admin' ? 'admin' : 'estudiante') : 'publico';
  $: nombreUsuario = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario';

  function manejarCerrar() {
    onCerrar();
  }

  function navegarA(url: string) {
    window.location.href = url;
    manejarCerrar();
  }

  async function manejarCerrarSesion() {
    await cerrarSesion();
    manejarCerrar();
  }

  function manejarIniciarSesion() {
    abrirModalLogin();
    manejarCerrar();
  }

  // Función para manejar click en el logo
  function navegarDesdelogo() {
    let destino = '/';
    
    if (usuario) {
      if (usuario.rol === 'admin') {
        destino = '/panel-administracion';
      } else {
        destino = '/panel-estudiante';
      }
    }
    
    navegarA(destino);
  }

  function manejarRegistro() {
    navegarA('/registro');
  }
</script>

{#if abierto}
  <!-- Overlay -->
  <div 
    class="overlay" 
    transition:fade={{ duration: 300 }}
    on:click={manejarCerrar}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Escape' && manejarCerrar()}
  ></div>

  <!-- Menú Lateral -->
  <div 
    class="menu-lateral"
    transition:fly={{ x: -300, duration: 300 }}
    role="dialog"
    aria-modal="true"
    aria-label="Menú de navegación"
  >
    <!-- Header del Perfil / Bienvenida -->
    <div class="header-perfil {tipoUsuario}">
      {#if tipoUsuario === 'publico'}
        <!-- Usuario no autenticado -->
        <div class="bienvenida-publica">
          		<div class="logo-academia" on:click={navegarDesdelogo} role="button" tabindex="0">
			<img 
				src="/logo academia vallenata.png" 
				alt="Academia Vallenata"
				class="logo-img"
            />
          </div>
          <div class="texto-bienvenida">
            <h3 class="titulo-bienvenida">¡Bienvenido!</h3>
            <p class="subtitulo-bienvenida">Aprende acordeón vallenato online</p>
          </div>
        </div>
      {:else}
        <!-- Usuario autenticado -->
        <div class="perfil-info">
          <div class="avatar-perfil-container">
            <Avatar 
              src={usuario?.url_foto_perfil}
              alt="Avatar del usuario" 
              nombreCompleto={nombreUsuario}
              size="large"
            />
          </div>
          <div class="info-texto">
            <h3 class="nombre-usuario">{nombreUsuario}</h3>
            <p class="rol-usuario">
              {tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}
            </p>
          </div>
        </div>
      {/if}
      
      <button class="boton-cerrar" on:click={manejarCerrar} aria-label="Cerrar menú">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Navegación Principal -->
    <div class="navegacion">
      
      {#if tipoUsuario === 'publico'}
        <!-- MENÚ PARA USUARIOS NO AUTENTICADOS -->

        <div class="seccion">
          <button class="enlace-nav" on:click={() => navegarA('/')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>
            </div>
            <span>Inicio</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/blog')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>
            </div>
            <span>Blog</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/cursos')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>
            </div>
            <span>Cursos</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/paquetes')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 3v4"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>
            </div>
            <span>Paquetes</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/eventos')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>
            </div>
            <span>Eventos</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/nuestra-academia')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><path d="M8 11h8"/><path d="M8 7h8"/></svg>
            </div>
            <span>Nuestra Academia</span>
          </button>
          <!-- SIMULADOR - Solo para Administradores -->
          {#if usuario?.rol === 'admin'}
            <button class="enlace-nav" on:click={() => navegarA('/simulador-gaming')}>
              <div class="icono-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="7" r="1.5"/><line x1="7" y1="10" x2="7" y2="12"/><line x1="17" y1="10" x2="17" y2="12"/></svg>
              </div>
              <span>Simulador</span>
            </button>
          {/if}
        </div>

        <!-- Botones de Acción para Usuarios Públicos -->
        <div class="seccion-acciones">
          <button class="boton-accion primario" on:click={manejarIniciarSesion}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <span>Iniciar Sesión</span>
          </button>

          <button class="boton-accion secundario" on:click={manejarRegistro}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <span>Crear Cuenta</span>
          </button>
        </div>

      {:else if tipoUsuario === 'estudiante'}
        <!-- MENÚ PARA ESTUDIANTES -->

        <div class="seccion">
          <button class="enlace-nav activo" on:click={() => navegarA('/panel-estudiante')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5"/>
              </svg>
            </div>
            <span>Mi Panel</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/cursos')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="13" rx="2"/>
                <path d="M16 3v4M8 3v4"/>
              </svg>
            </div>
            <span>Cursos</span>
            <span class="badge-nav progreso">75%</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/ranking')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <span>Ranking</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/eventos')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span>Eventos</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/blog')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M7 7h10M7 11h10M7 15h6"/>
              </svg>
            </div>
            <span>Blog</span>
          </button>

          <!-- SIMULADOR - Solo para Administradores -->
          {#if usuario?.rol === 'admin'}
            <button class="enlace-nav" on:click={() => navegarA('/simulador-gaming')}>
              <div class="icono-nav">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="7" cy="7" r="1.5"/>
                  <circle cx="17" cy="7" r="1.5"/>
                  <line x1="7" y1="10" x2="7" y2="12"/>
                  <line x1="17" y1="10" x2="17" y2="12"/>
                </svg>
              </div>
              <span>Simulador</span>
            </button>
          {/if}

          <button class="enlace-nav con-badge" on:click={() => navegarA('/comunidad')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span>Comunidad</span>
            <span class="badge-nav">12</span>
          </button>

          <button class="enlace-nav con-badge" on:click={() => navegarA('/mensajes')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Mensajes</span>
            <span class="badge-nav nuevo">2</span>
          </button>
        </div>

        <!-- Sección Personal para Estudiantes -->
        <div class="separador-seccion">
          <span class="titulo-seccion">Mi Cuenta</span>
        </div>

        <div class="seccion">
          <button class="enlace-nav con-badge" on:click={() => navegarA('/notificaciones')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span>Notificaciones</span>
            <span class="badge-nav nuevo">3</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/perfil')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Ver Perfil</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/cuenta')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <span>Configuración de Cuenta</span>
          </button>
        </div>

      {:else if tipoUsuario === 'admin'}
        <!-- MENÚ PARA ADMINISTRADORES -->

        <div class="seccion">
          			<button class="enlace-nav" on:click={() => navegarA('/panel-administracion')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            </div>
            <span>Panel Admin</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/administrador/crear-contenido')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <span>Crear Contenido</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/administrador/usuarios')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
            </div>
            <span>Gestión Usuarios</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/administrador/pagos')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="8" cy="15" r="2"/><circle cx="16" cy="15" r="2"/></svg>
            </div>
            <span>Pagos</span>
          </button>
          <button class="enlace-nav" on:click={() => navegarA('/simulador-gaming')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="7" r="1.5"/><line x1="7" y1="10" x2="7" y2="12"/><line x1="17" y1="10" x2="17" y2="12"/></svg>
            </div>
            <span>Simulador</span>
          </button>
          <button class="enlace-nav con-badge" on:click={() => navegarA('/mensajes')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span>Mensajes</span>
            <span class="badge-nav nuevo">5</span>
          </button>
        </div>

        <!-- Sección Creación para Administradores -->
        <div class="separador-seccion">
          <span class="titulo-seccion">Crear Contenido</span>
        </div>

        <div class="seccion">
          <button class="enlace-nav" on:click={() => navegarA('/administrador/crear-contenido')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <span>Nuevo Contenido</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/administrador/panel-contenido')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span>Gestionar</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/administrador/blog')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z"/>
              </svg>
            </div>
            <span>Blog</span>
          </button>
        </div>

        <!-- Sección Admin para Administradores -->
        <div class="separador-seccion">
          <span class="titulo-seccion">Administración</span>
        </div>

        <div class="seccion">
          <button class="enlace-nav con-badge" on:click={() => navegarA('/notificaciones')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span>Notificaciones</span>
            <span class="badge-nav nuevo">5</span>
          </button>

          <button class="enlace-nav con-badge" on:click={() => navegarA('/mensajes')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Mensajes</span>
            <span class="badge-nav activo">3</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/mi-perfil')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Mi Perfil</span>
          </button>

          <button class="enlace-nav" on:click={() => navegarA('/configuracion')}>
            <div class="icono-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <span>Configuración</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Footer con Cerrar Sesión (solo para usuarios autenticados) -->
    {#if tipoUsuario !== 'publico'}
      <div class="footer-menu">
        <button 
          class="boton-cerrar-sesion" 
          on:click={manejarCerrarSesion} 
          disabled={cerrandoSesion}
        >
          <div class="icono-nav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span>{cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}</span>
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1300;
  backdrop-filter: blur(2px);
}

.menu-lateral {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100%;
  background: #fff;
  z-index: 1400;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

/* Header del Perfil */
.header-perfil {
  padding: 2rem 1.5rem 1.5rem;
  color: white;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}

.header-perfil.publico {
  background: linear-gradient(135deg, #ff6600 0%, #ff8c42 100%);
}

.header-perfil.estudiante {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

.header-perfil.admin {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Bienvenida para usuarios públicos */
.bienvenida-publica {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.logo-academia {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo-academia:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.texto-bienvenida {
  flex: 1;
}

.titulo-bienvenida {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: white;
}

.subtitulo-bienvenida {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

/* Perfil para usuarios autenticados */
.perfil-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.avatar-perfil-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-texto {
  flex: 1;
}

.nombre-usuario {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: white;
}

.rol-usuario {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

.boton-cerrar {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.boton-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.boton-cerrar svg {
  width: 18px;
  height: 18px;
  color: white;
}

/* Navegación */
.navegacion {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.seccion {
  padding: 0 0.5rem;
}

.seccion-acciones {
  padding: 1rem 0.5rem;
  margin-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.separador-seccion {
  padding: 1.5rem 1.5rem 0.5rem;
  margin-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.titulo-seccion {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.enlace-nav {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  margin: 0.125rem 0;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  position: relative;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 500;
}

.enlace-nav:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}

.enlace-nav.activo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.enlace-nav.destacado {
  background: linear-gradient(135deg, #ff6600 0%, #ff8c42 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 102, 0, 0.3);
}

.enlace-nav.activo .icono-nav svg,
.enlace-nav.destacado .icono-nav svg {
  color: white;
}

.icono-nav {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icono-nav svg {
  width: 20px;
  height: 20px;
  color: #64748b;
  transition: color 0.2s;
}

.enlace-nav:hover .icono-nav svg {
  color: #1e293b;
}

.badge-nav {
  margin-left: auto;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.badge-nav.nuevo {
  background: #22c55e;
  color: white;
  animation: pulso-badge 2s infinite;
}

.badge-nav.activo {
  background: #f59e0b;
  color: white;
}

.badge-nav.gratis {
  background: #10b981;
  color: white;
  font-weight: 800;
}

.badge-nav.progreso {
  background: #3b82f6;
  color: white;
}

/* Clases utilizadas dinámicamente */
.enlace-nav.activo .badge-nav,
.enlace-nav.destacado .badge-nav {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Botones de Acción */
.boton-accion {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  margin: 0.5rem 0;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
}

.boton-accion.primario {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

.boton-accion.primario:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.boton-accion.secundario {
  background: #f8fafc;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.boton-accion.secundario:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.boton-accion .icono-nav svg {
  color: currentColor;
}

/* Footer */
.footer-menu {
  border-top: 1px solid #f1f5f9;
  padding: 1rem;
}

.boton-cerrar-sesion {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #dc2626;
  font-size: 0.95rem;
  font-weight: 500;
}

.boton-cerrar-sesion:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.boton-cerrar-sesion:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.boton-cerrar-sesion .icono-nav svg {
  color: #dc2626;
}

@keyframes pulso-badge {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Responsive */
@media (max-width: 400px) {
  .menu-lateral {
    width: 90%;
  }
}
</style> 