<script lang="ts">
  import ComunidadComentarios from './ComunidadComentarios.svelte';
  import EncuestaPublicacion from './EncuestaPublicacion.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { goto } from '$app/navigation';
  import { obtenerSlugUsuario } from '$lib/utilidades/utilidadesSlug';
  export let id: string = "";
  export let usuario_id: string = "";
  export let usuario_nombre: string = "Wall Oliveros";
  export let url_foto_perfil: string = "";
  export let usuario_slug: string = "";
  export let fecha: string = "14 de junio a las 11:43";
  export let contenido: string = "Esta es una publicación de ejemplo. ¡Puedes cambiar el texto!";
  export let url_imagen: string = "";
  export let url_video: string = "";
  export let url_gif: string = "";
  export let tipo: string = "texto";
  export let encuesta: any = null;
  export let me_gusta: string[] = [];
  export let total_comentarios: number = 0;

  // Estado local para el total de comentarios
  let contadorComentarios: number = total_comentarios;

  import { onMount } from 'svelte';
  // Al montar, cargar contador de comentarios y likes reales desde Supabase
  onMount(async () => {
    // Comentarios
    const { count, error } = await supabase
      .from('comunidad_comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('publicacion_id', id);
    if (!error && typeof count === 'number') {
      contadorComentarios = count;
    }
    // Likes
    await recargarConteoLikes();
  });
  export let total_compartidos: number = 0;
  export let usuario: any;

  // Estado local para los likes
  let meGusta: string[] = [...me_gusta];
  let cargandoMeGusta = false;
  let errorMeGusta = '';

  // Para mostrar/ocultar comentarios
  let mostrarComentarios = false;
  let enfoqueAutomaticoComentario = false;

  // Saber si el usuario actual ya dio like
  $: yaDioMeGusta = usuario && meGusta.includes(usuario.id);

  async function alternarMeGusta() {
    if (!usuario || !usuario.id || cargandoMeGusta) return;
    cargandoMeGusta = true;
    errorMeGusta = '';
    try {
      const { data, error } = await supabase.rpc('toggle_like_publicacion_sin_auth', {
        p_publicacion_id: id,
        p_usuario_id: usuario.id
      });
      if (error) {
        errorMeGusta = 'Error al procesar el like';
      } else {
        if (data && !data.error) {
          await recargarConteoLikes();
        }
      }
    } catch (error) {
      errorMeGusta = 'Error inesperado al procesar el like';
    }
    cargandoMeGusta = false;
  }

  // 📊 Función para recargar el conteo real de likes
  async function recargarConteoLikes() {
    try {
      const { data, error } = await supabase
        .from('comunidad_publicaciones_likes')
        .select('usuario_id')
        .eq('publicacion_id', id);
      if (!error && data) {
        const nuevosLikes = data.map((like: any) => like.usuario_id);
        meGusta = nuevosLikes;
      }
    } catch (error) {}
  }

  function manejarComentarClick() {
    mostrarComentarios = true;
    enfoqueAutomaticoComentario = false;
    // Necesario para que el cambio de false a true sea detectado si se hace varias veces seguidas
    setTimeout(() => { enfoqueAutomaticoComentario = true; }, 0);
  }

  function navegarAlPerfil() {
    console.log(`🔗 Intentando navegar al perfil: ${usuario_slug}`);
    
    if (usuario_slug && usuario_slug !== 'usuario') {
      console.log(`✅ Navegando a: /usuarios/${usuario_slug}`);
      goto(`/usuarios/${usuario_slug}`);
    } else {
      console.log('❌ Slug no válido, creando fallback usando utilidades');
      // Crear slug usando función unificada
      const datosUsuario = {
        nombre_usuario: usuario_slug !== 'usuario' ? usuario_slug : null,
        nombre: usuario_nombre,
        usuario_nombre: usuario_nombre,
        usuario_id: usuario_id
      };
      
      const slugFallback = obtenerSlugUsuario(datosUsuario);
      console.log(`🔧 Usando slug fallback: ${slugFallback}`);
      goto(`/usuarios/${slugFallback}`);
    }
  }
</script>

<article class="tarjeta-publicacion" id="publicacion-{id}">
  <!-- Encabezado de la publicación -->
  <header class="encabezado-publicacion">
    <div class="info-usuario">
      <div class="contenedor-avatar">
        <div class="avatar-button-container">
          <Avatar 
            src={url_foto_perfil}
            alt={usuario_nombre}
            nombreCompleto={usuario_nombre}
            size="medium"
            onClick={navegarAlPerfil}
          />
        </div>
        <div class="indicador-estado"></div>
      </div>
      <div class="detalles-usuario">
        <button
          class="nombre-usuario-button clickeable"
          on:click={navegarAlPerfil}
          aria-label="Ver perfil de {usuario_nombre}"
        >
          <h3 class="nombre-usuario">
            {usuario_nombre}
          </h3>
        </button>
        <div class="metadatos-publicacion">
          <time class="fecha-publicacion">{fecha}</time>
          <span class="separador">·</span>
          <span class="visibilidad-publicacion" title="Público">
            <svg class="icono-publico" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Público
          </span>
    </div>
    </div>
    </div>
    <div class="acciones-encabezado">
      <button class="boton-menu" title="Más opciones" aria-label="Opciones de publicación">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Contenido de la publicación -->
  <div class="contenido-principal">
    <!-- Mostrar texto especial para publicaciones automáticas de fotos -->
    {#if tipo === 'foto_perfil'}
      <p class="texto-publicacion-automatica">
        <span class="accion-automatica">Actualizó su foto de perfil</span>
      </p>
    {:else if tipo === 'foto_portada'}
      <p class="texto-publicacion-automatica">
        <span class="accion-automatica">Actualizó su foto de portada</span>
      </p>
    {:else}
      <p class="texto-publicacion">{contenido}</p>
    {/if}
    
    <!-- Media de la publicación -->
  {#if url_imagen}
      <div class="contenedor-media">
        <img 
          src={url_imagen} 
          alt="Imagen de la publicación" 
          class="imagen-publicacion"
          loading="lazy"
        />
    </div>
  {:else if url_video}
      <div class="contenedor-media">
        <video 
          src={url_video} 
          controls 
          class="video-publicacion"
          preload="metadata"
          aria-label="Video de la publicación"
        >
          <track kind="captions" src="" label="Sin subtítulos disponibles" default>
          Su navegador no soporta la reproducción de video.
        </video>
    </div>
  {:else if url_gif}
      <div class="contenedor-media">
        <img 
          src={url_gif} 
          alt="GIF de la publicación" 
          class="gif-publicacion"
          loading="lazy"
        />
    </div>
  {/if}

    <!-- Encuesta -->
    {#if encuesta && encuesta.opciones && encuesta.opciones.length > 0}
      <EncuestaPublicacion 
        publicacionId={id}
        {encuesta}
        {usuario}
      />
    {/if}
  </div>

  <!-- Barra de estadísticas -->
  <div class="barra-estadisticas">
    <div class="reacciones-info">
      {#if meGusta.length > 0}
        <div class="iconos-reacciones">
          <span class="icono-reaccion">👍</span>
        </div>
        <span class="contador-reacciones">{meGusta.length}</span>
        <span class="texto-reacciones">
          {meGusta.length === 1 ? 'persona le gusta esto' : 'personas les gusta esto'}
        </span>
      {/if}
    </div>
    <div class="estadisticas-derecha">
      {#if contadorComentarios > 0}
        <button 
          class="boton-contador-comentarios" 
          on:click={() => mostrarComentarios = !mostrarComentarios}
        >
          {contadorComentarios} {contadorComentarios === 1 ? 'comentario' : 'comentarios'}
      </button>
      {/if}
      {#if total_compartidos > 0}
        <span class="separador-estadisticas">·</span>
        <span class="contador-compartidos">
          {total_compartidos} {total_compartidos === 1 ? 'vez compartida' : 'veces compartida'}
        </span>
      {/if}
    </div>
  </div>

  <!-- Barra de acciones -->
  <div class="barra-acciones">
    <button 
      class="boton-accion" 
      class:activo={yaDioMeGusta}
      on:click={alternarMeGusta} 
      disabled={cargandoMeGusta}
      aria-label={yaDioMeGusta ? 'Quitar me gusta' : 'Me gusta'}
    >
      <svg class="icono-accion" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
      </svg>
      <span class="texto-accion">{yaDioMeGusta ? 'Te gusta' : 'Me gusta'}</span>
      {#if cargandoMeGusta}
        <div class="indicador-carga"></div>
      {/if}
    </button>
    
    <button 
      class="boton-accion" 
      on:click={manejarComentarClick}
      aria-label="Comentar publicación"
    >
      <svg class="icono-accion" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.89 2 2 2h14l4 4-.01-18z"/>
      </svg>
      <span class="texto-accion">Comentar</span>
    </button>
    
    <button 
      class="boton-accion" 
      aria-label="Compartir publicación"
    >
      <svg class="icono-accion" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
      <span class="texto-accion">Compartir</span>
    </button>
  </div>
  
  <!-- Sección de comentarios -->
<ComunidadComentarios
  publicacionId={id}
  usuario={usuario}
  mostrar={mostrarComentarios}
    autoFocusInput={enfoqueAutomaticoComentario}
  on:comentarioEnviado={() => {
      contadorComentarios += 1;
    mostrarComentarios = true;
  }}
/>
</article>

<style>
  /* Variables CSS para consistencia */
  :root {
    --color-primario: #667eea;
    --color-secundario: #764ba2;
    --color-texto-principal: #1a202c;
    --color-texto-secundario: #718096;
    --color-fondo-tarjeta: #ffffff;
    --color-borde: #e2e8f0;
    --color-hover: #f7fafc;
    --radio-borde: 16px;
    --sombra-tarjeta: 0 4px 20px rgba(0, 0, 0, 0.08);
    --sombra-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
    --transicion-suave: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transicion-rapida: all 0.15s ease-out;
}

  /* Tarjeta principal */
  .tarjeta-publicacion {
    background: var(--color-fondo-tarjeta);
    border-radius: var(--radio-borde);
    box-shadow: var(--sombra-tarjeta);
    margin-bottom: 1.5rem;
    overflow: hidden;
    transition: var(--transicion-suave);
    border: 1px solid var(--color-borde);
    position: relative;
  }

  .tarjeta-publicacion:hover {
    box-shadow: var(--sombra-hover);
    transform: translateY(-2px);
}

  /* Encabezado */
  .encabezado-publicacion {
  display: flex;
    align-items: center;
  justify-content: space-between;
    padding: 1.25rem 1rem 1rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

  .info-usuario {
  display: flex;
  align-items: center;
    gap: 1rem;
  }

  .contenedor-avatar {
    position: relative;
    margin-left: 1px;
  }

  .avatar-usuario {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: var(--transicion-suave);
  }

  .avatar-usuario:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  }

  .indicador-estado {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: linear-gradient(135deg, #48bb78, #38a169);
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

  .detalles-usuario {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nombre-usuario {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-texto-principal);
    margin: 0;
    line-height: 1.2;
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

  .metadatos-publicacion {
  display: flex;
  align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-texto-secundario);
}

  .fecha-publicacion {
    font-weight: 500;
}

  .separador {
    color: #cbd5e0;
}

  .visibilidad-publicacion {
  display: flex;
  align-items: center;
    gap: 0.25rem;
    font-weight: 500;
  }

  .icono-publico {
    width: 14px;
    height: 14px;
    color: var(--color-primario);
}

  .acciones-encabezado {
  display: flex;
  align-items: center;
  }

  .boton-menu {
  background: none;
  border: none;
    color: var(--color-texto-secundario);
  cursor: pointer;
    padding: 0.5rem;
  border-radius: 50%;
    transition: var(--transicion-rapida);
  display: flex;
  align-items: center;
  justify-content: center;
}

  .boton-menu:hover {
    background: var(--color-hover);
    color: var(--color-primario);
    transform: scale(1.1);
}

  .boton-menu svg {
    width: 20px;
    height: 20px;
  }

  /* Contenido principal */
  .contenido-principal {
    padding: 0 1.5rem 1rem;
  }

  .texto-publicacion {
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--color-texto-principal);
    margin: 0 0 1rem 0;
    white-space: pre-line;
    word-wrap: break-word;
  }

  /* Estilos para publicaciones automáticas de fotos */
  .texto-publicacion-automatica {
    font-size: 1.05rem;
    line-height: 1.4;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .accion-automatica {
    color: var(--color-texto-secundario);
    font-weight: 600;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    font-size: 0.95rem;
    display: inline-block;
  }

  /* Media */
  .contenedor-media {
    margin: 1rem 0;
  border-radius: 12px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

  .imagen-publicacion,
  .gif-publicacion {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    display: block;
    transition: var(--transicion-suave);
  }

  .imagen-publicacion:hover,
  .gif-publicacion:hover {
    transform: scale(1.02);
  }

  .video-publicacion {
    width: 100%;
    max-height: 400px;
    display: block;
  }

  /* Estadísticas */
  .barra-estadisticas {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-top: 1px solid var(--color-borde);
    border-bottom: 1px solid var(--color-borde);
    background: rgba(248, 250, 252, 0.5);
    font-size: 0.9rem;
}

  .reacciones-info {
  display: flex;
  align-items: center;
    gap: 0.5rem;
}

  .iconos-reacciones {
    display: flex;
    align-items: center;
}

  .icono-reaccion {
    font-size: 1.2rem;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }

  .contador-reacciones {
  font-weight: 600;
    color: var(--color-primario);
}

  .texto-reacciones {
    color: var(--color-texto-secundario);
    font-weight: 500;
  }

  .estadisticas-derecha {
  display: flex;
  align-items: center;
    gap: 0.5rem;
}

  .boton-contador-comentarios {
    background: none;
    border: none;
    color: var(--color-texto-secundario);
    font-weight: 600;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    transition: var(--transicion-rapida);
    font-size: inherit;
  }

  .boton-contador-comentarios:hover {
    color: var(--color-primario);
    background: rgba(102, 126, 234, 0.1);
  }

  .separador-estadisticas {
    color: #cbd5e0;
    margin: 0 0.25rem;
  }

  .contador-compartidos {
    color: var(--color-texto-secundario);
    font-weight: 500;
}

  /* Elementos clickeables para navegar al perfil */
  .clickeable {
    cursor: pointer;
    transition: var(--transicion-rapida);
  }

  .clickeable:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }

  .clickeable:focus {
    outline: 2px solid var(--color-primario);
    outline-offset: 2px;
  }

  /* Barra de acciones */
  .barra-acciones {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    padding: 0.75rem 1.5rem 1.25rem;
    background: var(--color-fondo-tarjeta);
  }

  .boton-accion {
  display: flex;
  align-items: center;
    justify-content: center;
    gap: 0.5rem;
  background: none;
  border: none;
    color: var(--color-texto-secundario);
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
  cursor: pointer;
    transition: var(--transicion-rapida);
    position: relative;
    overflow: hidden;
  }

  .boton-accion::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .boton-accion:hover::before {
    left: 100%;
  }

  .boton-accion:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    color: var(--color-primario);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .boton-accion.activo {
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  }

  .boton-accion.activo:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .icono-accion {
    width: 20px;
    height: 20px;
    transition: var(--transicion-rapida);
  }

  .boton-accion:hover .icono-accion {
    transform: scale(1.1);
  }

  .texto-accion {
    font-weight: 600;
    letter-spacing: 0.025em;
  }

  /* Indicador de carga */
  .indicador-carga {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
  border-radius: 50%;
    animation: girar 1s linear infinite;
  }

  @keyframes girar {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .tarjeta-publicacion {
      margin-bottom: 1rem;
      border-radius: 12px;
    }

    .encabezado-publicacion {
      padding: 1rem 1rem 0.75rem;
    }

    .avatar-usuario {
      width: 52px;
      height: 52px;
      margin-left: 0;
    }
    
    /* SOLO en páginas de perfil (como Publicaciones) agregar margin-left */
    :global(.layout-perfil-fijo) .avatar-usuario {
      margin-left: 30px;
    }

    .nombre-usuario {
      font-size: 1rem;
    }

    .metadatos-publicacion {
      font-size: 0.8rem;
    }

    .contenido-principal {
      padding: 0 1rem 0.75rem;
    }

    .texto-publicacion {
      font-size: 1rem;
      line-height: 1.5;
    }

    .barra-estadisticas {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }

    .barra-acciones {
      padding: 0.5rem 1rem 1rem;
      gap: 0.25rem;
    }

    .boton-accion {
      padding: 0.625rem 0.75rem;
      font-size: 0.9rem;
    }

    .texto-accion {
      display: none;
    }

    .icono-accion {
      width: 18px;
      height: 18px;
    }
  }



  /* Mejoras de accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Botones de avatar y nombre de usuario */
  .avatar-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    transition: var(--transicion-rapida);
  }

  .avatar-button:hover {
    transform: scale(1.05);
  }

  .avatar-button:focus {
    outline: 2px solid var(--color-primario);
    outline-offset: 2px;
  }

  .nombre-usuario-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: var(--transicion-rapida);
  }

  .nombre-usuario-button:hover {
    transform: translateY(-1px);
  }

  .nombre-usuario-button:focus {
    outline: 2px solid var(--color-primario);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .nombre-usuario-button .nombre-usuario {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
  }

  /* Tema oscuro */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-texto-principal: #f7fafc;
      --color-texto-secundario: #a0aec0;
      --color-fondo-tarjeta: #2d3748;
      --color-borde: #4a5568;
      --color-hover: #4a5568;
    }
}
</style>
