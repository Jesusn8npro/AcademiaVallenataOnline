<!-- SeccionSolucion.svelte - LA RESPUESTA al problema del cliente -->
<script lang="ts">
  export let tipo: 'curso' | 'tutorial' = 'curso';
  
  // Mensaje principal de la solución
  const solucionPrincipal = {
    titulo: "¡AQUÍ ESTÁ TU SOLUCIÓN DEFINITIVA!",
    subtitulo: "Nuestra metodología COMPROBADA ha transformado a miles de estudiantes"
  };
  
  // Metodología EFECTIVA (los 4 pilares)
  const metodologia = [
    {
      numero: "01",
      titulo: "Paso a Paso GARANTIZADO",
      descripcion: "Sistema progresivo que te lleva desde cero hasta tocar como un profesional",
      icono: "🎯",
      beneficio: "Sin confusión, sin perderte"
    },
    {
      numero: "02", 
      titulo: "Material INTERACTIVO",
      descripcion: "Videos HD, partituras digitales, ejercicios prácticos y herramientas exclusivas",
      icono: "💻",
      beneficio: "Aprende haciendo, no solo viendo"
    },
    {
      numero: "03",
      titulo: "Sistema de PUNTAJES",
      descripcion: "Completa actividades, gana puntos y desbloquea nuevos niveles de aprendizaje",
      icono: "🏆",
      beneficio: "Motivación constante garantizada"
    },
    {
      numero: "04",
      titulo: "Resultados COMPROBADOS",
      descripcion: "Metodología probada con miles de estudiantes que ya tocan sus canciones favoritas",
      icono: "✅",
      beneficio: "Tu éxito está garantizado"
    }
  ];
  

</script>

<section class="seccion-solucion">
  <div class="container">
    
    <!-- Encabezado IMPACTANTE -->
    <div class="encabezado-solucion">
      <div class="badge-solucion">
        <span class="badge-texto">⚡ LA RESPUESTA QUE BUSCABAS</span>
      </div>
      <h2 class="titulo-solucion">
        {solucionPrincipal.titulo}
      </h2>
      <p class="subtitulo-solucion">
        {solucionPrincipal.subtitulo}
      </p>
      <div class="linea-dorada"></div>
    </div>
    
    <!-- Metodología de 4 PILARES -->
    <div class="metodologia-container">
      <h3 class="titulo-metodologia">
        🚀 Nuestra Metodología REVOLUCIONARIA
      </h3>
      <div class="pilares-grid">
        {#each metodologia as pilar, index}
          <div class="pilar-card" style="animation-delay: {index * 0.15}s">
            <div class="pilar-numero">{pilar.numero}</div>
            <div class="pilar-icono">{pilar.icono}</div>
            <h4 class="pilar-titulo">{pilar.titulo}</h4>
            <p class="pilar-descripcion">{pilar.descripcion}</p>
            <div class="pilar-beneficio">
              <span class="beneficio-texto">💡 {pilar.beneficio}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
    

    

    

    
  </div>
  
  <!-- Elementos decorativos -->
  <div class="decoracion-nota-1">🎵</div>
  <div class="decoracion-nota-2">🎶</div>
  <div class="decoracion-estrella">⭐</div>
</section>

<style>
  .seccion-solucion {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: white;
    padding: 5rem 0;
    position: relative;
    overflow: hidden;
  }
  
  /* Elementos decorativos flotantes */
  .decoracion-nota-1 {
    position: absolute;
    top: 10%;
    right: 5%;
    font-size: 4rem;
    opacity: 0.1;
    animation: float 6s ease-in-out infinite;
  }
  
  .decoracion-nota-2 {
    position: absolute;
    bottom: 20%;
    left: 3%;
    font-size: 3rem;
    opacity: 0.1;
    animation: float 8s ease-in-out infinite reverse;
  }
  
  .decoracion-estrella {
    position: absolute;
    top: 30%;
    left: 10%;
    font-size: 2rem;
    opacity: 0.2;
    animation: twinkle 4s ease-in-out infinite;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }
  
  /* Encabezado IMPACTANTE */
  .encabezado-solucion {
    text-align: center;
    margin-bottom: 4rem;
  }
  
  .badge-solucion {
    display: inline-block;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
    animation: pulse-success 2s ease-in-out infinite;
  }
  
  .titulo-solucion {
    font-size: 3.5rem;
    font-weight: 900;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .subtitulo-solucion {
    font-size: 1.4rem;
    color: #cbd5e1;
    margin-bottom: 2rem;
    font-weight: 500;
  }
  
  .linea-dorada {
    width: 120px;
    height: 4px;
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    margin: 0 auto;
    border-radius: 2px;
  }
  
  /* Metodología de 4 PILARES */
  .metodologia-container {
    margin-bottom: 5rem;
  }
  
  .titulo-metodologia {
    font-size: 2.5rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 3rem;
    color: #f1f5f9;
  }
  
  .pilares-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
  
  .pilar-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    padding: 2.5rem;
    text-align: center;
    backdrop-filter: blur(10px);
    transform: translateY(40px);
    opacity: 0;
    animation: slideInUp 0.8s ease forwards;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
  }
  
  .pilar-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #fbbf24);
  }
  
  .pilar-card:hover {
    transform: translateY(-10px);
    border-color: #10b981;
    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
  }
  
  .pilar-numero {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    font-weight: 900;
    color: rgba(251, 191, 36, 0.5);
  }
  
  .pilar-icono {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .pilar-titulo {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 1rem;
  }
  
  .pilar-descripcion {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #cbd5e1;
    margin-bottom: 1.5rem;
  }
  
  .pilar-beneficio {
    background: rgba(16, 185, 129, 0.2);
    border-radius: 10px;
    padding: 1rem;
    border-left: 4px solid #10b981;
  }
  
  .beneficio-texto {
    font-weight: 600;
    color: #6ee7b7;
    font-style: italic;
  }
  

  

  

  
  /* Animaciones */
  @keyframes slideInUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse-success {
    0%, 100% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
  }
  

  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  
  @keyframes twinkle {
    0%, 100% {
      opacity: 0.2;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .seccion-solucion {
      padding: 4rem 0;
    }
    
    .container {
      padding: 0 1rem;
    }
    
    .titulo-solucion {
      font-size: 2.5rem;
    }
    
    .subtitulo-solucion {
      font-size: 1.2rem;
    }
    
    .pilares-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .pilar-card {
      padding: 2rem;
    }
    

  }
  
  @media (max-width: 480px) {
    .titulo-solucion {
      font-size: 2rem;
    }
    
    .titulo-metodologia {
      font-size: 2rem;
    }
    
    .pilar-card {
      padding: 1.5rem;
    }
    
    .pilares-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 