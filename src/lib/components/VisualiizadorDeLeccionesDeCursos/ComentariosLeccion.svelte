<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import ComentarioItem from './ComentarioItem.svelte';
  export let leccionId: string;
  export let usuarioActual: any = null; // { id, nombre }
  export let tipo: 'leccion' | 'clase' = 'leccion'; // 'leccion' para cursos, 'clase' para tutoriales
  // Si tipo === 'clase', usaremos la tabla comentarios_clases y el campo clase_id

  let comentarios: any[] = [];
  let respuestasPorComentario: Record<string, any[]> = {}; // Para mapear respuestas a cada comentario
  let comentariosPrincipales: any[] = []; // Comentarios raíz
  let nuevoComentario = '';
  let cargando = false;
  let error = '';
  let respuestaA: string | null = null; // ID del comentario al que se responde
  let respuestas: Record<string, string> = {}; // { [comentarioId]: textoRespuesta }
  let mostrandoFormularioRespuesta: Record<string, boolean> = {}; // { [comentarioId]: bool }
  let likeCargando: Record<string, boolean> = {};
  let comentariosMostrados = 5;

  // Cargar todos los comentarios y respuestas
  async function cargarComentarios() {
    cargando = true;
    error = '';
    // Usar la tabla y campo correcto según tipo
    const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones';
    const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id';
    const { data, error: err } = await supabase
      .from(tabla)
      .select(`id, contenido, fecha_creacion, usuario_id, respuesta_a, likes, perfiles:usuario_id (nombre_usuario, nombre_completo, url_foto_perfil)`)
      .eq(campoId, leccionId)
      .order('fecha_creacion', { ascending: false });
    if (err) {
      error = err.message || 'Error al cargar comentarios';
      comentarios = [];
    } else {
      comentarios = data || [];
    }
    cargando = false;
  }

  // Nuevo comentario principal
  async function agregarComentario() {
    if (!nuevoComentario.trim()) return;
    cargando = true;
    error = '';
    if (!leccionId || typeof leccionId !== 'string' || leccionId.length < 10) {
      error = 'ID de lección inválido.';
      cargando = false;
      return;
    }
    if (!usuarioActual || !usuarioActual.id || typeof usuarioActual.id !== 'string' || usuarioActual.id.length < 10) {
      error = 'Usuario no válido. Debes iniciar sesión.';
      cargando = false;
      return;
    }
    const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones';
    const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id';
    const { error: err } = await supabase
      .from(tabla)
      .insert({
        [campoId]: leccionId,
        usuario_id: usuarioActual.id,
        contenido: nuevoComentario,
        respuesta_a: null
      });
    if (err) {
      error = err.message || 'Error agregando comentario';
    } else {
      nuevoComentario = '';
      await cargarComentarios();
    }
    cargando = false;
  }

  // Responder a un comentario
  async function responderComentario(parentId: string) {
    const textoRespuesta = respuestas[parentId]?.trim();
    if (!textoRespuesta) return;
    mostrandoFormularioRespuesta[parentId] = false;
    cargando = true;
    error = '';
    const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones';
    const campoId = tipo === 'clase' ? 'clase_id' : 'leccion_id';
    const { error: err } = await supabase
      .from(tabla)
      .insert({
        [campoId]: leccionId,
        usuario_id: usuarioActual.id,
        contenido: textoRespuesta,
        respuesta_a: parentId
      });
    if (err) {
      error = err.message || 'Error agregando respuesta';
    } else {
      respuestas[parentId] = '';
      await cargarComentarios();
    }
    cargando = false;
  }

  // Like a comentario
  async function darLike(comentarioId: string, likesActuales: number) {
    likeCargando[comentarioId] = true;
    const tabla = tipo === 'clase' ? 'comentarios_clases' : 'comentarios_lecciones';
    const { error: err } = await supabase
      .from(tabla)
      .update({ likes: likesActuales + 1 })
      .eq('id', comentarioId);
    likeCargando[comentarioId] = false;
    if (err) {
      error = err.message || 'Error al dar like';
    } else {
      await cargarComentarios();
    }
  }

  // Helpers para separar comentarios principales y respuestas
  $: respuestasPorComentario = {} as Record<string, any[]>;
  // Reactivo: recalcula respuestasPorComentario y comentariosPrincipales cuando cambie comentarios
  $: {
    respuestasPorComentario = {};
    comentarios.forEach(c => {
      if (c.respuesta_a) {
        if (!respuestasPorComentario[c.respuesta_a]) respuestasPorComentario[c.respuesta_a] = [];
        respuestasPorComentario[c.respuesta_a].push(c);
      }
    });
    comentariosPrincipales = comentarios.filter(c => !c.respuesta_a);
  }

  // --- Elimina renderComentario. Usaremos bloques recursivos Svelte ---
  onMount(cargarComentarios);
