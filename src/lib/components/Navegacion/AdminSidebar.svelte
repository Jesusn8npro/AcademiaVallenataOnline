<script lang="ts">
  import { usuario, limpiarUsuario } from '$lib/UsuarioActivo/usuario';
  import { cerrarSesion as cerrarSesionSupabase } from '$lib/supabase/autenticacionSupabase';
  import { sidebarColapsado } from '$lib/stores/sidebarStore';
  import ModalBusqueda from '$lib/components/Busqueda/ModalBusqueda.svelte';
  import ToggleModoOscuro from '$lib/components/ui/ToggleModoOscuro.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  // ✅ NUEVO: Importar Dashboard de Métricas
  import DashboardMetricas from '$lib/components/Monitoreo/DashboardMetricas.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase/clienteSupabase';
  // ✅ NUEVO: Importar sistema de routing inteligente
  import { navegarInteligente, logRouting } from '$lib/utils/routingUtils';

  let colapsado = false;
  let menuPerfilAbierto = false;
  let modalBusquedaAbierto = false;
  
  // ✅ NUEVO: ESTADO DEL DASHBOARD DE MÉTRICAS
  let dashboardMetricasAbierto = false;

  // Determinar el tipo de usuario
  $: tipoUsuario = $usuario?.rol === 'admin' ? 'admin' : 'estudiante';
  $: nombreUsuario = $usuario?.nombre || 'Usuario';
  
  // Reactivo: cargar datos cuando cambie el usuario
  $: if ($usuario) {
    if (tipoUsuario === 'admin') {
      cargarEstadisticasAdmin();
    } else if (tipoUsuario === 'estudiante') {
      cargarProgresoEstudiante();
    }
  }
  
  // Función para verificar si una ruta está activa
  $: rutaActual = $page.url.pathname;
  
  function esRutaActiva(ruta: string): boolean {
    return rutaActual === ruta || rutaActual.startsWith(ruta + '/');
  }

  // Estados para datos reales
  let estadisticasAdmin = {
    totalEstudiantes: 0,
    totalCursos: 0,
    objetivoMensual: 0,
    porcentajeObjetivo: 0,
    notificacionesPendientes: 0,
    usuariosComunidad: 0
  };

  let progresoEstudiante = {
    cursosCompletados: 0,
    cursosEnProgreso: 0,
    porcentajeProgreso: 0,
    miembrosComunidad: 0, // No es relevante para el sidebar
    // 🆕 NUEVOS DATOS MÁS ÚTILES
    leccionesCompletadas: 0,
    tutorialesCompletados: 0,
    totalTutoriales: 0,
    puntos: 0,
    racha: 0
  };

  // 🎯 MENSAJES MOTIVACIONALES ALEATORIOS
  let mensajeMotivacional = '';
  const mensajesMotivacionales = [
    "¡Sigue así! Cada día es un paso hacia el éxito 🎵",
    "Tu dedicación te llevará lejos ⭐",
    "El acordeón es tu pasión, ¡persíguela! 🎶",
    "Cada nota que aprendes te hace mejor músico 🎼",
    "La práctica hace al maestro 🎯",
    "¡Tu talento brilla cada día más! ✨",
    "Cada lección te acerca a tu sueño 🚀",
    "El ritmo está en tu sangre 💪",
    "¡Eres capaz de grandes cosas! 🌟",
    "Tu esfuerzo hoy será tu éxito mañana 🎉"
  ];

  // 🎯 FUNCIÓN PARA SELECCIONAR MENSAJE MOTIVACIONAL ALEATORIO
  function seleccionarMensajeMotivacional() {
    const indiceAleatorio = Math.floor(Math.random() * mensajesMotivacionales.length);
    mensajeMotivacional = mensajesMotivacionales[indiceAleatorio];
  }

  // Cargar datos reales
  async function cargarEstadisticasAdmin() {
    if (!$usuario || tipoUsuario !== 'admin') return;
    
    try {
      // Obtener número total de estudiantes
      const { count: estudiantes } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'estudiante');

      // Obtener número total de cursos
      const { count: cursos } = await supabase
        .from('cursos')
        .select('*', { count: 'exact', head: true })
        .eq('publicado', true);

      // Obtener usuarios activos en comunidad (últimos 30 días)
      const { count: usuariosComunidad } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      estadisticasAdmin = {
        totalEstudiantes: estudiantes || 0,
        totalCursos: cursos || 0,
        objetivoMensual: 100, // Este puede ser configurable
        porcentajeObjetivo: Math.round(((estudiantes || 0) / 100) * 100),
        notificacionesPendientes: 0, // Placeholder - implementar según necesidades
        usuariosComunidad: usuariosComunidad || 0
      };
    } catch (error) {
      console.warn('Error cargando estadísticas admin:', error);
    }
  }

  async function cargarProgresoEstudiante() {
    if (!$usuario || tipoUsuario !== 'estudiante') return;
    
    try {
      // 🚀 EJECUTAR TODAS LAS CONSULTAS EN PARALELO
      const [
        inscripcionesResult,
        progresoLeccionesResult,
        progresoTutorialesResult,
        rankingResult,
        sesionesResult
      ] = await Promise.all([
        // 1. Inscripciones del estudiante
        supabase
        .from('inscripciones')
        .select('*, cursos(titulo)')
          .eq('usuario_id', $usuario.id),
          
        // 2. Progreso de lecciones (TODAS las lecciones, no solo últimos 30 días)
        supabase
          .from('progreso_lecciones')
          .select('porcentaje_completado, estado')
          .eq('usuario_id', $usuario.id),
          
        // 3. Progreso de tutoriales
        supabase
          .from('progreso_tutorial')
          .select('completado, ultimo_acceso')
          .eq('usuario_id', $usuario.id),
          
        // 4. Ranking del usuario
        supabase
          .from('ranking_global')
          .select('puntuacion, posicion')
          .eq('usuario_id', $usuario.id)
          .single(),
          
        // 5. Sesiones de usuario para calcular racha
        supabase
          .from('sesiones_usuario')
          .select('created_at')
          .eq('usuario_id', $usuario.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      // 📊 PROCESAR DATOS
      const inscripciones = inscripcionesResult.data || [];
      const progresoLecciones = progresoLeccionesResult.data || [];
      const progresoTutoriales = progresoTutorialesResult.data || [];
      const ranking = rankingResult.data;
      const sesiones = sesionesResult.data || [];

      // 🎯 CALCULAR ESTADÍSTICAS REALES
      const cursosActivos = inscripciones.filter((i: any) => !i.completado).length;
      const cursosCompletados = inscripciones.filter((i: any) => i.completado).length;
      const totalCursos = inscripciones.length;

      // Lecciones completadas (TODAS las lecciones, no solo últimos 30 días)
      const leccionesCompletadas = progresoLecciones.filter((p: any) => 
        p.estado === 'completado' || p.porcentaje_completado === 100
      ).length;
      
      // Tutoriales completados
      const tutorialesCompletados = progresoTutoriales.filter((t: any) => t.completado).length;
      const totalTutoriales = progresoTutoriales.length;
      
      // 🆕 TOTAL DE ACTIVIDADES COMPLETADAS (lecciones + tutoriales)
      const totalActividadesCompletadas = leccionesCompletadas + tutorialesCompletados;
      
      // Puntos del ranking
      const puntos = ranking?.puntuacion || 0;
      
      // Calcular racha (días consecutivos con actividad)
      let racha = 0;
      if (sesiones.length > 0) {
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        
        let diasConsecutivos = 0;
        let fechaActual = new Date(hoy);
        
        for (let i = 0; i < 7; i++) {
          const fechaStr = fechaActual.toISOString().split('T')[0];
          const tieneActividad = sesiones.some((s: any) => 
            s.created_at.startsWith(fechaStr)
          );
          
          if (tieneActividad) {
            diasConsecutivos++;
            fechaActual.setDate(fechaActual.getDate() - 1);
          } else {
            break;
          }
        }
        racha = diasConsecutivos;
      }
      
      // Porcentaje de progreso general
      const porcentajeProgreso = totalCursos > 0 ? 
        Math.round((cursosCompletados / totalCursos) * 100) : 0;

        progresoEstudiante = {
        cursosCompletados,
        cursosEnProgreso: cursosActivos,
        porcentajeProgreso,
        miembrosComunidad: 0, // No es relevante para el sidebar
        // 🆕 NUEVOS DATOS MÁS ÚTILES
        leccionesCompletadas: totalActividadesCompletadas, // 🚀 TOTAL CORRECTO: lecciones + tutoriales
        tutorialesCompletados,
        totalTutoriales,
        puntos,
        racha
      };
      
      console.log('✅ [SIDEBAR] Datos del estudiante cargados:', progresoEstudiante);
      
    } catch (error) {
      console.warn('⚠️ Error cargando progreso estudiante:', error);
    }
  }

  function alternarBarraLateral() {
    colapsado = !colapsado;
    sidebarColapsado.set(colapsado);
  }

  function alternarMenuPerfil(evento: Event) {
    evento.stopPropagation();
    menuPerfilAbierto = !menuPerfilAbierto;
  }

  async function cerrarSesionCompleta() {
    await cerrarSesionSupabase();
    limpiarUsuario();
    goto('/');
  }

  function irAPerfil() {
    menuPerfilAbierto = false;
    goto('/mi-perfil');
  }

  function irACursos() {
    menuPerfilAbierto = false;
    goto(tipoUsuario === 'admin' ? '/cursos' : '/mis-cursos');
  }

  function abrirModalBusqueda() {
    modalBusquedaAbierto = true;
  }

  function cerrarModalBusqueda() {
    modalBusquedaAbierto = false;
  }

  // ✅ NUEVO: FUNCIÓN PARA TOGGLE DEL DASHBOARD DE MÉTRICAS
  function toggleDashboardMetricas() {
    dashboardMetricasAbierto = !dashboardMetricasAbierto;
    console.log('🔧 [ADMIN] Dashboard de métricas:', dashboardMetricasAbierto ? 'abierto' : 'cerrado');
  }

  onMount(() => {
    const manejarClicFuera = (evento: Event) => {
      const elementoPerfil = document.querySelector('.perfil-usuario');
      if (elementoPerfil && !elementoPerfil.contains(evento.target as Node) && menuPerfilAbierto) {
        menuPerfilAbierto = false;
      }
    };
    
    document.addEventListener('click', manejarClicFuera);
    
    // Cargar datos según el tipo de usuario
    if (tipoUsuario === 'admin') {
      cargarEstadisticasAdmin();
    } else if (tipoUsuario === 'estudiante') {
      cargarProgresoEstudiante();
      seleccionarMensajeMotivacional(); // Llamar la función para seleccionar un mensaje al montar
    }
    
    return () => document.removeEventListener('click', manejarClicFuera);
  });
</script>

<div class="sidebar-moderno" class:colapsado>
  <!-- Header con Ícono de Sidebar -->
  <div class="sidebar-header">
    <div class="sidebar-icon-container">
      <div class="sidebar-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </div>
      {#if !colapsado}
        <span class="sidebar-label">Menú</span>
      {/if}
    </div>
    
    <button class="btn-toggle-moderno" aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'} on:click={alternarBarraLateral}>
      <div class="toggle-icon" class:rotado={colapsado}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
    </button>
  </div>

  <!-- Buscador Moderno -->
  <div class="search-container">
    <button class="search-btn-moderno" class:colapsado on:click={abrirModalBusqueda} aria-label="Abrir búsqueda">
      <div class="search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      {#if !colapsado}
        <span class="search-text">Buscar contenido...</span>
        <div class="search-shortcut">⌘K</div>
      {/if}
    </button>
  </div>

  <!-- Navegación Principal -->
  <nav class="navegacion-principal">
    
    {#if tipoUsuario === 'admin'}
      <!-- MENÚ PARA ADMINISTRADORES -->
      
      <!-- Sección Principal -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Principal</div>
        {/if}
        
        <a href="/panel-administracion" class="nav-item" class:destacado={esRutaActiva('/panel-administracion')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/>
              <rect x="3" y="16" width="7" height="5"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Dashboard</span>
            <div class="nav-badge activo">{estadisticasAdmin.notificacionesPendientes}</div>
          {/if}
        </a>

        <a href="/administrador/panel-contenido" class="nav-item" class:destacado={esRutaActiva('/administrador/panel-contenido')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Gestionar Contenido</span>
          {/if}
        </a>

        <a href="/administrador/crear-contenido" class="nav-item" class:destacado={esRutaActiva('/administrador/crear-contenido')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Crear Contenido</span>
            <div class="nav-badge nuevo">Nuevo</div>
          {/if}
        </a>
      </div>

      <!-- Sección Contenido -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Contenido</div>
        {/if}
        
        <a href="/cursos" class="nav-item" class:destacado={esRutaActiva('/cursos')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Cursos & Tutoriales</span>
          {/if}
        </a>

        <a href="/administrador/blog" class="nav-item" class:destacado={esRutaActiva('/administrador/blog')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Blog</span>
          {/if}
        </a>

        <a href="/administrador/eventos" class="nav-item" class:destacado={esRutaActiva('/administrador/eventos')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <rect x="8" y="14" width="8" height="4"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Eventos</span>
            <div class="nav-badge nuevo">Nuevo</div>
          {/if}
        </a>
      </div>

      <!-- Sección Herramientas -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Herramientas</div>
        {/if}
        
        <a href="/simulador-gaming" class="nav-item" class:destacado={esRutaActiva('/simulador-gaming')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Simulador Gaming</span>
            <div class="nav-badge nuevo">PRO</div>
          {/if}
        </a>

        <a href="/comunidad" class="nav-item" class:destacado={esRutaActiva('/comunidad')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Comunidad</span>
            <div class="nav-badge">{estadisticasAdmin.usuariosComunidad}</div>
          {/if}
        </a>

        <!-- ✅ NUEVO: DASHBOARD DE MÉTRICAS PARA ADMINISTRADOR -->
        <button 
          class="nav-item metricas-btn" 
          class:destacado={false}
          on:click={toggleDashboardMetricas}
          title="Dashboard de Métricas del Sistema"
        >
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Métricas Sistema</span>
            <div class="nav-badge monitoreo">📊</div>
          {/if}
        </button>
      </div>

    {:else}
      <!-- MENÚ PARA ESTUDIANTES -->
      
      <!-- Sección Principal -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Mi Aprendizaje</div>
        {/if}
        
        <a href="/panel-estudiante" class="nav-item" class:destacado={esRutaActiva('/panel-estudiante')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/>
              <rect x="3" y="16" width="7" height="5"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Mi Panel</span>
          {/if}
        </a>

        <a href="/mis-cursos" class="nav-item" class:destacado={esRutaActiva('/mis-cursos')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Mis Cursos</span>
            <div class="nav-badge progreso">{progresoEstudiante.porcentajeProgreso}%</div>
          {/if}
        </a>

        <a href="/cursos" class="nav-item" class:destacado={esRutaActiva('/cursos')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Cursos & Tutoriales</span>
          {/if}
        </a>
      </div>

      <!-- Sección Práctica -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Práctica</div>
        {/if}
        
        <!-- 🎵 SIMULADOR REMOVIDO PARA ESTUDIANTES -->
        <!-- Los estudiantes verán la landing page "Coming Soon" si intentan acceder -->

        <a href="/comunidad" class="nav-item" class:destacado={esRutaActiva('/comunidad')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Comunidad</span>
            <div class="nav-badge">{progresoEstudiante.miembrosComunidad}</div>
          {/if}
        </a>

        <a href="/ranking" class="nav-item" class:destacado={esRutaActiva('/ranking')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 16v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10c0-1.1.9-2 2-2h2l3-3 3 3h2a2 2 0 0 1 2 2v4M8 12l2 2 4-4"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Ranking</span>
          {/if}
        </a>

        <a href="/eventos" class="nav-item" class:destacado={esRutaActiva('/eventos')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Eventos</span>
          {/if}
        </a>

        <a href="/mensajes" class="nav-item" class:destacado={esRutaActiva('/mensajes')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Mensajes</span>
          {/if}
        </a>
      </div>

      <!-- 🆕 NUEVA SECCIÓN: CONFIGURACIÓN Y PERFIL -->
      <div class="nav-section">
        {#if !colapsado}
          <div class="section-title">Configuración</div>
        {/if}
        
        <a href="/mi-perfil" class="nav-item" class:destacado={esRutaActiva('/mi-perfil')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Mi Perfil</span>
          {/if}
        </a>

        <a href="/configuracion" class="nav-item" class:destacado={esRutaActiva('/configuracion')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Configuración</span>
          {/if}
        </a>

        <a href="/grabaciones" class="nav-item" class:destacado={esRutaActiva('/grabaciones')}>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="23"/>
              <line x1="8" x2="8" y1="23" y2="23"/>
              <line x1="16" x2="16" y1="23" y2="23"/>
            </svg>
          </div>
          {#if !colapsado}
            <span class="nav-text">Grabaciones</span>
          {/if}
        </a>
      </div>
    {/if}
  </nav>

  <!-- ✅ NUEVO: DASHBOARD DE MÉTRICAS PARA ADMINISTRADOR -->
  {#if tipoUsuario === 'admin' && dashboardMetricasAbierto}
    <div class="dashboard-metricas-container">
      <DashboardMetricas />
    </div>
  {/if}

  <!-- Stats Card - Solo para admins cuando no está colapsado -->
  {#if !colapsado && tipoUsuario === 'admin'}
    <div class="stats-card">
      <div class="stats-header">
        <div class="stats-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
          </svg>
        </div>
        <div class="stats-title">Estadísticas</div>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <div class="stat-value">{estadisticasAdmin.totalEstudiantes.toLocaleString()}</div>
          <div class="stat-label">Estudiantes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{estadisticasAdmin.totalCursos}</div>
          <div class="stat-label">Cursos</div>
        </div>
      </div>
      <div class="stats-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {estadisticasAdmin.porcentajeObjetivo}%"></div>
        </div>
        <div class="progress-text">{estadisticasAdmin.porcentajeObjetivo}% del objetivo mensual</div>
      </div>
    </div>
  {/if}

  <!-- Progress Card - Solo para estudiantes cuando no está colapsado -->
  {#if !colapsado && tipoUsuario === 'estudiante'}
    <div class="motivational-card">
      <div class="motivational-header">
        <div class="motivational-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div class="motivational-title">¡Motivación Diaria!</div>
      </div>
      <div class="motivational-content">
        <p class="motivational-message">{mensajeMotivacional}</p>
      </div>
    </div>

    <!-- 🆕 TARJETA DE ESTADÍSTICAS CLAVE -->
    <div class="stats-card-student">
      <div class="stats-header-student">
        <div class="stats-icon-student">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
          </svg>
        </div>
        <div class="stats-title-student">⭐ Estadísticas Clave</div>
          </div>
      <div class="stats-content-student">
        <div class="stat-item-student">
          <span class="stat-icon">💎</span>
          <div class="stat-info">
            <div class="stat-value-student">{progresoEstudiante.puntos}</div>
            <div class="stat-label-student">Puntos</div>
          </div>
        </div>
        <div class="stat-item-student">
          <span class="stat-icon">📚</span>
          <div class="stat-info">
            <div class="stat-value-student">{progresoEstudiante.leccionesCompletadas}</div>
            <div class="stat-label-student">Lecciones</div>
          </div>
        </div>
        <div class="stat-item-student">
          <span class="stat-icon">🔥</span>
          <div class="stat-info">
            <div class="stat-value-student">{progresoEstudiante.racha}</div>
            <div class="stat-label-student">Días</div>
          </div>
        </div>
      </div>
      
      <!-- 🆕 DOS BOTONES FUNCIONALES -->
      <div class="stats-buttons">
        <button class="stats-btn-left" on:click={() => goto('/mi-perfil')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Mi Perfil
        </button>
        <button class="stats-btn-right" on:click={() => goto('/mis-cursos')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Mis Cursos
        </button>
      </div>
    </div>
  {/if}

  <!-- Perfil Usuario (Manteniendo funcionalidad original) -->
  <div class="perfil-usuario-moderno">
    <div class="perfil-btn-moderno" class:colapsado on:click={alternarMenuPerfil} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && alternarMenuPerfil(e)}>
      <div class="avatar-container-sidebar">
        <Avatar 
          src={$usuario?.url_foto_perfil}
          alt="Avatar"
          nombreCompleto={nombreUsuario}
          size="medium"
        />
        <div class="status-indicator"></div>
      </div>
      {#if !colapsado}
        <div class="perfil-info">
          <div class="perfil-nombre">{nombreUsuario}</div>
          <div class="perfil-rol">{tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}</div>
        </div>
        <div class="perfil-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
      {/if}
    </div>
    
    {#if menuPerfilAbierto}
      <div class="menu-perfil-moderno" on:click|stopPropagation role="menu" tabindex="-1">
        <!-- Header del perfil -->
        <div class="perfil-header-moderno">
          <div class="avatar-header-container">
            <div class="avatar-header-wrapper">
              <Avatar 
                src={$usuario?.url_foto_perfil}
                alt="Avatar"
                nombreCompleto={nombreUsuario}
                size="large"
              />
            </div>
            <div class="status-indicator-header"></div>
          </div>
          <div class="info-header-moderno">
            <div class="nombre-header-moderno">{nombreUsuario}</div>
            <div class="correo-header-moderno">{$usuario?.correo_electronico || 'usuario@email.com'}</div>
          </div>
        </div>
        
        <!-- Opciones del menú -->
        <div class="menu-opciones">
          <button class="opcion-moderna" on:click={irAPerfil}>
            <div class="opcion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="opcion-text">Mi Perfil</span>
          </button>
          
          <div class="opcion-moderna tema-option">
            <div class="opcion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
            <span class="opcion-text">Tema Oscuro</span>
            <div class="toggle-sidebar-container">
              			<!-- ToggleModoOscuro - Temporalmente oculto -->
            </div>
          </div>
          
          <button class="opcion-moderna" on:click={irACursos}>
            <div class="opcion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <span class="opcion-text">{tipoUsuario === 'admin' ? 'Cursos' : 'Mis Cursos'}</span>
          </button>
          
          <div class="menu-divider"></div>
          
          <button class="opcion-moderna logout-moderna" on:click={cerrarSesionCompleta}>
            <div class="opcion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span class="opcion-text">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if modalBusquedaAbierto}
  <ModalBusqueda abierto={modalBusquedaAbierto} onCerrar={cerrarModalBusqueda} />
{/if}

<style>
.sidebar-moderno {
  position: fixed;
  top: 63px;
  left: 0;
  height: calc(100vh - 63px);
  min-height: calc(100vh - 63px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border-right: 1px solid #e1e5e9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  width: 280px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.sidebar-moderno.colapsado {
  width: 80px;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 10px 0px 24px;
  border-bottom: 1px solid #f0f2f5;
  background: #fff;
}

.sidebar-icon-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.sidebar-icon svg {
  width: 20px;
  height: 20px;
}

.sidebar-label {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.btn-toggle-moderno {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #64748b;
}

.btn-toggle-moderno:hover {
  background: #e2e8f0;
  color: #475569;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.toggle-icon.rotado {
  transform: rotate(180deg);
}

/* Search */
.search-container {
  padding: 10px 24px;
}

.sidebar-moderno.colapsado .search-container {
  padding: 10px 20px;
}

.search-btn-moderno {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.search-btn-moderno:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.search-btn-moderno.colapsado {
  justify-content: center;
  padding: 12px;
}

.search-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.search-text {
  flex: 1;
  text-align: left;
  font-size: 14px;
  color: #64748b;
}

.search-shortcut {
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Navigation */
.navegacion-principal {
  flex: 1;
  padding: 2px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 24px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 18px;
  margin: 1px 16px;
  text-decoration: none;
  color: #475569;
  font-weight: 500;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}

.nav-item.destacado {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

.nav-item.destacado:hover {
  transform: translateX(4px) translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.35);
}

.sidebar-moderno.colapsado .nav-item {
  justify-content: center;
  padding: 8px 16px;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
}

.nav-badge {
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.nav-badge.activo {
  background: #ef4444;
  color: white;
  animation: pulse-badge 2s infinite;
}

.nav-badge.nuevo {
  background: #22c55e;
  color: white;
}

.nav-badge.progreso {
  background: #3b82f6;
  color: white;
}

.nav-badge.gratis {
  background: #10b981;
  color: white;
  font-weight: 800;
}

.nav-item.destacado .nav-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Stats Card */
.stats-card {
  margin: 0 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stats-icon {
  width: 24px;
  height: 24px;
}

.stats-title {
  font-size: 16px;
  font-weight: 700;
}

.stats-content {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.stats-progress {
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  opacity: 0.9;
}

/* Progress Card */
.progress-card {
  margin: 0 16px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-icon {
  width: 20px;
  height: 20px;
  color: #22c55e;
}

.progress-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-circle {
  position: relative;
  width: 60px;
  height: 60px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 2;
}

.progress-meter {
  fill: none;
  stroke: #22c55e;
  stroke-width: 2;
  stroke-linecap: round;
  animation: progress-animation 1s ease-in-out;
}

.progress-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 700;
  color: #22c55e;
}

.progress-stats {
  flex: 1;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.stat-text {
  font-size: 12px;
  color: #64748b;
}

/* Progress Extra Stats */
.progress-extra-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.extra-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.extra-icon {
  font-size: 18px;
}

.extra-value {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.extra-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Modo Oscuro para estadísticas extra */
:global(.dark) .extra-value {
  color: #f1f5f9;
}

:global(.dark) .extra-label {
  color: #94a3b8;
}

:global(.dark) .progress-extra-stats {
  border-top-color: #374151;
}

/* Motivational Card */
.motivational-card {
  margin: 0 16px 8px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 12px;
  padding: 12px 16px;
  color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.motivational-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.motivational-icon {
  width: 18px;
  height: 18px;
  color: #1a1a1a;
}

.motivational-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.motivational-content {
  text-align: center;
}

.motivational-message {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a1a;
  margin: 0;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

/* Modo Oscuro para tarjeta motivacional */
:global(.dark) .motivational-card {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1a1a1a;
}

:global(.dark) .motivational-title {
  color: #1a1a1a;
}

:global(.dark) .motivational-message {
  color: #1a1a1a;
}

/* 🆕 TARJETA DE ESTADÍSTICAS DEL ESTUDIANTE */
.stats-card-student {
  margin: 0 16px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.stats-header-student {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stats-icon-student {
  width: 14px;
  height: 14px;
  color: #8b5cf6;
}

.stats-title-student {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
}

.stats-content-student {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 12px;
}

.stat-item-student {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
}

.stat-icon {
  font-size: 14px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value-student {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.stat-label-student {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* 🆕 BOTONES FUNCIONALES */
.stats-buttons {
  display: flex;
  gap: 6px;
}

.stats-btn-left,
.stats-btn-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: white;
}

.stats-btn-left {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
}

.stats-btn-left:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

.stats-btn-right {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
}

.stats-btn-right:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.stats-btn-left svg,
.stats-btn-right svg {
  width: 12px;
  height: 12px;
}

/* Modo Oscuro para estadísticas del estudiante */
:global(.dark) .stats-card-student {
  background: #334155;
  border-color: #475569;
}

:global(.dark) .stats-title-student {
  color: #f1f5f9;
}

:global(.dark) .stat-value-student {
  color: #f1f5f9;
}

:global(.dark) .stat-label-student {
  color: #94a3b8;
}

/* Perfil Usuario */
.perfil-usuario-moderno {
  margin-top: auto;
  position: relative;
  padding: 12px;
  border-top: 1px solid #f0f2f5;
}

.perfil-btn-moderno {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.perfil-btn-moderno:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.perfil-btn-moderno.colapsado {
  justify-content: center;
  padding: 10px;
}

.avatar-container-sidebar {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid white;
  border-radius: 50%;
}

.perfil-info {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.perfil-nombre {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-rol {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-chevron {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.perfil-btn-moderno:hover .perfil-chevron {
  transform: rotate(180deg);
}

/* Menu Perfil */
.menu-perfil-moderno {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  z-index: 50;
  overflow: hidden;
}

.perfil-header-moderno {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.avatar-header-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-header-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator-header {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
}

.info-header-moderno {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.nombre-header-moderno {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.correo-header-moderno {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-opciones {
  padding: 8px;
}

.opcion-moderna {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s ease;
  text-align: left;
}

.opcion-moderna:hover {
  background: #f8fafc;
  color: #1e293b;
}

.opcion-moderna.logout-moderna {
  color: #dc2626;
}

.opcion-moderna.logout-moderna:hover {
  background: #fef2f2;
}

.opcion-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.opcion-text {
  flex: 1;
}

.menu-divider {
  height: 1px;
  background: #f0f2f5;
  margin: 8px 0;
}

/* Estilos para la opción del tema oscuro */
.tema-option {
  justify-content: space-between !important;
  cursor: default !important;
  background: #f8fffe !important;
  border: 1px solid #e0f2f1;
}

.tema-option:hover {
  background: #f0fdf4 !important;
}

.toggle-sidebar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.toggle-sidebar-container :global(.toggle-modo-oscuro) {
  width: 32px;
  height: 32px;
  margin: 0;
}

/* Modo Oscuro */
:global(.dark) .sidebar-moderno {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right-color: #374151;
}

:global(.dark) .sidebar-header {
  background: #1e293b;
  border-bottom-color: #374151;
}

:global(.dark) .sidebar-label {
  color: #f1f5f9;
}

:global(.dark) .nav-item {
  color: #cbd5e1;
}

:global(.dark) .nav-item:hover {
  background: rgba(51, 65, 85, 0.3);
  color: #f1f5f9;
}

:global(.dark) .nav-item.destacado {
  background: rgba(229, 231, 235, 0.1);
  color: #f1f5f9;
}

:global(.dark) .section-title {
  color: #94a3b8;
}

:global(.dark) .perfil-usuario-moderno .perfil-btn-moderno {
  background: #334155;
}

:global(.dark) .perfil-usuario-moderno .perfil-btn-moderno:hover {
  background: #475569;
}

:global(.dark) .perfil-nombre {
  color: #f1f5f9;
}

:global(.dark) .perfil-rol {
  color: #94a3b8;
}

:global(.dark) .menu-perfil-moderno {
  background: #334155;
  border-color: #475569;
}

:global(.dark) .perfil-header-moderno {
  background: linear-gradient(135deg, #475569 0%, #374151 100%);
  border-bottom-color: #475569;
}

:global(.dark) .nombre-header-moderno {
  color: #f1f5f9;
}

:global(.dark) .correo-header-moderno {
  color: #94a3b8;
}

:global(.dark) .opcion-moderna {
  color: #cbd5e1;
}

:global(.dark) .opcion-moderna:hover {
  background: #475569 !important;
  color: #f1f5f9;
}

:global(.dark) .tema-option {
  background: rgba(34, 197, 94, 0.1) !important;
  border-color: rgba(34, 197, 94, 0.2) !important;
}

:global(.dark) .tema-option:hover {
  background: rgba(34, 197, 94, 0.15) !important;
}

/* Animations */
@keyframes pulse-badge {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes progress-animation {
  0% { stroke-dasharray: 0, 100; }
  100% { stroke-dasharray: 75, 100; }
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar-moderno:not(.colapsado) {
    width: 260px;
  }
  
  .stats-card,
  .progress-card {
    display: none;
  }
}

/* Ocultar sidebar en pantallas menores a 900px */
@media (max-width: 900px) {
  .sidebar-moderno {
    display: none;
  }
}

/* Para pantallas muy pequeñas, asegurar que esté oculto */
@media (max-width: 768px) {
  .sidebar-moderno {
    display: none !important;
  }
}

/* ✅ NUEVO: ESTILOS PARA EL DASHBOARD DE MÉTRICAS */
.dashboard-metricas-container {
  position: fixed;
  top: 63px;
  left: 280px;
  width: 400px;
  height: calc(100vh - 63px);
  z-index: 1000;
  background: transparent;
  pointer-events: none;
}

.dashboard-metricas-container :global(.dashboard-metricas) {
  pointer-events: auto;
}

/* ✅ ESTILOS PARA EL BOTÓN DE MÉTRICAS */
.metricas-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  padding: 0;
  margin: 0;
  font-family: inherit;
  color: inherit;
}

.metricas-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.nav-badge.monitoreo {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
  animation: pulse-badge 2s infinite;
}

/* ✅ RESPONSIVE PARA EL DASHBOARD */
@media (max-width: 1200px) {
  .dashboard-metricas-container {
    left: 80px;
    width: 350px;
  }
}

@media (max-width: 768px) {
  .dashboard-metricas-container {
    left: 0;
    width: 100%;
    height: 100vh;
    top: 0;
  }
}
</style>
