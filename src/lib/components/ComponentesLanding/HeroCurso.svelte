<!-- HeroCurso.svelte - Hero comprimido y funcional -->
<script lang="ts">
  // Props
  export let curso: any = {};
  export let estaInscrito: boolean = false;
  export let handleInscripcion: () => Promise<void>;
  export let verContenido: () => void;
  
  // Determinar el tipo de contenido
  $: tipoContenido = curso?.tipo || 'curso'; // 'curso' o 'tutorial'
  
  // Textos dinámicos según el tipo y estado
  $: textoBotonInscripcion = esGratis 
    ? (tipoContenido === 'tutorial' ? '🚀 ¡INSCRIBIRME GRATIS!' : '🚀 ¡INSCRIBIRME GRATIS!')
    : (tipoContenido === 'tutorial' ? '💳 ¡COMPRAR TUTORIAL!' : '💳 ¡COMPRAR CURSO!');
    
  $: textoBotonContinuar = tipoContenido === 'tutorial' 
    ? '🚀 Comenzar Tutorial' 
    : '🚀 Comenzar Curso';
  
  // Estados
  let showVideo = false;
  
  // Función para mostrar video
  function toggleVideo() {
    showVideo = !showVideo;
  }
  
  // Formatear precio
  function formatearPrecio(precio: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }
  
  // Calcular precio con descuento (usando precio_rebajado como en GridCursos)
  $: precioOriginal = curso.precio_normal || 0;
  $: precioRebajado = curso.precio_rebajado || 0;
  $: precioFinal = precioRebajado && precioRebajado > 0 ? precioRebajado : precioOriginal;
  $: hayDescuento = precioRebajado && precioRebajado < precioOriginal;
  $: esGratis = precioFinal === 0;
  
  // Objetivos por defecto optimizados
  const objetivosDefault = [
    "Aprenderás teoría musical",
    "Como se forman los acordes", 
    "Que es una nota",
    "Podrás improvisar",
    "Técnicas avanzadas",
    "Desarrollar habilidades profesionales"
  ];

  // MEJORAR: Función para obtener objetivos reales - maneja arrays, strings con líneas Y comas
  $: objetivosFinales = (() => {
    console.log('[HeroCurso] Procesando objetivos:', curso.objetivos);
    console.log('[HeroCurso] Tipo:', typeof curso.objetivos);
    
    // Si hay objetivos como array y no está vacío
    if (Array.isArray(curso.objetivos) && curso.objetivos.length > 0) {
      const objetivosProcesados = curso.objetivos.filter((obj: any) => {
        // Si el objetivo es un objeto con texto
        if (typeof obj === 'object' && obj.texto) {
          return obj.texto.trim() !== '';
        }
        // Si el objetivo es un string
        return typeof obj === 'string' && obj.trim() !== '';
      }).map((obj: any) => {
        // Normalizar a string
        return typeof obj === 'object' && obj.texto ? obj.texto : obj;
      });
      
      console.log('[HeroCurso] Objetivos de array procesados:', objetivosProcesados);
      return objetivosProcesados;
    }
    
    // Si hay objetivos como string
    else if (typeof curso.objetivos === 'string' && curso.objetivos.trim() !== '') {
      let objetivosSeparados: string[] = [];
      
      // NUEVO: Intentar separar por comas primero (para tutoriales)
      if (curso.objetivos.includes(',')) {
        objetivosSeparados = curso.objetivos.split(',').map((o: string) => o.trim()).filter((o: string) => o !== '');
        console.log('[HeroCurso] Objetivos separados por comas:', objetivosSeparados);
      }
      // Si no hay comas, separar por líneas (método original)
      else {
        objetivosSeparados = curso.objetivos.split('\n').map((o: string) => o.trim()).filter((o: string) => o !== '');
        console.log('[HeroCurso] Objetivos separados por líneas:', objetivosSeparados);
      }
      
      return objetivosSeparados.length > 0 ? objetivosSeparados : objetivosDefault;
    }
    
    // Fallback a objetivos por defecto
    console.log('[HeroCurso] Usando objetivos por defecto');
    return objetivosDefault;
  })();

  console.log('[HeroCurso] DEBUG objetivos:', {
    'curso.objetivos': curso.objetivos,
    'tipo objetivos': typeof curso.objetivos,
    'es array': Array.isArray(curso.objetivos),
    'objetivosFinales': objetivosFinales
  });
</script>

