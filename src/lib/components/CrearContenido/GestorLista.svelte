<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let titulo: string;
  export let placeholder: string;
  export let items: string[] = [];

  let nuevoItem = '';
  const dispatch = createEventDispatcher();

  function agregarItem() {
    if (nuevoItem.trim() === '' || items.includes(nuevoItem.trim())) {
      nuevoItem = '';
      return;
    }
    items = [...items, nuevoItem.trim()];
    nuevoItem = '';
    dispatch('update', items);
  }

  function eliminarItem(index: number) {
    items = items.filter((_, i) => i !== index);
    dispatch('update', items);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      agregarItem();
    }
  }
</script>

<div class="gestor-lista-contenedor">
  <label class="etiqueta-campo">{titulo}</label>
  <div class="input-agregar">
    <input 
      type="text" 
      bind:value={nuevoItem} 
      class="input-moderno"
      {placeholder}
      on:keydown={handleKeydown}
    />
    <button type="button" on:click={agregarItem} class="boton-agregar" title="Agregar item">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    </button>
  </div>

  <ul class="lista-items">
    {#each items as item, index (item)}
      <li class="item">
        <span class="texto-item">{item}</span>
        <button type="button" on:click={() => eliminarItem(index)} class="boton-eliminar" title="Eliminar item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .gestor-lista-contenedor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .etiqueta-campo {
    font-weight: 600;
    color: #4a5568;
    font-size: 0.9rem;
  }
  .input-agregar {
    display: flex;
    gap: 0.5rem;
  }
  .input-moderno {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    transition: all 0.2s ease-in-out;
  }
  .input-moderno:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }
  .boton-agregar {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background-color: #667eea;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
  }
  .boton-agregar:hover {
    background-color: #5a67d8;
    transform: scale(1.05);
  }
  .boton-agregar svg {
    width: 1.5rem;
    height: 1.5rem;
  }
  .lista-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f7fafc;
    border: 1px solid #e2e8f0;
    padding: 0.35rem 0.75rem;
    border-radius: 1.5rem;
    font-size: 0.85rem;
    color: #2d3748;
    animation: aparecer 0.3s ease;
  }
  @keyframes aparecer {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  .boton-eliminar {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #a0aec0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .boton-eliminar:hover {
    color: #f56565;
  }
  .boton-eliminar svg {
    width: 1rem;
    height: 1rem;
  }
</style> 