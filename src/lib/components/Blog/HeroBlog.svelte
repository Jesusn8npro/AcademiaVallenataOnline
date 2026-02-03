<script lang="ts">
  import { onMount } from 'svelte';
  
  export let titulo = 'Descubre el Mundo del Acordeón';
  export let descripcion = 'Historias inspiradoras, técnicas profesionales y la comunidad más apasionada del acordeón vallenato. Únete a miles de músicos que ya están transformando su música.';
  export let ctaTexto = 'Explorar Artículos';
  export let onCta: () => void = () => {
    window.location.href = '#articulos';
  };

  let tituloAnimado = '';
  let mostrarContenido = false;
  let mouseX = 0;
  let mouseY = 0;
  
  onMount(() => {
    setTimeout(() => mostrarContenido = true, 300);
    
    let index = 0;
    const efectoTyping = setInterval(() => {
      if (index < titulo.length) {
        tituloAnimado += titulo[index];
        index++;
      } else {
        clearInterval(efectoTyping);
      }
    }, 60);
    
    const manejarMovimientoMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 100;
      mouseY = (e.clientY / window.innerHeight) * 100;
    };
    
    window.addEventListener('mousemove', manejarMovimientoMouse);
    
    return () => {
      clearInterval(efectoTyping);
      window.removeEventListener('mousemove', manejarMovimientoMouse);
    };
  });
</script>

