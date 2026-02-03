<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, getContext } from 'svelte';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  
  // Props
  export let data: any;
  export let handleInscripcion: () => Promise<void>;
  export let plantilla: string; // <- requerido para renderizado dinámico
  // Navega automáticamente a la primera lección del curso
import { generateSlug } from '$lib/utilidades/utilidadesSlug';

function verContenido() {
  // LOG para depuración mejorada
  console.log('[verContenido] CONTENIDO:', JSON.stringify(contenido, null, 2));
  console.log('[verContenido] tipoContenido:', tipoContenido);

  if (tipoContenido === 'curso') {
    // Buscar módulos y lecciones anidadas
    const modulos = contenido.modulos || contenido.modulos_preview || [];
    const primerModulo = modulos.find((m) => m.lecciones && m.lecciones.length > 0);
    const leccionesSueltas = contenido.lecciones_sueltas || [];

    console.log('[verContenido] modulos:', modulos);
    console.log('[verContenido] primerModulo:', primerModulo);
    console.log('[verContenido] leccionesSueltas:', leccionesSueltas);

    if (primerModulo && primerModulo.lecciones.length > 0) {
      const cursoSlug = contenido.slug || generateSlug(contenido.titulo);
      const moduloSlug = primerModulo.slug || generateSlug(primerModulo.titulo);
      const leccionSlug = primerModulo.lecciones[0].slug || generateSlug(primerModulo.lecciones[0].titulo);
      const rutaDestino = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
      console.log('[continuarCurso][CURSO] rutaDestino:', rutaDestino);
      goto(rutaDestino);
      return;
    } else if (leccionesSueltas.length > 0) {
      const primeraLeccion = leccionesSueltas[0];
      const cursoSlug = contenido.slug || generateSlug(contenido.titulo);
      const leccionSlug = primeraLeccion.slug || generateSlug(primeraLeccion.titulo);
      const rutaDestino = `/cursos/${cursoSlug}/leccion/${leccionSlug}`;
      console.log('[continuarCurso][CURSO][SUELTA] rutaDestino:', rutaDestino);
      goto(rutaDestino);
      return;
    } else {
      alert('Este curso no tiene lecciones disponibles.\n\nVerifica que hayas creado módulos y lecciones correctamente.\nSi acabas de crear el curso, prueba recargar la página. Revisa la consola (F12) para más detalles.');
      console.error('[continuarCurso][ERROR] Sin lecciones:', contenido);
      return;
    }
  }

  // Lógica de tutorial igual que antes
  if (
    tipoContenido === 'tutorial' &&
    Array.isArray(contenido.modulos_preview) &&
    contenido.modulos_preview.length > 0
  ) {
    const tutorialSlug = generateSlug(contenido.titulo);
    const primeraClase = contenido.modulos_preview[0];
    const claseSlug = generateSlug(primeraClase.titulo);
    if (tutorialSlug && claseSlug) {
      goto(`/tutoriales/${tutorialSlug}/clase/${claseSlug}`);
      return;
    }
    alert('No se encontró la primera clase de este tutorial. Revisa la consola para más detalles.');
    console.error('[verContenido][ERROR][TUTORIAL] contenido:', contenido);
    return;
  }

  alert('No se encontró la primera lección o clase.\n\nRevisa la consola (F12) para ver la estructura de datos recibida.');
  console.error('[verContenido][ERROR][GENERAL] contenido:', contenido);
}

  
  // Extraer datos del contenido
  let contenido = {};
  let error = false;
  let tipoContenido = '';

  if (data?.curso) {
    contenido = data.curso;
    tipoContenido = 'curso';
  } else if (data?.tutorial) {
    contenido = data.tutorial;
    tipoContenido = 'tutorial';
  } else {
    error = true;
    console.error('[PremiumView] No se encontró ni curso ni tutorial en data:', data);
  }

  // Usar directamente el prop para reflejar el estado de inscripción actualizado
