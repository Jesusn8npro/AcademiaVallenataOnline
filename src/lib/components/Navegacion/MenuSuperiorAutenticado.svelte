<script lang="ts">
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { goto } from '$app/navigation';
  import { cerrarSesion as cerrarSesionSupabase } from '$lib/supabase/autenticacionSupabase';
  import { limpiarUsuario } from '$lib/UsuarioActivo/usuario';
  import ModalBusqueda from '$lib/components/Busqueda/ModalBusqueda.svelte';
  import MenuLateralResponsive from './MenuLateralResponsive.svelte';
  import CampanaNotificaciones from './CampanaNotificaciones.svelte';
  import ToggleModoOscuro from '$lib/components/ui/ToggleModoOscuro.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';

  let nombre = '';
  let mostrarMenu = false;
  let mostrarModalBusqueda = false;
  let mostrarMenuLateral = false;
  let cerrandoSesion = false;

  $: if ($usuario) {
    nombre = $usuario.nombre || '';
  }

  async function cerrarSesion() {
    cerrandoSesion = true;
    const error = await cerrarSesionSupabase();
    if (error) {
      cerrandoSesion = false;
      alert('Error al cerrar sesión: ' + error);
      return;
    }
    limpiarUsuario();
    goto('/sesion_cerrada');
  }

  function abrirModalBusqueda() {
    mostrarModalBusqueda = true;
  }

  function cerrarModalBusqueda() {
    mostrarModalBusqueda = false;
  }

  function toggleMenuLateral() {
    mostrarMenuLateral = !mostrarMenuLateral;
  }

  function cerrarMenuLateral() {
    mostrarMenuLateral = false;
  }

  function cerrarMenuUsuario() {
    mostrarMenu = false;
  }

  function manejarClickFuera(event: MouseEvent) {
    // 🔧 MEJORADO: Verificación más robusta para evitar errores
    if (!event.target) return;
    
    const target = event.target as Element;
    const menuUsuario = target.closest('.menu-usuario');
    
    // Si el clic no fue dentro del menú de usuario, cerrarlo
    if (!menuUsuario && mostrarMenu) {
      mostrarMenu = false;
    }
  }
</script>

<svelte:window on:click={manejarClickFuera} />

