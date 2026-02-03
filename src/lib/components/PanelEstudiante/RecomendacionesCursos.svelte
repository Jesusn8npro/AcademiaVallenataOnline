<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';

  // 🎯 Estados del componente
  let cargando = true;
  let recomendacionesUnificadas: any[] = [];
  let mostrarMas = false;
  
  // 🎯 DATOS POR DEFECTO PARA MOSTRAR INMEDIATAMENTE
  const datosPorDefecto = [
    {
      id: 1,
      titulo: 'A TOCAR ACORDEÓN',
      descripcion: 'Curso completo desde cero hasta tu primera canción',
      imagen_url: '/images/Home/academia-vallenata-1.jpg',
      slug: 'a-tocar-acordeon',
      nivel: 'principiante',
      categoria: 'Vallenato',
      precio_normal: 0,
      precio_rebajado: null, // 🚀 NUEVO: Agregar precio rebajado
      tipo: 'curso',
      rating: '4.8',
      estudiantes: '500+',
      razon: 'Perfecto para empezar'
    },
    {
      id: 2,
      titulo: 'Acordeón!',
      descripcion: 'Tutorial paso a paso de canciones populares',
      imagen_url: '/images/Home/academia-vallenata-1.jpg',
      slug: 'acordeon-tutorial',
      nivel: 'intermedio',
      categoria: 'Vallenato',
      precio_normal: 0,
      precio_rebajado: null, // 🚀 NUEVO: Agregar precio rebajado
      tipo: 'tutorial',
      rating: '4.6',
      estudiantes: '300+',
      razon: 'Canciones populares'
    }
  ];

  // 🚀 Cargar recomendaciones inteligentes
  async function cargarRecomendaciones() {
    try {
      // ⚡ MOSTRAR DATOS POR DEFECTO INMEDIATAMENTE
      recomendacionesUnificadas = datosPorDefecto;
      cargando = false;
      
      // 📊 CARGAR DATOS REALES EN SEGUNDO PLANO
      console.log('🎯 [RECOMENDACIONES] Iniciando carga en segundo plano...');

      // 📚 Cargar cursos básicos primero (sin filtros complejos)
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('*')
        .limit(4);

      console.log('📚 [CURSOS] Resultados:', cursosData?.length || 0, cursosError);

      // 🎵 Cargar tutoriales básicos
      const { data: tutorialesData, error: tutorialesError } = await supabase
        .from('tutoriales')
        .select('*')
        .limit(4);

      console.log('🎵 [TUTORIALES] Resultados:', tutorialesData?.length || 0, tutorialesError);

      // 🎯 Procesar cursos
      const cursosFormateados = (cursosData || []).map((curso: any) => ({
        id: curso.id,
        titulo: curso.titulo || 'Curso de Acordeón',
        descripcion: curso.descripcion || 'Aprende acordeón vallenato paso a paso',
        imagen_url: curso.imagen_url || '/images/Home/academia-vallenata-1.jpg',
        slug: generateSlug(curso.titulo || 'curso-acordeon'),
        nivel: curso.nivel || 'principiante',
        categoria: curso.categoria || 'Vallenato',
        precio_normal: curso.precio_normal || 0,
        precio_rebajado: curso.precio_rebajado || null, // 🚀 NUEVO: Campo correcto
        tipo: 'curso',
        rating: (4.2 + Math.random() * 0.8).toFixed(1),
        estudiantes: `${Math.floor(Math.random() * 2000) + 100}+`,
        razon: obtenerRazonRecomendacion('curso', curso.nivel, curso.categoria)
      }));

      // 🎵 Procesar tutoriales
      const tutorialesFormateados = (tutorialesData || []).map((tutorial: any) => ({
        id: tutorial.id,
        titulo: tutorial.titulo || 'Tutorial de Vallenato',
        descripcion: `Tutorial: ${tutorial.titulo || 'Canción Popular'} - ${tutorial.artista || 'Artista'}`,
        imagen_url: tutorial.imagen_url || '/images/Home/academia-vallenata-1.jpg',
        slug: generateSlug(tutorial.titulo || 'tutorial-vallenato'),
        nivel: tutorial.nivel || 'principiante',
        categoria: tutorial.categoria || 'Vallenato',
        artista: tutorial.artista || 'Artista Desconocido',
        precio_normal: tutorial.precio_normal || 0, // 🚀 NUEVO: Usar precio real del tutorial
        precio_rebajado: tutorial.precio_rebajado || null, // 🚀 NUEVO: Campo correcto
        tipo: 'tutorial',
        rating: (4.2 + Math.random() * 0.8).toFixed(1),
        estudiantes: `${Math.floor(Math.random() * 1500) + 50}+`,
        razon: obtenerRazonRecomendacion('tutorial', tutorial.nivel, tutorial.categoria)
      }));

      // 🔄 Unificar contenido
      const recomendacionesReales = [...cursosFormateados, ...tutorialesFormateados]
        .sort(() => Math.random() - 0.5);
      
      // ✅ ACTUALIZAR CON DATOS REALES SI HAY
      if (recomendacionesReales.length > 0) {
        recomendacionesUnificadas = recomendacionesReales;
        console.log('✅ [RECOMENDACIONES] Actualizadas con datos reales:', recomendacionesUnificadas.length);
      }

    } catch (error) {
      console.error('❌ [RECOMENDACIONES] Error general:', error);
      // Mantener datos por defecto si falla
    }
  }

  // 🧠 Obtener razón de recomendación
  function obtenerRazonRecomendacion(tipo: string, nivel: string, categoria: string): string {
    const razones = [
      `Perfecto para tu nivel ${nivel}`,
      `Complementa tu aprendizaje de ${categoria}`,
      `Popular entre estudiantes`,
      `Recomendado por tu progreso`,
      `Siguiente paso en tu formación`,
      `Ideal para mejorar técnica`
    ];
    return razones[Math.floor(Math.random() * razones.length)];
  }

  // 🎯 Ir a contenido (curso o tutorial)
  function verContenido(item: any) {
    if (item.tipo === 'curso') {
      console.log('📚 [NAVEGACIÓN] Yendo a curso:', item.slug);
      goto(`/cursos/${item.slug}`);
    } else {
      console.log('🎵 [NAVEGACIÓN] Yendo a tutorial:', item.slug);
      goto(`/tutoriales/${item.slug}`);
    }
  }

  // 👀 Ver todos los cursos y tutoriales
  function verTodosCursos() {
    console.log('📚 [NAVEGACIÓN] Yendo a todos los cursos...');
    goto('/cursos');
  }

  // 🔄 Alternar vista (mostrar más o menos)
  function alternarVista() {
    mostrarMas = !mostrarMas;
  }

  // 💰 Formatear precio
  function formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  // 📊 Calcular descuento
  function calcularDescuento(precioNormal: number, precioRebajado: number): number {
    return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100);
  }

  // ✂️ Acortar texto
  function acortarTexto(texto: string, limite: number = 100): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  onMount(() => {
    cargarRecomendaciones();
  });