let estaInscrito = data?.estaInscrito || false;

  // Log para depuración
  if (error) {
    console.error('[PremiumView] Error: No se pudo cargar el contenido. Data recibida:', data);
  } else {
    console.log(`[PremiumView] Mostrando ${tipoContenido}:`, contenido);
  }
  
  // Estado
  let isLoading = false;
  let tiempoRestante = { dias: 0, horas: 0, minutos: 0, segundos: 0 };
  let intervaloTiempo: any;
  
  // Calcular tiempo restante
  function calcularTiempoRestante() {
    if (!browser) return;
    
    const fechaFin = data.curso?.fecha_expiracion 
      ? new Date(data.curso.fecha_expiracion)
      : data.tutorial?.fecha_expiracion 
        ? new Date(data.tutorial.fecha_expiracion)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días por defecto
    
    const ahora = new Date();
    
    if (fechaFin <= ahora) {
      tiempoRestante = { dias: 0, horas: 0, minutos: 0, segundos: 0 };
      return;
    }
    
    const diferencia = fechaFin.getTime() - ahora.getTime();
    
    tiempoRestante = {
      dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
      horas: Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutos: Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60)),
      segundos: Math.floor((diferencia % (1000 * 60)) / 1000)
    };
  }
  
  // Función para volver
  function goBack() {
    if (browser) {
      window.history.length > 1 ? window.history.back() : goto('/cursos');
    }
  }
  
  // Calcular descuento si existe
  function calcularDescuento() {
    const precioNormal = contenido?.precio_normal || 0;
    const precioRebajado = contenido?.precio_rebajado || 0;
    
    if (precioNormal <= 0 || precioRebajado <= 0 || precioRebajado >= precioNormal) return 0;
    return Math.round((1 - precioRebajado / precioNormal) * 100);
  }
  
  // Inicialización
  onMount(() => {
    if (browser) {
      // Ocultar navegación
      document.body.classList.add('premium-view');
      
      // Iniciar contador
      calcularTiempoRestante();
      intervaloTiempo = setInterval(calcularTiempoRestante, 1000);
    }
    
    return () => {
      if (browser) {
        clearInterval(intervaloTiempo);
        document.body.classList.remove('premium-view');
      }
    };
  });

  // Asegurarse de que cualquier suscripción a stores se hace solo en el cliente
  $: if (browser) {
    // Cualquier lógica reactiva que dependa de stores debe ir aquí
  }
</script>

