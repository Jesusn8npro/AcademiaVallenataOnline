<script lang="ts">
  import { generarIniciales, obtenerAvatarPorDefecto, debeMostrarIniciales } from '$lib/utils/avatarUtils';

  export let src: string | null | undefined = null;
  export let alt: string = 'Avatar';
  export let nombreCompleto: string = '';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let onClick: (() => void) | null = null;

  $: mostrarIniciales = debeMostrarIniciales(src) && nombreCompleto;
  $: iniciales = mostrarIniciales ? generarIniciales(nombreCompleto) : '';

  function manejarClick() {
    if (onClick) {
      onClick();
    }
  }
</script>

<div 
  class="avatar avatar-{size}" 
  class:clickeable={onClick !== null}
  on:click={manejarClick}
  on:keydown={(e) => e.key === 'Enter' && manejarClick()}
  role={onClick ? 'button' : undefined}
  tabindex={onClick ? 0 : undefined}
>
  {#if mostrarIniciales}
    <!-- Avatar con iniciales -->
    <div class="avatar-iniciales">
      {iniciales}
    </div>
  {:else}
    <!-- Avatar con imagen -->
    <img 
      src={src || obtenerAvatarPorDefecto()} 
      {alt}
      class="avatar-imagen"
    />
  {/if}
</div>

<style>
  .avatar {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }

  .avatar.clickeable {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .avatar.clickeable:hover {
    transform: scale(1.05);
  }

  /* Tamaños */
  .avatar-small {
    width: 32px;
    height: 32px;
  }

  .avatar-medium {
    width: 100%;
    height: 100%;
    max-width: 40px;
    max-height: 40px;
  }

  .avatar-large {
    width: 100%;
    height: 100%;
    max-width: 60px;
    max-height: 60px;
  }

  .avatar-imagen {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-iniciales {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .avatar-small .avatar-iniciales {
    font-size: 0.7rem;
  }

  .avatar-medium .avatar-iniciales {
    font-size: 0.8rem;
  }

  .avatar-large .avatar-iniciales {
    font-size: 1.1rem;
  }
</style> 