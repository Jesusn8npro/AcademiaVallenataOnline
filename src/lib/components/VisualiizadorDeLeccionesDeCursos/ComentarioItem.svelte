<script lang="ts">
  // Componente recursivo para mostrar comentarios y respuestas
  import ComentarioItem from './ComentarioItem.svelte';

  // Define la interfaz para un comentario
  export interface Comentario {
    id: string;
    contenido: string;
    fecha_creacion: string;
    likes: number;
    profiles?: {
      avatar_url?: string;
      nickname?: string;
    };
    // Puedes agregar más campos según tu modelo real
  }

  export let comentario: Comentario;
  export let respuestasPorComentario: Record<string, Comentario[]>;
  export let nivel: number = 0;
  export let usuarioActual: any;
  export let mostrandoFormularioRespuesta: Record<string, boolean>;
  export let respuestas: Record<string, string>;
  export let cargando: boolean;
  export let responderComentario: (id: string) => void;
  export let darLike: (id: string, likes: number) => void;
  export let likeCargando: Record<string, boolean>;
  // (Todos los props son usados, solo se ordenan y se añade comentario explicativo)

</script>

<li class="comentario-card {nivel > 0 ? 'respuesta' : ''}">
  <div class="comentario-row">
    <img src={comentario.profiles?.avatar_url || '/default-avatar.png'} alt="avatar" class="comentario-avatar" />
    <div class="comentario-main">
      <div class="comentario-header">
        <span class="comentario-nombre">{comentario.profiles?.nickname || 'Usuario'}</span>
        <span class="comentario-fecha">{new Date(comentario.fecha_creacion).toLocaleString()}</span>
      </div>
      <div class="comentario-contenido">{comentario.contenido}</div>
      <div class="comentario-actions">
        <button class="comentario-like" on:click={() => darLike(comentario.id, comentario.likes)} disabled={likeCargando[comentario.id]} title="Me gusta">
          <span class="icon">❤️</span> <span>{comentario.likes || 0}</span>
        </button>
        {#if usuarioActual}
          <button class="comentario-reply" type="button" on:click={() => mostrandoFormularioRespuesta[comentario.id] = !mostrandoFormularioRespuesta[comentario.id]} aria-label="Responder a este comentario" role="button">
            {mostrandoFormularioRespuesta[comentario.id] ? 'Cancelar' : 'Responder'}
          </button>
        {/if}
        {#if respuestasPorComentario[comentario.id]?.length}
          <span class="comentario-view-replies" on:click={() => mostrandoFormularioRespuesta[comentario.id] = true} tabindex="0" role="button" aria-label="Ver respuestas de este comentario" on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') mostrandoFormularioRespuesta[comentario.id] = true; }}>
            Ver respuestas ({respuestasPorComentario[comentario.id].length})
          </span>
        {/if}
      </div>
      {#if mostrandoFormularioRespuesta[comentario.id]}
        <form class="comentario-respuesta-form" on:submit|preventDefault={() => responderComentario(comentario.id)}>
          <textarea bind:value={respuestas[comentario.id]} placeholder="Escribe una respuesta..." maxlength={500} rows={2}></textarea>
          <button type="submit" disabled={!respuestas[comentario.id] || cargando}>Responder</button>
        </form>
      {/if}
      <!-- Las respuestas siempre se muestran debajo del comentario padre -->
      {#if respuestasPorComentario[comentario.id]?.length}
        <ul class="comentario-respuestas">
          {#each respuestasPorComentario[comentario.id] as r}
            <ComentarioItem
              comentario={r}
              respuestasPorComentario={respuestasPorComentario}
              nivel={nivel + 1}
              usuarioActual={usuarioActual}
              mostrandoFormularioRespuesta={mostrandoFormularioRespuesta}
              respuestas={respuestas}
              cargando={cargando}
              responderComentario={responderComentario}
              darLike={darLike}
              likeCargando={likeCargando}
            />
          {/each}
        </ul>
      {/if}
    </div>
    <div class="comentario-like-right">
      <button class="comentario-like" on:click={() => darLike(comentario.id, comentario.likes)} disabled={likeCargando[comentario.id]} title="Me gusta">
        <span class="icon">❤️</span><br />
        <span class="count">{comentario.likes || 0}</span>
      </button>
    </div>
  </div>
</li>

<style>
.comentario-card {
  border-radius: 14px;
  box-shadow: 0 1px 4px #0001;
  margin-bottom: 16px;
  padding: 14px 18px 10px 14px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 4px solid transparent;
}
.comentario-card.respuesta {
  background: #f9fafb;
  border-left: 4px solid #ff9800;
  margin-left: 38px;
  margin-top: 8px;
}

.comentario-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.comentario-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
  border: 1.5px solid #eee;
}
.comentario-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}
.comentario-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
}
.comentario-nombre {
  font-weight: 700;
  font-size: 1.04rem;
  margin-right: 4px;
}
.comentario-fecha {
  font-size: 0.92rem;
  color: #888;
  font-weight: 400;
}
.comentario-contenido {
  font-size: 1.04rem;
  margin: 2px 0 8px 0;
  color: #222;
  line-height: 1.55;
}
.comentario-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 0;
  margin-top: 2px;
}
.comentario-like {
  background: none;
  border: none;
  color: #ff0050;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}
.comentario-like:disabled {
  color: #ccc;
  cursor: not-allowed;
}
.comentario-like-right {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.comentario-reply {
  background: none;
  border: none;
  color: #007aff;
  font-size: 0.96rem;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}
.comentario-reply:hover {
  color: #005bb5;
}
.comentario-view-replies {
  color: #888;
  font-size: 0.93rem;
  cursor: pointer;
  margin-left: 3px;
  text-decoration: underline;
}
.comentario-respuesta-form {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.comentario-respuesta-form textarea {
  border-radius: 10px;
  border: 1px solid #eee;
  padding: 6px 10px;
  font-size: 1rem;
  resize: vertical;
  min-height: 38px;
}
.comentario-respuesta-form button {
  align-self: flex-end;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 5px 18px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.comentario-respuesta-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.comentario-respuestas {
  margin-top: 2px;
  margin-left: 0;
  padding-left: 0;
  border-left: none;
  list-style: none;
  padding-bottom: 2px;
}

</style>
