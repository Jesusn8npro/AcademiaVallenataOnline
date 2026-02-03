<script lang="ts">
  import { onMount } from 'svelte';
  import { eventosService, type Evento } from '$lib/services/eventosService';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  
  // Props
  export let vista: 'calendario' | 'grid' | 'lista' = 'grid';
  export let mostrarFiltros: boolean = true;
  export let eventosPorPagina: number = 12;
  
  // Estado del componente
  let eventos: Evento[] = [];
  let loading = true;
  let error: string | null = null;
  let paginaActual = 0;
  let totalEventos = 0;
  let totalPaginas = 0;
  
  // Filtros
  let filtros = {
    categoria: '',
    tipo_evento: '',
    nivel_dificultad: '',
    es_gratuito: undefined as boolean | undefined,
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: ''
  };
  
  // Opciones para filtros
  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'tecnica', label: 'Técnica' },
    { value: 'teoria', label: 'Teoría' },
    { value: 'repertorio', label: 'Repertorio' },
    { value: 'historia', label: 'Historia' }
  ];
  
  const tiposEvento = [
    { value: '', label: 'Todos los tipos' },
    { value: 'masterclass', label: 'Masterclass' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'concierto', label: 'Concierto' },
    { value: 'concurso', label: 'Concurso' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'reunion', label: 'Reunión' }
  ];
  
  const nivelesEvento = [
    { value: '', label: 'Todos los niveles' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
    { value: 'profesional', label: 'Profesional' }
  ];

  // Funciones de utilidad
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  function formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }
  
  function obtenerColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      masterclass: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      concierto: 'bg-purple-100 text-purple-800',
      concurso: 'bg-orange-100 text-orange-800',
      webinar: 'bg-indigo-100 text-indigo-800',
      reunion: 'bg-gray-100 text-gray-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  }
  
  function obtenerColorNivel(nivel: string): string {
    const colores: Record<string, string> = {
      principiante: 'bg-green-500',
      intermedio: 'bg-yellow-500',
      avanzado: 'bg-orange-500',
      profesional: 'bg-red-500'
    };
    return colores[nivel] || 'bg-gray-500';
  }
  
  // Funciones principales
  async function cargarEventos(): Promise<void> {
    loading = true;
    error = null;
    
    try {
      const { eventos: eventosData, total, error: errorData } = await eventosService.obtenerEventos({
        ...filtros,
        estado: 'programado',
        limit: eventosPorPagina,
        offset: paginaActual * eventosPorPagina
      });
      
      if (errorData) {
        error = errorData;
        return;
      }
      
      eventos = eventosData;
      totalEventos = total;
      totalPaginas = Math.ceil(total / eventosPorPagina);
    } catch (err: any) {
      error = err.message || 'Error desconocido';
      console.error('Error cargando eventos:', err);
    } finally {
      loading = false;
    }
  }
  
  function aplicarFiltros(): void {
    paginaActual = 0;
    cargarEventos();
  }
  
  function limpiarFiltros(): void {
    filtros = {
      categoria: '',
      tipo_evento: '',
      nivel_dificultad: '',
      es_gratuito: undefined,
      busqueda: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    aplicarFiltros();
  }
  
  function cambiarPagina(nuevaPagina: number): void {
    paginaActual = nuevaPagina;
    cargarEventos();
  }
  
  function irAEvento(slug: string): void {
    window.location.href = `/eventos/${slug}`;
  }
  
  // Cargar eventos al montar el componente
  onMount(() => {
    cargarEventos();
  });
</script>

<!-- Componente Principal -->
<div class="w-full max-w-7xl mx-auto p-6 bg-white">
  <!-- Header con títulos y controles de vista -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
    <div class="mb-4 lg:mb-0">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        📅 Calendario de Eventos
      </h1>
      <p class="text-gray-600">
        Descubre masterclasses, workshops y eventos especiales de acordeón
      </p>
    </div>
    
    <!-- Selector de vista -->
    <div class="flex bg-gray-100 rounded-lg p-1">
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-all {vista === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => vista = 'grid'}
      >
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 grid grid-cols-2 gap-0.5">
            <div class="bg-current rounded-sm"></div>
            <div class="bg-current rounded-sm"></div>
            <div class="bg-current rounded-sm"></div>
            <div class="bg-current rounded-sm"></div>
          </div>
          Grid
        </div>
      </button>
      <button
        class="px-4 py-2 rounded-md text-sm font-medium transition-all {vista === 'lista' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => vista = 'lista'}
      >
        <div class="flex items-center gap-2">
          <div class="flex flex-col gap-0.5">
            <div class="w-4 h-0.5 bg-current rounded"></div>
            <div class="w-4 h-0.5 bg-current rounded"></div>
            <div class="w-4 h-0.5 bg-current rounded"></div>
          </div>
          Lista
        </div>
      </button>
    </div>
  </div>
  
  <!-- Filtros -->
  {#if mostrarFiltros}
    <div class="bg-gray-50 rounded-xl p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
          </svg>
          Filtros
        </h3>
        <button
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          on:click={limpiarFiltros}
        >
          Limpiar filtros
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <!-- Búsqueda -->
        <div class="xl:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Buscar eventos
          </label>
          <input
            type="text"
            placeholder="Busca por título o descripción..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={filtros.busqueda}
            on:input={aplicarFiltros}
          />
        </div>
        
        <!-- Categoría -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <select
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={filtros.categoria}
            on:change={aplicarFiltros}
          >
            {#each categorias as categoria}
              <option value={categoria.value}>{categoria.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={filtros.tipo_evento}
            on:change={aplicarFiltros}
          >
            {#each tiposEvento as tipo}
              <option value={tipo.value}>{tipo.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Nivel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
          <select
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={filtros.nivel_dificultad}
            on:change={aplicarFiltros}
          >
            {#each nivelesEvento as nivel}
              <option value={nivel.value}>{nivel.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Solo gratuitos -->
        <div class="flex items-center pt-6">
          <input
            type="checkbox"
            id="solo-gratuitos"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={filtros.es_gratuito === true}
            on:change={(e) => {
              const target = e.target as HTMLInputElement;
              filtros.es_gratuito = target?.checked ? true : undefined;
              aplicarFiltros();
            }}
          />
          <label for="solo-gratuitos" class="ml-2 text-sm text-gray-700">
            Solo eventos gratuitos
          </label>
        </div>
        
        <!-- Fecha desde -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Desde</label>
          <input
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={filtros.fecha_desde}
            on:change={aplicarFiltros}
          />
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Loading -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  <!-- Error -->
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-600 mb-2">❌ Error cargando eventos</div>
      <p class="text-red-700">{error}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        on:click={cargarEventos}
      >
        Reintentar
      </button>
    </div>
  <!-- Contenido -->
  {:else}
    <!-- Vista Grid -->
    {#if vista === 'grid'}
      {#if eventos.length === 0}
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay eventos</h3>
          <p class="text-gray-600">No se encontraron eventos con los filtros seleccionados.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {#each eventos as evento}
            <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer" on:click={() => irAEvento(evento.slug)}>
              <!-- Imagen del evento -->
              <div class="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                {#if evento.imagen_portada}
                  <img
                    src={evento.imagen_portada}
                    alt={evento.titulo}
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center text-white">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                {/if}
                
                <!-- Badges superiores -->
                <div class="absolute top-4 left-4 flex flex-col gap-2">
                  <span class="px-2 py-1 text-xs font-medium rounded-full {obtenerColorTipo(evento.tipo_evento)}">
                    {evento.tipo_evento}
                  </span>
                  {#if evento.es_gratuito}
                    <span class="px-2 py-1 text-xs font-bold bg-green-500 text-white rounded-full">
                      GRATIS
                    </span>
                  {/if}
                  {#if evento.es_destacado}
                    <span class="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded-full flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Destacado
                    </span>
                  {/if}
                </div>
                
                <!-- Nivel de dificultad -->
                {#if evento.nivel_dificultad}
                  <div class="absolute top-4 right-4">
                    <div class="w-3 h-3 rounded-full {obtenerColorNivel(evento.nivel_dificultad)}"></div>
                  </div>
                {/if}
              </div>
              
              <!-- Contenido de la tarjeta -->
              <div class="p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {evento.titulo}
                </h3>
                
                {#if evento.descripcion_corta}
                  <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                    {evento.descripcion_corta}
                  </p>
                {/if}
                
                <!-- Información del evento -->
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{formatearFecha(evento.fecha_inicio)}</span>
                  </div>
                  
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>{formatearHora(evento.fecha_inicio)}</span>
                    {#if evento.fecha_fin}
                      - {formatearHora(evento.fecha_fin)}
                    {/if}
                  </div>
                  
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{evento.modalidad === 'online' ? 'En línea' : evento.modalidad === 'presencial' ? 'Presencial' : 'Híbrido'}</span>
                  </div>
                  
                  {#if evento.instructor_nombre}
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <span>Instructor: {evento.instructor_nombre}</span>
                    </div>
                  {/if}
                </div>
                
                <!-- Footer de la tarjeta -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                  <!-- Precio -->
                  <div class="flex items-center gap-2">
                    {#if evento.es_gratuito}
                      <span class="text-lg font-bold text-green-600">Gratis</span>
                    {:else}
                      <div class="flex flex-col">
                        {#if evento.precio_rebajado && evento.precio_rebajado < evento.precio}
                          <span class="text-xs text-gray-500 line-through">
                            {formatearPrecio(evento.precio)}
                          </span>
                          <span class="text-lg font-bold text-blue-600">
                            {formatearPrecio(evento.precio_rebajado)}
                          </span>
                        {:else}
                          <span class="text-lg font-bold text-blue-600">
                            {formatearPrecio(evento.precio)}
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Estadísticas -->
                  <div class="flex items-center gap-3 text-sm text-gray-500">
                    <div class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <span>{evento.participantes_inscritos}</span>
                    </div>
                    
                    {#if evento.calificacion_promedio > 0}
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>{evento.calificacion_promedio.toFixed(1)}</span>
                      </div>
                    {/if}
                    
                    {#if evento.total_visualizaciones > 0}
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span>{evento.total_visualizaciones}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    
    <!-- Vista Lista -->
    {:else if vista === 'lista'}
      <div class="space-y-4 mb-8">
        {#each eventos as evento}
          <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer" on:click={() => irAEvento(evento.slug)}>
            <div class="p-6">
              <div class="flex items-start gap-6">
                <!-- Imagen pequeña -->
                <div class="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                  {#if evento.imagen_portada}
                    <img
                      src={evento.imagen_portada}
                      alt={evento.titulo}
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-white">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  {/if}
                </div>
                
                <!-- Contenido -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {evento.titulo}
                      </h3>
                      
                      {#if evento.descripcion_corta}
                        <p class="text-gray-600 mb-4 line-clamp-2">
                          {evento.descripcion_corta}
                        </p>
                      {/if}
                      
                      <!-- Información del evento -->
                      <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <span>{formatearFecha(evento.fecha_inicio)}</span>
                        </div>
                        
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                          <span>{formatearHora(evento.fecha_inicio)}</span>
                        </div>
                        
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>{evento.modalidad === 'online' ? 'En línea' : evento.modalidad === 'presencial' ? 'Presencial' : 'Híbrido'}</span>
                        </div>
                        
                        {#if evento.instructor_nombre}
                          <div class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            <span>{evento.instructor_nombre}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Sidebar derecho -->
                    <div class="flex flex-col items-end gap-3">
                      <!-- Badges -->
                      <div class="flex flex-col gap-2">
                        <span class="px-3 py-1 text-xs font-medium rounded-full {obtenerColorTipo(evento.tipo_evento)}">
                          {evento.tipo_evento}
                        </span>
                        {#if evento.es_gratuito}
                          <span class="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full text-center">
                            GRATIS
                          </span>
                        {/if}
                      </div>
                      
                      <!-- Precio -->
                      <div class="text-right">
                        {#if evento.es_gratuito}
                          <span class="text-lg font-bold text-green-600">Gratis</span>
                        {:else}
                          {#if evento.precio_rebajado && evento.precio_rebajado < evento.precio}
                            <div class="text-xs text-gray-500 line-through">
                              {formatearPrecio(evento.precio)}
                            </div>
                            <div class="text-lg font-bold text-blue-600">
                              {formatearPrecio(evento.precio_rebajado)}
                            </div>
                          {:else}
                            <div class="text-lg font-bold text-blue-600">
                              {formatearPrecio(evento.precio)}
                            </div>
                          {/if}
                        {/if}
                      </div>
                      
                      <!-- Estadísticas -->
                      <div class="flex items-center gap-3 text-sm text-gray-500">
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span>{evento.participantes_inscritos}</span>
                        </div>
                        
                        {#if evento.calificacion_promedio > 0}
                          <div class="flex items-center gap-1">
                            <svg class="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>{evento.calificacion_promedio.toFixed(1)}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
    
    <!-- Paginación -->
    {#if totalPaginas > 1}
      <div class="flex items-center justify-center gap-2">
        <button
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={paginaActual === 0}
          on:click={() => cambiarPagina(paginaActual - 1)}
        >
          Anterior
        </button>
        
        {#each Array(totalPaginas) as _, i}
          {#if i === 0 || i === totalPaginas - 1 || (i >= paginaActual - 2 && i <= paginaActual + 2)}
            <button
              class="px-3 py-2 text-sm font-medium rounded-lg {i === paginaActual ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}"
              on:click={() => cambiarPagina(i)}
            >
              {i + 1}
            </button>
          {:else if i === paginaActual - 3 || i === paginaActual + 3}
            <span class="px-3 py-2 text-sm text-gray-500">...</span>
          {/if}
        {/each}
        
        <button
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={paginaActual === totalPaginas - 1}
          on:click={() => cambiarPagina(paginaActual + 1)}
        >
          Siguiente
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 