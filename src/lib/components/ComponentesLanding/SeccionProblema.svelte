<!-- SeccionProblema.svelte - Sección LIMPIA que amplifica el dolor del cliente -->
<script lang="ts">
  export let tipo: 'curso' | 'tutorial' = 'curso';
  
  // Dolor GENÉRICO y directo
  const dolorPrincipal = {
    titulo: "¿Frustrado Aprendiendo Acordeón Vallenato?",
    subtitulo: "No eres el único... Miles abandonan su sueño musical cada día"
  };
  
  // Solo los problemas MÁS importantes (sin redundancia)
  const problemasCore = [
    {
      icono: "😤",
      titulo: "Te sientes perdido y sin rumbo",
      descripcion: "Has intentado aprender pero no sabes por dónde empezar ni cómo avanzar"
    },
    {
      icono: "⏰", 
      titulo: "Los métodos no funcionan",
      descripcion: "Videos confusos, clases costosas... nada te da los resultados que prometen"
    },
    {
      icono: "🎵",
      titulo: "Ves tu sueño alejarse",
      descripcion: "Otros ya tocan vallenato mientras tú sigues estancado en lo básico"
    }
  ];
  
  // Una sola estadística IMPACTANTE
  const estadisticaImpactante = "85% de las personas abandona aprender acordeón en el primer año";
</script>

<section class="seccion-problema">
  <div class="container">
    
    <!-- Encabezado LIMPIO -->
    <div class="encabezado">
      <h2 class="titulo">
        {dolorPrincipal.titulo}
      </h2>
      <p class="subtitulo">
        {dolorPrincipal.subtitulo}
      </p>
    </div>
    
    <!-- Estadística ÚNICA e impactante -->
    <div class="estadistica-principal">
      <div class="stat-destacado">
        <span class="icono-stat">😞</span>
        <p class="texto-stat">{estadisticaImpactante}</p>
      </div>
    </div>
    
    <!-- Problemas CORE (solo 3, sin redundancia) -->
    <div class="problemas-core">
      <h3 class="titulo-problemas">¿Te identificas con alguno de estos?</h3>
      <div class="problemas-grid">
        {#each problemasCore as problema, index}
          <div class="problema-item" style="animation-delay: {index * 0.1}s">
            <div class="problema-icono">{problema.icono}</div>
            <h4 class="problema-titulo">{problema.titulo}</h4>
            <p class="problema-descripcion">{problema.descripcion}</p>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Transición DIRECTA a la solución -->
    <div class="transicion">
      <div class="mensaje-esperanza">
        <h3 class="titulo-esperanza">
          ✨ Pero hay una solución...
        </h3>
        <p class="descripcion-esperanza">
          Miles ya rompieron este ciclo. <strong>¿Estás listo para ser el siguiente?</strong>
        </p>
      </div>
    </div>
    
  </div>
</section>

<style>
  .seccion-problema {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
    color: #1e293b;
    padding: 4rem 0;
    position: relative;
  }
  
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  /* Encabezado LIMPIO */
  .encabezado {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .titulo {
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 1rem;
    line-height: 1.2;
    color: #1e293b;
  }
  
  .subtitulo {
    font-size: 1.3rem;
    color: #64748b;
    font-weight: 500;
  }
  
  /* Estadística ÚNICA */
  .estadistica-principal {
    margin-bottom: 3rem;
    text-align: center;
  }
  
  .stat-destacado {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 2px solid #f59e0b;
    border-radius: 20px;
    padding: 2rem;
    display: inline-block;
    max-width: 500px;
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
  }
  
  .icono-stat {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 1rem;
  }
  
  .texto-stat {
    font-size: 1.3rem;
    font-weight: 700;
    color: #92400e;
    margin: 0;
    line-height: 1.4;
  }
  
  /* Problemas CORE (sin redundancia) */
  .problemas-core {
    margin-bottom: 3rem;
  }
  
  .titulo-problemas {
    font-size: 1.8rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 2.5rem;
    color: #374151;
  }
  
  .problemas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
  
  .problema-item {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    transform: translateY(20px);
    opacity: 0;
    animation: slideInUp 0.6s ease forwards;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  }
  
  .problema-item:hover {
    transform: translateY(-5px);
    border-color: #dc2626;
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.15);
  }
  
  .problema-icono {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
  }
  
  .problema-titulo {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
  }
  
  .problema-descripcion {
    font-size: 1rem;
    line-height: 1.6;
    color: #64748b;
    margin: 0;
  }
  
  /* Transición LIMPIA */
  .transicion {
    text-align: center;
  }
  
  .mensaje-esperanza {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    border: 2px solid #3b82f6;
    border-radius: 20px;
    padding: 2.5rem;
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  }
  
  .titulo-esperanza {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: #1e40af;
  }
  
  .descripcion-esperanza {
    font-size: 1.2rem;
    color: #1e40af;
    margin: 0;
    line-height: 1.5;
  }
  
  /* Animación simple */
  @keyframes slideInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .seccion-problema {
      padding: 3rem 0;
    }
    
    .container {
      padding: 0 1rem;
    }
    
    .titulo {
      font-size: 2.2rem;
    }
    
    .subtitulo {
      font-size: 1.1rem;
    }
    
    .stat-destacado {
      padding: 1.5rem;
      max-width: 100%;
    }
    
    .texto-stat {
      font-size: 1.1rem;
    }
    
    .problemas-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .problema-item {
      padding: 1.5rem;
    }
    
    .mensaje-esperanza {
      padding: 2rem;
    }
    
    .titulo-esperanza {
      font-size: 1.6rem;
    }
    
    .descripcion-esperanza {
      font-size: 1.1rem;
    }
  }
  
  @media (max-width: 480px) {
    .titulo {
      font-size: 1.8rem;
    }
    
    .stat-destacado {
      padding: 1.2rem;
    }
    
    .icono-stat {
      font-size: 2rem;
    }
    
    .problema-item {
      padding: 1.2rem;
    }
    
    .problema-icono {
      font-size: 2.5rem;
    }
    
    .mensaje-esperanza {
      padding: 1.5rem;
    }
    
    .titulo-esperanza {
      font-size: 1.4rem;
    }
  }
</style> 