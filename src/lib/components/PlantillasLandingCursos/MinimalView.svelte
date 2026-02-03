<!-- src/lib/components/PlantillasLandingCursos/MinimalView.svelte -->
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
  
  // Manejar errores de imagen
  let imageError = false;
  let imageLoading = true;
  
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
  
  // Manejar errores de imagen
  function handleImageError() {
    imageError = true;
    imageLoading = false;
  }
  
  function handleImageLoaded() {
    imageLoading = false;
  }
  
  function isValidImageUrl(url: string | null | undefined) {
    if (!url) return false;
    url = url.trim();
    if (url === '') return false;
    return url.startsWith('http://') || 
           url.startsWith('https://') ||
           url.includes('supabase.co') ||
           url.includes('storage');
  }
</script>

<!-- Minimal Header Section -->
<div class="bg-white">
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-4xl mx-auto">
      <!-- Title and Category -->
      <div class="text-center mb-8">
        <div class="mb-3">
          <span class="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            {contenido.categoria || contenido.nivel || (data.curso ? 'Curso' : 'Tutorial')}
          </span>
        </div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{contenido.titulo}</h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">{contenido.descripcion_corta}</p>
      </div>
      
      <!-- Meta Information -->
      <div class="flex flex-wrap justify-center gap-6 mb-10">
        {#if contenido.duracion_total}
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-gray-700">{formatDuracion(contenido.duracion_total)}</span>
          </div>
        {/if}
        
        {#if contenido.nivel}
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-gray-700">{contenido.nivel}</span>
          </div>
        {/if}
        
        {#if instructorInfo}
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-gray-700">{`${instructorInfo.first_name} ${instructorInfo.last_name}` || instructorInfo.email}</span>
          </div>
        {/if}
      </div>
      
      <!-- Image -->
      <div class="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-10">
        {#if imageLoading}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        {/if}
        
        {#if isValidImageUrl(contenido.imagen_url) && !imageError}
          <img 
            src={contenido.imagen_url} 
            alt={contenido.titulo || 'Imagen del contenido'} 
            class="object-cover w-full h-full"
            on:error={handleImageError}
            on:load={handleImageLoaded}
          />
        {:else}
          <div class="flex items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        {/if}
      </div>
      
      <!-- Action Button -->
      <div class="text-center mb-12">
        {#if !estaInscrito}
          <button 
            class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            on:click={verContenido}
          >
            Ir al contenido
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Content Description -->
<div class="bg-gray-50 py-12">
  <div class="container mx-auto px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Objectives -->
      {#if contenido.objetivos}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Lo que aprenderás</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      
      <!-- Description -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-bold mb-4">Descripción detallada</h2>
        <div class="prose prose-lg max-w-none">
          {#if contenido.descripcion}
            <p>{@html contenido.descripcion.replace(/\n/g, '<br />')}</p>
          {:else}
            <p>No hay descripción detallada disponible para este contenido.</p>
          {/if}
        </div>
      </div>
      
      <!-- Modules Preview (if available) -->
      {#if contenido.modulos_preview && contenido.modulos_preview.length > 0}
        <div class="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Contenido</h2>
          <div class="space-y-3">
            {#each contenido.modulos_preview as modulo, i}
              <div class="p-3 bg-gray-50 rounded-lg">
                <h3 class="font-medium">
                  Módulo {i + 1}: {modulo.titulo}
                </h3>
                {#if modulo.descripcion}
                  <p class="text-sm text-gray-600 mt-1">{modulo.descripcion}</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="mt-6 bg-white/80 rounded-lg shadow-sm p-6 text-center">
          <svg class="mx-auto mb-3 h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg text-gray-700 font-medium">Este tutorial aún no tiene lecciones o módulos disponibles.<br>¡Vuelve pronto para más contenido!</p>
        </div>
      {/if}
      
      <!-- Requirements -->
      {#if contenido.requisitos}
        <div class="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-bold mb-4">Requisitos</h2>
          <div>
            {#each Array.isArray(contenido.requisitos) 
              ? contenido.requisitos 
              : contenido.requisitos.split('\n') as requisito}
              {#if requisito && requisito.trim()}
                <div class="flex items-start mb-2">
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
    </div>
  </div>
</div> 