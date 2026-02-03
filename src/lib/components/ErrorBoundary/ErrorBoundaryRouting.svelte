<!-- ✅ FASE 2: ERROR BOUNDARY PARA ROUTING -->
<!-- Basado en la documentación oficial de SvelteKit para manejo de errores -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  // Props
  export let children: any;
  export let fallback: any = null;
  
  // Estado
  let hasError = false;
  let error: Error | null = null;
  let errorInfo: any = null;
  
  // ✅ SOLUCIÓN: Manejo de errores de routing
  let erroresRouting: Array<{ ruta: string; error: string; timestamp: number }> = [];
  
  // ✅ SOLUCIÓN: Verificar errores de routing
  function verificarErroresRouting() {
    if (!browser) return;
    
    try {
      // ✅ SOLUCIÓN: Verificar si hay errores en la consola
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        // ✅ SOLUCIÓN: Capturar errores de routing
        if (args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('routing') || arg.includes('navigation') || arg.includes('hydrate'))
        )) {
          const rutaActual = $page.url.pathname;
          erroresRouting.push({
            ruta: rutaActual,
            error: args.join(' '),
            timestamp: Date.now()
          });
          
          console.log('🔍 [ERROR BOUNDARY] Error de routing capturado:', args);
        }
        
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        // ✅ SOLUCIÓN: Capturar warnings de routing
        if (args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('routing') || arg.includes('navigation') || arg.includes('hydrate'))
        )) {
          const rutaActual = $page.url.pathname;
          erroresRouting.push({
            ruta: rutaActual,
            error: `WARNING: ${args.join(' ')}`,
            timestamp: Date.now()
          });
          
          console.log('🔍 [ERROR BOUNDARY] Warning de routing capturado:', args);
        }
        
        originalWarn.apply(console, args);
      };
      
      // ✅ SOLUCIÓN: Restaurar funciones originales al destruir
      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    } catch (error) {
      console.warn('⚠️ [ERROR BOUNDARY] Error configurando captura:', error);
    }
  }
  
  // ✅ SOLUCIÓN: Manejar errores de routing
  function manejarErrorRouting(error: Error, errorInfo: any) {
    if (!browser) return;
    
    hasError = true;
    this.error = error;
    this.errorInfo = errorInfo;
    
    // ✅ SOLUCIÓN: Registrar error de routing
    const rutaActual = $page.url.pathname;
    erroresRouting.push({
      ruta: rutaActual,
      error: error.message,
      timestamp: Date.now()
    });
    
    console.error('❌ [ERROR BOUNDARY] Error de routing capturado:', {
      error: error.message,
      stack: error.stack,
      ruta: rutaActual,
      errorInfo
    });
    
    // ✅ SOLUCIÓN: Intentar recuperación automática
    setTimeout(() => {
      intentarRecuperacionAutomatica();
    }, 1000);
  }
  
  // ✅ SOLUCIÓN: Recuperación automática de errores de routing
  function intentarRecuperacionAutomatica() {
    if (!browser || !hasError) return;
    
    try {
      console.log('🔄 [ERROR BOUNDARY] Intentando recuperación automática...');
      
      // ✅ SOLUCIÓN: Limpiar estado de error
      hasError = false;
      this.error = null;
      this.errorInfo = null;
      
      // ✅ SOLUCIÓN: Forzar re-renderizado
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));
      }
      
      console.log('✅ [ERROR BOUNDARY] Recuperación automática completada');
    } catch (error) {
      console.warn('⚠️ [ERROR BOUNDARY] Error en recuperación automática:', error);
    }
  }
  
  // ✅ SOLUCIÓN: Reset manual del error boundary
  function resetErrorBoundary() {
    hasError = false;
    this.error = null;
    this.errorInfo = null;
    erroresRouting = [];
    
    console.log('🔄 [ERROR BOUNDARY] Error boundary reseteado manualmente');
  }
  
  // ✅ SOLUCIÓN: Obtener estadísticas de errores
  function obtenerEstadisticasErrores() {
    const ahora = Date.now();
    const ultimaHora = ahora - (60 * 60 * 1000);
    
    return {
      totalErrores: erroresRouting.length,
      erroresUltimaHora: erroresRouting.filter(e => e.timestamp > ultimaHora).length,
      rutasConErrores: [...new Set(erroresRouting.map(e => e.ruta))],
      ultimoError: erroresRouting[erroresRouting.length - 1] || null
    };
  }
  
  onMount(() => {
    if (browser) {
      console.log('🔧 [ERROR BOUNDARY] Error boundary de routing montado');
      const cleanup = verificarErroresRouting();
      
      // ✅ SOLUCIÓN: Limpiar al destruir
      onDestroy(() => {
        if (cleanup) cleanup();
      });
    }
  });