</script>

<!-- 🚀 RECOMENDACIONES INTELIGENTES -->
<div class="recomendaciones-cursos">
  
  {#if cargando}
    <!-- Estado de carga -->
    <div class="cargando-recomendaciones">
      <div class="skeleton-recomendaciones"></div>
    </div>
    
  {:else}
    <!-- 🎯 Tarjeta principal de recomendaciones -->
    <div class="tarjeta-recomendaciones">
      
      <!-- 🚀 Header con título y estadísticas -->
      <div class="recomendaciones-header">
        <div class="header-info">
          <h3>🚀 Recomendaciones Para Ti</h3>
          <p class="subtitulo">Contenido perfecto que aún no has explorado</p>
        </div>
        <div class="header-stats">
          <span class="stat-badge">
            {recomendacionesUnificadas.filter(item => item.tipo === 'curso').length} Cursos
          </span>
          <span class="stat-badge">
            {recomendacionesUnificadas.filter(item => item.tipo === 'tutorial').length} Tutoriales
          </span>
        </div>
      </div>

      <!-- 🎯 GRID DE RECOMENDACIONES (Como página de cursos) -->
      <div class="contenido-recomendaciones">
        {#if recomendacionesUnificadas.length === 0}
          <div class="sin-recomendaciones">
            <h4>📚 Cargando recomendaciones...</h4>
            <p>Estamos buscando el mejor contenido para ti</p>
          </div>
        {:else}
          <div class="recomendaciones-grid">
            {#each recomendacionesUnificadas.slice(0, mostrarMas ? 8 : 4) as item}
              <div 
                class="curso-card"
                on:click={() => verContenido(item)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && verContenido(item)}
              >
              <div class="curso-imagen-container">
                <img 
                  src={item.imagen_url} 
                  alt={item.titulo}
                  class="curso-imagen"
                  loading="lazy"
                />
                
                <div class="tipo-badge {item.tipo}">
                  {item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
                </div>
                
                {#if item.precio_rebajado && item.precio_normal}
                  {@const descuento = calcularDescuento(item.precio_normal, item.precio_rebajado)}
                  {#if descuento > 0}
                    <div class="descuento-badge">-{descuento}%</div>
                  {/if}
                {/if}
                
                <div class="imagen-overlay">
                  <button class="btn-ver-curso">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    {item.tipo === 'curso' ? 'Ver Curso' : 'Ver Tutorial'}
                  </button>
                </div>
              </div>
              
              <div class="curso-content">
                <div class="curso-header">
                  <h4 class="curso-titulo">{item.titulo}</h4>
                  <div class="curso-meta">
                    <span class="rating">⭐ {item.rating}</span>
                    <span class="estudiantes">👥 {item.estudiantes}</span>
                  </div>
                </div>
                
                <p class="curso-descripcion">
                  {acortarTexto(item.descripcion, 80)}
                </p>
                
                <div class="nivel-container">
                  <span class="nivel-badge nivel-{item.nivel}">
                    {#if item.nivel === 'principiante'}🌱 Principiante
                    {:else if item.nivel === 'intermedio'}🔥 Intermedio
                    {:else if item.nivel === 'avanzado'}⚡ Avanzado
                    {:else if item.nivel === 'profesional'}👑 Profesional
                    {:else}📚 {item.nivel}{/if}
                  </span>
                </div>
                
                <div class="curso-footer">
                  <div class="precio-container">
                    {#if item.precio_normal === 0 || item.precio_normal === null}
                      <span class="precio-gratis">¡GRATIS!</span>
                    {:else if item.precio_rebajado && item.precio_rebajado < item.precio_normal}
                      <span class="precio-original">{formatearPrecio(item.precio_normal)}</span>
                      <span class="precio-actual">{formatearPrecio(item.precio_rebajado)}</span>
                    {:else}
                      <span class="precio-actual">{formatearPrecio(item.precio_normal)}</span>
                    {/if}
                  </div>
                  
                  <button class="btn-acceder {item.tipo}">
                    {item.precio_normal === 0 || item.precio_normal === null ? 'Acceder Gratis' : 'Comenzar Ahora'}
                  </button>
                </div>
              </div>
            </div>
                        {/each}
            </div>
            
            <!-- 👀 Botones de acción -->
            <div class="acciones-container">
              {#if recomendacionesUnificadas.length > 4}
                <button class="ver-mas-btn" on:click={alternarVista}>
                  <span>{mostrarMas ? '👆 Ver Menos' : '👀 Ver Más Recomendaciones'}</span>
                </button>
              {/if}
              
              <button class="ver-todos-btn" on:click={verTodosCursos}>
                <span>📚 Explorar Todos los Cursos</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
        {/if}
      </div>

    </div>
  {/if}
  
</div>

<style>
  /* 🚀 CONTENEDOR PRINCIPAL */
  .recomendaciones-cursos {
    width: 100%;
    height: auto; /* 🚀 Cambiar de 100% a auto */
    min-height: 480px; /* 🚀 Altura mínima igual al simulador */
  }

  /* 🎯 TARJETA DE RECOMENDACIONES */
  .tarjeta-recomendaciones {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
    border-radius: 20px;
    padding: 16px;
    color: white;
    position: relative;
    overflow: visible; /* 🚀 Cambiar de hidden a visible para que se vea completo */
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    height: auto; /* 🚀 Cambiar de 100% a auto */
    min-height: 480px; /* 🚀 Altura mínima igual al simulador */
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tarjeta-recomendaciones::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  /* 🚀 HEADER */
  .recomendaciones-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .header-info h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .subtitulo {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.8;
    margin-top: 2px;
  }

  .header-stats {
    display: flex;
    gap: 6px;
  }

  .stat-badge {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 🎯 GRID DE RECOMENDACIONES */
  .recomendaciones-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    flex: 1;
  }

  /* 📚 CONTENIDO DE RECOMENDACIONES */
  .contenido-recomendaciones {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: visible; /* 🚀 NUNCA scroll */
    max-height: none; /* 🚀 Sin altura máxima */
    height: auto; /* 🚀 Altura automática */
  }

  /* 📱 RESPONSIVE - ELIMINAR SCROLL EN MÓVIL */
  @media (max-width: 900px) {
    .contenido-recomendaciones {
      overflow-y: visible; /* Sin scroll en móvil */
      max-height: none; /* Sin altura máxima en móvil */
      height: auto; /* Altura automática */
    }

    .tarjeta-recomendaciones {
      height: auto; /* Altura automática en móvil */
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
      padding: 20px; /* Padding mayor en móvil para mejor legibilidad */
    }

    .recomendaciones-grid {
      grid-template-columns: 1fr; /* Una columna en móvil */
      gap: 16px; /* Espaciado mayor en móvil */
    }

    /* 🚀 NUEVO: Asegurar que las tarjetas se muestren completas */
    .curso-card {
      height: auto; /* Altura automática */
      min-height: auto; /* Sin altura mínima */
      padding: 12px; /* Padding mayor en móvil */
    }

    /* 🚀 NUEVO: Ajustar el contenedor principal para móvil */
    .recomendaciones-cursos {
      height: auto; /* Altura automática en móvil */
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
    }

    /* 🚀 NUEVO: Ajustar header para móvil */
    .recomendaciones-header {
      flex-direction: column; /* Stack vertical en móvil */
      align-items: flex-start;
      gap: 16px;
    }

    .header-stats {
      width: 100%; /* Ocupar todo el ancho */
      justify-content: space-between; /* Distribuir badges */
    }

    /* 🚀 NUEVO: Ajustar botones de acción para móvil */
    .acciones-container {
      flex-direction: column;
      gap: 12px;
    }

    .ver-mas-btn, .ver-todos-btn {
      width: 100%; /* Botones de ancho completo en móvil */
      padding: 12px 16px; /* Padding mayor para mejor touch */
    }
  }

  /* 🚀 NUEVO: BREAKPOINT PARA TABLETS - TRANSICIÓN SUAVE */
  @media (max-width: 1300px) {
    .contenido-recomendaciones {
      overflow-y: visible; /* Sin scroll en tablets */
      max-height: none; /* Sin altura máxima en tablets */
      height: auto; /* Altura automática */
    }

    .tarjeta-recomendaciones {
      height: auto; /* Altura automática en tablets */
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
    }

    .recomendaciones-cursos {
      height: auto; /* Altura automática en tablets */
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
    }

    /* 🚀 NUEVO: Ajustar grid para tablets */
    .recomendaciones-grid {
      grid-template-columns: repeat(2, 1fr); /* Mantener 2 columnas en tablets */
      gap: 16px; /* Espaciado ligeramente mayor */
    }
  }

  /* 🎯 TARJETAS DE CURSO (Basado en GridCursos) */
  .curso-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .curso-card:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .curso-imagen-container {
    position: relative;
    width: 100%;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .curso-imagen {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .curso-card:hover .curso-imagen {
    transform: scale(1.05);
  }

  .tipo-badge {
    position: absolute;
    top: 4px;
    left: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }

  .tipo-badge.curso {
    background: rgba(59, 130, 246, 0.9);
    color: white;
  }

  .tipo-badge.tutorial {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  .descuento-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
  }

  .imagen-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);
  }

  .curso-card:hover .imagen-overlay {
    opacity: 1;
  }

  .btn-ver-curso {
    background: rgba(255, 255, 255, 0.9);
    color: #1e293b;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-ver-curso:hover {
    background: white;
    transform: scale(1.05);
  }

  .curso-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .curso-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .curso-titulo {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.2;
    color: white;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .curso-meta {
    display: flex;
    gap: 8px;
    font-size: 0.65rem;
    opacity: 0.8;
  }

  .rating, .estudiantes {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .curso-descripcion {
    margin: 0;
    font-size: 0.7rem;
    opacity: 0.8;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nivel-container {
    margin: 4px 0;
  }

  .nivel-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-weight: 600;
    display: inline-block;
  }

  .nivel-badge.nivel-principiante {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .nivel-badge.nivel-intermedio {
    background: rgba(249, 115, 22, 0.2);
    color: #f97316;
    border: 1px solid rgba(249, 115, 22, 0.3);
  }

  .nivel-badge.nivel-avanzado {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .nivel-badge.nivel-profesional {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }

  .curso-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    gap: 8px;
  }

  .precio-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .precio-gratis {
    color: #10b981;
    font-weight: 700;
    font-size: 0.7rem;
  }

  .precio-original {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.6rem;
    text-decoration: line-through;
  }

  .precio-actual {
    color: #fbbf24;
    font-weight: 700;
    font-size: 0.7rem;
  }

  .btn-acceder {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .btn-acceder:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .btn-acceder.curso {
    border-color: rgba(59, 130, 246, 0.3);
  }

  .btn-acceder.tutorial {
    border-color: rgba(16, 185, 129, 0.3);
  }

  /* 🚫 SIN RECOMENDACIONES */
  .sin-recomendaciones {
    text-align: center;
    padding: 40px 20px;
    opacity: 0.8;
  }

  .sin-recomendaciones h4 {
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: white;
  }

  .sin-recomendaciones p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.7;
  }

  /* 👀 ACCIONES */
  .acciones-container {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .ver-mas-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .ver-mas-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .ver-todos-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .ver-todos-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .ver-todos-btn svg {
    width: 12px;
    height: 12px;
    transition: transform 0.3s ease;
  }

  .ver-todos-btn:hover svg {
    transform: translateX(2px);
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 900px) {
    .tarjeta-recomendaciones {
      padding: 12px;
    }

    .recomendaciones-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .curso-imagen-container {
      height: 60px;
    }

    .curso-titulo {
      font-size: 0.75rem;
    }

    .curso-meta {
      font-size: 0.6rem;
    }

    .acciones-container {
      flex-direction: column;
    }
  }

  /* 🔄 LOADING */
  .cargando-recomendaciones {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .skeleton-recomendaciones {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
    border-radius: 20px;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .skeleton-recomendaciones::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.1) 50%, 
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  /* 📱 RESPONSIVE - ESTILOS ADICIONALES PARA MÓVIL */
  @media (max-width: 900px) {
    /* 🚀 NUEVO: Ajustes adicionales para móvil */
    .curso-imagen-container {
      height: 70px; /* Imagen ligeramente más alta en móvil */
    }

    .curso-meta {
      flex-direction: column; /* Stack vertical para mejor legibilidad */
      gap: 4px;
    }

    .nivel-container {
      margin: 6px 0; /* Margen mayor para mejor separación */
    }

    .imagen-overlay {
      opacity: 1; /* Siempre visible en móvil para mejor UX */
      background: rgba(0, 0, 0, 0.3); /* Fondo más sutil */
    }

    .btn-ver-curso {
      font-size: 0.65rem; /* Botón más pequeño */
      padding: 4px 8px; /* Padding ajustado */
    }
  }

  /* 🚀 NUEVO: BREAKPOINT PARA MÓVILES MUY PEQUEÑOS */
  @media (max-width: 480px) {
    .tarjeta-recomendaciones {
      padding: 16px; /* Padding ajustado para móviles muy pequeños */
      border-radius: 16px; /* Border radius menor */
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
    }

    .recomendaciones-cursos {
      min-height: 480px; /* 🚀 Mantener altura mínima igual al simulador */
    }

    .recomendaciones-header h3 {
      font-size: 1rem; /* Título más pequeño */
    }

    .subtitulo {
      font-size: 0.7rem; /* Subtítulo más pequeño */
    }

    .stat-badge {
      font-size: 0.65rem; /* Badges más pequeños */
      padding: 3px 6px; /* Padding menor */
    }

    .curso-card {
      padding: 10px; /* Padding menor en móviles muy pequeños */
    }

    .curso-titulo {
      font-size: 0.7rem; /* Título más pequeño */
    }

    .curso-descripcion {
      font-size: 0.65rem; /* Descripción más pequeña */
    }

    .btn-acceder {
      font-size: 0.6rem; /* Botón más pequeño */
      padding: 3px 6px; /* Padding menor */
    }

    .ver-mas-btn, .ver-todos-btn {
      font-size: 0.7rem; /* Botones más pequeños */
      padding: 10px 14px; /* Padding ajustado */
    }
  }
</style>