{#if error}
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
    <strong class="font-bold">Error!</strong>
    <span class="block sm:inline">No se pudo cargar el contenido solicitado.</span>
  </div>
{:else if error}
  <div class="bg-red-100 text-red-700 p-8 rounded-xl text-center max-w-xl mx-auto mt-16">
    <h2 class="text-2xl font-bold mb-2">No se pudo cargar el contenido</h2>
    <p>Verifica que el curso o tutorial exista y que los datos lleguen correctamente.</p>
    <pre class="mt-4 text-xs text-left bg-red-50 p-2 rounded overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
  </div>
{:else}
  <!-- Banner de oferta -->
  {#if contenido.precio_rebajado || contenido.fecha_expiracion}
    <div class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 shadow-lg">
      <div class="container mx-auto px-4 flex flex-wrap md:flex-nowrap items-center justify-between">
        <div class="flex items-center mb-2 md:mb-0">
          <button class="text-white hover:text-yellow-200 mr-3" on:click={goBack}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            <span class="ml-1">Volver</span>
          </button>
          <div class="bg-white/10 rounded-full px-3 py-1 flex items-center">
            <svg class="h-4 w-4 text-yellow-300 animate-pulse mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            <span class="font-bold">¡OFERTA EXCLUSIVA!</span>
          </div>
          
          {#if calcularDescuento() > 0}
            <span class="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
              -{calcularDescuento()}%
            </span>
          {/if}
        </div>
        
        <div class="flex flex-col items-end w-full md:w-auto">
          <div class="text-xs text-yellow-200 mb-1">La oferta termina en:</div>
          <div class="grid grid-cols-4 gap-2">
            <div class="bg-black/20 px-2 py-1 rounded text-center">
              <div class="text-lg font-bold">{tiempoRestante.dias}</div>
              <div class="text-xs text-white/70">Días</div>
            </div>
            <div class="bg-black/20 px-2 py-1 rounded text-center">
              <div class="text-lg font-bold">{tiempoRestante.horas}</div>
              <div class="text-xs text-white/70">Horas</div>
            </div>
            <div class="bg-black/20 px-2 py-1 rounded text-center">
              <div class="text-lg font-bold">{tiempoRestante.minutos}</div>
              <div class="text-xs text-white/70">Min</div>
            </div>
            <div class="bg-black/20 px-2 py-1 rounded text-center">
              <div class="text-lg font-bold">{tiempoRestante.segundos}</div>
              <div class="text-xs text-white/70">Seg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Espaciador mínimo - ajustado para eliminar espacio blanco -->
    <div class="h-14 bg-black"></div>
  {/if}
  
  <!-- Sección Hero Principal - con espaciador explícito -->
  <div class="relative text-white bg-black">
    <!-- Espaciador explícito para garantizar el padding superior -->
    <div class="h-40 w-full bg-black"></div>
    
    <!-- Fondo negro con animación -->
    <div class="absolute inset-0 z-0 bg-black">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-indigo-900/10 animate-pulse"></div>
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -inset-[10%] opacity-5">
          <svg class="rotate-12 animate-slowly-spin" viewBox="0 0 500 500">
            <path d="M250,50 C388.07,50 500,161.93 500,300 C500,438.07 388.07,550 250,550 C111.93,550 0,438.07 0,300 C0,161.93 111.93,50 250,50 Z" fill="url(#grad)" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B5CF6" />
                <stop offset="100%" stop-color="#4338CA" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="container mx-auto px-8 pt-8 pb-32"> <!-- Padding superior reducido -->
      <div class="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        
        <!-- Columna izquierda: Información del curso -->
        <div class="w-full lg:w-1/2 space-y-6" in:fade={{ duration: 300, delay: 200 }}>
          <!-- Categoría y nivel -->
          <div class="flex items-center">
            <span class="bg-purple-600 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
              {contenido.categoria || contenido.nivel || (data.curso ? 'Curso' : 'Tutorial')}
            </span>
            <div class="flex items-center ml-3">
              <div class="flex -space-x-2 overflow-hidden">
                <img class="h-6 w-6 rounded-full ring-2 ring-white" src="/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg" alt="Estudiante" />
                <img class="h-6 w-6 rounded-full ring-2 ring-white" src="/images/Home/Cursos-Acordeon.jpg" alt="Estudiante" />
              </div>
              <span class="text-sm text-gray-300 ml-2">+{contenido.estudiantes_inscritos || '300'} estudiantes</span>
            </div>
          </div>
          
          <!-- Título principal -->
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white drop-shadow-lg">
            {contenido.titulo || 'Domina este contenido exclusivo'}
          </h1>
          
          <!-- Descripción -->
          <p class="text-lg text-gray-100">
            {contenido.descripcion_corta || 'Aprende habilidades avanzadas con este contenido exclusivo, diseñado para llevarte al siguiente nivel con metodología probada.'}
          </p>
          
          <!-- Objetivos destacados: muestra todos los objetivos reales si existen -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#if Array.isArray(contenido.objetivos) && contenido.objetivos.length > 0}
              {#each contenido.objetivos as objetivo, i}
                {#if (typeof objetivo === 'object' && objetivo.texto) || (typeof objetivo === 'string' && objetivo.trim() !== '')}
                  <div class="flex items-start" style="animation-delay: {i * 100}ms" class:animate-fade-in={true}>
                    <svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-white font-medium">{typeof objetivo === 'object' && objetivo.texto ? objetivo.texto : objetivo}</span>
                  </div>
                {/if}
              {/each}
            {:else if typeof contenido.objetivos === 'string' && contenido.objetivos.trim() !== ''}
              {#each contenido.objetivos.split('\n').filter(o => o.trim() !== '') as objetivo, i}
                <div class="flex items-start" style="animation-delay: {i * 100}ms" class:animate-fade-in={true}>
                  <svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-white font-medium">{objetivo}</span>
                </div>
              {/each}
            {:else}
              <!-- Fallback solo si no hay objetivos reales -->
              {#each ['Técnicas avanzadas', 'Contenido exclusivo', 'Soporte personalizado', 'Acceso de por vida'] as objetivo, i}
                <div class="flex items-start" style="animation-delay: {i * 100}ms" class:animate-fade-in={true}>
                  <svg class="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-white font-medium">{objetivo}</span>
                </div>
              {/each}
            {/if}
          </div>
          
          <!-- CTA y Precio -->
          <div class="pt-4">
            {#if !data.estaInscrito}
              <!-- Información de precio -->
              <div class="mb-4">
                <!-- Precios -->
                {#if contenido.precio_rebajado || contenido.fecha_expiracion}
                  <div class="flex items-center">
                    {#if contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado}
                      <span class="line-through text-gray-400 mr-2">${contenido.precio_normal.toLocaleString()}</span>
                      <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">${contenido.precio_rebajado.toLocaleString()}</span>
                    {:else}
                      <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                        ${(contenido.precio || contenido.precio_normal || contenido.precio_rebajado || 0).toLocaleString()}
                      </span>
                    {/if}
                  </div>
                  <p class="text-sm text-green-400 mt-1">✓ Pago único - Acceso de por vida</p>
                {:else if contenido.tipo_acceso === 'gratuito'}
                  <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">GRATIS</span>
                  <p class="text-sm text-green-400 mt-1">✓ Contenido 100% gratuito</p>
                {:else}
                  <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Premium</span>
                  <p class="text-sm text-green-400 mt-1">✓ Incluido en tu suscripción</p>
                {/if}
              </div>
              
              <!-- Botones CTA -->
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl px-6 py-3 font-bold shadow-xl transform transition hover:scale-105 duration-300 hover:shadow-indigo-500/30"
                  on:click={handleInscripcion}
                  disabled={isLoading}
                >
                  {#if isLoading}
                    <svg class="animate-spin h-5 w-5 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  {/if}
                  Inscribirme al curso
                </button>
                
                <button 
                  class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl px-6 py-3 font-bold shadow-lg transform transition hover:scale-105 duration-300"
                  on:click={verMasDetalles}
                >
                  Ver más detalles
                </button>
              </div>
              
              <!-- Garantía (solo para cursos de pago) -->
              {#if contenido.tipo_acceso === 'pago'}
                <div class="mt-4 flex items-center text-sm">
                  <svg class="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span>Garantía de satisfacción 30 días o te devolvemos tu dinero</span>
                </div>
              {/if}
            {:else}
              <!-- Usuario ya inscrito -->
              <button 
                class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl px-6 py-3 font-bold shadow-lg transform transition hover:scale-105 duration-300"
                on:click={verContenido}
              >
                {#if tipoContenido === 'curso'}
                  Continuar curso
                {:else}
                  Continuar tutorial
                {/if}
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Columna derecha: Imagen/video -->
        <div class="w-full lg:w-1/2 mt-6 lg:mt-0">
          <div class="relative rounded-xl overflow-hidden p-1 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 shadow-xl">
            <div class="rounded-lg overflow-hidden bg-black">
              <!-- Imagen del curso -->
              <img 
                src={contenido.imagen_url || '/images/Home/Aprende a tocar el acordeon con los mejores cursos.jpg'} 
                alt={contenido.titulo || 'Imagen del curso'} 
                class="w-full aspect-video object-cover transition-all hover:scale-105 duration-700"
                on:error={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target) {
                    target.src = '/static/images/Home/Aprende a tocar el acordeon con los mejores cursos.jpg';
                  }
                }}
              />
              
              <!-- Botón de play superpuesto -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/70 transition-all duration-300 border border-white/10 hover:scale-110">
                  <svg class="h-8 w-8 md:h-10 md:w-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              
              <!-- Badge informativo -->
              <div class="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                Vista previa
              </div>
            </div>
          </div>
          
          <!-- Valoraciones -->
          <div class="mt-4 rounded-lg p-4 shadow-lg relative overflow-hidden border border-white/10">
            <!-- Fondo negro con animación sutil -->
            <div class="absolute inset-0 z-0 bg-black">
              <div class="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-indigo-900/10"></div>
              <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-500/10 to-transparent"></div>
            </div>
            
            <!-- Contenido del testimonio -->
            <div class="relative z-10">
              <div class="flex items-center">
                <div class="flex">
                  {#each Array(5) as _, i}
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  {/each}
                </div>
                <div class="ml-2 text-sm text-white">
                  <span class="font-semibold">4.9/5</span>
                  <span class="text-white/80"> - {contenido.estudiantes_inscritos || '300'}+ estudiantes</span>
                </div>
              </div>
              <p class="mt-3 text-white italic border-l-2 border-purple-500 pl-3 text-sm">
                "{contenido.testimonio || 'Este curso superó mis expectativas. El contenido es claro y la metodología increíble. Recomendado 100%.'}" 
                <span class="font-semibold not-italic block mt-1 text-yellow-200">- {contenido.autor_testimonio || 'Carlos M.'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sección de ventajas y características principales con fondo blanco -->
  <div class="bg-white text-gray-800 py-20">
    <div class="container mx-auto px-4">
      <!-- Encabezado de la sección -->
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-purple-800">¿Por qué elegir nuestros cursos de acordeón?</h2>
        <p class="text-lg text-gray-700 max-w-3xl mx-auto">Descubre por qué más de 10,000 estudiantes confían en nuestra metodología exclusiva para dominar el acordeón vallenato</p>
      </div>
      
      <!-- Características principales - 3 columnas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <!-- Característica 1 -->
        <div class="bg-white p-6 rounded-xl border-2 border-purple-500 hover:border-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-purple-200">
          <div class="rounded-full bg-purple-600 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-purple-700">Metodología Exclusiva</h3>
          <p class="text-gray-700 mb-4">Nuestro método de enseñanza paso a paso ha sido perfeccionado durante más de 15 años, garantizando resultados rápidos incluso si nunca has tocado un acordeón.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Técnicas pedagógicas comprobadas</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Progresión lógica y fluida</span>
            </li>
          </ul>
        </div>
        
        <!-- Característica 2 -->
        <div class="bg-white p-6 rounded-xl border-2 border-blue-500 hover:border-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-blue-200">
          <div class="rounded-full bg-blue-600 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-blue-700">Acceso de por Vida</h3>
          <p class="text-gray-700 mb-4">Una vez que te inscribes, tendrás acceso ilimitado a todo el material, actualizaciones y nuevos contenidos que se añadan en el futuro.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Sin suscripciones mensuales</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Actualizaciones gratuitas</span>
            </li>
          </ul>
        </div>
        
        <!-- Característica 3 -->
        <div class="bg-white p-6 rounded-xl border-2 border-amber-500 hover:border-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-amber-200">
          <div class="rounded-full bg-amber-500 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857l-.548-.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-amber-700">Comunidad Exclusiva</h3>
          <p class="text-gray-700 mb-4">Únete a una comunidad activa de estudiantes y profesionales donde podrás compartir tus avances, resolver dudas y recibir feedback.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Grupos exclusivos de WhatsApp</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Eventos virtuales con expertos</span>
            </li>
          </ul>
        </div>
        
        <!-- Característica 4 -->
        <div class="bg-white p-6 rounded-xl border-2 border-green-500 hover:border-green-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-green-200">
          <div class="rounded-full bg-green-600 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-green-700">Garantía de Satisfacción</h3>
          <p class="text-gray-700 mb-4">Estamos tan seguros de la calidad de nuestros cursos que ofrecemos una garantía de devolución de 30 días sin preguntas.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">30 días para probar sin riesgo</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Devolución completa del 100%</span>
            </li>
          </ul>
        </div>
        
        <!-- Característica 5 -->
        <div class="bg-white p-6 rounded-xl border-2 border-pink-500 hover:border-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-pink-200">
          <div class="rounded-full bg-pink-600 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-pink-700">Contenido Premium HD</h3>
          <p class="text-gray-700 mb-4">Todas nuestras lecciones están grabadas con equipos profesionales para garantizar la mejor calidad de audio y video.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-pink-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Vídeos en alta definición (4K)</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-pink-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Audio profesional de estudio</span>
            </li>
          </ul>
        </div>
        
        <!-- Característica 6 -->
        <div class="bg-white p-6 rounded-xl border-2 border-indigo-500 hover:border-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-indigo-200">
          <div class="rounded-full bg-indigo-600 p-3 w-14 h-14 flex items-center justify-center mb-4 text-white">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-indigo-700">Aprende a Tu Ritmo</h3>
          <p class="text-gray-700 mb-4">Nuestros cursos están diseñados para que avances a tu propio paso, sin presiones ni fechas límite. Estudia cuando y donde quieras.</p>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Acceso desde cualquier dispositivo</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">Descarga las lecciones para ver offline</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- CTA final -->
      <div class="mt-16 text-center">
        <p class="text-2xl font-bold text-purple-800 mb-6">¡No esperes más para iniciar tu camino hacia el dominio del acordeón!</p>
        {#if !estaInscrito}
          <a href="#detalles" class="border border-purple-500 hover:bg-purple-700 hover:text-white rounded-lg px-7 py-4 text-lg font-semibold transition inline-block mt-2">Ver más detalles</a>
        {/if}
        <p class="mt-4 text-gray-600">Oferta por tiempo limitado. <span class="text-purple-700 font-semibold">Garantía de 30 días de devolución</span> del dinero.</p>
      </div>
    </div>
  </div>

  <!-- Sección de Precios - Fondo negro puro con padding inferior ajustado -->
  <div class="bg-black text-white pt-24 pb-16"> <!-- Padding reducido para evitar espacio vacío -->
    <div class="container mx-auto px-4 md:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Mensaje de urgencia superior -->
        <div class="text-center mb-8">
          <p class="text-xl md:text-2xl text-white mb-1">No pierdas esta oportunidad,</p>
          <p class="text-xl md:text-2xl text-white">¡garantiza hoy <span class="text-green-400 font-bold animate-pulse">tu participación!</span></p>
        </div>
        
        <!-- Tarjeta principal de precios - estilo mejorado como en la imagen -->
        <div class="bg-[#121a24] border border-green-500/30 rounded-lg overflow-hidden shadow-2xl mx-auto transition-all duration-300 hover:shadow-green-500/20 hover:shadow-xl">
          <div class="p-8">
            <!-- Título/nombre del curso o tutorial -->
            <div class="text-center mb-6">
              <p class="text-green-500 uppercase font-bold tracking-widest text-lg">{contenido.titulo || 'Curso/Tutorial'}</p>
              <p class="text-gray-400 text-sm mt-1">{contenido.descripcion_corta || 'Accede a contenido premium y exclusivo.'}</p>
            </div>
            
            <!-- Objetivos reales (viñetas) -->
            <div class="space-y-3 mb-8">
              {#if Array.isArray(contenido.objetivos) && contenido.objetivos.length > 0}
                {#each contenido.objetivos as objetivo, i}
                  <div class="flex items-start transform transition hover:translate-x-1 duration-200">
                    <span class="text-green-400 mr-3 text-xl">✓</span>
                    <p class="text-gray-300">{objetivo}</p>
                  </div>
                {/each}
              {:else}
                <!-- Fallback solo si no hay objetivos reales -->
                {#each ['Clases paso a paso completas', 'Contenido exclusivo de nivel profesional', 'Soporte directo del instructor', 'Más de 50 lecciones en video HD'] as objetivo}
                  <div class="flex items-start transform transition hover:translate-x-1 duration-200">
                    <span class="text-green-400 mr-3 text-xl">✓</span>
                    <p class="text-gray-300">{objetivo}</p>
                  </div>
                {/each}
              {/if}
            </div>

            <!-- Módulos/lecciones premium -->
            {#if contenido.modulos_preview && contenido.modulos_preview.length > 0}
              <div class="mt-8">
                <h2 class="text-xl font-bold mb-4 text-green-400">Lecciones y módulos</h2>
                <div class="space-y-3">
                  {#each contenido.modulos_preview as modulo, i}
                    <div class="p-3 bg-black/60 rounded-lg shadow-sm">
                      <div class="flex justify-between">
                        <h3 class="font-medium text-green-200">
                          Módulo {i + 1}: {modulo.titulo}
                        </h3>
                      </div>
                      {#if modulo.descripcion}
                        <p class="text-sm text-gray-400 mt-1">{modulo.descripcion}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="mt-8 bg-black/60 rounded-lg shadow-sm p-6 text-center border border-green-700">
                <svg class="mx-auto mb-3 h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg text-green-200 font-medium">Este tutorial aún no tiene lecciones o módulos disponibles.<br>¡Vuelve pronto para más contenido premium!</p>
              </div>
            {/if}

            <!-- Línea divisoria -->
            <div class="border-t border-gray-700 my-5"></div>
            
            <!-- Precio real y descuento -->
            <div class="text-center mb-8">
              {#if contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado}
                <p class="text-gray-400 line-through">De: ${contenido.precio_normal.toLocaleString()}</p>
                <div class="flex items-center justify-center mt-3">
                  <span class="text-green-400 text-5xl font-bold">${contenido.precio_rebajado.toLocaleString()}</span>
                  <span class="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">-{Math.round((1 - contenido.precio_rebajado / contenido.precio_normal) * 100)}%</span>
                </div>
                <p class="text-gray-500 text-sm mt-2">Pago único - Acceso de por vida</p>
              {:else if contenido.precio_normal}
                <p class="text-gray-400">Precio:</p>
                <span class="text-green-400 text-5xl font-bold">${contenido.precio_normal.toLocaleString()}</span>
                <p class="text-gray-500 text-sm mt-2">Pago único - Acceso de por vida</p>
              {:else}
                <span class="text-green-400 text-5xl font-bold">GRATIS</span>
                <p class="text-gray-500 text-sm mt-2">Contenido 100% gratuito</p>
              {/if}
            </div>
            
            <!-- Botón CTA con animación -->
            <button 
              class="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-6 rounded-md transform transition hover:scale-105 duration-300 text-lg uppercase shadow-lg hover:shadow-green-500/40"
              on:click={handleInscripcion}
            >
              ¡QUIERO APROVECHAR ESTA PROMOCIÓN!
            </button>
            
            <!-- Métodos de pago -->
            <div class="flex justify-center mt-6 mb-2">
              <div class="flex space-x-3">
                <!-- Usamos texto estilizado en lugar de imágenes SVG -->
                <div class="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded">
                  PayPal
                </div>
                <div class="bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded">
                  Visa
                </div>
                <div class="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded">
                  Mastercard
                </div>
                <div class="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded">
                  AmEx
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sección de Mentor - Fondo blanco para contraste -->
  <div class="bg-white text-gray-900 py-28">
    <div class="container mx-auto px-4 md:px-8">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <!-- Imagen del mentor - Ruta corregida -->
          <div class="w-full md:w-1/2">
            <div class="relative">
              <div class="absolute -inset-1 bg-gradient-to-r from-green-500 to-green-300 opacity-75 blur rounded-lg"></div>
              <div class="relative overflow-hidden rounded-lg shadow-xl">
                <img 
                  src="/images/Foto-maestro-oficial-JESUS-GONZALEZ.jpg" 
                  alt="Jesús González - Maestro de Acordeón" 
                  class="w-full h-auto object-cover transform transition hover:scale-105 duration-700"
                  on:error={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target) {
                      // Intentar varias rutas alternativas
                      target.src = '/images/Jesus-Gonzalez--Profesor-de-acordeon.jpg';
                      target.onerror = () => {
                        target.src = '/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg';
                        target.onerror = null;
                      };
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <!-- Información del mentor -->
          <div class="w-full md:w-1/2 space-y-6">
            <div>
              <h2 class="text-xl uppercase tracking-wider text-green-600 font-bold transform transition hover:translate-x-1 duration-200">JESÚS GONZÁLEZ</h2>
              <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2">¿Quién será tu mentor?</h3>
            </div>
            
            <p class="text-gray-700">
              Clases con un Maestro experto y de larga trayectoria en la música vallenata. 
              Jesús González ha compartido escenario con las más grandes estrellas del vallenato como 
              Jorge Celedón, Felipe Peláez y muchos más.
            </p>
            
            <div class="space-y-4">
              <div class="flex items-start transform transition hover:translate-x-1 duration-200">
                <svg class="h-6 w-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p class="text-gray-700">Más de 15 años de experiencia enseñando acordeón vallenato</p>
              </div>
              <div class="flex items-start transform transition hover:translate-x-1 duration-200">
                <svg class="h-6 w-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p class="text-gray-700">Metodología exclusiva paso a paso para principiantes y avanzados</p>
              </div>
              <div class="flex items-start transform transition hover:translate-x-1 duration-200">
                <svg class="h-6 w-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p class="text-gray-700">Más de 10,000 estudiantes satisfechos en todo el mundo</p>
              </div>
            </div>
            
            <!-- Botón CTA con animación -->
            <button 
              class="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-md transform transition hover:scale-105 duration-300 shadow-lg hover:shadow-green-600/30"
              on:click={handleInscripcion}
            >
              ¡GARANTIZA TU CUPO AHORA!
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Eliminar todos los márgenes y paddings por defecto */
  :global(body), :global(html) {
    margin: 0 !important;
    padding: 0 !important;
    background-color: black !important;
  }
  
  /* Ocultar navegación */
  :global(.premium-view) {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden;
    background-color: black !important;
  }
  
  :global(.premium-view) :global(footer),
  :global(.premium-view) :global(nav),
  :global(.premium-view) :global(#sidebar),
  :global(.premium-view) :global(.sidebar) {
    display: none !important;
  }
  
  :global(.premium-view) :global(#main-content) {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }
  
  /* Animaciones */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  @keyframes slowlySpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-slowly-spin {
    animation: slowlySpin 60s linear infinite;
  }
  
  /* Estilos de fondo y efectos */
  :global(body.premium-view) {
    background-color: #000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
</style> 