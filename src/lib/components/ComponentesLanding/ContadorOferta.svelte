<!-- ContadorOferta.svelte - Contador de oferta responsivo -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  
  let dias = 10;
  let horas = 23;
  let minutos = 13;
  let segundos = 10;
  
  let interval: ReturnType<typeof setInterval>;
  
  // 🔧 FUNCIÓN PARA VOLVER AL HOME
  function volverAlHome() {
    console.log('🏠 Navegando al home desde curso');
    goto('/');
  }
  
  onMount(() => {
    interval = setInterval(() => {
      if (segundos > 0) {
        segundos--;
      } else if (minutos > 0) {
        segundos = 59;
        minutos--;
      } else if (horas > 0) {
        segundos = 59;
        minutos = 59;
        horas--;
      } else if (dias > 0) {
        segundos = 59;
        minutos = 59;
        horas = 23;
        dias--;
      }
    }, 1000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="contador-banner">
  <div class="container">
    
    <!-- Sección izquierda -->
    <div class="left-section">
      <button class="btn-volver" on:click={volverAlHome}>← Volver</button>
      
      <div class="oferta-info">
        <div class="oferta-icon">⚡</div>
        <span class="oferta-text">¡OFERTA EXCLUSIVA!</span>
        <span class="descuento">-50%</span>
      </div>
    </div>
    
    <!-- Sección derecha -->
    <div class="right-section">
      <span class="tiempo-text">La oferta termina en:</span>
      <div class="countdown">
        <div class="time-item">
          <span class="number">{dias.toString().padStart(2, '0')}</span>
          <span class="label">Días</span>
        </div>
        <div class="time-item">
          <span class="number">{horas.toString().padStart(2, '0')}</span>
          <span class="label">Horas</span>
        </div>
        <div class="time-item">
          <span class="number">{minutos.toString().padStart(2, '0')}</span>
          <span class="label">Min</span>
        </div>
        <div class="time-item">
          <span class="number">{segundos.toString().padStart(2, '0')}</span>
          <span class="label">Seg</span>
        </div>
      </div>
    </div>
    
  </div>
</div>

<style>
  .contador-banner {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    padding: 0.8rem 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .left-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  
  .btn-volver {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }
  
  .btn-volver:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .oferta-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .oferta-icon {
    font-size: 1.3rem;
    animation: pulse 2s infinite;
  }
  
  .oferta-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  
  .descuento {
    background: #ef4444;
    color: white;
    padding: 0.3rem 0.7rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    animation: bounce 2s infinite;
  }
  
  .right-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .tiempo-text {
    font-size: 0.9rem;
    opacity: 0.9;
    white-space: nowrap;
  }
  
  .countdown {
    display: flex;
    gap: 0.5rem;
  }
  
  .time-item {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 0.5rem;
    text-align: center;
    min-width: 45px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .number {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
  }
  
  .label {
    display: block;
    font-size: 0.65rem;
    opacity: 0.8;
    margin-top: 0.25rem;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-3px); }
    60% { transform: translateY(-1px); }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
      gap: 1rem;
      padding: 0 1rem;
    }
    
    .left-section {
      width: 100%;
      justify-content: space-between;
      gap: 1rem;
    }
    
    .right-section {
      width: 100%;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }
    
    .tiempo-text {
      font-size: 0.85rem;
    }
    
    .countdown {
      gap: 0.75rem;
    }
    
    .time-item {
      min-width: 50px;
      padding: 0.6rem 0.4rem;
    }
    
    .number {
      font-size: 1.2rem;
    }
    
    .label {
      font-size: 0.7rem;
    }
  }
  
  @media (max-width: 480px) {
    .contador-banner {
      padding: 1rem 0;
    }
    
    .left-section {
      flex-direction: column;
      gap: 0.8rem;
      align-items: center;
    }
    
    .btn-volver {
      align-self: flex-start;
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
    }
    
    .oferta-info {
      gap: 0.5rem;
    }
    
    .oferta-text {
      font-size: 0.9rem;
    }
    
    .right-section {
      gap: 0.5rem;
    }
    
    .countdown {
      gap: 0.5rem;
    }
    
    .time-item {
      min-width: 45px;
      padding: 0.5rem 0.3rem;
    }
    
    .number {
      font-size: 1rem;
    }
    
    .label {
      font-size: 0.6rem;
    }
  }
</style> 