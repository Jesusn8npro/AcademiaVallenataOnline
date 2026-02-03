<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let tipo: 'tutorial' | 'curso' = 'tutorial';
  export let datosGenerales = {};
  export let estructura = [];
  const dispatch = createEventDispatcher();

  // Drag & drop con svelte-dnd-action
  let modulos = tipo === 'curso' ? (estructura.length ? estructura : [{
    titulo: '',
    descripcion: '',
    orden: 1,
    lecciones: []
  }]) : [];
  let partes = tipo === 'tutorial' ? (estructura.length ? estructura : [{
    titulo: '',
    descripcion: '',
    tipo_parte: '',
    video_url: '',
    orden: 1
  }]) : [];

  // Añadir módulo o parte
  function agregarModulo() {
    modulos = [...modulos, { titulo: '', descripcion: '', orden: modulos.length+1, lecciones: [] }];
  }
  function agregarParte() {
    partes = [...partes, { titulo: '', descripcion: '', tipo_parte: '', video_url: '', orden: partes.length+1 }];
  }
  // Añadir lección a módulo
  function agregarLeccion(idxModulo) {
    modulos[idxModulo].lecciones = [
      ...(modulos[idxModulo].lecciones || []),
      { titulo: '', descripcion: '', video_url: '', tipo_contenido: '', orden: (modulos[idxModulo].lecciones?.length||0)+1 }
    ];
    modulos = [...modulos];
  }

  // Drag & drop básico (puedes mejorar con svelte-dnd-action)
  function moverModulo(from, to) {
    const m = modulos.splice(from, 1)[0];
    modulos.splice(to, 0, m);
    modulos = modulos.map((mod, i) => ({ ...mod, orden: i+1 }));
  }
  // Drag & drop manual para lecciones
  function moverLeccion(idxModulo, from, to) {
    if (from === to || from < 0 || to < 0 || from >= modulos[idxModulo].lecciones.length || to >= modulos[idxModulo].lecciones.length) return;
    const lecciones = [...modulos[idxModulo].lecciones];
    const [moved] = lecciones.splice(from, 1);
    lecciones.splice(to, 0, moved);
    modulos[idxModulo].lecciones = lecciones.map((lec, i) => ({ ...lec, orden: i+1 }));
    modulos = [...modulos];
  }
  function moverParte(from, to) {
    const p = partes.splice(from, 1)[0];
    partes.splice(to, 0, p);
    partes = partes.map((par, i) => ({ ...par, orden: i+1 }));
  }

  // Guardar estructura y continuar
  function continuar() {
    dispatch('continuar', tipo === 'curso' ? modulos : partes);
  }
</script>

