<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';

  let visible = false;
  let videoLoaded = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible = true;
        }
      });
    });

    const section = document.querySelector('.seccion-simulador');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function irAlSimulador() {
    goto('/simulador-gaming');
  }

  function irAlRanking() {
    goto('/ranking');
  }

  const caracteristicas = [
    {
      icono: '🎮',
      titulo: 'Experiencia Gaming',
      descripcion: 'Efectos de sonido profesionales y visuales inmersivos',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icono: '🏆',
      titulo: 'Ranking Global',
      descripcion: '6 categorías de competencia y rankings en tiempo real',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icono: '🎯',
      titulo: 'Sistema de Puntos',
      descripcion: 'XP, niveles y achievements que motivan tu progreso',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icono: '⚡',
      titulo: 'Editor MAX',
      descripcion: 'Herramientas avanzadas para crear tus propias canciones',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icono: '🎵',
      titulo: 'Biblioteca Musical',
      descripcion: 'Amplia selección de canciones vallenatas populares',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icono: '📊',
      titulo: 'Análisis Detallado',
      descripcion: 'Estadísticas de precisión y progreso personalizado',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  const beneficiosUnicos = [
    'El único simulador gaming de acordeón en línea',
    'Competencia global con otros estudiantes',
    'Feedback inmediato de tu interpretación',
    'Práctica divertida que no se siente como estudio',
    'Motivación constante a través de gamificación'
  ];
</script>

<section class="seccion-simulador" id="simulador">
  <div class="contenedor">
    
    <!-- Header de la sección -->
    {#if visible}
      <div in:fly="{{ y: 50, duration: 1000, easing: quintOut }}" class="header-seccion">
        <div class="badge-innovacion">🚀 INNOVACIÓN EXCLUSIVA</div>
        <h2 class="titulo-seccion">
          <span class="texto-gaming">Simulador Gaming</span><br>
          <span class="texto-principal">de Acordeón Profesional</span>
        </h2>
        <p class="descripcion-seccion">
          La primera y única experiencia gaming para aprender acordeón vallenato.
          <br><strong>¡Practica, compite y domina como un verdadero gamer!</strong>
        </p>
      </div>
    {/if}

    <!-- Contenido principal -->
    <div class="contenido-principal">
      
      <!-- Video/Demo del simulador -->
      {#if visible}
        <div in:scale="{{ start: 0.8, duration: 1000, delay: 200, easing: quintOut }}" class="demo-container">
          <div class="video-simulador">
            <div class="placeholder-video">
              <div class="play-button" on:click={irAlSimulador} role="button" tabindex="0">
                <div class="play-icon">▶</div>
              </div>
              <img 
                src="/Acordeon PRO MAX.png" 
                alt="Simulador de Acordeón Pro MAX"
                class="imagen-simulador"
              />
              <div class="overlay-gaming"></div>
              <div class="efectos-gaming">
                <div class="particula particula-1"></div>
                <div class="particula particula-2"></div>
                <div class="particula particula-3"></div>
                <div class="particula particula-4"></div>
              </div>
            </div>
            <div class="controles-demo">
              <button class="boton-probar" on:click={irAlSimulador}>
                🎮 PROBAR SIMULADOR GRATIS
              </button>
              <button class="boton-ranking" on:click={irAlRanking}>
                🏆 Ver Ranking Global
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Características del simulador -->
      {#if visible}
        <div in:fly="{{ y: 50, duration: 1000, delay: 400, easing: quintOut }}" class="caracteristicas-simulador">
          <h3 class="titulo-caracteristicas">¿Por qué es Revolucionario?</h3>
          
          <div class="grid-caracteristicas">
            {#each caracteristicas as caracteristica, index}
              <div 
                in:scale="{{ start: 0, duration: 600, delay: 500 + (index * 100), easing: quintOut }}"
                class="tarjeta-caracteristica"
              >
                <div class="icono-caracteristica bg-gradient-{caracteristica.color}">
                  {caracteristica.icono}
                </div>
                <h4 class="titulo-caracteristica">{caracteristica.titulo}</h4>
                <p class="descripcion-caracteristica">{caracteristica.descripcion}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Beneficios únicos -->
    {#if visible}
      <div in:fly="{{ y: 30, duration: 1000, delay: 800, easing: quintOut }}" class="beneficios-unicos">
        <div class="contenido-beneficios">
          <h3 class="titulo-beneficios">Ventajas Exclusivas del Simulador</h3>
          <div class="lista-beneficios">
            {#each beneficiosUnicos as beneficio, index}
              <div 
                in:fly="{{ x: -30, duration: 500, delay: 900 + (index * 100), easing: quintOut }}"
                class="beneficio-unico"
              >
                <span class="check-gaming">✓</span>
                {beneficio}
              </div>
            {/each}
          </div>
        </div>
        
        <div class="stats-gaming">
          <div class="stat-item">
            <div class="stat-numero">1°</div>
            <div class="stat-texto">En el mundo</div>
          </div>
          <div class="stat-item">
            <div class="stat-numero">6</div>
            <div class="stat-texto">Categorías de ranking</div>
          </div>
          <div class="stat-item">
            <div class="stat-numero">∞</div>
            <div class="stat-texto">Horas de diversión</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- CTA final -->
    {#if visible}
      <div in:scale="{{ start: 0, duration: 1000, delay: 1200, easing: quintOut }}" class="cta-simulador">
        <div class="cta-gaming-content">
          <h3>¿Listo para la Experiencia Gaming?</h3>
          <p>Únete a miles de acordeonistas que ya practican de forma divertida</p>
          <div class="botones-cta">
            <button class="boton-principal-gaming" on:click={irAlSimulador}>
              🚀 EMPEZAR A JUGAR AHORA
            </button>
            <button class="boton-secundario-gaming" on:click={irAlRanking}>
              📊 Ver Mi Posición en Ranking
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .seccion-simulador {
    padding: 6rem 0;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0a2463 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .seccion-simulador::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%237c3aed' fill-opacity='0.03'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E");
    animation: movePattern 20s linear infinite;
  }

  @keyframes movePattern {
    0% { transform: translateX(0) translateY(0); }
    100% { transform: translateX(-100px) translateY(-100px); }
  }

  .contenedor {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 2;
  }

  /* Header de la sección */
  .header-seccion {
    text-align: center;
    margin-bottom: 4rem;
  }

  .badge-innovacion {
    display: inline-block;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { 
      box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
    }
    50% { 
      box-shadow: 0 12px 35px rgba(124, 58, 237, 0.6), 0 0 30px rgba(124, 58, 237, 0.3);
    }
  }

  .titulo-seccion {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }

  .texto-gaming {
    background: linear-gradient(135deg, #a855f7, #ec4899);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: block;
  }

  .texto-principal {
    color: #e2e8f0;
    display: block;
  }

  .descripcion-seccion {
    font-size: 1.2rem;
    color: #cbd5e1;
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Contenido principal */
  .contenido-principal {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    margin-bottom: 4rem;
  }

  /* Demo del simulador */
  .demo-container {
    position: relative;
  }

  .video-simulador {
    position: relative;
  }

  .placeholder-video {
    position: relative;
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #1e293b, #334155);
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid rgba(124, 58, 237, 0.3);
    transition: all 0.3s ease;
  }

  .placeholder-video:hover {
    border-color: rgba(124, 58, 237, 0.6);
    transform: scale(1.02);
  }

  .imagen-simulador {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.7;
  }

  .overlay-gaming {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.2));
  }

  .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 5;
  }

  .play-button:hover {
    background: white;
    transform: translate(-50%, -50%) scale(1.1);
  }

  .play-icon {
    font-size: 2rem;
    color: #7c3aed;
    margin-left: 4px;
  }

  /* Efectos gaming */
  .efectos-gaming {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particula {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #a855f7;
    border-radius: 50%;
    animation: floatParticle 3s ease-in-out infinite;
  }

  .particula-1 { top: 20%; left: 10%; animation-delay: 0s; }
  .particula-2 { top: 60%; right: 15%; animation-delay: 1s; }
  .particula-3 { bottom: 30%; left: 20%; animation-delay: 2s; }
  .particula-4 { top: 40%; right: 30%; animation-delay: 1.5s; }

  @keyframes floatParticle {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
    50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
  }

  /* Controles demo */
  .controles-demo {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .boton-probar, .boton-ranking {
    flex: 1;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-probar {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
  }

  .boton-ranking {
    background: transparent;
    border: 2px solid rgba(124, 58, 237, 0.5);
    color: #a855f7;
  }

  .boton-probar:hover, .boton-ranking:hover {
    transform: translateY(-2px);
  }

  .boton-probar:hover {
    box-shadow: 0 12px 35px rgba(124, 58, 237, 0.5);
  }

  .boton-ranking:hover {
    background: rgba(124, 58, 237, 0.1);
    border-color: #a855f7;
  }

  /* Características */
  .caracteristicas-simulador {
    padding: 2rem 0;
  }

  .titulo-caracteristicas {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 2rem;
    text-align: center;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .grid-caracteristicas {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .tarjeta-caracteristica {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .tarjeta-caracteristica:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-5px);
  }

  .icono-caracteristica {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin: 0 auto 1rem auto;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
  }

  .titulo-caracteristica {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #e2e8f0;
  }

  .descripcion-caracteristica {
    font-size: 0.9rem;
    color: #cbd5e1;
    line-height: 1.5;
  }

  /* Beneficios únicos */
  .beneficios-unicos {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 3rem;
    margin-bottom: 4rem;
  }

  .titulo-beneficios {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    color: #fbbf24;
  }

  .lista-beneficios {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .beneficio-unico {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1rem;
    color: #e2e8f0;
  }

  .check-gaming {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* Stats gaming */
  .stats-gaming {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .stat-item {
    text-align: center;
    padding: 1.5rem;
    background: rgba(124, 58, 237, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(124, 58, 237, 0.3);
  }

  .stat-numero {
    font-size: 2.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  .stat-texto {
    font-size: 0.9rem;
    color: #cbd5e1;
    font-weight: 600;
  }

  /* CTA final */
  .cta-simulador {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 24px;
    padding: 3rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .cta-simulador::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E");
    animation: moveDots 15s linear infinite;
  }

  @keyframes moveDots {
    0% { transform: translateX(0) translateY(0); }
    100% { transform: translateX(-40px) translateY(-40px); }
  }

  .cta-gaming-content {
    position: relative;
    z-index: 2;
  }

  .cta-simulador h3 {
    font-size: 2.2rem;
    font-weight: 900;
    margin-bottom: 1rem;
    color: white;
  }

  .cta-simulador p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 2rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .botones-cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .boton-principal-gaming, .boton-secundario-gaming {
    padding: 1.2rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-principal-gaming {
    background: white;
    color: #7c3aed;
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
  }

  .boton-secundario-gaming {
    background: transparent;
    border: 2px solid white;
    color: white;
  }

  .boton-principal-gaming:hover, .boton-secundario-gaming:hover {
    transform: translateY(-3px);
  }

  .boton-principal-gaming:hover {
    box-shadow: 0 12px 35px rgba(255, 255, 255, 0.3);
  }

  .boton-secundario-gaming:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .contenido-principal {
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    .grid-caracteristicas {
      grid-template-columns: 1fr;
    }

    .beneficios-unicos {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  @media (max-width: 768px) {
    .seccion-simulador {
      padding: 4rem 0;
    }

    .contenedor {
      padding: 0 1rem;
    }

    .controles-demo {
      flex-direction: column;
    }

    .botones-cta {
      flex-direction: column;
      align-items: center;
    }

    .boton-principal-gaming, .boton-secundario-gaming {
      width: 100%;
      max-width: 300px;
    }

    .stats-gaming {
      flex-direction: row;
      justify-content: space-around;
    }

    .stat-item {
      padding: 1rem;
    }

    .stat-numero {
      font-size: 2rem;
    }
  }

  @media (max-width: 480px) {
    .beneficios-unicos {
      padding: 2rem 1.5rem;
    }

    .cta-simulador {
      padding: 2rem 1.5rem;
    }

    .titulo-seccion {
      font-size: 2rem;
    }

    .descripcion-seccion {
      font-size: 1rem;
    }
  }
</style> 