</script>

<!-- ✅ SOLUCIÓN: Renderizado condicional basado en estado de error -->
{#if hasError}
  <!-- ✅ SOLUCIÓN: UI de error personalizada -->
  <div class="error-boundary-routing">
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">Error de Navegación Detectado</h2>
      <p class="error-message">
        Se ha detectado un problema en la navegación. El sistema está intentando recuperarse automáticamente.
      </p>
      
      <!-- ✅ SOLUCIÓN: Información detallada del error -->
      {#if error}
        <details class="error-details">
          <summary>Detalles del Error</summary>
          <div class="error-stack">
            <strong>Mensaje:</strong> {error.message}
            {#if error.stack}
              <br>
              <strong>Stack:</strong>
              <pre>{error.stack}</pre>
            {/if}
          </div>
        </details>
      {/if}
      
      <!-- ✅ SOLUCIÓN: Estadísticas de errores -->
      {#if erroresRouting.length > 0}
        <div class="error-stats">
          <h4>Estadísticas de Errores:</h4>
          <p>Total de errores: {erroresRouting.length}</p>
          <p>Rutas afectadas: {obtenerEstadisticasErrores().rutasConErrores.length}</p>
        </div>
      {/if}
      
      <!-- ✅ SOLUCIÓN: Botones de acción -->
      <div class="error-actions">
        <button class="btn-recuperar" on:click={intentarRecuperacionAutomatica}>
          🔄 Intentar Recuperación
        </button>
        <button class="btn-reset" on:click={resetErrorBoundary}>
          🧹 Reset Manual
        </button>
        <button class="btn-reload" on:click={() => window.location.reload()}>
          🔄 Recargar Página
        </button>
      </div>
    </div>
  </div>
{:else}
  <!-- ✅ SOLUCIÓN: Renderizado normal de children -->
  {@render children()}
{/if}

<style>
  /* ✅ SOLUCIÓN: Estilos para error boundary */
  .error-boundary-routing {
    padding: 2rem;
    text-align: center;
    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
    border-radius: 12px;
    margin: 1rem;
    border: 1px solid #fca5a5;
  }
  
  .error-container {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-title {
    color: #dc2626;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  .error-message {
    color: #7f1d1d;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  .error-details {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }
  
  .error-details summary {
    cursor: pointer;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .error-stack {
    font-family: monospace;
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.75rem;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .error-stats {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .error-stats h4 {
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .btn-recuperar,
  .btn-reset,
  .btn-reload {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-recuperar {
    background: #059669;
    color: white;
  }
  
  .btn-recuperar:hover {
    background: #047857;
    transform: translateY(-2px);
  }
  
  .btn-reset {
    background: #dc2626;
    color: white;
  }
  
  .btn-reset:hover {
    background: #b91c1c;
    transform: translateY(-2px);
  }
  
  .btn-reload {
    background: #2563eb;
    color: white;
  }
  
  .btn-reload:hover {
    background: #1d4ed8;
    transform: translateY(-2px);
  }
  
  /* ✅ SOLUCIÓN: Responsive design */
  @media (max-width: 768px) {
    .error-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .btn-recuperar,
    .btn-reset,
    .btn-reload {
      width: 100%;
      max-width: 300px;
    }
  }
</style> 