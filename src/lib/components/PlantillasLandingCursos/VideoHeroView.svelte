<!-- src/lib/components/PlantillasLandingCursos/VideoHeroView.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props
  export let data: any;
  export let handleInscripcion: () => Promise<void>;
  export let verContenido: () => void;
  
  // Datos del contenido (curso o tutorial)
  const contenido = data.curso || data.tutorial;
  
  // Estado
  let isLoading = false;
  let instructorInfo = contenido.instructor || null;
  let estaInscrito = data.estaInscrito || false;
  let videoError = false;
  let videoLoading = true;
  
  // Formatear duración
  function formatDuracion(minutos?: number): string {
    if (!minutos) return 'Duración no especificada';
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    
    if (horas === 0) {
      return `${minutosRestantes} minutos`;
    } else if (horas === 1 && minutosRestantes === 0) {
      return '1 hora';
    } else if (minutosRestantes === 0) {
      return `${horas} horas`;
    } else {
      return `${horas} h ${minutosRestantes} min`;
    }
  }
  
  function handleVideoError() {
    videoError = true;
    videoLoading = false;
  }
  
  function handleVideoLoaded() {
    videoLoading = false;
  }
  
  // Extraer ID de YouTube si existe
  function getYouTubeID(url: string | null | undefined): string | null {
    if (!url) return null;
    
    // Patrones de URL de YouTube
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
  
  function isValidVideoUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    url = url.trim();
    if (url === '') return false;
    
    // Verificar si es una URL de YouTube o video genérico
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.ogg');
  }
  
  // Determinar la fuente de video
  const youtubeID = getYouTubeID(contenido.video_url || contenido.trailer_url);
  const hasVideo = youtubeID || isValidVideoUrl(contenido.video_url || contenido.trailer_url);
  const videoUrl = contenido.video_url || contenido.trailer_url;
</script>

<!-- Video Hero Section -->
<div class="bg-black text-white">
  <div class="w-full">
    <!-- Video Hero -->
    <div class="relative w-full" style="padding-bottom: 56.25%"> <!-- 16:9 Aspect Ratio -->
      {#if videoLoading}
        <div class="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div class="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
        </div>
      {/if}
      
      {#if hasVideo}
        {#if youtubeID}
          <iframe 
            class="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeID}?rel=0&showinfo=0&autoplay=0`}
            title={contenido.titulo}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            on:load={handleVideoLoaded}
            on:error={handleVideoError}
          ></iframe>
        {:else if isValidVideoUrl(videoUrl)}
          <video 
            class="absolute top-0 left-0 w-full h-full"
            controls
            on:loadeddata={handleVideoLoaded}
            on:error={handleVideoError}
          >
            <source src={videoUrl} type={videoUrl.endsWith('.mp4') ? 'video/mp4' : videoUrl.endsWith('.webm') ? 'video/webm' : 'video/ogg'}>
            Tu navegador no soporta videos HTML5.
          </video>
        {/if}
      {:else}
        <!-- Si no hay video, mostrar imagen alternativa -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-800 flex items-center justify-center">
          {#if contenido.imagen_url}
            <img 
              src={contenido.imagen_url} 
              alt={contenido.titulo} 
              class="w-full h-full object-cover opacity-60"
            />
          {/if}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center p-8 bg-black bg-opacity-50 rounded-lg max-w-2xl">
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{contenido.titulo}</h1>
              <p class="text-lg mb-6">{contenido.descripcion_corta}</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Content Info Bar -->
  <div class="bg-gray-900 py-4">
    <div class="container mx-auto px-4">
      <div class="flex flex-wrap items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{contenido.titulo}</h1>
          <div class="flex flex-wrap gap-4 mt-2 text-gray-300">
            {#if contenido.duracion_total}
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatDuracion(contenido.duracion_total)}</span>
              </div>
            {/if}
            
            {#if contenido.nivel}
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{contenido.nivel}</span>
              </div>
            {/if}
            
            {#if instructorInfo}
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{`${instructorInfo.first_name} ${instructorInfo.last_name}` || instructorInfo.email}</span>
              </div>
            {/if}
          </div>
        </div>
        
        <div class="mt-4 lg:mt-0">
          {#if !estaInscrito}
            <button 
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              on:click={handleInscripcion}
              disabled={isLoading}
            >
              {#if isLoading}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              {/if}
              Inscribirme ahora
            </button>
          {:else}
            <button 
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              on:click={verContenido}
            >
              Ir al contenido
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Content Section -->
<div class="bg-white py-12">
  <div class="container mx-auto px-4">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Description -->
        <div class="lg:col-span-2">
          <h2 class="text-2xl font-bold mb-6">Acerca de este {data.curso ? 'curso' : 'tutorial'}</h2>
          <div class="prose prose-lg max-w-none mb-8">
            {#if contenido.descripcion}
              <p>{@html contenido.descripcion.replace(/\n/g, '<br />')}</p>
            {:else}
              <p>No hay descripción detallada disponible para este contenido.</p>
            {/if}
          </div>
          
          <!-- Modules Preview -->
          {#if contenido.modulos_preview && contenido.modulos_preview.length > 0}
            <div class="mt-8">
              <h2 class="text-2xl font-bold mb-4">Lecciones y módulos</h2>
              <div class="space-y-3">
                {#each contenido.modulos_preview as modulo, i}
                  <div class="p-3 bg-white rounded-lg shadow-sm">
                    <div class="flex justify-between">
                      <h3 class="font-medium">
                        Módulo {i + 1}: {modulo.titulo}
                      </h3>
                    </div>
                    {#if modulo.descripcion}
                      <p class="text-sm text-gray-600 mt-1">{modulo.descripcion}</p>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="mt-8 bg-white/80 rounded-lg shadow-sm p-6 text-center">
              <svg class="mx-auto mb-3 h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-lg text-gray-700 font-medium">Este tutorial aún no tiene lecciones o módulos disponibles.<br>¡Vuelve pronto para más contenido!</p>
            </div>
          {/if}
        </div>
        
        <!-- Right Column - Cards -->
        <div>
          <!-- Lo que aprenderás -->
          {#if contenido.objetivos}
            <div class="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 class="text-xl font-bold mb-4">Lo que aprenderás</h2>
              <div class="space-y-2">
                {#each Array.isArray(contenido.objetivos) 
                  ? contenido.objetivos 
                  : contenido.objetivos.split('\n') as objetivo}
                  {#if objetivo && objetivo.trim()}
                    <div class="flex items-start">
                      <svg class="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{objetivo}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Requisitos -->
          {#if contenido.requisitos}
            <div class="bg-gray-50 rounded-lg p-6">
              <h2 class="text-xl font-bold mb-4">Requisitos</h2>
              <div class="space-y-2">
                {#each Array.isArray(contenido.requisitos) 
                  ? contenido.requisitos 
                  : contenido.requisitos.split('\n') as requisito}
                  {#if requisito && requisito.trim()}
                    <div class="flex items-start">
                      <svg class="h-5 w-5 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{requisito}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Acceso -->
          <div class="bg-gray-50 rounded-lg p-6 mt-6">
            <h2 class="text-xl font-bold mb-4">Acceso al {data.curso ? 'curso' : 'tutorial'}</h2>
            <div class="flex flex-col space-y-4">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Acceso ilimitado</span>
              </div>
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Aprende a tu ritmo</span>
              </div>
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Disponible en todos tus dispositivos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 