<nav class="menu-superior">
  <!-- Lado Izquierdo: Logo + Hamburguesa -->
  <div class="lado-izquierdo">
    <div class="logo">
      <a href="{$usuario?.rol === 'admin' ? '/panel-administracion' : '/panel-estudiante'}">
        <img src="/logo academia vallenata.png" alt="Logo Academia" class="logo-img" />
      </a>
    </div>

    <!-- Botón Hamburguesa Creativo - Solo Móvil -->
    <button class="boton-hamburguesa-lujo" on:click={toggleMenuLateral} aria-label="Menú">
      <div class="hamburguesa-container">
        <div class="hamburguesa-linea linea-1"></div>
        <div class="hamburguesa-linea linea-2"></div>
        <div class="hamburguesa-linea linea-3"></div>
      </div>
      <div class="hamburguesa-fondo"></div>
    </button>
  </div>

  <!-- Menú Central - Solo Desktop -->
  <div class="menu-central">
    {#if $usuario?.rol === 'admin'}
      <!-- MENÚ PARA ADMINISTRADORES -->
      			<a href="/panel-administracion" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
        </span>
        <span>Panel Admin</span>
      </a>
      <a href="/administrador/crear-contenido" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        </span>
        <span>Crear Contenido</span>
      </a>
      <a href="/administrador/usuarios" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
        </span>
        <span>Gestión Usuarios</span>
      </a>
      <a href="/administrador/pagos" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="8" cy="15" r="2"/><circle cx="16" cy="15" r="2"/></svg>
        </span>
        <span>Pagos</span>
      </a>
      <a href="/simulador-gaming" class="enlace simulador-enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="7" r="1.5"/><line x1="7" y1="10" x2="7" y2="12"/><line x1="17" y1="10" x2="17" y2="12"/></svg>
        </span>
        <span>Simulador</span>
      </a>
      <a href="/mensajes" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span>Mensajes</span>
      </a>
    {:else}
      <!-- MENÚ PARA ESTUDIANTES -->
      <a href="/panel-estudiante" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5"/></svg>
        </span>
        <span>Mi Panel</span>
      </a>
      <a href="/cursos" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
        </span>
        <span>Cursos</span>
      </a>
      <a href="/comunidad" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </span>
        <span>Comunidad</span>
      </a>
      <a href="/ranking" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
        </span>
        <span>Ranking</span>
      </a>
      <a href="/eventos" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </span>
        <span>Eventos</span>
      </a>
      <a href="/blog" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 7h10M7 11h10M7 15h6"/></svg>
        </span>
        <span>Blog</span>
      </a>
      <a href="/mensajes" class="enlace">
        <span class="icono-enlace-nav">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span>Mensajes</span>
      </a>
    {/if}
  </div>

  <!-- Área Derecha -->
  <div class="area-derecha">
    <!-- Iconos Desktop -->
    <div class="iconos-desktop">
      <button class="icono" aria-label="Buscar" on:click={abrirModalBusqueda}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
      
      <!-- Toggle Modo Oscuro -->
      <div class="toggle-tema-container">
        			<!-- ToggleModoOscuro - Temporalmente oculto -->
      </div>
      
      <CampanaNotificaciones esMobile={false} />
    </div>

    <!-- Campana Notificaciones Móvil -->
    <div class="icono-movil">
      <CampanaNotificaciones esMobile={true} />
    </div>
    
    <!-- Menú Usuario -->
    <div class="menu-usuario">
      <button class="boton-usuario" on:click={() => mostrarMenu = !mostrarMenu}>
        <span class="nombre">{nombre}</span>
        <div class="avatar-container">
          <Avatar 
            src={$usuario?.url_foto_perfil}
            alt="Avatar"
            nombreCompleto={$usuario?.nombre || ''}
            size="medium"
          />
        </div>
      </button>
      
      {#if mostrarMenu}
        <div class="desplegable">
          <div class="header">
            <div class="avatar-grande-container">
              <Avatar 
                src={$usuario?.url_foto_perfil}
                alt="Avatar"
                nombreCompleto={$usuario?.nombre || ''}
                size="large"
              />
            </div>
            <div>
              <div class="nombre-completo">{nombre}</div>
              <div class="rol">{$usuario?.rol === 'admin' ? 'Administrador' : 'Estudiante'}</div>
            </div>
          </div>
          
          <div class="links">
            <a href="/mi-perfil" class="link" on:click={cerrarMenuUsuario}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Mi Perfil
            </a>
            
            {#if $usuario?.rol === 'admin'}
              <!-- Opciones específicas para Administradores -->
              <a href="/administrador/panel-contenido" class="link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Gestión de Contenido
              </a>
              <a href="/administrador/notificaciones" class="link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Notificaciones Sistema
              </a>
            {:else}
              <!-- Opciones específicas para Estudiantes -->
              <a href="/mis-cursos" class="link" on:click={cerrarMenuUsuario}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Mis Cursos
              </a>
              <a href="/comunidad" class="link" on:click={cerrarMenuUsuario}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0a4 4 0 0 0 0-8 4 4 0 0 0 0 8z"/>
                </svg>
                Comunidad
              </a>
              <a href="/membresias" class="link" on:click={cerrarMenuUsuario}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
                Mi Membresía
              </a>
            {/if}
            
            <a href="/configuracion" class="link" on:click={cerrarMenuUsuario}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configuración
            </a>
          </div>
          
          <div class="separador"></div>
          
          <button class="boton-salir" on:mousedown={cerrarSesion} disabled={cerrandoSesion}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}
          </button>
        </div>
      {/if}
    </div>
  </div>
</nav>

<!-- Modal de Búsqueda -->
{#if mostrarModalBusqueda}
  <ModalBusqueda abierto={mostrarModalBusqueda} onCerrar={cerrarModalBusqueda} />
{/if}

<!-- Menú Lateral Responsive -->
<MenuLateralResponsive 
  bind:abierto={mostrarMenuLateral} 
  onCerrar={cerrarMenuLateral}
  usuario={$usuario}
  {cerrarSesion}
  {cerrandoSesion}
/>

<style>
.menu-superior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 2.3rem 2rem;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1200;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 60px;
}

/* Lado Izquierdo */
.lado-izquierdo {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  max-width: 90px;
  height: auto;
  object-fit: contain;
}

/* Botón Hamburguesa de Lujo */
.boton-hamburguesa-lujo {
  display: none;
  position: relative;
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.25);
  overflow: hidden;
}

.boton-hamburguesa-lujo:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.boton-hamburguesa-lujo:active {
  transform: translateY(0);
}

.hamburguesa-fondo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.boton-hamburguesa-lujo:hover .hamburguesa-fondo {
  opacity: 1;
}

.hamburguesa-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 3px;
}

