<!-- Botón de inicio idéntico al START GAME de Rhythm Plus -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { audioManager } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';
  
  export let text = 'INICIAR JUEGO';
  export let variant: 'default' | 'colored' = 'default';
  
  function manejarHover() {
    // Usar el método simplificado para hover de botón
    audioManager.hoverBoton();
  }
  
  function manejarClick() {
    // Usar el método simplificado para click de botón
    audioManager.clickBoton();
  }
</script>

<div class="wrap" class:colored={variant === 'colored'}>
  <button 
    class="main_button" 
    on:click={manejarClick} 
    on:mouseenter={manejarHover}
    on:click
  >
    {text}
  </button>
</div>

<style>
  /* Estilos exactos del botón START GAME de Rhythm Plus */
  /* ref https://codepen.io/mccombsc/pen/ZEzxWPy */

  .wrap {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.7);
  }

  .main_button {
    min-width: 300px;
    min-height: 60px;
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 1.3px;
    font-weight: 700;
    color: #ffffff;
    background: rgb(221, 125, 0);
    background: linear-gradient(90deg, rgb(221, 125, 0) 0%, rgb(194, 61, 0) 100%);
    border: none;
    border-radius: 1000px;
    box-shadow: 12px 12px 24px rgba(238, 67, 0, 0.514);
    transition: all 0.3s ease-in-out 0s;
    cursor: pointer;
    outline: none;
    position: relative;
    padding: 10px;
  }

  .main_button::before {
    content: "";
    border-radius: 1000px;
    min-width: calc(300px + 12px);
    min-height: calc(60px + 12px);
    border: 6px solid rgb(255, 145, 0);
    box-shadow: 0 0 60px rgba(255, 94, 0, 0.64);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: all 0.3s ease-in-out 0s;
  }

  .main_button:hover,
  .main_button:focus {
    color: #ffffff;
    transform: translateY(-6px);
  }

  .main_button:hover::before,
  .main_button:focus::before {
    opacity: 1;
  }

  .wrap::after {
    content: "";
    width: 30px;
    height: 30px;
    border-radius: 100%;
    border: 6px solid rgb(255, 166, 0);
    position: absolute;
    z-index: -1;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ring 1s infinite;
    pointer-events: none;
  }

  /* Variante colorida (igual que Rhythm Plus) */
  .colored .main_button {
    background: #a166ab;
    background: linear-gradient(
      60deg,
      #f79533,
      #f37055,
      #ef4e7b,
      #a166ab,
      #5073b8,
      #1098ad,
      #07b39b,
      #6fba82
    );
    box-shadow: 12px 12px 24px rgba(161, 102, 171, 0.5);
  }

  .colored .main_button::before {
    border: 6px solid #07b39b;
    box-shadow: 0px 0px 60px #1098ad;
  }

  .colored::after {
    border: 6px solid #ef4e7b;
  }

  .main_button:hover::after,
  .main_button:focus::after {
    animation: none;
    display: none;
  }

  @keyframes ring {
    0% {
      width: 30px;
      height: 30px;
      opacity: 1;
    }
    100% {
      width: 300px;
      height: 300px;
      opacity: 0;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .wrap {
      transform: scale(0.6);
    }
    
    .main_button {
      min-width: 250px;
      min-height: 50px;
      font-size: 18px;
    }

    .main_button::before {
      min-width: calc(250px + 12px);
      min-height: calc(50px + 12px);
    }
  }
</style> 