<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { fade } from 'svelte/transition';
  export let leccionId: string = '';
  export let usuarioActual: any = null; // { id }
  export let tipo: 'leccion' | 'clase' = 'leccion';

  let nuevaNota = '';
  let notas: any[] = [];
  let cargando = true;
  let guardando = false;
  let mensaje: string | null = null;
  let error: string | null = null;
  let editandoId: string | null = null;
  let editandoContenido: string = '';
  let editandoGuardando = false;
  let eliminandoId: string | null = null;
  let eliminandoGuardando = false;

  async function cargarNotas() {
    cargando = true;
    error = null;
    mensaje = null;
    try {
      if (!usuarioActual?.id) {
        notas = [];
        cargando = false;
        return;
      }
      const { data, error: err } = await supabase
        .from('notas_lecciones')
        .select('*')
        .eq('usuario_id', usuarioActual.id)
        .eq('leccion_id', leccionId)
        .eq('tipo', tipo)
        .order('fecha_creacion', { ascending: false });
      if (err) throw err;
      notas = data || [];
    } catch (e: any) {
      error = 'No se pudieron cargar tus notas. Intenta de nuevo.';
    } finally {
      cargando = false;
    }
  }

  async function guardarNota() {
    guardando = true;
    error = null;
    mensaje = null;
    try {
      if (!usuarioActual?.id) throw new Error('Debes iniciar sesión para guardar notas.');
      if (!nuevaNota.trim()) throw new Error('La nota no puede estar vacía.');
      const { error: err } = await supabase
        .from('notas_lecciones')
        .insert({
          usuario_id: usuarioActual.id,
          leccion_id: leccionId,
          tipo,
          contenido: nuevaNota,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString()
        });
      if (err) throw err;
      mensaje = '¡Nota agregada!';
      nuevaNota = '';
      await cargarNotas();
    } catch (e: any) {
      error = e.message || 'No se pudo guardar la nota.';
    } finally {
      guardando = false;
      setTimeout(() => (mensaje = null), 2000);
    }
  }

  async function guardarEdicionNota() {
    if (!editandoId) return;
    editandoGuardando = true;
    error = null;
    mensaje = null;
    try {
      if (!usuarioActual?.id) throw new Error('Debes iniciar sesión para editar notas.');
      if (!editandoContenido.trim()) throw new Error('La nota no puede estar vacía.');
      const { error: err } = await supabase
        .from('notas_lecciones')
        .update({ contenido: editandoContenido, fecha_actualizacion: new Date().toISOString() })
        .eq('id', editandoId);
      if (err) throw err;
      mensaje = '¡Nota actualizada!';
      editandoId = null;
      editandoContenido = '';
      await cargarNotas();
    } catch (e: any) {
      error = e.message || 'No se pudo editar la nota.';
    } finally {
      editandoGuardando = false;
      setTimeout(() => (mensaje = null), 2000);
    }
  }

  async function eliminarNota(id: string) {
    eliminandoId = id;
    eliminandoGuardando = true;
    error = null;
    mensaje = null;
    try {
      const { error: err } = await supabase
        .from('notas_lecciones')
        .delete()
        .eq('id', id);
      if (err) throw err;
      mensaje = '¡Nota eliminada!';
      await cargarNotas();
    } catch (e: any) {
      error = e.message || 'No se pudo eliminar la nota.';
    } finally {
      eliminandoId = null;
      eliminandoGuardando = false;
      setTimeout(() => (mensaje = null), 2000);
    }
  }

  $: if (leccionId && usuarioActual?.id) cargarNotas();
</script>

