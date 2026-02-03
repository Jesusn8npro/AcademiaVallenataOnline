<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';

  let visible = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible = true;
        }
      });
    });

    const section = document.querySelector('.seccion-cta-final');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function irAlCursoEstrella() {
    goto('/curso-acordeon-desde-cero');
  }

  function irASimulador() {
    // Simulador próximamente
    alert('¡Simulador gaming próximo a lanzar! Será la experiencia más innovadora para aprender acordeón.');
  }

  const beneficiosFinales = [
    'Primera canción en 7 días garantizado',
    'Simulador gaming (lanzamiento próximos días)',
    'Comunidad de 5,000+ estudiantes',
    'Método del Maestro Jesús González',
    'Garantía de satisfacción 30 días'
  ];
</script>

<section class="seccion-cta-final">
  <div class="contenedor">
    
    <!-- Mensaje principal -->
    {#if visible}
      <div in:fly="{{ y: 50, duration: 1000, easing: quintOut }}" class="mensaje-principal">
        <div class="badge-urgencia">⚡ TU MOMENTO ES AHORA</div>
        <h2 class="titulo-cta">
          <span class="texto-impacto">¡No Esperes Más!</span><br>
          <span class="texto-motivacion">Tu Sueño Musical te Está Esperando</span>
        </h2>
        <p class="descripcion-cta">
          Miles de estudiantes ya están tocando acordeón gracias a nuestro método probado.
          <br><strong>Es tu turno de unirte al éxito.</strong>
        </p>
      </div>
    {/if}

    <!-- Beneficios finales -->
    {#if visible}
      <div in:fly="{{ y: 30, duration: 1000, delay: 200, easing: quintOut }}" class="beneficios-finales">
        <h3 class="titulo-beneficios">Lo que Obtienes:</h3>
        <div class="grid-beneficios">
          {#each beneficiosFinales as beneficio, index}
            <div 
              in:fly="{{ x: -30, duration: 500, delay: 300 + (index * 100), easing: quintOut }}"
              class="beneficio-final"
            >
              <span class="check-final">✅</span>
              {beneficio}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Botón principal -->
    {#if visible}
      <div in:scale="{{ start: 0, duration: 1000, delay: 600, easing: quintOut }}" class="accion-principal">
        <button class="boton-mega-cta" on:click={irAlCursoEstrella}>
          <span class="icono-boton">🚀</span>
          <div class="texto-boton">
            <span class="texto-principal">¡EMPEZAR AHORA!</span>
            <span class="texto-secundario">Curso desde cero</span>
          </div>
        </button>
        
        <button class="boton-simulador" on:click={irASimulador}>
          🎮 Simulador (Próximamente)
        </button>
      </div>
    {/if}

    <!-- Garantía -->
    {#if visible}
      <div in:fly="{{ y: 20, duration: 1000, delay: 800, easing: quintOut }}" class="garantia-final">
        <div class="contenido-garantia">
          <div class="icono-garantia">🛡️</div>
          <div class="texto-garantia">
            <h4>Garantía Total de 30 Días</h4>
            <p>Si no estás 100% satisfecho, te devolvemos tu dinero sin preguntas</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Mensaje de cierre -->
    {#if visible}
      <div in:scale="{{ start: 0, duration: 1000, delay: 1000, easing: quintOut }}" class="mensaje-cierre">
        <div class="contenido-cierre">
          <h3>La Música Vallenata Corre por Tus Venas</h3>
          <p>
            No permitas que pase otro día sin tocar. 
            <br><strong>Tu acordeón te está esperando. Es hora de liberarlo.</strong>
          </p>
          
          <div class="frase-motivacional">
            <span class="comillas">"</span>
            <span class="frase">El mejor momento para aprender fue ayer. El segundo mejor momento es AHORA.</span>
            <span class="comillas">"</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .seccion-cta-final {
    padding: 6rem 0;
    background: linear-gradient(135deg, #7c2d12 0%, #dc2626 25%, #b91c1c 50%, #991b1b 75%, #7c2d12 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .seccion-cta-final::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M40 0l40 40-40 40L0 40z'/%3E%3C/g%3E%3C/svg%3E");
    animation: rotatePattern 30s linear infinite;
  }

  @keyframes rotatePattern {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .contenedor {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 2;
  }

  /* Mensaje principal */
  .mensaje-principal {
    text-align: center;
    margin-bottom: 4rem;
  }

  .badge-urgencia {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: 0 15px 40px rgba(251, 191, 36, 0.6);
    }
  }

  .titulo-cta {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }

  .texto-impacto {
    display: block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  .texto-motivacion {
    display: block;
    color: #fecaca;
  }

  .descripcion-cta {
    font-size: 1.3rem;
    color: #fecaca;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Beneficios */
  .beneficios-finales {
    margin-bottom: 4rem;
  }

  .titulo-beneficios {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 800;
    color: #fbbf24;
    margin-bottom: 2rem;
  }

  .grid-beneficios {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .beneficio-final {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .check-final {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  /* Botones de acción */
  .accion-principal {
    text-align: center;
    margin-bottom: 4rem;
  }

  .boton-mega-cta {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    border: none;
    padding: 2rem 3rem;
    border-radius: 20px;
    font-weight: 900;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 15px 40px rgba(251, 191, 36, 0.4);
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0 auto 1.5rem auto;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .boton-mega-cta:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 25px 60px rgba(251, 191, 36, 0.6);
  }

  .icono-boton {
    font-size: 2rem;
  }

  .texto-principal {
    font-size: 1.4rem;
    line-height: 1;
  }

  .texto-secundario {
    font-size: 1rem;
    opacity: 0.8;
    text-transform: none;
    letter-spacing: normal;
  }

  .boton-simulador {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-simulador:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fbbf24;
    color: #fbbf24;
  }

  /* Garantía */
  .garantia-final {
    margin-bottom: 4rem;
  }

  .contenido-garantia {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    max-width: 600px;
    margin: 0 auto;
  }

  .icono-garantia {
    font-size: 3rem;
    flex-shrink: 0;
  }

  .texto-garantia h4 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 0.5rem;
  }

  .texto-garantia p {
    color: #fecaca;
    line-height: 1.4;
  }

  /* Mensaje de cierre */
  .mensaje-cierre {
    text-align: center;
  }

  .contenido-cierre h3 {
    font-size: 2rem;
    font-weight: 800;
    color: #fbbf24;
    margin-bottom: 1rem;
  }

  .contenido-cierre p {
    font-size: 1.2rem;
    color: #fecaca;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .frase-motivacional {
    font-style: italic;
    font-size: 1.1rem;
    color: #fed7aa;
    position: relative;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    max-width: 500px;
    margin: 0 auto;
  }

  .comillas {
    font-size: 2rem;
    color: #fbbf24;
    font-weight: 900;
  }

  .frase {
    font-weight: 600;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .seccion-cta-final {
      padding: 4rem 0;
    }

    .contenedor {
      padding: 0 1rem;
    }

    .grid-beneficios {
      grid-template-columns: 1fr;
    }

    .boton-mega-cta {
      padding: 1.5rem 2rem;
      font-size: 1.2rem;
      flex-direction: column;
      gap: 0.5rem;
    }

    .contenido-garantia {
      flex-direction: column;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .beneficio-final {
      padding: 0.8rem 1rem;
      font-size: 0.9rem;
    }

    .boton-mega-cta {
      padding: 1.2rem 1.5rem;
      font-size: 1rem;
    }
  }
</style> 