.hamburguesa-linea {
  width: 20px;
  height: 2.5px;
  background: #fff;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.linea-1 {
  transform-origin: center;
}

.linea-2 {
  width: 16px;
  opacity: 0.9;
}

.linea-3 {
  width: 18px;
  transform-origin: center;
}

.boton-hamburguesa-lujo:hover .linea-1 {
  transform: rotate(5deg);
}

.boton-hamburguesa-lujo:hover .linea-2 {
  width: 20px;
  opacity: 1;
}

.boton-hamburguesa-lujo:hover .linea-3 {
  transform: rotate(-5deg);
}

.menu-central {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex: 1;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
}

.enlace {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: color 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  min-width: 80px;
  white-space: nowrap;
  text-align: center;
}

.enlace:hover {
  color: #ff6d1a;
  background: rgba(255, 109, 26, 0.05);
}

/* Estilos especiales para el enlace del simulador */
.simulador-enlace {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  border-radius: 12px;
  padding: 0.6rem 1rem !important;
  margin: 0 0.2rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-width: 90px !important;
}

.simulador-enlace:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  color: white !important;
}

.simulador-enlace::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.simulador-enlace:hover::before {
  left: 100%;
}

.simulador-enlace svg {
  stroke: white !important;
  animation: pulseIcon 2s ease-in-out infinite;
}