<section class="hero-blog" style="--mouse-x: {mouseX}%; --mouse-y: {mouseY}%">
  <!-- Fondos con efectos parallax -->
  <div class="capa-fondo fondo-primario"></div>
  <div class="capa-fondo fondo-secundario"></div>
  <div class="capa-fondo fondo-acento"></div>
  
  <!-- Partículas flotantes -->
  <div class="particulas">
    {#each Array(15) as _, i}
      <div class="particula" style="--delay: {i * 0.4}s; --duration: {5 + i * 0.3}s"></div>
    {/each}
  </div>
  
  <!-- Contenido principal -->
  <div class="contenido-hero" class:mostrar={mostrarContenido}>
    <!-- Título con efecto typing -->
    <h1 class="titulo-hero">
      <span class="texto-titulo">{tituloAnimado}</span>
      <span class="cursor">|</span>
    </h1>
    
    <!-- Subtítulo elegante -->
    <p class="subtitulo-hero">{descripcion}</p>
    
    <!-- Estadísticas impresionantes -->
    <div class="grilla-estadisticas">
      <div class="item-estadistica">
        <span class="numero-estadistica">500+</span>
        <span class="etiqueta-estadistica">Artículos</span>
      </div>
      <div class="item-estadistica">
        <span class="numero-estadistica">15K+</span>
        <span class="etiqueta-estadistica">Lectores</span>
      </div>
      <div class="item-estadistica">
        <span class="numero-estadistica">50+</span>
        <span class="etiqueta-estadistica">Expertos</span>
      </div>
    </div>
    
    <!-- Botón CTA moderno -->
    <button class="boton-cta" on:click={onCta}>
      <span class="texto-cta">{ctaTexto}</span>
      <span class="icono-cta">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </span>
      <div class="brillo-cta"></div>
    </button>
    
    <!-- Notas musicales flotantes -->
    <div class="notas-musicales">
      <span class="nota-musical" style="--delay: 0s;">♪</span>
      <span class="nota-musical" style="--delay: 1.5s;">♫</span>
      <span class="nota-musical" style="--delay: 3s;">♪</span>
      <span class="nota-musical" style="--delay: 0.8s;">♬</span>
    </div>
  </div>
  
  <!-- Indicador de scroll -->
  <div class="indicador-scroll">
    <span>Desliza para explorar</span>
    <div class="flecha-scroll">↓</div>
  </div>
</section>

<style>
  .hero-blog {
    position: relative;
    width: 100%;
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  }
  
  /* Fondos parallax */
  .capa-fondo {
    position: absolute;
    inset: 0;
    opacity: 0.7;
    transition: transform 0.3s ease;
  }
  
  .fondo-primario {
    background: radial-gradient(
      circle at calc(var(--mouse-x) * 0.5) calc(var(--mouse-y) * 0.5),
      #3b82f6 0%,
      #2563eb 30%,
      transparent 60%
    );
    transform: translate(calc(var(--mouse-x) * -0.02px), calc(var(--mouse-y) * -0.02px));
  }
  
  .fondo-secundario {
    background: radial-gradient(
      circle at calc(var(--mouse-x) * 0.8) calc(var(--mouse-y) * 0.8),
      #8b5cf6 0%,
      #7c3aed 25%,
      transparent 50%
    );
    transform: translate(calc(var(--mouse-x) * -0.01px), calc(var(--mouse-y) * -0.01px));
  }
  
  .fondo-acento {
    background: radial-gradient(
      circle at calc(var(--mouse-x) * 1.2) calc(var(--mouse-y) * 1.2),
      #10b981 0%,
      #059669 20%,
      transparent 40%
    );
    transform: translate(calc(var(--mouse-x) * -0.005px), calc(var(--mouse-y) * -0.005px));
  }
  
  /* Partículas optimizadas */
  .particulas {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .particula {
    position: absolute;
    width: 3px;
    height: 3px;
    background: radial-gradient(circle, rgba(255,255,255,0.8), transparent);
    border-radius: 50%;
    opacity: 0.4;
    animation: flotar var(--duration, 5s) var(--delay, 0s) infinite ease-in-out;
    left: calc(var(--mouse-x, 50) * 1%);
    top: calc(var(--mouse-y, 50) * 1%);
  }
  
  @keyframes flotar {
    0%, 100% { 
      transform: translateY(0) translateX(0) scale(1); 
      opacity: 0.4; 
    }
    50% { 
      transform: translateY(-30px) translateX(10px) scale(1.2); 
      opacity: 0.8; 
    }
  }
  
  /* Contenido principal limpio */
  .contenido-hero {
    position: relative;
    z-index: 10;
    text-align: center;
    color: white;
    max-width: 900px;
    padding: 2rem;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .contenido-hero.mostrar {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Título con gradiente */
  .titulo-hero {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #a855f7 40%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  
  .cursor {
    animation: parpadear 1s infinite;
    color: #a855f7;
  }
  
  @keyframes parpadear {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .subtitulo-hero {
    font-size: clamp(1.1rem, 2.5vw, 1.4rem);
    line-height: 1.6;
    margin-bottom: 3rem;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 400;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* Estadísticas elegantes */
  .grilla-estadisticas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-bottom: 3rem;
    padding: 2rem 0;
  }
  
  .item-estadistica {
    text-align: center;
  }
  
  .numero-estadistica {
    display: block;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 900;
    background: linear-gradient(135deg, #10b981, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .etiqueta-estadistica {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
  
  /* Botón CTA elegante */
  .boton-cta {
    position: relative;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
    border: none;
    border-radius: 50px;
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
  }
  
  .boton-cta:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
  }
  
  .boton-cta:hover .icono-cta {
    transform: translateX(5px);
  }
  
  .brillo-cta {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  .boton-cta:hover .brillo-cta {
    transform: translateX(100%);
  }
  
  .icono-cta {
    transition: transform 0.3s ease;
  }
  
  /* Notas musicales mejoradas */
  .notas-musicales {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  .nota-musical {
    position: absolute;
    font-size: 1.8rem;
    color: rgba(255, 255, 255, 0.2);
    animation: flotarMusica 8s var(--delay, 0s) infinite ease-in-out;
  }
  
  .nota-musical:nth-child(1) { top: 15%; left: 8%; }
  .nota-musical:nth-child(2) { top: 65%; right: 12%; }
  .nota-musical:nth-child(3) { bottom: 25%; left: 15%; }
  .nota-musical:nth-child(4) { top: 35%; right: 20%; }
  
  @keyframes flotarMusica {
    0%, 100% { 
      transform: translateY(0) rotate(0deg); 
      opacity: 0.2; 
    }
    50% { 
      transform: translateY(-20px) rotate(10deg); 
      opacity: 0.6; 
    }
  }
  
  /* Indicador de scroll minimalista */
  .indicador-scroll {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    z-index: 20;
  }
  
  .flecha-scroll {
    font-size: 1.5rem;
    animation: rebotar 2s infinite;
    margin-top: 0.5rem;
  }
  
  @keyframes rebotar {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    60% { transform: translateY(-4px); }
  }
  
  /* Responsive optimizado */
  @media (max-width: 768px) {
    .contenido-hero {
      padding: 1.5rem;
    }
    
    .grilla-estadisticas {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .boton-cta {
      padding: 0.9rem 2rem;
      font-size: 1rem;
    }
    
    .nota-musical {
      font-size: 1.4rem;
    }
  }
</style>

