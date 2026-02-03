<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { usuario } from '$lib/UsuarioActivo/usuario';

  // Props
  export let abierto = false;
  export let imagenUrl = '';
  export let imagenId: string | null = null;
  export let usuarioPropietario = { id: '', nombre: '', avatar: '' };
  export let tipoImagen: 'avatar' | 'portada' | null = null;
  export let onCerrar: () => void;

  // Estado de navegación de imágenes
  let todasLasImagenes: any[] = [];
  let indiceImagenActual = 0;
  let cargandoImagenes = false;

  // Estado de likes y comentarios
  let likes: any[] = [];
  let comentarios: any[] = [];
  let nuevoComentario = '';
  let totalLikes = 0;
  let yaLikee = false;
  let cargandoLikes = false;
  let cargandoComentarios = false;
  let enviandoComentario = false;
  let dandoLike = false;

  // Estado UI
  let modalElement: HTMLElement;
  let comentarioInput: HTMLTextAreaElement;
  let respondiendo: string | null = null;
  let respuestaTexto = '';

  $: usuarioActual = $usuario;

  // Cargar datos cuando se abre el modal
  $: if (abierto && usuarioPropietario.id && tipoImagen) {
    cargarTodasLasImagenes();
  }

  // Cargar likes y comentarios cuando cambia la imagen actual
  $: if (abierto && imagenId) {
    cargarLikes();
    cargarComentarios();
  }

  async function cargarTodasLasImagenes() {
    if (!usuarioPropietario.id || !tipoImagen) return;
    cargandoImagenes = true;
    
    try {
      const { data: imagenesData, error } = await supabase
        .from('usuario_imagenes')
        .select('*')
        .eq('usuario_id', usuarioPropietario.id)
        .eq('tipo', tipoImagen)
        .order('fecha_subida', { ascending: false });

      if (error) throw error;

      todasLasImagenes = imagenesData || [];
      
      // Encontrar el índice de la imagen actual
      if (imagenId) {
        const indice = todasLasImagenes.findIndex(img => img.id === imagenId);
        indiceImagenActual = indice >= 0 ? indice : 0;
      } else {
        indiceImagenActual = 0;
      }

      // Si hay imágenes, actualizar la imagen actual
      if (todasLasImagenes.length > 0) {
        const imagenActual = todasLasImagenes[indiceImagenActual];
        imagenId = imagenActual.id;
        imagenUrl = imagenActual.url_imagen;
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error);
    } finally {
      cargandoImagenes = false;
    }
  }

  async function cargarLikes() {
    if (!imagenId) return;
    cargandoLikes = true;
    
    try {
      // Obtener total de likes
      const { data: likesData, error } = await supabase
        .from('usuario_imagenes_likes')
        .select('*')
        .eq('imagen_id', imagenId);

      if (error) throw error;

      likes = likesData || [];
      totalLikes = likes.length;
      yaLikee = usuarioActual ? likes.some(like => like.usuario_id === usuarioActual.id) : false;
    } catch (error) {
      console.error('Error cargando likes:', error);
    } finally {
      cargandoLikes = false;
    }
  }

  async function cargarComentarios() {
    if (!imagenId) return;
    cargandoComentarios = true;
    
    try {
      const { data: comentariosData, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .select('*')
        .eq('imagen_id', imagenId)
        .order('fecha_creacion', { ascending: true });

      if (error) throw error;

      comentarios = comentariosData || [];
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      cargandoComentarios = false;
    }
  }

  async function toggleLike() {
    if (!usuarioActual || !imagenId || dandoLike) return;
    dandoLike = true;

    try {
      if (yaLikee) {
        // Quitar like
        const { error } = await supabase
          .from('usuario_imagenes_likes')
          .delete()
          .eq('imagen_id', imagenId)
          .eq('usuario_id', usuarioActual.id);

        if (error) throw error;
        
        totalLikes--;
        yaLikee = false;
      } else {
        // Dar like
        const { error } = await supabase
          .from('usuario_imagenes_likes')
          .insert({
            imagen_id: imagenId,
            usuario_id: usuarioActual.id,
            fecha_creacion: new Date().toISOString()
          });

        if (error) throw error;
        
        totalLikes++;
        yaLikee = true;
      }
    } catch (error) {
      console.error('Error al dar/quitar like:', error);
    } finally {
      dandoLike = false;
    }
  }

  async function enviarComentario() {
    if (!usuarioActual || !imagenId || !nuevoComentario.trim() || enviandoComentario) return;
    enviandoComentario = true;

    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre || 'Usuario',
          usuario_avatar: usuarioActual.url_foto_perfil || '',
          comentario: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: null
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar el comentario a la lista local
      comentarios = [...comentarios, data];
      nuevoComentario = '';
      
      // Enfocar el input nuevamente
      if (comentarioInput) {
        comentarioInput.focus();
      }
    } catch (error) {
      console.error('Error enviando comentario:', error);
    } finally {
      enviandoComentario = false;
    }
  }

  async function responderComentario() {
    if (!usuarioActual || !imagenId || !respuestaTexto.trim() || !respondiendo || enviandoComentario) return;
    enviandoComentario = true;

    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre || 'Usuario',
          usuario_avatar: usuarioActual.url_foto_perfil || '',
          comentario: respuestaTexto.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: respondiendo
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar la respuesta a la lista local
      comentarios = [...comentarios, data];
      respuestaTexto = '';
      respondiendo = null;
    } catch (error) {
      console.error('Error enviando respuesta:', error);
    } finally {
      enviandoComentario = false;
    }
  }

  function manejarTeclaEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (respondiendo) {
        responderComentario();
      } else {
        enviarComentario();
      }
    }
  }

  function cerrarModal() {
    abierto = false;
    onCerrar();
  }

  function manejarClickFondo(event: MouseEvent) {
    if (event.target === modalElement) {
      cerrarModal();
    }
  }

  function navegarImagenAnterior() {
    if (indiceImagenActual > 0) {
      indiceImagenActual--;
      cambiarImagenActual();
    }
  }

  function navegarImagenSiguiente() {
    if (indiceImagenActual < todasLasImagenes.length - 1) {
      indiceImagenActual++;
      cambiarImagenActual();
    }
  }

  function cambiarImagenActual() {
    if (todasLasImagenes.length > 0) {
      const imagenActual = todasLasImagenes[indiceImagenActual];
      imagenId = imagenActual.id;
      imagenUrl = imagenActual.url_imagen;
    }
  }

  function formatearFecha(fecha: string) {
    const ahora = new Date();
    const fechaComentario = new Date(fecha);
    const diffMs = ahora.getTime() - fechaComentario.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    return fechaComentario.toLocaleDateString();
  }

  function obtenerComentariosPrincipales() {
    return comentarios.filter(c => !c.comentario_padre_id);
  }

  function obtenerRespuestas(comentarioPadreId: string) {
    return comentarios.filter(c => c.comentario_padre_id === comentarioPadreId);
  }

  // Cerrar modal con ESC y navegar con flechas
  function manejarTeclado(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cerrarModal();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navegarImagenAnterior();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navegarImagenSiguiente();
    }
  }

  onMount(() => {
    if (abierto) {
      document.addEventListener('keydown', manejarTeclado);
      document.body.style.overflow = 'hidden';
    }
  });

  onDestroy(() => {
    document.removeEventListener('keydown', manejarTeclado);
    document.body.style.overflow = '';
  });

  $: if (abierto) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
