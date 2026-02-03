<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let visible = false;
  let contadorIniciado = false;

  // Estados para contadores
  let estudiantesCount = 0;
  let satisfaccionCount = 0;
  let reseniasCount = 0;
  let experienciaCount = 0;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !contadorIniciado) {
          visible = true;
          contadorIniciado = true;
          setTimeout(() => animarContadores(), 500);
        }
      });
    });

    const section = document.querySelector('.seccion-stats');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function animarContadores() {
    animarNumero(1247, 2000, (valor) => estudiantesCount = valor);
    animarNumero(4.8, 1500, (valor) => satisfaccionCount = Math.round(valor * 10) / 10);
    animarNumero(312, 1800, (valor) => reseniasCount = valor);
    animarNumero(10, 1200, (valor) => experienciaCount = valor);
  }

  function animarNumero(objetivo: number, duracion: number, callback: (valor: number) => void) {
    const inicio = performance.now();
    
    function actualizar(tiempoActual: number) {
      const progreso = Math.min((tiempoActual - inicio) / duracion, 1);
      const easeOut = 1 - Math.pow(1 - progreso, 4);
      const valorActual = objetivo * easeOut;
      
      callback(Math.floor(valorActual));
      if (progreso < 1) requestAnimationFrame(actualizar);
      else callback(objetivo);
    }

    requestAnimationFrame(actualizar);
  }

  const estadisticas = [
    {
      numero: () => estudiantesCount.toLocaleString(),
      sufijo: '+',
      titulo: 'Estudiantes Transformados',
      icono: '👥',
      testimonio: '"Jesús cambió mi vida. En 3 semanas ya tocaba en fiestas familiares" - Carlos M.',
      destacado: true
    },
    {
      numero: () => satisfaccionCount.toString(),
      sufijo: '/5',
      titulo: 'Calificación Real',
      icono: '⭐',
      testimonio: '"El mejor maestro de acordeón que encontré en internet" - María L.',
      destacado: true
    },
    {
      numero: () => reseniasCount.toString(),
      sufijo: '',
      titulo: 'Reseñas Auténticas',
      icono: '📝',
      testimonio: '"Mi hijo de 12 años ya toca mejor que yo" - Roberto P.',
      destacado: false
    },
    {
      numero: () => experienciaCount.toString(),
      sufijo: '+',
      titulo: 'Años Profesionales',
      icono: '🏆',
      testimonio: '"Se nota la experiencia de Jesús en cada clase" - Ana G.',
      destacado: false
    }
  ];

  const logrosExtras = [
    { titulo: 'Primera Canción', valor: '7 días', descripcion: 'Promedio de estudiantes que logran tocar su primera canción completa' },
    { titulo: 'Tasa de Éxito', valor: '89%', descripcion: 'De estudiantes que completan su primer mes de aprendizaje' },
    { titulo: 'Satisfacción', valor: '96%', descripcion: 'Recomendarían la academia a familiares y amigos' }
  ];
</script>