<section class="hero">
  <div class="container">
    
    <!-- Badge superior -->
    <div class="badge">
      <span class="categoria">{curso.categoria || 'Simulación 3D'}</span>
      <div class="avatars">
        {#each Array(3) as _, i}
          <div class="avatar"></div>
        {/each}
      </div>
      <span class="estudiantes">+{curso.total_estudiantes || 1} estudiantes</span>
    </div>
    
    <div class="content">
      
      <!-- Lado izquierdo -->
      <div class="left">
        <h1 class="titulo">{curso.titulo}</h1>
        
        <p class="descripcion">
          {curso.descripcion_corta || curso.descripcion || 'Domina este curso y desarrolla tus habilidades de forma profesional.'}
        </p>
        
        <!-- Objetivos MEJORADOS -->
        <div class="objetivos">
          {#each objetivosFinales as objetivo, i}
            <div class="objetivo">
              <div class="check-icon">✓</div>
              <span>{objetivo}</span>
            </div>
          {/each}
        </div>
        
        <!-- Precio -->
        <div class="precio-container">
          {#if !esGratis}
            {#if hayDescuento}
              <span class="precio-tachado">{formatearPrecio(precioOriginal)}</span>
            {/if}
            <span class="precio">{formatearPrecio(precioFinal)}</span>
          {:else}
            <span class="precio-gratis">Gratis</span>
          {/if}
        </div>
        
        <div class="acceso">
          <span class="check">✓</span>
          <span>Pago único - Acceso de por vida</span>
        </div>
        
        <!-- Botones -->
        <div class="botones">
          {#if estaInscrito}
            <button class="btn-principal" on:click={verContenido}>
              {textoBotonContinuar}
            </button>
            <!-- No mostrar botón secundario cuando está inscrito -->
          {:else}
            <button class="btn-principal" on:click={handleInscripcion}>
              {textoBotonInscripcion}
            </button>
            <button class="btn-secundario">Ver más detalles</button>
          {/if}
        </div>
        
        <div class="garantia">
          <span class="check">✓</span>
          <span>Garantía de satisfacción 30 días o te devolvemos tu dinero</span>
        </div>
      </div>
      
      <!-- Lado derecho -->
      <div class="right">
        <div class="video-card">
          <div class="video-preview">
            {#if curso.imagen_url}
              <img src={curso.imagen_url} alt={curso.titulo} class="thumbnail" />
            {:else}
              <div class="placeholder">
                <div class="play-icon">▶</div>
              </div>
            {/if}
            <button class="play-btn" on:click={toggleVideo}>
              <div class="play-icon">▶</div>
            </button>
            <div class="preview-label">Vista previa</div>
          </div>
          
          <div class="rating">
            <div class="stars">★★★★★</div>
            <span class="rating-text">4.9/5 - 1+ estudiantes</span>
          </div>
          
          <div class="testimonial">
            <p>"Este curso superó mis expectativas. El contenido es claro y la metodología increíble. Recomendado 100%."</p>
            <cite>- Carlos M.</cite>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</section>

<style>
  .hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
    color: white;
    padding: 4rem 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 25px;
    padding: 8px 16px;
    margin-bottom: 2rem;
    font-size: 14px;
  }
  
  .categoria {
    color: #a855f7;
    font-weight: 600;
  }
  
  .avatars {
    display: flex;
    margin-left: 4px;
  }
  
  .avatar {
    width: 20px;
    height: 20px;
    background: linear-gradient(45deg, #f59e0b, #ef4444);
    border-radius: 50%;
    border: 2px solid #1a1a2e;
    margin-left: -4px;
  }
  
  .estudiantes {
    color: #d1d5db;
    font-size: 13px;
  }
  
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }
  
  .left {
    padding-right: 1rem;
  }
  
  .titulo {
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    color: white;
  }
  
  .descripcion {
    font-size: 1.1rem;
    color: #d1d5db;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
  
  .objetivos {
    margin-bottom: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
  }
  
  .objetivo {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .check-icon {
    width: 20px;
    height: 20px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
  
  .precio-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  
  .precio-tachado {
    text-decoration: line-through;
    color: #9ca3af;
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0.7;
    position: relative;
  }

  .precio-tachado::before {
    content: "Antes: ";
    font-weight: 400;
    color: #6b7280;
  }
  
  .precio {
    font-size: 2.5rem;
    font-weight: 900;
    color: #ef4444;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }
  
  .precio::after {
    content: "¡AHORA!";
    font-size: 0.7rem;
    background: linear-gradient(45deg, #ef4444, #dc2626);
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-weight: 700;
    animation: pulse 2s infinite;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    position: absolute;
    top: -8px;
    right: -60px;
  }

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }
    50% { 
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
    }
  }
  
  .precio-gratis {
    font-size: 2.2rem;
    font-weight: 800;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 0.5rem 1.5rem;
    border-radius: 25px;
    text-align: center;
  }
  
  .acceso, .garantia {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #d1d5db;
    font-size: 14px;
    margin-bottom: 2rem;
  }
  
  .garantia {
    color: #9ca3af;
    margin-bottom: 0;
  }
  
  .check {
    color: #10b981;
    font-weight: bold;
  }
  
  .botones {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .btn-principal {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    padding: 14px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
  }
  
  .btn-principal:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  }
  
  .btn-secundario {
    background: transparent;
    color: #a855f7;
    border: 1px solid #a855f7;
    padding: 14px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .btn-secundario:hover {
    background: rgba(168, 85, 247, 0.1);
  }
  
  .right {
    position: relative;
  }
  
  .video-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .video-preview {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    aspect-ratio: 16/9;
  }
  
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    background: #1a1a1a;
  }
  
  .placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #374151, #1f2937);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .play-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translate(-50%, -50%) scale(1.05);
  }
  
  .play-icon {
    color: white;
    font-size: 18px;
    margin-left: 2px;
  }
  
  .preview-label {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .stars {
    color: #fbbf24;
    font-size: 18px;
  }
  
  .rating-text {
    color: #d1d5db;
    font-size: 14px;
  }
  
  .testimonial {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px;
    border-left: 3px solid #8b5cf6;
  }
  
  .testimonial p {
    color: #e5e7eb;
    font-style: italic;
    margin-bottom: 8px;
    line-height: 1.5;
    font-size: 14px;
  }
  
  .testimonial cite {
    color: #9ca3af;
    font-size: 13px;
    font-style: normal;
  }
  
  /* MEJORAR RESPONSIVE - Más específico para móviles */
  @media (max-width: 768px) {
    .hero { 
      padding: 2.5rem 0; 
    }
    
    .container { 
      padding: 0 1rem; 
    }
    
    .content { 
      grid-template-columns: 1fr; 
      gap: 2.5rem; 
    }
    
    .left { 
      padding-right: 0; 
    }
    
    .titulo { 
      font-size: 2.2rem; 
      line-height: 1.2;
    }
    
    .descripcion {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .objetivos { 
      grid-template-columns: 1fr; 
      gap: 10px;
      margin-bottom: 1.5rem;
    }
    
    .objetivo {
      gap: 10px;
    }
    
    .objetivo span {
      font-size: 14px;
    }
    
    .botones { 
      flex-direction: column; 
      gap: 0.8rem; 
    }
    
    .btn-principal, .btn-secundario {
      width: 100%;
      text-align: center;
    }
    
    .precio {
      font-size: 2rem;
    }

    .precio::after {
      font-size: 0.6rem;
      padding: 0.2rem 0.6rem;
      right: -50px;
    }

    .precio-gratis {
      font-size: 1.8rem;
      padding: 0.4rem 1.2rem;
    }

    .precio-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .acceso, .garantia {
      font-size: 13px;
    }
  }
  
  @media (max-width: 480px) {
    .hero { 
      padding: 2rem 0; 
    }
    
    .titulo { 
      font-size: 1.8rem; 
    }
    
    .precio { 
      font-size: 1.6rem; 
    }

    .precio::after {
      font-size: 0.5rem;
      padding: 0.15rem 0.5rem;
      right: -40px;
      top: -5px;
    }

    .precio-gratis { 
      font-size: 1.6rem;
      padding: 0.3rem 1rem;
    }
    
    .btn-principal, .btn-secundario { 
      padding: 12px 20px; 
      font-size: 14px; 
    }
    
    .badge {
      font-size: 12px;
      padding: 6px 12px;
    }
    
    .video-card {
      padding: 15px;
    }
  }
  
  /* CORREGIR: Responsive específico para tablets */
  @media (max-width: 1024px) and (min-width: 769px) {
    .content {
      gap: 3rem;
    }
    
    .titulo {
      font-size: 2.5rem;
    }
    
    .objetivos {
      gap: 10px 20px;
    }
  }
</style> 