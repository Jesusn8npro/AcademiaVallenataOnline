<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  export let apiKey: string;
  export let show: boolean = false;
  export let top: number = 0;
  export let left: number = 0;
  export let onSelect: (url: string) => void;
  export let onClose: () => void = () => {};
  let search = '';
  let gifs: Array<{id: string, url: string, preview: string}> = [];
  let loading = false;
  let error = '';
  let pickerEl: HTMLDivElement | null = null;

  async function buscarGifs(q?: string) {
    const query = q !== undefined ? q : (search.trim() ? search : 'acordeon');
    loading = true;
    error = '';
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=16&rating=pg`);
      const data = await res.json();
      gifs = data.data.map((g: any) => ({
        id: g.id,
        url: g.images.original.url,
        preview: g.images.fixed_height_small.url
      }));
    } catch (e) {
      gifs = [];
    }
    loading = false;
  }

  // Buscar acordeon por defecto al abrir o si el usuario borra el input
  $: if (show && (!search.trim() || search === '')) {
    buscarGifs('acordeon');
  }
  $: if (show && search.trim()) {
    // Si el usuario escribe, buscar solo al hacer click en buscar
  }

  function seleccionarGif(url: string) {
    onSelect(url);
    onClose();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
  function handleClickOutside(event: MouseEvent) {
    if (pickerEl && !pickerEl.contains(event.target as Node)) {
      onClose();
    }
  }
  onMount(() => {
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });
</script>

{#if show}
  <div bind:this={pickerEl}
    class="fixed z-50 bg-white rounded-lg shadow-lg gif-popover"
    style="top:{top}px; left:{left}px; min-width:180px; width:100%; max-width:340px; overflow:hidden;"
  >
    <div class="flex items-center mb-2 gap-0.5">
      <input
        class="gif-search"
        placeholder="Buscar..."
        bind:value={search}
        on:keydown={(e) => e.key === 'Enter' && buscarGifs()}
        style="font-size:15px; min-width:0; flex:1; padding:6px 10px; border-radius:10px 0 0 10px; border:1px solid #e0e0e0; background:#f7f7f9;"
      />
      <button class="gif-close-btn" on:click={onClose} title="Cerrar">×</button>
    </div>
    {#if loading}
      <div class="text-center text-xs py-2">Buscando...</div>
    {:else if gifs.length > 0}
      <div class="gif-scroll-area">
        <div class="gif-grid-responsive">
          {#each gifs as gif}
            <button type="button" class="rounded focus:outline-none p-0" style="background:none;" on:click={() => seleccionarGif(gif.url)}>
              <img src={gif.preview} alt="GIF" class="rounded w-full h-auto" style="height:120px; object-fit:cover;" />
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-center text-xs text-gray-400 py-2">Sin resultados</div>
    {/if}
  </div>
{/if}

<style>
  .gif-popover {
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 6px 32px 0 rgba(60,60,60,0.13), 0 1.5px 6px 0 rgba(60,60,60,0.08);
    padding: 12px 12px 16px 12px;
    min-width: 240px;
    width: 270px;
    border: none;
  }
  .gif-search {
    border: none;
    border-radius: 10px 0 0 10px;
    background: #f5f6fa;
    padding: 7px 10px;
    font-size: 15px;
    color: #222;
    outline: none;
    width: 100%;
    transition: box-shadow 0.15s;
  }
  .gif-search:focus {
    box-shadow: 0 0 0 2px #2563eb33;
  }
  .gif-close-btn {
    background: none;
    border: none;
    color: #bbb;
    font-size: 22px;
    margin-left: 4px;
    margin-right: -2px;
    cursor: pointer;
    padding: 0 4px;
    border-radius: 0 10px 10px 0;
    transition: background 0.13s;
    width: 30px;
  }
  .gif-close-btn:hover {
    background: #f0f0f0;
    color: #888;
  }
  .gif-empty {
    text-align: center;
    color: #b0b0b0;
    font-size: 13px;
    padding: 10px 0 0 0;
  }
  .gif-grid-responsive {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  @media (min-width: 480px) {
    .gif-grid-responsive {
      grid-template-columns: repeat(3, 1fr);
    }
  }
.gif-scroll-area {
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 #fff;
}
.gif-scroll-area::-webkit-scrollbar {
  width: 6px;
  background: #fff;
}
.gif-scroll-area::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 6px;
}
</style>