<div class="notas-leccion-container" in:fade={{ duration: 200 }}>
  <h2>Mis notas personales</h2>
  {#if cargando}
    <div class="notas-cargando">Cargando...</div>
  {:else}
    <div class="notas-grid">
      <div class="notas-edicion">
        <textarea
          class="notas-textarea"
          placeholder="Escribe una nueva nota para esta lección o clase..."
          bind:value={nuevaNota}
          rows={4}
          disabled={guardando}
        ></textarea>
        <button class="notas-btn" on:click={guardarNota} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar nota'}
        </button>
        {#if mensaje}
          <div class="notas-mensaje exito" in:fade>{mensaje}</div>
        {/if}
        {#if error}
          <div class="notas-mensaje error" in:fade>{error}</div>
        {/if}
      </div>
      <div class="notas-preview">
        <div class="notas-preview-title">Notas guardadas</div>
        {#if notas.length === 0}
          <div class="notas-preview-content">No tienes notas guardadas para esta lección.</div>
        {:else}
          <ul class="notas-lista">
            {#each notas as nota}
              <li class="nota-item">
                {#if editandoId === nota.id}
                  <textarea class="notas-textarea-edit" bind:value={editandoContenido} rows={3} disabled={editandoGuardando}></textarea>
                  <div class="notas-acciones">
                    <button class="notas-btn-accion" on:click={guardarEdicionNota} disabled={editandoGuardando}>Guardar</button>
                    <button class="notas-btn-accion notas-btn-cancelar" on:click={() => { editandoId = null; editandoContenido = ''; }} disabled={editandoGuardando}>Cancelar</button>
                  </div>
                {:else}
                  <div class="nota-contenido">{nota.contenido}</div>
                  <div class="nota-fecha">{new Date(nota.fecha_actualizacion).toLocaleString()}</div>
                  <div class="notas-acciones">
                    <button class="notas-btn-accion" on:click={() => { editandoId = nota.id; editandoContenido = nota.contenido; }}>Editar</button>
                    <button class="notas-btn-accion notas-btn-eliminar" on:click={() => eliminarNota(nota.id)} disabled={eliminandoId === nota.id && eliminandoGuardando}>Eliminar</button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
.notas-leccion-container {
  background: #faf8f6;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 #0001;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  margin: 0 auto 1.5rem auto;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.notas-grid {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.notas-edicion {
  flex: 2 1 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.notas-preview {
  flex: 1 1 240px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 6px #7c3aed11;
  padding: 1rem 1rem 0.5rem 1rem;
  margin-top: 0.5rem;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}
.notas-preview-title {
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
}
.notas-preview-content {
  color: #222;
  font-size: 1rem;
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
}
.notas-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}
.nota-item {
  background: #f3f0ff;
  border-radius: 8px;
  box-shadow: 0 1px 4px #7c3aed14;
  margin-bottom: 1rem;
  padding: 0.8rem 1rem 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
}
.nota-contenido {
  font-size: 1rem;
  color: #222;
  white-space: pre-wrap;
}
.nota-fecha {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.2rem;
}
.notas-acciones {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.2rem;
}
.notas-btn-accion {
  background: #ede9fe;
  color: #7c3aed;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.notas-btn-accion:hover {
  background: #d1c4e9;
}
.notas-btn-eliminar {
  background: #fee2e2;
  color: #ef4444;
}
.notas-btn-eliminar:hover {
  background: #fecaca;
}
.notas-btn-cancelar {
  background: #f3f4f6;
  color: #444;
}
.notas-textarea-edit {
  width: 100%;
  min-height: 60px;
  border-radius: 7px;
  border: 1.2px solid #e0e0e0;
  padding: 0.6rem;
  font-size: 1rem;
  margin-bottom: 0.3rem;
  background: #fff;
  color: #222;
  resize: vertical;
  transition: border-color 0.2s;
}
.notas-textarea-edit:focus {
  outline: none;
  border-color: #7c3aed;
}

.notas-preview-fecha {
  font-size: 0.85rem;
  color: #888;
  margin-top: auto;
}
@media (max-width: 900px) {
  .notas-grid {
    flex-direction: column;
    gap: 1rem;
  }
  .notas-edicion, .notas-preview {
    width: 100%;
    min-width: unset;
  }
  .notas-leccion-container {
    max-width: 98vw;
    padding: 1rem 0.5rem 1rem 0.5rem;
  }
}

.notas-leccion-container h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 1rem;
}
.notas-textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 8px;
  border: 1.5px solid #e0e0e0;
  padding: 1rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  background: #fff;
  color: #222;
  resize: vertical;
  transition: border-color 0.2s;
}
.notas-textarea:focus {
  outline: none;
  border-color: #7c3aed;
}
.notas-btn {
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
  color: #fff;
  font-weight: 600;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px #7c3aed22;
}
.notas-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.notas-mensaje {
  margin-top: 0.7rem;
  font-size: 1rem;
  text-align: center;
}
.notas-mensaje.exito {
  color: #22c55e;
}
.notas-mensaje.error {
  color: #ef4444;
}
.notas-cargando {
  text-align: center;
  color: #7c3aed;
  font-weight: 500;
  padding: 1rem 0;
}
</style>