@keyframes pulseIcon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.simulador-enlace span {
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.enlace svg {
  width: 20px;
  height: 20px;
  margin-bottom: 0.3rem;
  flex-shrink: 0;
}

.enlace span {
  font-size: 0.85rem;
  line-height: 1.2;
}

.area-derecha {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.iconos-desktop {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.toggle-tema-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  position: relative;
}

.icono:hover {
  background: #f3f4f6;
  color: #374151;
}

.icono svg {
  width: 18px;
  height: 18px;
}

.badge .num {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6d1a;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulso 2s infinite;
}

/* Iconos Móvil */
.icono-movil {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  position: relative;
}

.icono-movil:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.icono-movil svg {
  width: 20px;
  height: 20px;
}

.num-movil {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  animation: pulso 2s infinite;
}

.menu-usuario {
  position: relative;
  /* 🔧 ASEGURAR que el contenedor no interfiera con el layout */
  isolation: isolate;
}

.boton-usuario {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 1.5rem;
  transition: background 0.15s;
  gap: 0.5rem;
}

.boton-usuario:hover {
  background: #f3f4f6;
}

.nombre {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.avatar-container {
  width: 40px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-container:hover {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.desplegable {
  position: absolute;
  top: 110%;
  right: 0;
  min-width: 260px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 9999; /* 🔧 AUMENTADO para estar por encima de todo */
  transform: translateZ(0); /* 🔧 FORZAR nueva capa de stacking */
  will-change: transform; /* 🔧 OPTIMIZAR para animaciones */
  animation: fadeInDown 0.2s ease-out; /* 🔧 ANIMACIÓN SUAVE */
}

.header {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
  gap: 0.8rem;
}

.avatar-grande-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nombre-completo {
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.rol {
  color: #6b7280;
  font-size: 0.85rem;
}

.links {
  padding: 0.4rem 0;
}

.link {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  color: #374151;
  text-decoration: none;
  transition: background 0.15s;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.link:hover {
  background: #f3f4f6;
}

.link svg {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.separador {
  height: 1px;
  background: #e5e7eb;
  margin: 0.3rem 0;
}

.boton-salir {
  width: 100%;
  background: none;
  border: none;
  padding: 0.6rem 0.8rem;
  color: #dc2626;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.boton-salir:hover {
  background: #fef2f2;
}

.boton-salir:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.boton-salir svg {
  width: 16px;
  height: 16px;
}

@keyframes pulso {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 🔧 NUEVA ANIMACIÓN para el menú desplegable */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px) translateZ(0);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateZ(0);
  }
}

/* Modo Oscuro */
:global(.dark) .menu-superior {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom-color: #334155;
}

:global(.dark) .enlace {
  color: #cbd5e1;
}

:global(.dark) .enlace:hover {
  background: rgba(51, 65, 85, 0.3);
  color: #f1f5f9;
}

:global(.dark) .icono {
  color: #94a3b8;
}

:global(.dark) .icono:hover {
  background: rgba(51, 65, 85, 0.3);
  color: #f1f5f9;
}

:global(.dark) .menu-usuario .nombre {
  color: #f1f5f9;
}

:global(.dark) .desplegable {
  background: #334155;
  border-color: #475569;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); /* 🔧 SOMBRA más fuerte en modo oscuro */
}

:global(.dark) .nombre-completo {
  color: #f1f5f9;
}

:global(.dark) .rol {
  color: #94a3b8;
}

:global(.dark) .link {
  color: #cbd5e1;
}

:global(.dark) .link:hover {
  background: rgba(71, 85, 105, 0.3);
  color: #f1f5f9;
}

:global(.dark) .boton-salir {
  color: #f87171;
}

:global(.dark) .boton-salir:hover {
  background: rgba(127, 29, 29, 0.2);
}

/* Responsive */
@media (max-width: 1200px) {
  .menu-central {
    gap: 1rem;
    max-width: 700px;
  }
  .enlace {
    min-width: 70px;
    padding: 0.4rem 0.6rem;
  }
  .enlace span {
    font-size: 0.83rem;
  }
  
  .simulador-enlace {
    padding: 0.5rem 0.8rem !important;
    min-width: 80px !important;
  }
}

@media (max-width: 1000px) {
  .menu-central {
    gap: 0.8rem;
    max-width: 600px;
  }
  .enlace {
    min-width: 60px;
    padding: 0.3rem 0.4rem;
  }
  .icono-enlace-nav svg {
    width: 18px;
    height: 18px;
  }
  .enlace span {
    font-size: 0.8rem;
  }
  
  .simulador-enlace {
    padding: 0.4rem 0.6rem !important;
    min-width: 70px !important;
  }
}

@media (max-width: 900px) {
  .menu-superior {
    padding: 2.4rem 0.8rem;
    height: 56px;
  }
  .boton-hamburguesa-lujo {
    display: flex;
  }
  .menu-central {
    display: none !important;
  }
  .iconos-desktop {
    display: none;
  }
  .icono-movil {
    display: flex;
  }
  .nombre {
    display: none;
  }
  .avatar-container {
    width: 60px;
    height: 60px;
    border: 2px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
  .logo-img {
    max-width: 90px;
  }
}

.icono-enlace-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 0.1rem 0;
}

.enlace {
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 80px;
  max-width: 100px;
}

.enlace span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #222;
  margin-top: 0;
  line-height: 1.2;
}
</style>
