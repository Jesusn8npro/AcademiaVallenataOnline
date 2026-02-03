<!--
🏆 RANKING COMUNIDAD - VERSIÓN MEJORADA UX
=====================================================
Sistema de ranking mejorado con scroll infinito
Mejor estética, funcionalidad de clic y texto explicativo
=====================================================
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { estadoUsuarioActual } from '$lib/supabase/estadoUsuarioActual';
  import GamificacionService from '$lib/services/gamificacionService';
  // import BarraXP from '$lib/components/Gaming/BarraXP.svelte'; // Componente eliminado
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { obtenerSlugUsuario } from '$lib/utilidades/utilidadesSlug';

  // Estado del componente
  let rankingData: any[] = [];
  let rankingCompleto: any[] = [];
  let isLoading = true;
  let isLoadingMore = false;
  let error: string | null = null;
  let filtroTipo = 'general';
  let datosUsuarioActual: any = null;
  let posicionUsuario = 0;
  let showXPBars = false;
  let mostrarExplicacion = false;
  
  // Paginación
  let itemsPerPage = 20;
  let currentPage = 1;
  let hasMore = true;

  // Suscribirse a cambios del usuario
  $: datosUsuarioActual = $estadoUsuarioActual;

  // Opciones de filtro
  const filtros = [
    { value: 'general', label: 'General', icon: '🏆' },
    { value: 'cursos', label: 'Cursos', icon: '📚' },
    { value: 'comunidad', label: 'Comunidad', icon: '💬' },
    { value: 'simulador', label: 'Simulador', icon: '🎹' },
    { value: 'constancia', label: 'Constancia', icon: '🔥' }
  ];

  /**
   * 🏅 Cargar ranking completo
   */
  async function cargarRankingCompleto() {
    try {
      isLoading = true;
      error = null;
      
      // Cargar ranking completo
      const { data, error: supabaseError } = await supabase.rpc('obtener_ranking_hibrido_completo', {
        p_tipo_ranking: filtroTipo,
        p_limite: 1000
      });
      
      if (supabaseError) {
        console.error('Error obteniendo ranking:', supabaseError);
        await cargarRankingTradicional();
        return;
      }
      
      if (!data || data.length === 0) {
        await cargarRankingTradicional();
        return;
      }
      
      // Mapear datos y reorganizar posiciones
              rankingCompleto = data
        .filter((item: any) => item.usuario_id && (item.puntuacion > 0 || item.posicion > 0))
        .map((item: any, index: number) => ({
        posicion: index + 1, // Siempre usar secuencia continua
        puntuacion: Math.max(0, item.puntuacion || 0),
        usuario_id: item.usuario_id,
        usuario: {
          nombre: item.nombre || 'Usuario',
          apellido: item.apellido || '',
          nombre_usuario: item.nombre_usuario || null,
          nombre_completo: item.nombre_completo || null,
          url_foto_perfil: item.url_foto_perfil
        },
        nivel: Math.max(1, item.nivel || 1),
        xp_total: Math.max(0, item.xp_total || 0),
        cursos_completados: Math.max(0, item.cursos_completados || 0),
        tutoriales_completados: Math.max(0, item.tutoriales_completados || 0),
        publicaciones_creadas: Math.max(0, item.publicaciones_creadas || 0),
        likes_recibidos: Math.max(0, item.likes_recibidos || 0),
        comentarios_hechos: Math.max(0, item.comentarios_hechos || 0),
        racha_actual_dias: Math.max(0, item.racha_actual_dias || 0),
        logros_totales: Math.max(0, item.logros_totales || 0),
                es_gaming: item.es_gaming || false
      }));
      
      // Encontrar posición del usuario actual
      if (datosUsuarioActual?.id) {
        const userIndex = rankingCompleto.findIndex(u => u.usuario_id === datosUsuarioActual.id);
        posicionUsuario = userIndex >= 0 ? userIndex + 1 : 0;
      }
      
      // Cargar primera página
      cargarPaginaInicial();
      
    } catch (error) {
      console.error('Error en cargarRankingCompleto:', error);
      await cargarRankingTradicional();
    }
  }

  /**
   * 🏅 Cargar página inicial
   */
  function cargarPaginaInicial() {
    currentPage = 1;
    rankingData = rankingCompleto.slice(0, itemsPerPage);
    hasMore = rankingCompleto.length > itemsPerPage;
    isLoading = false;
  }

  /**
   * 🏅 Cargar más usuarios
   */
  function cargarMasUsuarios() {
    if (isLoadingMore || !hasMore) return;
    
    isLoadingMore = true;
    
    setTimeout(() => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const nuevosUsuarios = rankingCompleto.slice(startIndex, endIndex);
      
      if (nuevosUsuarios.length > 0) {
        rankingData = [...rankingData, ...nuevosUsuarios];
        currentPage++;
        hasMore = endIndex < rankingCompleto.length;
      } else {
        hasMore = false;
      }
      
      isLoadingMore = false;
    }, 500); // Simular carga
  }

  /**
   * 🏅 Método de respaldo
   */
  async function cargarRankingTradicional() {
    try {
      const resultado = await GamificacionService.obtenerRanking(filtroTipo, 1000);
      rankingCompleto = resultado
        .filter((item: any) => item.usuario_id && (item.puntuacion > 0 || item.posicion > 0))
        .map((item: any, index: number) => ({
        posicion: index + 1, // Secuencia continua sin saltos
        puntuacion: Math.max(0, item.puntuacion || 0),
        usuario_id: item.usuario_id,
        usuario: {
          nombre: item.perfiles?.nombre || 'Usuario',
          apellido: item.perfiles?.apellido || '',
          nombre_usuario: item.perfiles?.nombre_usuario || null,
          nombre_completo: item.perfiles?.nombre_completo || null,
          url_foto_perfil: item.perfiles?.url_foto_perfil
        },
        nivel: Math.max(1, item.metricas?.nivel || 1),
        xp_total: Math.max(0, item.metricas?.xp_total || 0),
        cursos_completados: Math.max(0, item.metricas?.cursos_completados || 0),
        tutoriales_completados: Math.max(0, item.metricas?.tutoriales_completados || 0),
        publicaciones_creadas: Math.max(0, item.metricas?.publicaciones_creadas || 0),
        likes_recibidos: Math.max(0, item.metricas?.likes_recibidos || 0),
        comentarios_hechos: Math.max(0, item.metricas?.comentarios_hechos || 0),
        racha_actual_dias: Math.max(0, item.metricas?.racha_actual_dias || 0),
        logros_totales: Math.max(0, item.metricas?.logros_conseguidos || 0),
        es_gaming: item.metricas?.es_gaming || false
      }));
      
      cargarPaginaInicial();
      
    } catch (error) {
      console.error('Error en cargarRankingTradicional:', error);
      isLoading = false;
      error = 'Error al cargar el ranking';
    }
  }

  // Cargar al montar
  onMount(() => {
    cargarRankingCompleto();
  });
  
  // Recargar cuando cambie el filtro
  $: if (filtroTipo) {
    cargarRankingCompleto();
  }

  /**
   * 🏅 Obtener clase de posición
   */
  function obtenerClasePosicion(posicion: number): string {
    if (posicion === 1) return 'oro';
    if (posicion === 2) return 'plata';
    if (posicion === 3) return 'bronce';
    if (posicion <= 10) return 'top-10';
    return 'otros';
  }

  /**
   * 🏅 Obtener emoji de posición
   */
  function obtenerEmojiPosicion(posicion: number): string {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    if (posicion <= 10) return '🏆';
    return '🎯';
  }

  /**
   * 🏅 Obtener descripción de puntuación según filtro
   */
  function obtenerDescripcionPuntuacion(item: any): string {
    if (filtroTipo === 'cursos') {
      return `${item.cursos_completados} cursos • ${item.tutoriales_completados} tutoriales`;
    }
    if (filtroTipo === 'comunidad') {
      return `${item.publicaciones_creadas} posts • ${item.likes_recibidos} likes`;
    }
    if (filtroTipo === 'constancia') {
      return `${item.racha_actual_dias} días activo`;
    }
    if (filtroTipo === 'simulador') {
      return `Nivel ${item.nivel} • ${item.xp_total} XP`;
    }
    return `${item.puntuacion} puntos • Nivel ${item.nivel}`;
  }

  /**
   * 🏅 Navegar a perfil de usuario
   */
  function irAPerfil(item: any) {
    console.log(`🔗 Navegando al perfil de:`, item.usuario);
    
    // Crear objeto con datos del usuario para obtener el slug
    const datosUsuario = {
      nombre_usuario: item.usuario.nombre_usuario || null,
      nombre: item.usuario.nombre,
      apellido: item.usuario.apellido,
      nombre_completo: item.usuario.nombre_completo || null,
      usuario_nombre: item.usuario.nombre || item.usuario_nombre || null,
      usuario_id: item.usuario_id
    };
    
    // Obtener slug usando la función unificada
    const slug = obtenerSlugUsuario(datosUsuario);
    
    console.log(`✅ Slug generado: ${slug}`);
    console.log(`🔗 Navegando a: /usuarios/${slug}`);
    
    // Navegar al perfil
    goto(`/usuarios/${slug}`);
  }

  /**
   * 🏅 Alternar barras XP
   */
  function alternarXPBars() {
    showXPBars = !showXPBars;
  }

  /**
   * 🏅 Alternar explicación
   */
  function alternarExplicacion() {
    mostrarExplicacion = !mostrarExplicacion;
  }

  /**
   * 🏅 Obtener texto de explicación
   */
  function obtenerTextoExplicacion(): string {
    switch (filtroTipo) {
      case 'cursos':
        return 'Los puntos se ganan completando cursos, tutoriales y lecciones. Cada actividad suma XP automáticamente.';
      case 'comunidad':
        return 'Los puntos se ganan participando: crear publicaciones (+15), comentar (+5), recibir likes (+2).';
      case 'constancia':
        return 'Los puntos reflejan tu constancia diaria en la plataforma. Mantén tu racha activa para subir.';
      case 'simulador':
        return 'Los puntos se ganan practicando en el simulador de acordeón. Cada sesión suma XP.';
      default:
        return 'Los puntos combinan todas tus actividades: cursos, comunidad, constancia y simulador.';
    }
  }