</script>

{#if abierto}
  <div 
    class="modal-overlay" 
    bind:this={modalElement}
    on:click={manejarClickFondo}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="modal-container">
      <!-- Botón cerrar -->
      <button class="btn-cerrar" on:click={cerrarModal} aria-label="Cerrar">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Contenido principal -->
      <div class="modal-content">
        <!-- Imagen -->
        <div class="imagen-container">
          <img src={imagenUrl} alt="Imagen de perfil" class="imagen-principal" />
          
          <!-- Botones de navegación -->
          {#if todasLasImagenes.length > 1}
            <button 
              class="btn-navegacion btn-anterior"
              class:disabled={indiceImagenActual === 0}
              on:click={navegarImagenAnterior}
              disabled={indiceImagenActual === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <button 
              class="btn-navegacion btn-siguiente"
              class:disabled={indiceImagenActual === todasLasImagenes.length - 1}
              on:click={navegarImagenSiguiente}
              disabled={indiceImagenActual === todasLasImagenes.length - 1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          {/if}
          
          <!-- Indicador de posición -->
          {#if todasLasImagenes.length > 1}
            <div class="indicador-posicion">
              {indiceImagenActual + 1} de {todasLasImagenes.length} fotos
            </div>
          {/if}
        </div>

        <!-- Panel lateral con interacciones -->
        <div class="panel-interacciones">
          <!-- Header del propietario -->
          <div class="header-propietario">
            <img 
              src={usuarioPropietario.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} 
              alt="Avatar" 
              class="avatar-pequeno" 
            />
            <div class="info-propietario">
              <h3 class="nombre-propietario">{usuarioPropietario.nombre}</h3>
              <p class="tiempo-subida">
                {#if tipoImagen === 'avatar'}
                  Foto de perfil
                {:else if tipoImagen === 'portada'}
                  Foto de portada
                {:else}
                  Imagen
                {/if}
              </p>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="acciones-principales">
            <button 
              class="btn-like" 
              class:activo={yaLikee}
              class:cargando={dandoLike}
              on:click={toggleLike}
              disabled={!usuarioActual || dandoLike}
            >
              <svg width="20" height="20" fill={yaLikee ? "#e74c3c" : "none"} stroke={yaLikee ? "#e74c3c" : "currentColor"} viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Me gusta
            </button>
            
            <button 
              class="btn-comentar"
              on:click={() => comentarioInput?.focus()}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Comentar
            </button>
          </div>

          <!-- Contador de likes -->
          {#if totalLikes > 0}
            <div class="contador-likes">
              <span class="emoji-like">❤️</span>
              <span class="texto-likes">
                {#if totalLikes === 1}
                  1 persona le gusta esto
                {:else}
                  {totalLikes} personas les gusta esto
                {/if}
              </span>
            </div>
          {/if}

          <!-- Lista de comentarios -->
          <div class="seccion-comentarios">
            {#if cargandoComentarios}
              <div class="cargando-comentarios">
                <div class="spinner"></div>
                <span>Cargando comentarios...</span>
              </div>
            {:else}
              <div class="lista-comentarios">
                {#each obtenerComentariosPrincipales() as comentario (comentario.id)}
                  <div class="comentario-item">
                    <img 
                      src={comentario.usuario_avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} 
                      alt="Avatar" 
                      class="avatar-comentario" 
                    />
                    <div class="contenido-comentario">
                      <div class="burbuja-comentario">
                        <strong class="nombre-comentarista">{comentario.usuario_nombre}</strong>
                        <p class="texto-comentario">{comentario.comentario}</p>
                      </div>
                      <div class="acciones-comentario">
                        <span class="tiempo-comentario">{formatearFecha(comentario.fecha_creacion)}</span>
                        <button 
                          class="btn-responder"
                          on:click={() => {
                            respondiendo = comentario.id;
                            respuestaTexto = '';
                          }}
                        >
                          Responder
                        </button>
                      </div>

                      <!-- Respuestas -->
                      {#each obtenerRespuestas(comentario.id) as respuesta (respuesta.id)}
                        <div class="respuesta-item">
                          <img 
                            src={respuesta.usuario_avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} 
                            alt="Avatar" 
                            class="avatar-respuesta" 
                          />
                          <div class="contenido-respuesta">
                            <div class="burbuja-respuesta">
                              <strong class="nombre-comentarista">{respuesta.usuario_nombre}</strong>
                              <p class="texto-comentario">{respuesta.comentario}</p>
                            </div>
                            <span class="tiempo-comentario">{formatearFecha(respuesta.fecha_creacion)}</span>
                          </div>
                        </div>
                      {/each}

                      <!-- Input para responder -->
                      {#if respondiendo === comentario.id}
                        <div class="input-respuesta">
                          <img 
                            src={usuarioActual?.url_foto_perfil || 'https://randomuser.me/api/portraits/women/44.jpg'} 
                            alt="Tu avatar" 
                            class="avatar-respuesta" 
                          />
                          <div class="input-container-respuesta">
                            <textarea
                              bind:value={respuestaTexto}
                              placeholder="Escribe una respuesta..."
                              class="textarea-respuesta"
                              on:keydown={manejarTeclaEnter}
                              rows="1"
                            ></textarea>
                            <div class="botones-respuesta">
                              <button 
                                class="btn-cancelar-respuesta"
                                on:click={() => {
                                  respondiendo = null;
                                  respuestaTexto = '';
                                }}
                              >
                                Cancelar
                              </button>
                              <button 
                                class="btn-enviar-respuesta"
                                on:click={responderComentario}
                                disabled={!respuestaTexto.trim() || enviandoComentario}
                              >
                                Responder
                              </button>
                            </div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}

                {#if comentarios.length === 0}
                  <div class="sin-comentarios">
                    <p>Sé el primero en comentar esta foto</p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Input para nuevo comentario -->
          {#if usuarioActual}
            <div class="input-comentario">
              <img 
                src={usuarioActual.url_foto_perfil || 'https://randomuser.me/api/portraits/women/44.jpg'} 
                alt="Tu avatar" 
                class="avatar-comentario" 
              />
              <div class="input-container">
                <textarea
                  bind:this={comentarioInput}
                  bind:value={nuevoComentario}
                  placeholder="Escribe un comentario..."
                  class="textarea-comentario"
                  on:keydown={manejarTeclaEnter}
                  rows="1"
                ></textarea>
                <button 
                  class="btn-enviar"
                  on:click={enviarComentario}
                  disabled={!nuevoComentario.trim() || enviandoComentario}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              </div>
            </div>
          {:else}
            <div class="login-requerido">
              <p>Inicia sesión para comentar y dar me gusta</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200; /* Por encima del encabezado (100) y pestañas (50) */
    padding: 20px;
    isolation: isolate; /* Crear nuevo contexto de apilamiento */
  }

  .modal-container {
    position: relative;
    max-width: 1200px;
    max-height: 90vh;
    width: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .btn-cerrar {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 201;
    transition: all 0.2s ease;
  }

  .btn-cerrar:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .modal-content {
    display: flex;
    height: 80vh;
    max-height: 700px;
  }

  .imagen-container {
    flex: 1.5;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .imagen-principal {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  /* Botones de navegación */
  .btn-navegacion {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
  }

  .btn-navegacion:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-50%) scale(1.1);
  }

  .btn-navegacion.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-navegacion.disabled:hover {
    background: rgba(0, 0, 0, 0.6);
    transform: translateY(-50%) scale(1);
  }

  .btn-anterior {
    left: 20px;
  }

  .btn-siguiente {
    right: 20px;
  }

  /* Indicador de posición */
  .indicador-posicion {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 10;
  }

  .panel-interacciones {
    flex: 1;
    background: white;
    display: flex;
    flex-direction: column;
    max-width: 400px;
  }

  .header-propietario {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }

  .avatar-pequeno {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 12px;
  }

  .nombre-propietario {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #1a1a1a;
  }

  .tiempo-subida {
    font-size: 0.8rem;
    color: #666;
    margin: 2px 0 0 0;
  }

  .acciones-principales {
    display: flex;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    gap: 15px;
  }

  .btn-like, .btn-comentar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 20px;
    transition: all 0.2s ease;
    color: #666;
  }

  .btn-like:hover, .btn-comentar:hover {
    background: #f5f5f5;
  }

  .btn-like.activo {
    color: #e74c3c;
  }

  .contador-likes {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 20px 15px 20px;
    border-bottom: 1px solid #eee;
  }

  .emoji-like {
    font-size: 1.1rem;
  }

  .texto-likes {
    font-size: 0.9rem;
    color: #666;
  }

  .seccion-comentarios {
    flex: 1;
    overflow-y: auto;
    padding: 15px 20px;
  }

  .cargando-comentarios {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px;
    color: #666;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #ddd;
    border-top-color: #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .comentario-item {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .avatar-comentario, .avatar-respuesta {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .contenido-comentario {
    flex: 1;
  }

  .burbuja-comentario, .burbuja-respuesta {
    background: #f5f5f5;
    border-radius: 18px;
    padding: 8px 14px;
    margin-bottom: 5px;
  }

  .nombre-comentarista {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 2px;
  }

  .texto-comentario {
    font-size: 0.9rem;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.3;
  }

  .acciones-comentario {
    display: flex;
    gap: 15px;
    margin-bottom: 10px;
  }

  .tiempo-comentario {
    font-size: 0.75rem;
    color: #666;
  }

  .btn-responder {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #666;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-responder:hover {
    text-decoration: underline;
  }

  .respuesta-item {
    display: flex;
    gap: 10px;
    margin-left: 20px;
    margin-bottom: 15px;
  }

  .contenido-respuesta {
    flex: 1;
  }

  .input-respuesta, .input-comentario {
    display: flex;
    gap: 12px;
    padding: 15px 20px;
    border-top: 1px solid #eee;
    background: white;
  }

  .input-respuesta {
    margin-left: 20px;
    margin-top: 10px;
    padding: 10px 0;
    border-top: none;
  }

  .input-container, .input-container-respuesta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .textarea-comentario, .textarea-respuesta {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 10px 15px;
    font-size: 0.9rem;
    resize: none;
    outline: none;
    background: #f9f9f9;
    transition: all 0.2s ease;
  }

  .textarea-comentario:focus, .textarea-respuesta:focus {
    border-color: #1877f2;
    background: white;
  }

  .btn-enviar {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #1877f2;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-enviar:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .btn-enviar:not(:disabled):hover {
    background: #166fe5;
  }

  .input-container {
    position: relative;
  }

  .botones-respuesta {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-cancelar-respuesta, .btn-enviar-respuesta {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
  }

  .btn-cancelar-respuesta {
    background: #f5f5f5;
    color: #666;
  }

  .btn-enviar-respuesta {
    background: #1877f2;
    color: white;
  }

  .btn-enviar-respuesta:disabled {
    background: #ccc;
  }

  .sin-comentarios {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .login-requerido {
    padding: 20px;
    text-align: center;
    border-top: 1px solid #eee;
    background: #f9f9f9;
    color: #666;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-overlay {
      padding: 0;
    }

    .modal-container {
      max-height: 100vh;
      border-radius: 0;
    }

    .modal-content {
      flex-direction: column;
      height: 100vh;
    }

    .imagen-container {
      flex: 1;
      max-height: 50vh;
    }

    .panel-interacciones {
      flex: 1;
      max-width: none;
    }

    .btn-cerrar {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
    }

    /* Botones de navegación en móvil */
    .btn-navegacion {
      width: 40px;
      height: 40px;
    }

    .btn-anterior {
      left: 10px;
    }

    .btn-siguiente {
      right: 10px;
    }

    .indicador-posicion {
      bottom: 10px;
      font-size: 0.8rem;
      padding: 6px 12px;
    }
  }
</style> 