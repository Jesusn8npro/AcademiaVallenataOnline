<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let mostrar = false;
  export let pregunta = '';
  export let opciones: string[] = ['', ''];
  export let permitirMultiples = false;
  export let permitirAgregarOpciones = false;
  export let duracion = '3 días';
  export let duraciones = ['1 día', '3 días', '7 días', '14 días'];

  const dispatch = createEventDispatcher();

  function cerrar() {
    dispatch('close');
  }

  function agregarOpcion() {
    opciones = [...opciones, ''];
    dispatch('update', { pregunta, opciones, permitirMultiples, permitirAgregarOpciones, duracion });
  }

  function eliminarOpcion(idx: number) {
    if (opciones.length > 2) {
      opciones = opciones.filter((_, i) => i !== idx);
      dispatch('update', { pregunta, opciones, permitirMultiples, permitirAgregarOpciones, duracion });
    }
  }

  function guardar() {
    dispatch('save', { pregunta, opciones, permitirMultiples, permitirAgregarOpciones, duracion });
    cerrar();
  }
</script>

{#if mostrar}
  <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center" on:click={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative" style="box-shadow: 0 8px 32px rgba(0,0,0,0.18);" on:click|stopPropagation>
      <button class="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600" on:click={cerrar} aria-label="Cerrar">×</button>
      <h2 class="text-xl font-semibold mb-4">Agregar encuesta</h2>
      <div class="mb-4">
        <label class="block font-medium mb-1" for="pregunta">Pregunta de la encuesta</label>
        <input id="pregunta" type="text" class="w-full border rounded px-3 py-2" bind:value={pregunta} placeholder="Escribe tu pregunta aquí..." maxlength="120" />
      </div>
      <div class="mb-4">
        <label class="block font-medium mb-1">Opciones</label>
        {#each opciones as opcion, idx (idx)}
          <div class="flex items-center mb-2">
            <input type="text" class="flex-1 border rounded px-3 py-2" bind:value={opciones[idx]} placeholder={`Opción ${idx + 1}`} maxlength="60" />
            {#if opciones.length > 2}
              <button class="ml-2 px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200" on:click={() => eliminarOpcion(idx)} aria-label="Eliminar opción">×</button>
            {/if}
          </div>
        {/each}
        <button class="mt-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm" on:click={agregarOpcion}>+ Agregar opción</button>
      </div>
      <div class="mb-4">
        <label class="block font-medium mb-1">Configuración</label>
        <div class="flex flex-col space-y-1">
          <label class="inline-flex items-center" for="multi">
            <input id="multi" type="checkbox" bind:checked={permitirMultiples} class="mr-2" /> Permitir seleccionar varias respuestas
          </label>
          <label class="inline-flex items-center" for="agregar">
            <input id="agregar" type="checkbox" bind:checked={permitirAgregarOpciones} class="mr-2" /> Permitir que los usuarios agreguen opciones
          </label>
        </div>
      </div>
      <div class="mb-6">
        <label class="block font-medium mb-1" for="duracion">Duración de la encuesta</label>
        <select id="duracion" class="w-full border rounded px-3 py-2" bind:value={duracion}>
          {#each duraciones as dur}
            <option value={dur}>{dur}</option>
          {/each}
        </select>
      </div>
      <div class="flex justify-end space-x-2">
        <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" on:click={cerrar}>Cancelar</button>
        <button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" on:click={guardar}>Guardar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    background: rgba(255,255,255,0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background 0.2s;
  }
</style>
