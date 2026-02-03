<script lang="ts">
  import FondoEspacial from '../efectos/FondoEspacial.svelte';
</script>

<FondoEspacial />
<div class="contenido-pagina">
  <slot />
</div>

<style>
  .contenido-pagina {
    position: relative;
    z-index: 1;
    min-height: 100vh;
  }
</style> 