</script>

<div class="comentarios-leccion-box">
  <div class="comentarios-header">
    <span class="comentarios-count">{comentarios.length} comentarios</span>
    <button class="comentarios-close" aria-label="Cerrar sección de comentarios" title="Cerrar comentarios" role="button">×</button>
  </div>
  <div class="comentarios-lista-box">
    {#if cargando}
      <p class="comentarios-loading">Cargando comentarios...</p>
    {:else if error}
      <p class="comentarios-error">{error}</p>
    {:else if comentariosPrincipales.length === 0}
      <p class="comentarios-empty">No hay comentarios aún.</p>
    {:else}
      <ul class="comentarios-lista">
        {#each comentariosPrincipales.slice(0, comentariosMostrados) as c}
          <ComentarioItem
            comentario={c}
            {respuestasPorComentario}
            nivel={0}
            {usuarioActual}
            {mostrandoFormularioRespuesta}
            {respuestas}
            {cargando}
            {responderComentario}
            {darLike}
            {likeCargando}
          />
        {/each}
      </ul>
      {#if comentariosPrincipales.length > comentariosMostrados}
        <button class="comentarios-ver-mas" on:click={() => comentariosMostrados += 5}>Ver más comentarios</button>
      {/if}
    {/if}
  </div>
  {#if usuarioActual}
    <form on:submit|preventDefault={agregarComentario} class="comentario-form-bar">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual?.nombre || 'Usuario')}&background=667eea&color=fff`} alt="avatar" class="comentario-form-avatar" />
      <input
        class="comentario-form-input"
        type="text"
        bind:value={nuevoComentario}
        placeholder="Agregar comentario..."
        maxlength={500}
      />
      <button type="submit" disabled={cargando || !nuevoComentario.trim()} class="comentario-form-btn" aria-label="Enviar comentario" title="Enviar comentario" role="button">Enviar</button>
    </form>
  {/if}
</div>

<style>
.comentarios-leccion-box {
  background: #fff;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 2px 8px #0001;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}
.comentarios-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 10px 18px;
  border-bottom: 1px solid #eee;
  background: #fafbfc;
}
.comentarios-count {
  font-weight: 600;
  font-size: 1.07rem;
}
.comentarios-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
}
.comentarios-lista-box {
  flex: 1 1 auto;
  overflow-y: auto;
  width: 100%;
  padding: 16px 16px 90px 16px;
  box-sizing: border-box;
  background: #fff;
  min-height: 0;
}
.comentarios-lista {
  list-style: none;
  padding: 0;
  margin: 0;
}
.comentarios-loading,
.comentarios-error,
.comentarios-empty {
  color: #888;
  text-align: center;
  margin: 40px 0;
}
.comentario-form-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fafbfc;
  border-top: 1px solid #eee;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.comentario-form-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}
.comentario-form-input {
  flex: 1 1 auto;
  border: none;
  background: #f2f3f5;
  border-radius: 18px;
  padding: 8px 14px;
  font-size: 1rem;
  outline: none;
}
.comentario-form-btn {
  background: #ff0050;
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 6px 16px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.comentario-form-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comentarios-leccion {
  margin-top: 24px;
}
.comentario-form, .respuesta-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.comentario-form textarea, .respuesta-form textarea {
  resize: vertical;
  border-radius: 5px;
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 15px;
}
.comentario-form button, .respuesta-form button {
  align-self: flex-end;
  background: #e63946;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.comentario-form button:disabled, .respuesta-form button:disabled {
  background: #aaa;
  cursor: not-allowed;
}
.comentarios-lista, .respuestas-lista {
  list-style: none;
  padding: 0;
  margin: 0;
}
.comentario-item {
  background: #fff;
  border-radius: 5px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.respuesta-item {
  background: #f7f7f7;
  margin-left: 32px;
  margin-top: 4px;
  margin-bottom: 4px;
}
.comentario-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}
.nombre {
  font-weight: 600;
}
.fecha {
  margin-left: auto;
  color: #888;
  font-size: 13px;
}
.comentario-contenido {
  font-size: 15px;
  margin-top: 2px;
  white-space: pre-line;
}
.like-btn {
  background: none;
  border: none;
  color: #e63946;
  font-size: 16px;
  margin-left: 8px;
  cursor: pointer;
  transition: color 0.2s;
}
.like-btn:disabled {
  color: #aaa;
  cursor: not-allowed;
}
.responder-btn {
  background: none;
  border: none;
  color: #0077cc;
  font-size: 14px;
  margin-left: 8px;
  cursor: pointer;
  transition: color 0.2s;
}
.responder-btn:hover {
  text-decoration: underline;
}
.error {
  color: #e63946;
  font-weight: 500;
}
</style>

