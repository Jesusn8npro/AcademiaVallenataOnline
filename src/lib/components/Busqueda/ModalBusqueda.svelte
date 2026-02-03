<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { busquedaService } from '$lib/services/busquedaService';

  export let abierto = false;
  export let onCerrar = () => {};

  let inputBusqueda: HTMLInputElement;
  let terminoBusqueda = '';
  let cargandoResultados = false;
  let timeoutBusqueda: any;
  let resultadoIndiceActivo = -1; // Para navegación con teclado
  let sugerencias: string[] = [];
  let mostrandoSugerencias = false;
  let resultadosBusqueda: any = {
    cursos: [],
    tutoriales: [],
    blog: [],
    usuarios: [],
    eventos: [],
    paquetes: [],
    total: 0
  };

  // Recomendaciones estáticas por ahora
  const recomendacionesEstaticas = [
    {
      titulo: 'Aprende desde Cero',
      descripcion: 'Curso completo para principiantes',
      icono: '⭐',
      color: 'from-red-500 to-red-700',
      url: '/curso-acordeon-desde-cero',
      razon: 'Más de 5,000 estudiantes'
    },
    {
      titulo: 'Simulador de Acordeón',
      descripcion: 'Practica sin instrumento físico',
      icono: '🎮',
      color: 'from-purple-500 to-purple-700',
      url: '/simulador-de-acordeon',
      razon: 'La mejor forma de practicar'
    },
    {
      titulo: 'Tutoriales Gratis',
      descripcion: 'Canciones paso a paso',
      icono: '🎵',
      color: 'from-teal-500 to-teal-700',
      url: '/tutoriales',
      razon: 'Aprende canciones famosas'
    },
    {
      titulo: 'Comunidad',
      descripcion: 'Conecta con otros estudiantes',
      icono: '👥',
      color: 'from-blue-500 to-blue-700',
      url: '/comunidad',
      razon: 'Aprende con otros acordeoneros'
    }
  ];

  $: if (abierto) {
    setTimeout(() => {
      inputBusqueda?.focus();
      reproducirSonido('abrir');
    }, 100);
  }

  $: if (terminoBusqueda.length >= 2) {
    buscarConDebounce();
  } else if (terminoBusqueda.length < 2) {
    // Limpiar resultados cuando hay menos de 2 caracteres
    resultadosBusqueda = { cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0 };
  }

  // Generar sugerencias cuando el usuario escribe
  $: if (terminoBusqueda.length >= 1) {
    generarSugerencias();
  }

  function buscarConDebounce() {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
      realizarBusqueda();
    }, 300);
  }

  async function realizarBusqueda() {
    if (!terminoBusqueda || terminoBusqueda.length < 2) return;
    
    console.log('🔍 [BÚSQUEDA] Buscando:', terminoBusqueda);
    cargandoResultados = true;
    mostrandoSugerencias = false;
    resultadoIndiceActivo = -1; // Reset navegación
    
    try {
      // Usar el servicio de búsqueda completo
      const resultados = await busquedaService.buscarTodo(terminoBusqueda);
      
      console.log('✅ [BÚSQUEDA] Resultados obtenidos:', resultados);
      console.log('📚 Cursos:', resultados.cursos.length);
      console.log('🎵 Tutoriales:', resultados.tutoriales.length);
      console.log('📝 Blog:', resultados.blog.length);
      console.log('👥 Usuarios:', resultados.usuarios.length);
      console.log('🎪 Eventos:', resultados.eventos.length);
      console.log('📦 Paquetes:', resultados.paquetes.length);
      
      resultadosBusqueda = resultados;
      
    } catch (error) {
      console.error('❌ [BÚSQUEDA] Error:', error);
      resultadosBusqueda = { 
        cursos: [], 
        tutoriales: [], 
        blog: [], 
        usuarios: [], 
        eventos: [], 
        paquetes: [], 
        total: 0 
      };
    } finally {
      cargandoResultados = false;
    }
  }

  // 🎮 FUNCIÓN PARA GENERAR SUGERENCIAS INTELIGENTES
  async function generarSugerencias() {
    if (terminoBusqueda.length >= 1) {
      const sugerenciasBasicas = [
        'acordeón', 'vallenato', 'diomedes', 'carlos vives', 'binomio de oro',
        'principiante', 'intermedio', 'avanzado', 'técnicas', 'historia',
        'la gota fría', 'mi primera cana', 'masterclass', 'festival'
      ];
      
      sugerencias = sugerenciasBasicas
        .filter(s => s.toLowerCase().includes(terminoBusqueda.toLowerCase()))
        .slice(0, 5);
      
      mostrandoSugerencias = sugerencias.length > 0 && terminoBusqueda.length < 3;
    } else {
      sugerencias = [];
      mostrandoSugerencias = false;
    }
  }

  // 🚀 FUNCIÓN PARA ABRIR EL CHAT WIDGET
  function abrirChatDesdeModal() {
    console.log('🎯 [MODAL] Abriendo Chat Widget desde búsqueda');
    
    // Reproducir sonido de acción exitosa
    reproducirSonido('click');
    
    // Cerrar el modal
    onCerrar();
    
    // Enviar evento personalizado para abrir el chat
    setTimeout(() => {
      const event = new CustomEvent('abrirChatWidget', {
        detail: { 
          mensaje: `Hola! Me interesa aprender sobre: "${terminoBusqueda || 'acordeón vallenato'}"`,
          origen: 'busqueda'
        }
      });
      window.dispatchEvent(event);
    }, 300);
  }

  // 🔊 SISTEMA DE SONIDOS
  function reproducirSonido(tipo: string) {
    try {
      let rutaAudio = '';
      
      switch (tipo) {
        case 'hover': rutaAudio = '/audio/effects/ui/ping.mp3'; break;
        case 'click': rutaAudio = '/audio/effects/ui/click.mp3'; break;
        case 'abrir': rutaAudio = '/audio/effects/ui/mopen.mp3'; break;
        case 'cerrar': rutaAudio = '/audio/effects/ui/mclose.mp3'; break;
        case 'buscar': rutaAudio = '/audio/effects/ui/flourish.mp3'; break;
        case 'sugerencia': rutaAudio = '/audio/effects/ui/pop.mp3'; break;
        case 'resultado': rutaAudio = '/audio/effects/success.mp3'; break;
        case 'error': rutaAudio = '/audio/effects/error.mp3'; break;
        default: return;
      }
      
      const audio = new Audio(rutaAudio);
      audio.volume = 0.2; // Volumen más bajo para el modal
      audio.play().catch(() => console.log('🔇 Error reproduciendo sonido'));
    } catch (error) {
      console.log('🔇 Error con audio:', error);
    }
  }

  // 📐 NAVEGACIÓN CON TECLADO
  function manejarTeclas(event: KeyboardEvent) {
    const { key } = event;
    
    // Lista plana de todos los resultados para navegación
    const todosLosResultados = [
      ...resultadosBusqueda.cursos,
      ...resultadosBusqueda.tutoriales,
      ...resultadosBusqueda.blog,
      ...resultadosBusqueda.eventos
    ];
    
    switch (key) {
      case 'Escape':
        reproducirSonido('cerrar');
        onCerrar();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (mostrandoSugerencias) {
          // Navegar por sugerencias
        } else if (todosLosResultados.length > 0) {
          resultadoIndiceActivo = Math.min(resultadoIndiceActivo + 1, todosLosResultados.length - 1);
          console.log('⬇️ Navegando a resultado:', resultadoIndiceActivo);
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (todosLosResultados.length > 0) {
          resultadoIndiceActivo = Math.max(resultadoIndiceActivo - 1, -1);
          console.log('⬆️ Navegando a resultado:', resultadoIndiceActivo);
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (resultadoIndiceActivo >= 0 && todosLosResultados[resultadoIndiceActivo]) {
          reproducirSonido('resultado');
          navigarAResultado(todosLosResultados[resultadoIndiceActivo].url);
        } else if (terminoBusqueda.length >= 2) {
          reproducirSonido('buscar');
          realizarBusqueda();
        }
        break;
    }
  }

  function navigarAResultado(url: string) {
    reproducirSonido('resultado');
    goto(url);
    onCerrar();
  }

  function handleModalClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCerrar();
    }
  }

  // Prevenir scroll del body cuando el modal está abierto
  $: if (abierto) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  onDestroy(() => {
    if (timeoutBusqueda) {
      clearTimeout(timeoutBusqueda);
    }
    document.body.style.overflow = '';
  });