<section class="seccion-stats">
  <div class="contenedor">
    
    <!-- Header vendedor -->
    {#if visible}
      <div in:fly="{{ y: 50, duration: 1000, easing: quintOut }}" class="header">
        <div class="badge-proof">🏆 RESULTADOS COMPROBADOS</div>
        <h2 class="titulo">Los Números NO Mienten</h2>
        <p class="descripcion">
          Mientras otras academias prometen, <strong>nosotros demostramos</strong> con resultados reales
          <br>de estudiantes que ya están <strong>viviendo su sueño musical.</strong>
        </p>
      </div>
    {/if}

    <!-- Grid de estadísticas principales -->
    <div class="grid-stats">
      {#each estadisticas as stat, index}
        {#if visible}
          <div 
            in:scale="{{ start: 0, duration: 800, delay: 200 + (index * 150), easing: quintOut }}"
            class="stat-card"
            class:destacado={stat.destacado}
          >
            <div class="icono">{stat.icono}</div>
            <div class="numero">
              {stat.numero()}<span class="sufijo">{stat.sufijo}</span>
            </div>
            <div class="titulo-stat">{stat.titulo}</div>
            
            <!-- Testimonio sutil -->
            <div class="testimonio-sutil">
              <div class="comillas-mini">"</div>
              <p class="texto-testimonio">{stat.testimonio}</p>
            </div>
            
            {#if stat.destacado}
              <div class="badge-destacado">✨ MÁS POPULAR</div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    <!-- Logros comprobados -->
    {#if visible}
      <div in:fly="{{ y: 30, duration: 1000, delay: 800, easing: quintOut }}" class="logros-comprobados">
        <h3 class="titulo-logros">Métricas que Importan de Verdad</h3>
        
        <div class="grid-logros">
          {#each logrosExtras as logro, index}
            <div 
              in:scale="{{ start: 0, duration: 600, delay: 900 + (index * 100), easing: quintOut }}"
              class="logro-card"
            >
              <div class="valor-logro">{logro.valor}</div>
              <div class="titulo-logro">{logro.titulo}</div>
              <div class="descripcion-logro">{logro.descripcion}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Mensaje vendedor final -->
    {#if visible}
      <div in:scale="{{ start: 0, duration: 1000, delay: 1200, easing: quintOut }}" class="mensaje-vendedor">
        <div class="contenido-vendedor">
          <h3>¿Aún Tienes Dudas?</h3>
          <p>
            <strong>{estudiantesCount.toLocaleString()}+ estudiantes</strong> confiaron en nosotros y 
            <strong>NO se arrepintieron.</strong> Sus vidas musicales cambiaron para siempre.
          </p>
          <div class="frase-impacto">
            "La diferencia entre soñar y lograr está en elegir al <strong>maestro correcto.</strong>"
          </div>
        </div>
      </div>
    {/if}

  </div>
</section>

<style>
  .seccion-stats {
    padding: 6rem 0;
    background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .seccion-stats::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/svg%3E");
    animation: floatPattern 20s linear infinite;
  }

  @keyframes floatPattern {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-60px) rotate(360deg); }
  }

  .contenedor {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 2;
  }

  .header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .badge-proof {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
    }
    50% { 
      transform: scale(1.02);
      box-shadow: 0 12px 35px rgba(251, 191, 36, 0.6);
    }
  }

  .titulo {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 900;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }

  .descripcion {
    font-size: 1.3rem;
    color: #cbd5e1;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .grid-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 5rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
  }

  .stat-card:hover {
    background: rgba(251, 191, 36, 0.1);
    transform: translateY(-10px);
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .stat-card.destacado {
    background: rgba(251, 191, 36, 0.08);
    border: 2px solid rgba(251, 191, 36, 0.3);
    transform: scale(1.02);
  }

  .stat-card.destacado:hover {
    transform: translateY(-10px) scale(1.02);
  }

  .icono {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  }

  .numero {
    font-size: 4rem;
    font-weight: 900;
    color: #fbbf24;
    margin-bottom: 0.5rem;
    line-height: 1;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .sufijo {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .titulo-stat {
    font-size: 1.2rem;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 1.5rem;
  }

  /* Testimonios sutiles */
  .testimonio-sutil {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
    border-left: 3px solid #fbbf24;
    position: relative;
  }

  .comillas-mini {
    position: absolute;
    top: -0.5rem;
    left: 0.5rem;
    font-size: 2rem;
    color: #fbbf24;
    font-weight: 900;
  }

  .texto-testimonio {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-style: italic;
    line-height: 1.4;
    margin: 0;
    padding-left: 1rem;
  }

  .badge-destacado {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Logros comprobados */
  .logros-comprobados {
    margin-bottom: 4rem;
  }

  .titulo-logros {
    text-align: center;
    font-size: 2.2rem;
    font-weight: 800;
    color: #fbbf24;
    margin-bottom: 3rem;
  }

  .grid-logros {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .logro-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .logro-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-5px);
    border-color: rgba(251, 191, 36, 0.3);
  }

  .valor-logro {
    font-size: 2.5rem;
    font-weight: 900;
    color: #fbbf24;
    margin-bottom: 0.5rem;
  }

  .titulo-logro {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 0.8rem;
  }

  .descripcion-logro {
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Mensaje vendedor */
  .mensaje-vendedor {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1));
    border: 2px solid rgba(251, 191, 36, 0.3);
    border-radius: 20px;
    padding: 3rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .mensaje-vendedor::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M20 0l20 20-20 20L0 20z'/%3E%3C/g%3E%3C/svg%3E");
    animation: rotatePattern 25s linear infinite;
  }

  .contenido-vendedor {
    position: relative;
    z-index: 2;
  }

  .contenido-vendedor h3 {
    font-size: 2rem;
    font-weight: 900;
    color: #fbbf24;
    margin-bottom: 1rem;
  }

  .contenido-vendedor p {
    font-size: 1.2rem;
    color: #e2e8f0;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .frase-impacto {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fbbf24;
    font-style: italic;
    background: rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #fbbf24;
  }

  @keyframes rotatePattern {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .grid-logros {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .seccion-stats {
      padding: 4rem 0;
    }

    .contenedor {
      padding: 0 1rem;
    }

    .grid-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .stat-card {
      padding: 2rem 1.5rem;
    }

    .stat-card.destacado {
      transform: none;
    }

    .numero {
      font-size: 3rem;
    }

    .sufijo {
      font-size: 2rem;
    }

    .mensaje-vendedor {
      padding: 2rem 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .grid-stats {
      grid-template-columns: 1fr;
    }

    .numero {
      font-size: 2.5rem;
    }

    .sufijo {
      font-size: 1.8rem;
    }

    .testimonio-sutil {
      padding: 0.8rem;
    }

    .texto-testimonio {
      font-size: 0.8rem;
    }
  }
</style> 