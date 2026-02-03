<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';

  export let mostrarModal: boolean;
  export let scrollToSection: (id: string) => void;

  let visible = false;

  onMount(() => {
    visible = true;
  });

  function irAlCursoEstrella() {
    goto('/curso-acordeon-desde-cero');
  }

  function irASimulador() {
    // Simulador próximamente
    alert('🎮 ¡Simulador Gaming en desarrollo! Será la experiencia más innovadora para aprender acordeón. ¡Lanzamiento en los próximos días!');
  }
</script>

<section class="hero-section">
  <!-- Fondo animado con partículas -->
  <div class="hero-particles">
    <div class="particles"></div>
  </div>
  
  <!-- Imagen de fondo con overlay -->
  <div class="hero-background">
    <img 
      src="/images/Home/Banner- Academia vallenata ONLINE.jpg" 
      alt="Academia Vallenata Background"
      class="hero-bg-image"
    />
  </div>
  
  <!-- Contenido principal -->
  <div class="hero-content">
    {#if visible}
      <!-- Badge de credibilidad -->
      <div in:fly="{{ y: -30, duration: 800, easing: quintOut }}" class="credibilidad-badge">
        🏆 #1 Academia de Acordeón Online • 5,000+ Estudiantes Transformados
      </div>

      <!-- Título principal -->
      <div in:fly="{{ y: 50, duration: 1000, easing: quintOut }}">
        <h1 class="hero-title">
          <span class="titulo-principal">Domina el Acordeón Vallenato</span>
          <span class="hero-subtitle">Como Un Verdadero Profesional</span>
        </h1>
      </div>
      
      <!-- Promesa de valor -->
      <div in:fly="{{ y: 50, duration: 1000, delay: 200, easing: quintOut }}">
        <p class="hero-description">
          🎵 De <strong>cero absoluto</strong> a tu <strong>primera canción en 7 días</strong> 
          <br>Con el método probado del Maestro <strong>Jesús González</strong> 
          <br>+ Simulador Gaming + Comunidad de 5,000+ acordeonistas
        </p>
      </div>

      <!-- Botones de acción -->
      <div in:fly="{{ y: 50, duration: 1000, delay: 300, easing: quintOut }}" class="hero-buttons">
        <button 
          on:click={irAlCursoEstrella}
          class="hero-btn-primary"
        >
          🚀 ¡EMPEZAR CURSO ESTRELLA!
          <span class="btn-subtitle">Primera canción en 7 días</span>
        </button>
        
        <button 
          on:click={irASimulador}
          class="hero-btn-gaming"
        >
          🎮 SIMULADOR PRÓXIMAMENTE
          <span class="btn-subtitle">Lanzamiento en días</span>
        </button>
      </div>
      
      <!-- Social proof -->
      <div in:scale="{{ start: 0, duration: 1000, delay: 500, easing: quintOut }}">
        <div class="hero-rating">
          <div class="rating-estrellas">
            <span class="rating-stars">⭐⭐⭐⭐⭐</span>
            <span class="rating-text">4.9/5 - 847 reseñas verificadas</span>
          </div>
          <div class="rating-estudiantes">
            <span class="numero-destacado">5,000+</span>
            <span>estudiantes activos</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Scroll indicator -->
  <div class="scroll-indicator">
    <div class="scroll-mouse">
      <div class="scroll-dot"></div>
    </div>
    <span class="scroll-text">Descubre más</span>
  </div>
</section>

<style>
  .hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #7c3aed 50%, #1e40af 75%, #0f172a 100%);
  }

  .hero-particles {
    position: absolute;
    inset: 0;
    opacity: 0.3;
  }

  .particles {
    width: 100%;
    height: 100%;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    animation: particleFloat 25s linear infinite;
  }

  @keyframes particleFloat {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
    100% { transform: translateY(0) rotate(360deg); }
  }

  .hero-background {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .hero-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.2;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    color: white;
    padding: 0 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Badge de credibilidad */
  .credibilidad-badge {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    }
    50% { 
      transform: scale(1.02);
      box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
    }
  }

  /* Títulos */
  .hero-title {
    margin-bottom: 2rem;
  }

  .titulo-principal {
    display: block;
    font-size: clamp(2.5rem, 8vw, 6rem);
    font-weight: 900;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.1;
    margin-bottom: 0.5rem;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .hero-subtitle {
    display: block;
    font-size: clamp(1.5rem, 4vw, 3rem);
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1.2;
  }

  /* Descripción */
  .hero-description {
    font-size: clamp(1.1rem, 3vw, 1.4rem);
    margin-bottom: 2rem;
    color: #cbd5e1;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }



  /* Botones principales */
  .hero-buttons {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
    margin-bottom: 2.5rem;
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  .hero-btn-primary, .hero-btn-gaming {
    padding: 1.5rem 2rem;
    border-radius: 15px;
    border: none;
    cursor: pointer;
    font-weight: 800;
    font-size: clamp(1rem, 4vw, 1.2rem);
    width: 100%;
    max-width: 100%;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .hero-btn-primary {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
    color: white;
    box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
    animation: pulseRed 2s ease-in-out infinite;
  }

  .hero-btn-gaming {
    background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%);
    color: white;
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
  }

  .hero-btn-primary:hover, .hero-btn-gaming:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 15px 40px rgba(220, 38, 38, 0.6);
  }

  .hero-btn-gaming:hover {
    box-shadow: 0 15px 40px rgba(124, 58, 237, 0.6);
  }

  @keyframes pulseRed {
    0%, 100% { 
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
    }
    50% { 
      box-shadow: 0 15px 40px rgba(220, 38, 38, 0.7), 0 0 20px rgba(220, 38, 38, 0.3);
    }
  }

  .btn-subtitle {
    font-size: 0.8rem;
    font-weight: 400;
    opacity: 0.9;
    text-transform: none;
    letter-spacing: normal;
  }



  /* Social proof */
  .hero-rating {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .rating-estrellas {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .rating-stars {
    font-size: 1.5rem;
  }

  .rating-text {
    font-size: 1rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .rating-estudiantes {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
  }

  .numero-destacado {
    font-size: 2rem;
    font-weight: 900;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Scroll indicator */
  .scroll-indicator {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    animation: bounce 2s infinite;
  }

  .scroll-mouse {
    width: 1.5rem;
    height: 2.5rem;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 0.5rem;
  }

  .scroll-dot {
    width: 0.25rem;
    height: 0.75rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    animation: scrollDot 2s infinite;
  }

  .scroll-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  @keyframes scrollDot {
    0%, 20% { opacity: 1; transform: translateY(0); }
    80%, 100% { opacity: 0; transform: translateY(1rem); }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
    40% { transform: translateX(-50%) translateY(-10px); }
    60% { transform: translateX(-50%) translateY(-5px); }
  }

  /* Responsive */
  @media (min-width: 640px) {
    .hero-buttons {
      flex-direction: row;
    }

    .rating-estrellas {
      flex-direction: row;
    }
  }

  @media (max-width: 768px) {
    .hero-buttons {
      max-width: 95vw;
      padding: 0 0.5rem;
    }
    
    .hero-btn-primary, .hero-btn-gaming {
      padding: 1.2rem 1.5rem;
      font-size: clamp(0.9rem, 3.5vw, 1.1rem);
    }
    
    .hero-title {
      padding: 0 1rem;
    }
    
    .hero-description {
      padding: 0 1rem;
    }
  }

  @media (max-width: 480px) {
    .credibilidad-badge {
      font-size: 0.8rem;
      padding: 0.6rem 1.5rem;
    }

    .hero-btn-primary, .hero-btn-gaming {
      padding: 1rem 1.5rem;
      font-size: clamp(0.8rem, 3vw, 1rem);
    }
    
    .hero-buttons {
      max-width: 98vw;
      padding: 0 0.25rem;
    }
    
    .hero-title {
      padding: 0 0.5rem;
    }
    
    .hero-description {
      padding: 0 0.5rem;
    }
  }
</style> 