</script>

{#if abierto}
  <div 
    class="modal-busqueda-overlay" 
    on:click={handleModalClick}
    role="dialog"
    aria-modal="true"
    aria-label="Búsqueda Universal"
    tabindex="-1"
  >
    <div class="modal-busqueda-contenido">
      <!-- Header con botón cerrar -->
      <div class="modal-header">
        <h2 class="modal-titulo">🔍 Buscar en la Academia</h2>
        <button 
          class="boton-cerrar-modal" 
          on:click={() => { reproducirSonido('cerrar'); onCerrar(); }} 
          on:mouseenter={() => reproducirSonido('hover')}
          aria-label="Cerrar búsqueda"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Barra de búsqueda -->
      <div class="busqueda-principal">
        <div class="input-busqueda-container">
          <div class="input-wrapper">
            <svg class="icono-busqueda" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input 
              bind:this={inputBusqueda}
              bind:value={terminoBusqueda}
              type="search" 
              placeholder="Buscar cursos, tutoriales, artículos..." 
              class="input-busqueda-modal"
              autocomplete="off"
              spellcheck="false"
              on:keydown={manejarTeclas}
            />
            {#if cargandoResultados}
              <div class="spinner-busqueda">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.2"/>
                  <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 12a8 8 0 018-8V2.5"/>
                </svg>
              </div>
            {/if}
            
            <!-- SUGERENCIAS INTELIGENTES -->
            {#if mostrandoSugerencias && sugerencias.length > 0}
              <div class="sugerencias-flotantes">
                <p class="sugerencias-titulo">💡 Prueba buscando:</p>
                <div class="sugerencias-grid">
                  {#each sugerencias as sugerencia}
                                         <button 
                       class="sugerencia-tag" 
                       on:click={() => { reproducirSonido('sugerencia'); terminoBusqueda = sugerencia; realizarBusqueda(); }}
                       on:mouseenter={() => reproducirSonido('hover')}
                     >
                      {sugerencia}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="modal-body">
        {#if terminoBusqueda.length === 0}
          <!-- Recomendaciones personalizadas -->
          <div class="seccion-recomendaciones">
            <h3 class="seccion-titulo">✨ Recomendado para ti</h3>
            
            <div class="grid-recomendaciones">
              {#each recomendacionesEstaticas as recomendacion}
                <button 
                  class="tarjeta-recomendacion bg-gradient-to-r {recomendacion.color}"
                  on:click={() => { reproducirSonido('click'); navigarAResultado(recomendacion.url); }}
                  on:mouseenter={() => reproducirSonido('hover')}
                >
                  <div class="recomendacion-icono">{recomendacion.icono}</div>
                  <div class="recomendacion-contenido">
                    <h4 class="recomendacion-titulo">{recomendacion.titulo}</h4>
                    <p class="recomendacion-descripcion">{recomendacion.descripcion}</p>
                    <span class="recomendacion-razon">{recomendacion.razon}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Accesos rápidos -->
          <div class="accesos-rapidos">
            <h3 class="seccion-titulo">🚀 Accesos Rápidos</h3>
            <div class="grid-accesos">
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/cursos'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">🎓</span>
                <span class="acceso-texto">Todos los Cursos</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/tutoriales'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">🎵</span>
                <span class="acceso-texto">Tutoriales</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/simulador-de-acordeon'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">🎮</span>
                <span class="acceso-texto">Simulador</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/comunidad'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">👥</span>
                <span class="acceso-texto">Comunidad</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/ranking'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">🏆</span>
                <span class="acceso-texto">Ranking</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/blog'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">📖</span>
                <span class="acceso-texto">Blog</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/eventos'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">🎪</span>
                <span class="acceso-texto">Eventos</span>
              </button>
              <button class="acceso-rapido" on:click={() => { reproducirSonido('click'); navigarAResultado('/paquetes'); }} on:mouseenter={() => reproducirSonido('hover')}>
                <span class="acceso-icono">📦</span>
                <span class="acceso-texto">Paquetes</span>
              </button>
            </div>
          </div>
        {:else if cargandoResultados}
          <!-- Loading mientras busca -->
          <div class="buscando-mensaje">
            <div class="buscando-icono">🔍</div>
            <h3 class="buscando-titulo">Buscando "{terminoBusqueda}"...</h3>
            <p class="buscando-descripcion">
              Buscando en cursos, tutoriales, blog, usuarios, eventos y paquetes...
            </p>
            
            <!-- BOTÓN DE AYUDA DURANTE LA BÚSQUEDA -->
            <div class="ayuda-busqueda">
                              <button class="boton-ayuda-chat" on:click={abrirChatDesdeModal} on:mouseenter={() => reproducirSonido('hover')}>
                  💬 ¿Necesitas ayuda con tu búsqueda?
                </button>
            </div>
          </div>
        {:else if resultadosBusqueda.total === 0}
          <!-- Sin resultados -->
          <div class="sin-resultados">
            <div class="sin-resultados-icono">😔</div>
            <h3 class="sin-resultados-titulo">No encontramos nada</h3>
            <p class="sin-resultados-descripcion">
              No pudimos encontrar contenido para "<strong>{terminoBusqueda}</strong>"
            </p>
            <div class="sugerencias-busqueda">
              <p>💡 Intenta con:</p>
              <ul>
                <li>"acordeón" - para contenido general</li>
                <li>"Diomedes" o "Binomio de Oro" - para artistas</li>
                <li>"principiante" - para nivel</li>
                <li>"masterclass" - para eventos en vivo</li>
                <li>"técnicas" - para artículos del blog</li>
              </ul>
              
              <!-- BOTÓN DE AYUDA CUANDO NO HAY RESULTADOS -->
              <div class="ayuda-sin-resultados">
                                 <button class="boton-ayuda-chat" on:click={abrirChatDesdeModal} on:mouseenter={() => reproducirSonido('hover')}>
                   💬 Habla con un asesor
                 </button>
                <p class="ayuda-texto">Te ayudamos a encontrar el contenido perfecto para ti</p>
              </div>
            </div>
          </div>
        {:else}
          <!-- RESULTADOS DE BÚSQUEDA -->
          <div class="resultados-container">
            <div class="resultados-header">
              <h3 class="resultados-titulo">
                📊 {resultadosBusqueda.total} resultado{resultadosBusqueda.total !== 1 ? 's' : ''} para "{terminoBusqueda}"
              </h3>
            </div>

            <!-- CURSOS -->
            {#if resultadosBusqueda.cursos.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">🎓</span>
                  Cursos ({resultadosBusqueda.cursos.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.cursos as curso}
                    <button class="tarjeta-resultado" on:click={() => { reproducirSonido('resultado'); navigarAResultado(curso.url); }} on:mouseenter={() => reproducirSonido('hover')}>
                      {#if curso.imagen}
                        <img src={curso.imagen} alt={curso.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-blue-500 to-blue-700">
                          <span class="placeholder-icono">🎓</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{curso.titulo}</h5>
                        {#if curso.descripcion}
                          <p class="resultado-descripcion">{curso.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if curso.nivel}
                            <span class="meta-item">📊 {curso.nivel}</span>
                          {/if}
                          {#if curso.precio}
                            <span class="meta-item precio">${new Intl.NumberFormat('es-CO').format(curso.precio)} COP</span>
                          {/if}
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- TUTORIALES -->
            {#if resultadosBusqueda.tutoriales.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">🎵</span>
                  Tutoriales ({resultadosBusqueda.tutoriales.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.tutoriales as tutorial}
                    <button class="tarjeta-resultado" on:click={() => { reproducirSonido('resultado'); navigarAResultado(tutorial.url); }} on:mouseenter={() => reproducirSonido('hover')}>
                      {#if tutorial.imagen}
                        <img src={tutorial.imagen} alt={tutorial.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-teal-500 to-teal-700">
                          <span class="placeholder-icono">🎵</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{tutorial.titulo}</h5>
                        {#if tutorial.descripcion}
                          <p class="resultado-descripcion">{tutorial.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if tutorial.autor}
                            <span class="meta-item">👤 {tutorial.autor}</span>
                          {/if}
                          {#if tutorial.nivel}
                            <span class="meta-item">📊 {tutorial.nivel}</span>
                          {/if}
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- BLOG -->
            {#if resultadosBusqueda.blog.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">📖</span>
                  Blog ({resultadosBusqueda.blog.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.blog as articulo}
                    <button class="tarjeta-resultado" on:click={() => { reproducirSonido('resultado'); navigarAResultado(articulo.url); }} on:mouseenter={() => reproducirSonido('hover')}>
                      {#if articulo.imagen}
                        <img src={articulo.imagen} alt={articulo.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-orange-500 to-orange-700">
                          <span class="placeholder-icono">📖</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{articulo.titulo}</h5>
                        {#if articulo.descripcion}
                          <p class="resultado-descripcion">{articulo.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if articulo.autor}
                            <span class="meta-item">👤 {articulo.autor}</span>
                          {/if}
                          {#if articulo.categoria}
                            <span class="meta-item">🏷️ {articulo.categoria}</span>
                          {/if}
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- USUARIOS -->
            {#if resultadosBusqueda.usuarios.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">👥</span>
                  Usuarios ({resultadosBusqueda.usuarios.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.usuarios as usuario}
                    <button class="tarjeta-resultado" on:click={() => navigarAResultado(usuario.url)}>
                      {#if usuario.imagen}
                        <img src={usuario.imagen} alt={usuario.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-purple-500 to-purple-700">
                          <span class="placeholder-icono">👤</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{usuario.titulo}</h5>
                        {#if usuario.descripcion}
                          <p class="resultado-descripcion">{usuario.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if usuario.nivel}
                            <span class="meta-item">📊 {usuario.nivel}</span>
                          {/if}
                          <span class="meta-item">🎵 Acordeonista</span>
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- EVENTOS -->
            {#if resultadosBusqueda.eventos.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">🎪</span>
                  Eventos ({resultadosBusqueda.eventos.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.eventos as evento}
                    <button class="tarjeta-resultado" on:click={() => { reproducirSonido('resultado'); navigarAResultado(evento.url); }} on:mouseenter={() => reproducirSonido('hover')}>
                      {#if evento.imagen}
                        <img src={evento.imagen} alt={evento.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-green-500 to-green-700">
                          <span class="placeholder-icono">🎪</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{evento.titulo}</h5>
                        {#if evento.descripcion}
                          <p class="resultado-descripcion">{evento.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if evento.fechaCreacion}
                            <span class="meta-item">📅 {new Date(evento.fechaCreacion).toLocaleDateString('es-ES')}</span>
                          {/if}
                          <span class="meta-item">🎫 Evento</span>
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- PAQUETES -->
            {#if resultadosBusqueda.paquetes.length > 0}
              <div class="categoria-seccion">
                <h4 class="categoria-titulo">
                  <span class="categoria-icono">📦</span>
                  Paquetes ({resultadosBusqueda.paquetes.length})
                </h4>
                <div class="grid-resultados">
                  {#each resultadosBusqueda.paquetes as paquete}
                    <button class="tarjeta-resultado" on:click={() => navigarAResultado(paquete.url)}>
                      {#if paquete.imagen}
                        <img src={paquete.imagen} alt={paquete.titulo} class="resultado-imagen" loading="lazy" />
                      {:else}
                        <div class="resultado-imagen-placeholder bg-gradient-to-r from-yellow-500 to-yellow-700">
                          <span class="placeholder-icono">📦</span>
                        </div>
                      {/if}
                      <div class="resultado-contenido">
                        <h5 class="resultado-titulo">{paquete.titulo}</h5>
                        {#if paquete.descripcion}
                          <p class="resultado-descripcion">{paquete.descripcion}</p>
                        {/if}
                        <div class="resultado-meta">
                          {#if paquete.precio}
                            <span class="meta-item precio">${new Intl.NumberFormat('es-CO').format(paquete.precio)} COP</span>
                          {/if}
                          <span class="meta-item">📦 Paquete</span>
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer con atajos mejorados -->
      <div class="modal-footer">
        <div class="atajos-teclado">
          <span class="atajo"><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>
          <span class="atajo"><kbd>Enter</kbd> Abrir</span>
          <span class="atajo"><kbd>Esc</kbd> Cerrar</span>
        </div>
        <div class="footer-ayuda">
          <button class="boton-chat-footer" on:click={abrirChatDesdeModal} on:mouseenter={() => reproducirSonido('hover')}>
            💬 ¿Necesitas ayuda?
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
/* ARREGLO PARA DOBLE SCROLL - Modal fijo sin scroll interno */
.modal-busqueda-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  /* CRÍTICO: Sin overflow aquí */
}

.modal-busqueda-contenido {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* CRÍTICO: Altura fija para evitar crecimiento */
  height: 85vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  /* CRÍTICO: Sin overflow en el contenedor principal */
}

/* Header fijo */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* CRÍTICO: Flex-shrink 0 para evitar que se comprima */
  flex-shrink: 0;
}

.modal-titulo {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.boton-cerrar-modal {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  color: #fff;
  transition: all 0.3s ease;
}

.boton-cerrar-modal:hover {
  background: rgba(255, 102, 0, 0.2);
  transform: scale(1.1);
}

/* Búsqueda fija */
.busqueda-principal {
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* CRÍTICO: Flex-shrink 0 para evitar que se comprima */
  flex-shrink: 0;
}

.input-busqueda-container {
  position: relative;
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 102, 0, 0.3);
  border-radius: 12px;
  padding: 0 1rem;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #ff6600;
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.2);
}

.icono-busqueda {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.input-busqueda-modal {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 1rem 0;
  font-size: 1.1rem;
  color: #fff;
  font-family: inherit;
}

.input-busqueda-modal::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.spinner-busqueda {
  margin-left: 0.5rem;
  animation: spin 1s linear infinite;
}

.spinner-busqueda svg {
  color: #ff6600;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Body con scroll SOLO aquí */
.modal-body {
  flex: 1;
  /* CRÍTICO: Solo aquí permitimos scroll */
  overflow-y: auto;
  padding: 2rem;
  /* CRÍTICO: min-height 0 para permitir que flex funcione */
  min-height: 0;
}

/* Scrollbar personalizada */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 102, 0, 0.5);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 102, 0, 0.7);
}

/* Recomendaciones */
.seccion-recomendaciones {
  margin-bottom: 3rem;
}

.seccion-titulo {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grid-recomendaciones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.tarjeta-recomendacion {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  color: white;
  position: relative;
  overflow: hidden;
}

.tarjeta-recomendacion:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.recomendacion-icono {
  font-size: 2rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.recomendacion-contenido {
  flex: 1;
}

.recomendacion-titulo {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.recomendacion-descripcion {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0 0 0.5rem 0;
}

.recomendacion-razon {
  font-size: 0.8rem;
  opacity: 0.7;
  font-style: italic;
}

/* Accesos rápidos */
.accesos-rapidos {
  margin-bottom: 2rem;
}

.grid-accesos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.acceso-rapido {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
}

.acceso-rapido:hover {
  background: rgba(255, 102, 0, 0.1);
  border-color: rgba(255, 102, 0, 0.3);
  transform: translateY(-2px);
}

.acceso-icono {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.acceso-texto {
  font-size: 0.85rem;
  text-align: center;
}

/* Mensaje de búsqueda temporal */
.buscando-mensaje {
  text-align: center;
  padding: 3rem 1rem;
  color: #fff;
}

.buscando-icono {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.buscando-titulo {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.buscando-descripcion {
  font-size: 1rem;
  opacity: 0.8;
  margin: 0;
}

/* Sin resultados */
.sin-resultados {
  text-align: center;
  padding: 3rem 1rem;
  color: #fff;
}

.sin-resultados-icono {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.sin-resultados-titulo {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.sin-resultados-descripcion {
  font-size: 1.1rem;
  opacity: 0.8;
  margin: 0 0 2rem 0;
}

.sugerencias-busqueda {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.sugerencias-busqueda p {
  font-weight: 600;
  margin-bottom: 1rem;
}

.sugerencias-busqueda ul {
  list-style: none;
  padding: 0;
}

.sugerencias-busqueda li {
  padding: 0.5rem 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

/* Resultados de búsqueda */
.resultados-container {
  padding: 0;
}

.resultados-header {
  margin-bottom: 1.5rem;
}

.resultados-titulo {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

/* Categorías de resultados */
.categoria-seccion {
  margin-bottom: 2rem;
}

.categoria-titulo {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categoria-icono {
  font-size: 1.2rem;
}

.grid-resultados {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.tarjeta-resultado {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  color: #fff;
}

.tarjeta-resultado:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.resultado-imagen,
.resultado-imagen-placeholder {
  width: 80px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
}

.resultado-imagen-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icono {
  font-size: 1.5rem;
  color: white;
}

.resultado-contenido {
  padding: 1rem;
  flex: 1;
  min-width: 0;
}

.resultado-titulo {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resultado-descripcion {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resultado-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-item {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  opacity: 0.8;
}

.meta-item.precio {
  background: rgba(255, 102, 0, 0.2);
  color: #ffaa66;
  font-weight: 600;
}

/* Footer fijo */
.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  /* CRÍTICO: Flex-shrink 0 para evitar que se comprima */
  flex-shrink: 0;
}

.atajos-teclado {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.atajo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.atajo kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  font-family: monospace;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-busqueda-overlay {
    padding: 1rem;
  }
  
  .modal-busqueda-contenido {
    height: 90vh;
  }
  
  .modal-header,
  .busqueda-principal,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .grid-recomendaciones {
    grid-template-columns: 1fr;
  }
  
  .grid-accesos {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .modal-busqueda-contenido {
    height: 95vh;
  }
  
  .grid-accesos {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* =====================================================
🎮 NUEVAS FUNCIONALIDADES INTERACTIVAS  
===================================================== */

/* Sugerencias flotantes */
.sugerencias-flotantes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 32, 68, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 0.5rem;
  z-index: 1000;
  animation: fadeInUp 0.3s ease;
}

.sugerencias-titulo {
  color: #ffb347;
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.sugerencias-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sugerencia-tag {
  background: rgba(255, 179, 71, 0.15);
  border: 1px solid rgba(255, 179, 71, 0.3);
  color: #ffb347;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.sugerencia-tag:hover {
  background: rgba(255, 179, 71, 0.25);
  transform: translateY(-1px);
}

/* Botones de ayuda del chat */
.boton-ayuda-chat {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
  margin: 1rem 0;
}

.boton-ayuda-chat:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.ayuda-busqueda {
  text-align: center;
  margin-top: 1rem;
}

.ayuda-sin-resultados {
  text-align: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ayuda-texto {
  color: #a0a9c0;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

/* Footer mejorado */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.footer-ayuda {
  display: flex;
  align-items: center;
}

.boton-chat-footer {
  background: rgba(255, 179, 71, 0.15);
  border: 1px solid rgba(255, 179, 71, 0.3);
  color: #ffb347;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.boton-chat-footer:hover {
  background: rgba(255, 179, 71, 0.25);
  transform: scale(1.05);
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive para móviles */
@media (max-width: 768px) {
  .sugerencias-flotantes {
    position: static;
    margin-top: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer-ayuda {
    width: 100%;
    justify-content: center;
  }
}
</style>
