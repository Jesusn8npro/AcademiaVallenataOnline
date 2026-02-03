<script lang="ts">
  import { modoOscuro, toggleModoOscuro } from '$lib/stores/temaStore';

  function handleToggle() {
    toggleModoOscuro();
  }
</script>

<button 
  class="toggle-modo-oscuro" 
  on:click={handleToggle}
  aria-label={$modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
  title={$modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
>
  {#if $modoOscuro}
    <!-- Icono de Sol (modo claro) -->
    <svg class="icono-sol w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  {:else}
    <!-- Icono de Luna (modo oscuro) -->
    <svg class="icono-luna w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
    </svg>
  {/if}
</button>

<style>
  .toggle-modo-oscuro {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: none;
    background: transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease-in-out;
  }

  .toggle-modo-oscuro:hover {
    background-color: #f3f4f6;
    color: #374151;
    transform: scale(1.05);
  }

  :global(.dark) .toggle-modo-oscuro {
    color: #9ca3af;
  }

  :global(.dark) .toggle-modo-oscuro:hover {
    background-color: #374151;
    color: #f9fafb;
  }

  .icono-sol,
  .icono-luna {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s ease-in-out;
  }

  .toggle-modo-oscuro:hover .icono-sol,
  .toggle-modo-oscuro:hover .icono-luna {
    transform: rotate(15deg);
  }

  /* Animación suave de entrada */
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  .icono-sol,
  .icono-luna {
    animation: fadeIn 0.3s ease-out;
  }
</style> 