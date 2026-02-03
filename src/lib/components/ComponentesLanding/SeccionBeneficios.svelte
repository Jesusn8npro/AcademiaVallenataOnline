<!-- SeccionBeneficios.svelte - Sección vendedora y persuasiva -->
<script lang="ts">
  export const contenido: any = {}; // Curso o tutorial (externa)
  export const tipo: 'curso' | 'tutorial' = 'curso'; // Externa
  
  // Estadísticas impactantes (estáticas para generar confianza)
  const estadisticas = [
    { numero: "15,000+", texto: "Estudiantes Activos", icono: "👥" },
    { numero: "98%", texto: "Satisfacción Garantizada", icono: "⭐" },
    { numero: "500+", texto: "Canciones Enseñadas", icono: "🎵" },
    { numero: "24/7", texto: "Soporte Disponible", icono: "🔧" }
  ];
</script>

<section class="seccion-beneficios">
  <div class="container">
    
    <!-- Encabezado súper vendedor -->
    <div class="encabezado">
      <div class="badge-superior">
        <span class="badge-texto">🔥 LA MEJOR DECISIÓN DE TU VIDA MUSICAL</span>
      </div>
      <h2 class="titulo-principal">
        ¿Por Qué Nuestros Cursos Son 
        <span class="texto-destacado">IRRESISTIBLES?</span>
      </h2>
      <p class="subtitulo-vendedor">
        Más de <strong>15,000 estudiantes</strong> ya transformaron su vida musical. 
        <br><span class="texto-urgencia">¡Es tu turno de brillar!</span>
      </p>
    </div>
    
    <!-- Estadísticas impactantes -->
    <div class="estadisticas">
      {#each estadisticas as stat, index}
        <div class="stat-card" style="animation-delay: {index * 0.1}s">
          <div class="stat-icono">{stat.icono}</div>
          <div class="stat-numero">{stat.numero}</div>
          <div class="stat-texto">{stat.texto}</div>
        </div>
      {/each}
    </div>
    
    <!-- CTA final súper persuasivo -->
    <div class="cta-final">
      <div class="cta-contenido">
        <div class="cta-urgencia">⚡ OFERTA POR TIEMPO LIMITADO</div>
        <h3 class="cta-titulo">¡NO DEJES QUE OTRO DÍA PASE SIN TOCAR!</h3>
        <p class="cta-descripcion">
          Únete a los <strong>15,000+ estudiantes</strong> que ya están viviendo su sueño musical.
        </p>
        <div class="garantias">
          <div class="garantia-item">
            <span class="garantia-icono">🛡️</span>
            <span>Garantía 30 días o tu dinero de vuelta</span>
          </div>
          <div class="garantia-item">
            <span class="garantia-icono">🎁</span>
            <span>Bonos gratuitos valorados en $200</span>
          </div>
          <div class="garantia-item">
            <span class="garantia-icono">⚡</span>
            <span>Acceso inmediato 24/7</span>
          </div>
        </div>
      </div>
    </div>
    
  </div>
  
  <!-- Elementos decorativos -->
  <div class="decoracion-1"></div>
  <div class="decoracion-2"></div>
  <div class="decoracion-3"></div>
</section>

<style>
  .seccion-beneficios {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
    position: relative;
    padding: 5rem 0;
    overflow: hidden;
  }
  
  /* Elementos decorativos */
  .decoracion-1 {
    position: absolute;
    top: 10%;
    right: -5%;
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    border-radius: 50%;
    opacity: 0.1;
    animation: float 6s ease-in-out infinite;
  }
  
  .decoracion-2 {
    position: absolute;
    bottom: 20%;
    left: -5%;
    width: 150px;
    height: 150px;
    background: linear-gradient(45deg, #8b5cf6, #a855f7);
    border-radius: 50%;
    opacity: 0.1;
    animation: float 8s ease-in-out infinite reverse;
  }
  
  .decoracion-3 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: linear-gradient(45deg, #10b981, #059669);
    border-radius: 50%;
    opacity: 0.05;
    animation: pulse 4s ease-in-out infinite;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }
  
  /* Encabezado */
  .encabezado {
    text-align: center;
    margin-bottom: 4rem;
  }
  
  .badge-superior {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }
  
  .titulo-principal {
    font-size: 3rem;
    font-weight: 900;
    color: #1e293b;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }
  
  .texto-destacado {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: inline-block;
    animation: shine 3s ease-in-out infinite;
  }
  
  .subtitulo-vendedor {
    font-size: 1.3rem;
    color: #475569;
    margin-bottom: 2rem;
  }
  
  .texto-urgencia {
    color: #dc2626;
    font-weight: 700;
    font-size: 1.1em;
  }
  
  /* Estadísticas */
  .estadisticas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }
  
  .stat-card {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transform: translateY(20px);
    opacity: 0;
    animation: slideInUp 0.8s ease forwards;
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: #8b5cf6;
  }
  
  .stat-icono {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .stat-numero {
    font-size: 2.5rem;
    font-weight: 900;
    color: #8b5cf6;
    margin-bottom: 0.5rem;
  }
  
  .stat-texto {
    font-weight: 600;
    color: #475569;
  }
  
  /* CTA final */
  .cta-final {
    background: linear-gradient(135deg, #1e293b, #334155);
    color: white;
    padding: 3rem;
    border-radius: 25px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .cta-final::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #fbbf24, #f59e0b, #8b5cf6, #ec4899);
    opacity: 0.1;
    animation: gradient-shift 3s ease-in-out infinite;
  }
  
  .cta-contenido {
    position: relative;
    z-index: 1;
  }
  
  .cta-urgencia {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    display: inline-block;
    margin-bottom: 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }
  
  .cta-titulo {
    font-size: 2.2rem;
    font-weight: 900;
    margin-bottom: 1rem;
    color: #fbbf24;
  }
  
  .cta-descripcion {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #cbd5e1;
  }
  
  .garantias {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .garantia-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
  }
  
  .garantia-icono {
    font-size: 1.5rem;
  }
  
  /* Animaciones */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes slideInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shine {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
  }
  
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .seccion-beneficios {
      padding: 3rem 0;
    }
    
    .container {
      padding: 0 1rem;
    }
    
    .titulo-principal {
      font-size: 2.2rem;
    }
    
    .subtitulo-vendedor {
      font-size: 1.1rem;
    }
    
    .estadisticas {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .stat-card {
      padding: 1.5rem;
    }
    
    .stat-numero {
      font-size: 2rem;
    }
    
    .cta-final {
      padding: 2rem;
    }
    
    .cta-titulo {
      font-size: 1.8rem;
    }
    
    .garantias {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 480px) {
    .titulo-principal {
      font-size: 1.8rem;
    }
    
    .estadisticas {
      grid-template-columns: 1fr;
    }
    
    .cta-final {
      padding: 1.5rem;
    }
    
    .cta-titulo {
      font-size: 1.5rem;
    }
  }
</style>