{#if tipo === 'curso'}
  <div class="estructura-curso">
    <h2>Módulos y lecciones</h2>
    {#each modulos as modulo, idxModulo}
      <div class="modulo">
        <div class="modulo-header">
          <span class="drag">☰</span>
          <input type="text" bind:value={modulo.titulo} placeholder="Título del módulo" />
          <input type="text" bind:value={modulo.descripcion} placeholder="Descripción" />
          <button on:click={() => agregarLeccion(idxModulo)}>+ Lección</button>
          {#if modulos.length > 1}
            <button on:click={() => { modulos.splice(idxModulo,1); modulos = [...modulos]; }}>Eliminar módulo</button>
          {/if}
        </div>
        <div class="lecciones">
          {#each modulo.lecciones as leccion, idxLeccion}
            <div class="leccion">
              <span class="drag">⋮</span>
              <input type="text" bind:value={leccion.titulo} placeholder="Título de la lección" />
              <input type="text" bind:value={leccion.descripcion} placeholder="Descripción" />
              {#if leccion.tipo_contenido === 'video'}
                <input type="text" bind:value={leccion.video_url} placeholder="URL de video" class="input-video-url" />
              {/if}
              {#if leccion.tipo_contenido === 'texto'}
                <textarea bind:value={leccion.contenido} placeholder="Escribe el contenido de la lección" rows="2" class="textarea-contenido"></textarea>
              {/if}
              <select bind:value={leccion.tipo_contenido} class="select-tipo-contenido">
                <option value="">Tipo de contenido</option>
                <option value="video">Video</option>
                <option value="quiz">Quiz</option>
                <option value="texto">Texto</option>
              </select>
              {#if modulo.lecciones.length > 1}
                <button on:click={() => { modulo.lecciones.splice(idxLeccion,1); modulos = [...modulos]; }}>Eliminar lección</button>
              {/if}
              {#if idxLeccion > 0}
                <button on:click={() => moverLeccion(idxModulo, idxLeccion, idxLeccion-1)}>↑</button>
              {/if}
              {#if idxLeccion < modulo.lecciones.length-1}
                <button on:click={() => moverLeccion(idxModulo, idxLeccion, idxLeccion+1)}>↓</button>
              {/if}
            </div>
          {/each}
        </div>
        <div class="modulo-mover">
          {#if idxModulo > 0}
            <button on:click={() => moverModulo(idxModulo, idxModulo-1)}>↑ Módulo</button>
          {/if}
          {#if idxModulo < modulos.length-1}
            <button on:click={() => moverModulo(idxModulo, idxModulo+1)}>↓ Módulo</button>
          {/if}
        </div>
      </div>
    {/each}
    <button class="agregar" on:click={agregarModulo}>+ Módulo</button>
    <button class="continuar" on:click={continuar}>Continuar</button>
  </div>
{/if}

{#if tipo === 'tutorial'}
  <div class="estructura-tutorial">
    <h2>Partes del tutorial</h2>
    {#each partes as parte, idxParte}
      <div class="parte">
        <span class="drag">☰</span>
        <!-- Campos comunes -->
        <input type="text" bind:value={parte.titulo} placeholder="Título de la parte" required class="input-parte" aria-label="Título de la parte" />
<input type="text" bind:value={parte.descripcion} placeholder="Descripción corta (opcional)" class="input-parte" aria-label="Descripción corta" />
<input type="number" bind:value={parte.orden} min="1" placeholder="Orden" style="width: 90px;" class="input-parte" aria-label="Orden de la parte" />
<label class="label-visible" style="display:flex;align-items:center;gap:4px;">
  <input type="checkbox" bind:checked={parte.visible} aria-label="Parte visible" /> Visible
</label>

<!-- Selector de tipo de parte -->
<select bind:value={parte.tipo_parte} class="select-tipo-parte" required aria-label="Tipo de parte" title="Selecciona el tipo lógico de la parte">
  <option value="" disabled selected>Tipo de parte</option>
  <option value="introduccion">Introducción</option>
  <option value="pase_intermedio">Pase intermedio</option>
  <option value="pase_final">Pase final</option>
  <option value="acompanamiento">Acompañamiento</option>
  <option value="extra">Extra</option>
</select>

<!-- Selector de tipo de contenido -->
<select bind:value={parte.tipo_contenido} class="select-tipo-contenido" required aria-label="Tipo de contenido" title="Selecciona el formato del contenido">
  <option value="" disabled selected>Tipo de contenido</option>
  <option value="video">Video</option>
  <option value="texto">Texto</option>
  <option value="pdf">PDF</option>
</select>

        {#if parte.tipo_contenido === 'video'}
          <input type="text" bind:value={parte.video_url} placeholder="URL de video" required />
        {/if}
        {#if parte.tipo_contenido === 'texto' || parte.tipo_contenido === 'pdf'}
          <textarea bind:value={parte.contenido} placeholder="Contenido principal (HTML o Markdown)"></textarea>
        {/if}

        {#if partes.length > 1}
  <button class="btn-eliminar" on:click={() => { partes.splice(idxParte,1); partes = [...partes]; }} aria-label="Eliminar parte" title="Eliminar parte">🗑️</button>
{/if}
{#if idxParte > 0}
  <button class="btn-mover" on:click={() => moverParte(idxParte, idxParte-1)} aria-label="Mover arriba" title="Mover arriba">↑</button>
{/if}
{#if idxParte < partes.length-1}
  <button class="btn-mover" on:click={() => moverParte(idxParte, idxParte+1)} aria-label="Mover abajo" title="Mover abajo">↓</button>
{/if}
      </div>
    {/each}
    <button class="agregar" on:click={agregarParte}>+ Parte</button>
    <button class="continuar" on:click={continuar}>Continuar</button>
  </div>
{/if}

<style>
.estructura-curso, .estructura-tutorial {
  max-width: 100%;
  margin: 0 auto;
  margin-bottom: 2rem;
}
.modulo, .parte {
  background: #f8fbff;
  border-radius: 1.5rem;
  box-shadow: 0 4px 24px #1e90ff22, 0 1.5px 6px #0001;
  margin-bottom: 2.2rem;
  padding: 1.7rem 2.2rem 1.5rem 2.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.3rem 2.5rem;
  align-items: flex-end;
  position: relative;
  transition: box-shadow 0.22s, transform 0.18s;
}
.parte:hover {
  box-shadow: 0 8px 32px #1e90ff44, 0 2px 12px #0002;
  transform: translateY(-2px) scale(1.01);
}
.modulo-header, .parte {
  display: flex;
  gap: 1rem;
  align-items: center;
}
@media (max-width: 900px) {
  .parte {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.2rem 0.7rem;
  }
}

.lecciones {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}
.leccion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}
.input-video-url, .select-tipo-contenido, .textarea-contenido {
  min-width: 120px;
  max-width: 350px;
}
.textarea-contenido {
  flex: 2 1 350px;
  min-width: 220px;
  max-width: 600px;
  width: 100%;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 0.7rem;
}
.drag {
  cursor: grab;
  font-size: 1.7rem;
  color: #1e90ffcc;
  margin-right: 0.7rem;
  transition: color 0.2s, transform 0.12s;
}
.drag:hover {
  color: #1e90ff;
  transform: scale(1.15);
}

.agregar, .continuar {
  background: linear-gradient(90deg, #1e90ff 60%, #6dd5ed 100%);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.9rem 2.5rem;
  font-size: 1.13rem;
  font-weight: 700;
  margin-top: 1.7rem;
  margin-right: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 20px #1e90ff33;
  transition: background 0.25s, box-shadow 0.22s, transform 0.12s;
  position: relative;
  overflow: hidden;
}
.agregar:hover, .continuar:hover {
  background: linear-gradient(90deg, #6dd5ed 60%, #1e90ff 100%);
  box-shadow: 0 8px 32px #1e90ff55;
  transform: scale(1.04);
}
.btn-eliminar {
  background: #fff0f3;
  color: #e53935;
  border: none;
  border-radius: 1.2rem;
  font-size: 1.18rem;
  padding: 0.6rem 1.2rem;
  margin-left: 0.5rem;
  cursor: pointer;
  transition: background 0.22s, color 0.22s, box-shadow 0.18s;
  box-shadow: 0 2px 8px #e5393533;
}
.btn-eliminar:hover {
  background: #e53935;
  color: #fff;
  box-shadow: 0 4px 16px #e5393555;
}
.btn-mover {
  background: #f8fbff;
  color: #1e90ff;
  border: 1.5px solid #b0c4de;
  border-radius: 1.2rem;
  font-size: 1rem;
  padding: 0.5rem 1.1rem;
  margin-left: 0.3rem;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border 0.18s, box-shadow 0.15s;
  box-shadow: 0 1.5px 6px #1e90ff11;
}
.btn-mover:hover {
  background: #1e90ff;
  color: #fff;
  border: 1.5px solid #1e90ff;
  box-shadow: 0 4px 16px #1e90ff44;
}
.input-parte, .select-tipo-parte, .select-tipo-contenido, textarea {
  min-width: 130px;
  max-width: 340px;
  padding: 0.7rem 1rem;
  border-radius: 1rem;
  border: 1.5px solid #b0c4de;
  font-size: 1.05rem;
  background: #fff;
  transition: border 0.18s, box-shadow 0.18s;
  box-shadow: 0 0.5px 2px #1e90ff11;
}
.input-parte:focus, .select-tipo-parte:focus, .select-tipo-contenido:focus, textarea:focus {
  border: 1.5px solid #1e90ff;
  box-shadow: 0 2px 8px #1e90ff22;
  outline: none;
}
textarea {
  flex: 2 1 300px;
  min-width: 180px;
  max-width: 600px;
  width: 100%;
  resize: vertical;
  margin-bottom: 0.7rem;
  font-family: inherit;
}
.label-visible {
  font-weight: 500;
  color: #1e90ff;
  margin-bottom: 0;
}
@media (max-width: 900px) {
  .input-parte, .select-tipo-parte, .select-tipo-contenido, textarea {
    max-width: 100%;
    min-width: 90px;
  }
}

.modulo-mover {
  margin-top: 0.7rem;
  display: flex;
  gap: 1rem;
}
</style>
