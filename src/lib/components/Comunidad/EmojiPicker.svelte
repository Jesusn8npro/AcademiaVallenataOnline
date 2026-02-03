<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  export let show = false;
  export let top = 0;
  export let left = 0;
  export let onClose = () => {};
  export let emojiSearch = '';
  export let filteredEmojis = [];
  export let selectEmoji = (emoji: string) => {};
  let pickerEl: HTMLDivElement | null = null;

  // Cerrar con escape
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
  onMount(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });
</script>
{#if show}
  <div bind:this={pickerEl}
    class="fixed z-50 bg-white rounded-xl shadow-lg p-3 border border-gray-200"
    style="top:{top}px; left:{left}px; min-width:18rem; width:22rem;"
    tabindex="0"
  >
    <div class="flex justify-between items-center mb-2">
      <input type="text" class="w-3/4 p-1 rounded border text-sm" placeholder="Buscar..." bind:value={emojiSearch} autofocus />
      <button class="ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300" on:click={onClose}>✕</button>
    </div>
    <div class="overflow-y-auto max-h-60 grid grid-cols-8 gap-1">
      {#each filteredEmojis as emoji}
        <button type="button" class="text-2xl p-1 hover:bg-gray-100 rounded" on:click={() => selectEmoji(emoji)}>{emoji}</button>
      {/each}
    </div>
  </div>
  <div class="fixed inset-0 z-40" on:click={onClose} tabindex="-1" style="background:transparent;"></div>
{/if}

<style>
  :global(body) {
    overflow-x: hidden;
  }
</style>
