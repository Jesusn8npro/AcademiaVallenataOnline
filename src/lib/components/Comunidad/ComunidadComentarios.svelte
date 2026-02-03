<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
export let publicacionId: string;
export let usuario: {
  id: string;
  nombre: string;

  email?: string;
} | null = null;
export let mostrar: boolean = false;
export let autoFocusInput: boolean = false;

let comentarios: any[] = [];
let likesComentarios: Record<string, number> = {}; // { [comentario_id]: cantidad }
let usuarioLikeComentarios: Record<string, boolean> = {}; // { [comentario_id]: true/false }
let textoComentario = '';
let cargandoComentarios = false;
let cargandoEnvio = false;
let errorMensaje = '';

let inputComentarioEl: HTMLInputElement | null = null;

async function cargarComentarios() {
  cargandoComentarios = true;
  errorMensaje = '';
  const { data, error: err } = await supabase
    .from('comunidad_comentarios')
    .select('*')
    .eq('publicacion_id', publicacionId)
    .order('fecha_creacion', { ascending: true });
  if (err) {
    errorMensaje = 'Error al cargar comentarios';
  } else {
    comentarios = data;
    await cargarLikesComentarios();
  }
  cargandoComentarios = false;
}

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

async function enviarComentario() {
  if (!textoComentario.trim() || cargandoEnvio) return;
  if (!usuario) {
    errorMensaje = 'Error: Usuario no autenticado';
    return;
  }
  if (!usuario.id || !usuario.nombre) {
    errorMensaje = 'Error: Datos de usuario incompletos (falta id o nombre)';
    return;
  }
  if (!publicacionId) {
    errorMensaje = 'Error: ID de publicación no válido';
    return;
  }
  cargandoEnvio = true;
  errorMensaje = '';
  const nuevoComentario = {
    publicacion_id: publicacionId,
    usuario_id: usuario.id,
    usuario_nombre: usuario.nombre,
    usuario_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre || 'Usuario')}&background=667eea&color=fff`,
    comentario: textoComentario.trim(),
    comentario_padre_id: null
  };
  try {
    const { data, error: err } = await supabase
      .from('comunidad_comentarios')
      .insert([nuevoComentario])
      .select();
    if (err) {
      errorMensaje = `Error al enviar comentario: ${err.message} (Código: ${err.code})`;
    } else {
      textoComentario = '';
      errorMensaje = '';
      await cargarComentarios();
      dispatch('comentarioEnviado', { comentario: data?.[0] });
    }
  } catch (error) {
    errorMensaje = 'Error inesperado al enviar el comentario';
  }
  cargandoEnvio = false;
}

async function cargarLikesComentarios() {
  likesComentarios = {};
  usuarioLikeComentarios = {};
  if (!comentarios.length) return;
  const ids = comentarios.map(c => c.id);
  // Obtener total_likes de cada comentario
  comentarios.forEach(c => {
    likesComentarios[c.id] = c.total_likes ?? 0;
  });
  // Saber si el usuario ya dio like a cada comentario
  if (usuario?.id) {
    const { data } = await supabase
      .from('comunidad_comentarios_likes')
      .select('comentario_id')
      .in('comentario_id', ids)
      .eq('usuario_id', usuario.id);
    if (data) {
      data.forEach((like: any) => {
        usuarioLikeComentarios[like.comentario_id] = true;
      });
    }
  }
}

async function alternarLikeComentario(comentarioId: string) {
  if (!usuario?.id) return;
  
  const yaLeDioLike = usuarioLikeComentarios[comentarioId];
  
  if (yaLeDioLike) {
    // Quitar like
  usuarioLikeComentarios[comentarioId] = false;
  likesComentarios[comentarioId] = Math.max((likesComentarios[comentarioId] || 1) - 1, 0);
  await supabase.from('comunidad_comentarios_likes')
    .delete()
    .eq('comentario_id', comentarioId)
    .eq('usuario_id', usuario.id);
  } else {
    // Dar like
    usuarioLikeComentarios[comentarioId] = true;
    likesComentarios[comentarioId] = (likesComentarios[comentarioId] || 0) + 1;
    await supabase.from('comunidad_comentarios_likes').insert([
      { comentario_id: comentarioId, usuario_id: usuario.id }
    ]);
  }
}

import { afterUpdate } from 'svelte';

onMount(() => {
  if (mostrar) {
    cargarComentarios();
  }
});

// Cargar comentarios cada vez que mostrar cambia a true
let mostrarAnterior = mostrar;
let autoFocusAnterior = autoFocusInput;
afterUpdate(() => {
  // Si mostrar cambia a true, recarga comentarios
  if (mostrar && !mostrarAnterior) {
    cargarComentarios();
  }
  mostrarAnterior = mostrar;

  // Si autoFocusInput cambia a true, enfoca el input
  if (autoFocusInput && !autoFocusAnterior && inputComentarioEl) {
    inputComentarioEl.focus();
  }
  autoFocusAnterior = autoFocusInput;
});

function manejarTeclaPresionada(evento: KeyboardEvent) {
  if (evento.key === 'Enter' && !evento.shiftKey) {
    evento.preventDefault();
    enviarComentario();
  }
}

function formatearFecha(fechaISO: string): string {
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const diferencia = ahora.getTime() - fecha.getTime();
  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `${minutos}m`;
  if (horas < 24) return `${horas}h`;
  if (dias < 7) return `${dias}d`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
</script>

<section class="seccion-comentarios" class:visible={mostrar}>
  {#if mostrar}
    <!-- Encabezado de comentarios -->
    <header class="encabezado-comentarios">
      <div class="titulo-comentarios">
        <svg class="icono-comentarios" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.89 2 2 2h14l4 4-.01-18z"/>
        </svg>
        <span>Comentarios</span>
        <span class="contador-comentarios">{comentarios.length}</span>
      </div>
    </header>

    <!-- Lista de comentarios -->
    <div class="contenedor-lista-comentarios">
      {#if cargandoComentarios}
        <div class="estado-carga">
          <div class="spinner-carga"></div>
          <span>Cargando comentarios...</span>
        </div>
      {:else if comentarios.length === 0}
        <div class="estado-vacio">
          <svg class="icono-vacio" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 13.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
          </svg>
          <p>Sé el primero en comentar</p>
          <p class="subtexto-vacio">¡Comparte tu opinión sobre esta publicación!</p>
    </div>
      {:else}
        <div class="lista-comentarios">
          {#each comentarios as comentario (comentario.id)}
            <article class="elemento-comentario" data-comentario-id={comentario.id}>
              <div class="avatar-comentario">
                <img 
                  class="imagen-avatar" 
                  src={comentario.usuario_avatar && comentario.usuario_avatar !== '' 
                    ? comentario.usuario_avatar 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(comentario.usuario_nombre || 'Usuario')}&background=667eea&color=fff`
                  } 
                  alt={comentario.usuario_nombre}
                  loading="lazy"
                />
                <div class="indicador-actividad"></div>
              </div>
              
              <div class="contenido-comentario">
                <div class="burbuja-comentario">
                  <div class="cabecera-comentario">
                    <h4 class="nombre-autor">{comentario.usuario_nombre}</h4>
                    <time class="tiempo-comentario" datetime={comentario.fecha_creacion}>
                      {formatearFecha(comentario.fecha_creacion)}
                    </time>
                  </div>
                  <p class="texto-comentario">{comentario.comentario}</p>
                </div>
                
              <div class="acciones-comentario">
                <button
                    class="boton-me-gusta-comentario"
                    class:activo={usuarioLikeComentarios[comentario.id]}
                    on:click={() => alternarLikeComentario(comentario.id)}
                    title={usuarioLikeComentarios[comentario.id] ? 'Quitar me gusta' : 'Me gusta'}
                    aria-label={usuarioLikeComentarios[comentario.id] ? 'Quitar me gusta' : 'Me gusta'}
                >
                    <svg class="icono-me-gusta" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                    <span class="contador-likes">{likesComentarios[comentario.id] || 0}</span>
                  </button>
                  
                  <button class="boton-responder" aria-label="Responder comentario">
                    <svg class="icono-responder" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                    </svg>
                    <span>Responder</span>
                </button>
              </div>
            </div>
            </article>
          {/each}
          </div>
      {/if}
    </div>
  {/if}

  <!-- Formulario para nuevo comentario -->
  {#if usuario}
    <div class="formulario-comentario">
      <!-- Mostrar mensaje de error si existe -->
      {#if errorMensaje}
        <div class="mensaje-error">
          <svg class="icono-error" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{errorMensaje}</span>
          <button class="cerrar-error" on:click={() => errorMensaje = ''}>×</button>
        </div>
      {/if}
      
      <div class="contenedor-avatar-usuario">
        <img 
          class="avatar-usuario-actual" 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || '')}&background=667eea&color=fff`} 
          alt={usuario?.nombre}
        />
      </div>
      
      <div class="contenedor-input-comentario">
        <div class="input-wrapper">
      <input
        class="input-comentario"
        placeholder="Escribe un comentario..."
            bind:value={textoComentario}
        bind:this={inputComentarioEl}
            on:keydown={manejarTeclaPresionada}
            maxlength={500}
            disabled={cargandoEnvio}
            aria-label="Escribir comentario"
          />
          <div class="contador-caracteres">
            <span class="caracteres-usados" class:limite-cercano={textoComentario.length > 400}>
              {textoComentario.length}/500
            </span>
          </div>
        </div>
        
        <div class="acciones-formulario">
          <button 
            class="boton-enviar-comentario" 
            on:click={enviarComentario} 
            disabled={!textoComentario.trim() || cargandoEnvio}
            aria-label="Enviar comentario"
          >
            {#if cargandoEnvio}
              <div class="spinner-envio"></div>
            {:else}
              <svg class="icono-enviar" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            {/if}
            <span class="texto-boton">
              {cargandoEnvio ? 'Enviando...' : 'Enviar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  /* Variables CSS para consistencia */
  :root {
    --color-primario: #667eea;
    --color-secundario: #764ba2;
    --color-texto-principal: #1a202c;
    --color-texto-secundario: #718096;
    --color-fondo: #f8fafc;
    --color-fondo-comentario: #ffffff;
    --color-borde: #e2e8f0;
    --color-hover: #edf2f7;
    --color-exito: #48bb78;
    --color-error: #f56565;
    --color-advertencia: #ed8936;
    --radio-borde: 12px;
    --radio-borde-pequeno: 8px;
    --sombra-sutil: 0 1px 3px rgba(0, 0, 0, 0.1);
    --sombra-comentario: 0 2px 8px rgba(0, 0, 0, 0.08);
    --sombra-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
    --transicion-suave: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transicion-rapida: all 0.15s ease-out;
}

  /* Sección principal */
  .seccion-comentarios {
    background: var(--color-fondo);
    border-radius: 0 0 var(--radio-borde) var(--radio-borde);
    overflow: hidden;
    transition: var(--transicion-suave);
    margin-top: 0.5rem;
  }

  .seccion-comentarios.visible {
    border-top: 1px solid var(--color-borde);
  }

  /* Encabezado */
  .encabezado-comentarios {
    padding: 1rem 1.5rem 0.75rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03));
    border-bottom: 1px solid var(--color-borde);
  }

  .titulo-comentarios {
  display: flex;
  align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--color-texto-principal);
}

  .icono-comentarios {
    width: 20px;
    height: 20px;
    color: var(--color-primario);
  }

  .contador-comentarios {
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    min-width: 24px;
    text-align: center;
    box-shadow: var(--sombra-sutil);
}

  /* Estados de carga y vacío */
  .estado-carga,
  .estado-vacio {
  display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    text-align: center;
    color: var(--color-texto-secundario);
}

  .spinner-carga {
  width: 32px;
  height: 32px;
    border: 3px solid var(--color-borde);
    border-top: 3px solid var(--color-primario);
    border-radius: 50%;
    animation: girar 1s linear infinite;
    margin-bottom: 1rem;
  }

  .icono-vacio {
    width: 48px;
    height: 48px;
    color: var(--color-borde);
    margin-bottom: 1rem;
  }

  .estado-vacio p {
    margin: 0.5rem 0;
    font-weight: 600;
    color: var(--color-texto-principal);
  }

  .subtexto-vacio {
    font-size: 0.9rem;
    color: var(--color-texto-secundario) !important;
  }

  /* Lista de comentarios */
  .contenedor-lista-comentarios {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-borde) transparent;
  }

  .contenedor-lista-comentarios::-webkit-scrollbar {
    width: 6px;
  }

  .contenedor-lista-comentarios::-webkit-scrollbar-track {
    background: transparent;
  }

  .contenedor-lista-comentarios::-webkit-scrollbar-thumb {
    background: var(--color-borde);
    border-radius: 10px;
  }

  .contenedor-lista-comentarios::-webkit-scrollbar-thumb:hover {
    background: var(--color-texto-secundario);
  }

  .lista-comentarios {
    padding: 1rem 1.5rem 0.5rem;
  }

  /* Elemento de comentario */
  .elemento-comentario {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    animation: aparecerComentario 0.4s ease-out;
  }

  @keyframes aparecerComentario {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .avatar-comentario {
    position: relative;
    flex-shrink: 0;
  }

  .imagen-avatar {
    width: 40px;
    height: 40px;
  border-radius: 50%;
  object-fit: cover;
    border: 2px solid #ffffff;
    box-shadow: var(--sombra-sutil);
    transition: var(--transicion-suave);
  }

  .imagen-avatar:hover {
    transform: scale(1.05);
    box-shadow: var(--sombra-comentario);
  }

  .indicador-actividad {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: var(--color-exito);
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: var(--sombra-sutil);
  }

  /* Contenido del comentario */
  .contenido-comentario {
    flex: 1;
  min-width: 0;
  }

  .burbuja-comentario {
    background: var(--color-fondo-comentario);
    border-radius: var(--radio-borde);
    padding: 0.875rem 1rem;
    box-shadow: var(--sombra-comentario);
    border: 1px solid var(--color-borde);
    position: relative;
    transition: var(--transicion-suave);
}

  .burbuja-comentario:hover {
    box-shadow: var(--sombra-hover);
    transform: translateY(-1px);
  }

  .burbuja-comentario::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 12px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid var(--color-fondo-comentario);
    filter: drop-shadow(-1px 0 1px rgba(0, 0, 0, 0.05));
  }

  .cabecera-comentario {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .nombre-autor {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-texto-principal);
    margin: 0;
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tiempo-comentario {
    font-size: 0.8rem;
    color: var(--color-texto-secundario);
    font-weight: 500;
  }

  .texto-comentario {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-texto-principal);
    word-wrap: break-word;
  }

  /* Acciones del comentario */
.acciones-comentario {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
    padding-left: 1rem;
}

  .boton-me-gusta-comentario,
  .boton-responder {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
  border: none;
    color: var(--color-texto-secundario);
    font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
    padding: 0.375rem 0.5rem;
    border-radius: var(--radio-borde-pequeno);
    transition: var(--transicion-rapida);
  }

  .boton-me-gusta-comentario:hover,
  .boton-responder:hover {
    background: var(--color-hover);
    color: var(--color-primario);
    transform: scale(1.05);
}

  .boton-me-gusta-comentario.activo {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    color: var(--color-primario);
    box-shadow: var(--sombra-sutil);
  }

  .icono-me-gusta,
  .icono-responder {
    width: 16px;
    height: 16px;
    transition: var(--transicion-rapida);
}

  .boton-me-gusta-comentario:hover .icono-me-gusta,
  .boton-responder:hover .icono-responder {
    transform: scale(1.1);
  }

  .contador-likes {
    font-weight: 700;
    min-width: 16px;
    text-align: center;
  }

  /* Formulario de comentario */
  .formulario-comentario {
  display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.25rem;
    background: var(--color-fondo-comentario);
    border-top: 1px solid var(--color-borde);
}

  .contenedor-avatar-usuario {
    flex-shrink: 0;
  }

  .avatar-usuario-actual {
    width: 40px;
    height: 40px;
  border-radius: 50%;
  object-fit: cover;
    border: 2px solid #ffffff;
    box-shadow: var(--sombra-sutil);
  }

  .contenedor-input-comentario {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-wrapper {
    position: relative;
  }

.input-comentario {
    width: 100%;
    border: 2px solid var(--color-borde);
    border-radius: 24px;
    padding: 0.875rem 1.25rem;
    font-size: 0.95rem;
    background: #ffffff;
  outline: none;
    transition: var(--transicion-suave);
    color: var(--color-texto-principal);
    resize: none;
}

.input-comentario::placeholder {
    color: var(--color-texto-secundario);
    font-weight: 500;
  }

  .input-comentario:focus {
    border-color: var(--color-primario);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background: #ffffff;
}

  .input-comentario:disabled {
    background: var(--color-hover);
    color: var(--color-texto-secundario);
  cursor: not-allowed;
}

  .contador-caracteres {
    position: absolute;
    bottom: -24px;
    right: 0;
    font-size: 0.75rem;
    color: var(--color-texto-secundario);
  }

  .caracteres-usados.limite-cercano {
    color: var(--color-advertencia);
    font-weight: 600;
}

  .acciones-formulario {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.75rem;
}

  .boton-enviar-comentario {
  display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: #ffffff;
    border: none;
    border-radius: 24px;
    padding: 0.75rem 1.5rem;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transicion-suave);
    box-shadow: var(--sombra-comentario);
    position: relative;
    overflow: hidden;
}

  .boton-enviar-comentario::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .boton-enviar-comentario:hover::before {
    left: 100%;
  }

  .boton-enviar-comentario:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: var(--sombra-hover);
}

  .boton-enviar-comentario:disabled {
    background: var(--color-borde);
    color: var(--color-texto-secundario);
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--sombra-sutil);
  }

  .icono-enviar {
    width: 18px;
    height: 18px;
    transition: var(--transicion-rapida);
}

  .boton-enviar-comentario:hover .icono-enviar {
    transform: scale(1.1) rotate(15deg);
  }

  .spinner-envio {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: girar 1s linear infinite;
  }

  .texto-boton {
    font-weight: 700;
    letter-spacing: 0.025em;
  }

  /* === MENSAJE DE ERROR === */
  .mensaje-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }

  .icono-error {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .cerrar-error {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    margin-left: auto;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .cerrar-error:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  /* === RESPONSIVE === */
  @media (max-width: 768px) {
    .encabezado-comentarios {
      padding: 0.875rem 1rem 0.625rem;
    }

    .titulo-comentarios {
      font-size: 1rem;
    }

    .lista-comentarios {
      padding: 0.875rem 1rem 0.5rem;
    }

    .elemento-comentario {
      gap: 0.625rem;
      margin-bottom: 1rem;
    }

    .imagen-avatar,
    .avatar-usuario-actual {
      width: 36px;
      height: 36px;
    }

    .burbuja-comentario {
      padding: 0.75rem 0.875rem;
}

    .formulario-comentario {
      padding: 0.875rem 1rem 1rem;
      gap: 0.625rem;
    }

.input-comentario {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }

    .boton-enviar-comentario {
      padding: 0.625rem 1.25rem;
      font-size: 0.85rem;
    }
  }

  @media (max-width: 480px) {
    .encabezado-comentarios {
      padding: 0.75rem 0.875rem 0.5rem;
}

    .lista-comentarios {
      padding: 0.75rem 0.875rem 0.5rem;
    }

    .formulario-comentario {
      padding: 0.75rem 0.875rem 0.875rem;
    }

    .texto-boton {
      display: none;
    }

    .boton-enviar-comentario {
      padding: 0.75rem;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      justify-content: center;
    }

    .contador-caracteres {
      position: static;
      margin-top: 0.25rem;
      text-align: right;
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

  /* Tema oscuro */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-texto-principal: #f7fafc;
      --color-texto-secundario: #a0aec0;
      --color-fondo: #2d3748;
      --color-fondo-comentario: #4a5568;
      --color-borde: #718096;
      --color-hover: #718096;
    }
}
</style>