</script>

<div class="ranking-comunidad">
  <!-- Encabezado mejorado -->
  <div class="ranking-header">
    <div class="header-info">
      <h3>🏆 Ranking Comunidad</h3>
      <p>Compite con otros acordeonistas</p>
    </div>
    
    <div class="header-controls">
      <button 
        class="control-btn" 
        on:click={alternarExplicacion}
        class:active={mostrarExplicacion}
        title="Información sobre puntos"
      >
        {mostrarExplicacion ? '❌' : '❓'}
      </button>
      <button 
        class="control-btn" 
        on:click={alternarXPBars} 
        class:active={showXPBars}
        title="Mostrar barras XP"
      >
        {showXPBars ? '📊' : '🎮'}
      </button>
    </div>
  </div>

  <!-- Explicación de puntos -->
  {#if mostrarExplicacion}
    <div class="explicacion-puntos">
      <div class="explicacion-content">
        <h4>💡 ¿Cómo funcionan los puntos?</h4>
        <p>{obtenerTextoExplicacion()}</p>
      </div>
    </div>
  {/if}

  <!-- Filtros mejorados -->
  <div class="filtros-ranking">
    {#each filtros as filtro}
      <button 
        class="filtro-btn" 
        class:active={filtroTipo === filtro.value}
        on:click={() => filtroTipo = filtro.value}
      >
        <span class="filtro-icon">{filtro.icon}</span>
        <span class="filtro-label">{filtro.label}</span>
      </button>
    {/each}
  </div>

  <!-- Mi posición -->
  {#if posicionUsuario > 0}
    <div class="mi-posicion">
      <span class="posicion-icon">{obtenerEmojiPosicion(posicionUsuario)}</span>
      <span class="posicion-texto">
        Tu posición: <strong>#{posicionUsuario}</strong>
      </span>
    </div>
  {/if}

  <!-- Lista de ranking con scroll mejorado -->
  <div class="ranking-container">
    <div class="ranking-lista">
      {#if isLoading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando ranking...</p>
        </div>
      {:else if error}
        <div class="error">
          <p>{error}</p>
          <button class="retry-btn" on:click={cargarRankingCompleto}>
            Reintentar
          </button>
        </div>
      {:else if rankingData.length === 0}
        <div class="empty">
          <p>No hay datos disponibles</p>
        </div>
      {:else}
        {#each rankingData as item, index (item.usuario_id)}
          <div 
            class="ranking-item {obtenerClasePosicion(item.posicion)}"
            class:es-usuario-actual={item.usuario_id === datosUsuarioActual?.id}
            class:es-gaming={item.es_gaming}
            on:click={() => irAPerfil(item)}
            on:keydown={(e) => e.key === 'Enter' && irAPerfil(item)}
            role="button"
            tabindex="0"
            title="Ver perfil de {item.usuario.nombre}"
          >
            <!-- Posición -->
            <div class="posicion">
              <span class="posicion-emoji">{obtenerEmojiPosicion(item.posicion)}</span>
              <span class="posicion-numero">#{item.posicion}</span>
            </div>

            <!-- Avatar -->
            <div class="avatar">
              {#if item.usuario.url_foto_perfil}
                <img src={item.usuario.url_foto_perfil} alt="Avatar de {item.usuario.nombre}" />
              {:else}
                <div class="avatar-placeholder">
                  {item.usuario.nombre.charAt(0).toUpperCase()}
                </div>
              {/if}
              {#if item.es_gaming}
                <div class="gaming-badge">🎮</div>
              {/if}
            </div>

            <!-- Info usuario -->
            <div class="usuario-info">
              <h4 class="nombre">
                {item.usuario.nombre} {item.usuario.apellido}
              </h4>
              <p class="descripcion">
                {obtenerDescripcionPuntuacion(item)}
              </p>
              
              <!-- {#if showXPBars && item.es_gaming}
                <div class="xp-bar-container">
                  <BarraXP 
                    usuarioId={item.usuario_id}
                    size="pequeño"
                    mostrarDetalles={false}
                    animarSubida={false}
                  />
                </div>
              {/if} -->
            </div>

            <!-- Puntuación -->
            <div class="puntuacion">
              <span class="puntos">{item.puntuacion.toLocaleString()}</span>
              <span class="puntos-label">puntos</span>
            </div>

            <!-- Indicador gaming -->
            {#if item.es_gaming}
              <div class="gaming-indicator">
                <div class="gaming-dot"></div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Botón cargar más -->
  {#if hasMore && !isLoading}
    <div class="load-more-container">
      <button 
        class="load-more-btn"
        on:click={cargarMasUsuarios}
        disabled={isLoadingMore}
      >
        {#if isLoadingMore}
          <div class="btn-spinner"></div>
          Cargando...
        {:else}
          Ver más usuarios
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .ranking-comunidad {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    border-radius: 20px;
    padding: 24px;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-info h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-info p {
    margin: 4px 0 0 0;
    opacity: 0.8;
    font-size: 0.9rem;
  }

  .header-controls {
    display: flex;
    gap: 8px;
  }

  .control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 10px;
    padding: 10px 12px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    min-width: 40px;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .control-btn.active {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .explicacion-puntos {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    border-left: 4px solid #ffd700;
  }

  .explicacion-content h4 {
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: #ffd700;
  }

  .explicacion-content p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
    opacity: 0.9;
  }

  .filtros-ranking {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .filtro-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    padding: 10px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    border: 2px solid transparent;
  }

  .filtro-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .filtro-btn.active {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .mi-posicion {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid rgba(255, 215, 0, 0.3);
  }

  .posicion-icon {
    font-size: 1.2rem;
  }

  .ranking-container {
    position: relative;
  }

  .ranking-lista {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 8px;
    /* Scroll personalizado */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  /* Scroll personalizado para WebKit */
  .ranking-lista::-webkit-scrollbar {
    width: 6px;
  }

  .ranking-lista::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  .ranking-lista::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    transition: background 0.3s ease;
  }

  .ranking-lista::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .ranking-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border: 2px solid transparent;
  }

  .ranking-item:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .ranking-item:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.5);
  }

  .ranking-item.es-usuario-actual {
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.1);
  }

  .ranking-item.es-gaming {
    border-left: 4px solid #00ff88;
  }

  .ranking-item.oro {
    background: linear-gradient(45deg, rgba(255, 215, 0, 0.25), rgba(255, 215, 0, 0.15));
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  }

  .ranking-item.plata {
    background: linear-gradient(45deg, rgba(192, 192, 192, 0.25), rgba(192, 192, 192, 0.15));
    border-color: rgba(192, 192, 192, 0.4);
    box-shadow: 0 4px 12px rgba(192, 192, 192, 0.2);
  }

  .ranking-item.bronce {
    background: linear-gradient(45deg, rgba(205, 127, 50, 0.25), rgba(205, 127, 50, 0.15));
    border-color: rgba(205, 127, 50, 0.4);
    box-shadow: 0 4px 12px rgba(205, 127, 50, 0.2);
  }

  .ranking-item.top-10 {
    background: linear-gradient(45deg, rgba(106, 90, 205, 0.2), rgba(106, 90, 205, 0.1));
    border-color: rgba(106, 90, 205, 0.3);
    box-shadow: 0 4px 12px rgba(106, 90, 205, 0.2);
  }

  .ranking-item.otros {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  }

  .posicion {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 45px;
    justify-content: center;
  }

  .posicion-numero {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.8;
    margin-top: 2px;
  }

  .posicion-emoji {
    font-size: 1.4rem;
    margin-bottom: 2px;
  }

  .avatar {
    position: relative;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.2rem;
  }

  .gaming-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #00ff88;
    color: black;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    border: 2px solid white;
  }

  .usuario-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .nombre {
    margin: 0 0 6px 0;
    font-size: 1.05rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .descripcion {
    margin: 0;
    opacity: 0.8;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .xp-bar-container {
    margin-top: 8px;
  }

  .puntuacion {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    min-width: 65px;
    flex-shrink: 0;
  }

  .puntos {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffd700;
    line-height: 1.2;
  }

  .puntos-label {
    font-size: 0.65rem;
    opacity: 0.7;
    margin-top: 2px;
  }

  .gaming-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .gaming-dot {
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    box-shadow: 0 0 6px #00ff88;
  }

  .load-more-container {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .load-more-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 12px 24px;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .load-more-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
    transform: translateY(-2px);
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading {
    text-align: center;
    padding: 40px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    text-align: center;
    padding: 40px;
  }

  .retry-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    margin-top: 16px;
    transition: all 0.3s ease;
  }

  .retry-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .empty {
    text-align: center;
    padding: 40px;
    opacity: 0.7;
  }

  /* Responsive mejorado */
  @media (max-width: 768px) {
    .ranking-comunidad {
      padding: 16px;
    }
    
    .ranking-header {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    
    .filtros-ranking {
      justify-content: center;
    }
    
    .ranking-item {
      padding: 10px;
      gap: 10px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
    }
    
    .posicion {
      min-width: 35px;
    }
  }
  
  @media (max-width: 480px) {
    .ranking-comunidad {
      padding: 12px;
    }
    
    .ranking-item {
      padding: 8px;
      gap: 8px;
    }
    
    .avatar {
      width: 36px;
      height: 36px;
    }
    
    .nombre {
      font-size: 0.9rem;
    }
    
    .posicion {
      min-width: 30px;
    }
    
    .posicion-emoji {
      font-size: 1.2rem;
    }
    
    .puntos {
      font-size: 1rem;
    }
  }
</style>
