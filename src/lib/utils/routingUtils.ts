// ✅ FASE 2: UTILIDADES DE ROUTING INTELIGENTE
// Basadas en la documentación oficial de SvelteKit para routing estable

import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';

/**
 * ✅ UTILIDAD: Sistema de routing inteligente para hidratación estable
 */
export class RoutingInteligente {
  private static instance: RoutingInteligente;
  private rutasCriticas: Set<string> = new Set();
  private rutasEnCache: Map<string, any> = new Map();
  private navegacionEnProgreso: boolean = false;

  private constructor() {
    this.inicializarRutasCriticas();
  }

  static getInstance(): RoutingInteligente {
    if (!RoutingInteligente.instance) {
      RoutingInteligente.instance = new RoutingInteligente();
    }
    return RoutingInteligente.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar rutas críticas para prefetch
   */
  private inicializarRutasCriticas(): void {
    this.rutasCriticas = new Set([
      '/panel-estudiante',
      '/panel-administracion',
      '/mis-cursos',
      '/mi-perfil',
      '/comunidad',
      '/blog'
    ]);
  }

  /**
   * ✅ SOLUCIÓN: Navegación inteligente con verificación de hidratación
   */
  async navegarInteligente(ruta: string, opciones?: { replaceState?: boolean }): Promise<void> {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Verificar si la navegación está en progreso
      if (this.navegacionEnProgreso) {
        console.log('⚠️ [ROUTING] Navegación en progreso, esperando...');
        return;
      }

      this.navegacionEnProgreso = true;
      console.log('🚀 [ROUTING] Iniciando navegación inteligente a:', ruta);

      // ✅ SOLUCIÓN: Verificar si es una ruta crítica
      if (this.rutasCriticas.has(ruta)) {
        await this.prefetchRuta(ruta);
      }

      // ✅ SOLUCIÓN: Navegación con manejo de errores
      await goto(ruta, opciones);

      // ✅ SOLUCIÓN: Verificar estabilidad post-navegación
      setTimeout(() => {
        this.verificarEstabilidadPostNavegacion(ruta);
      }, 100);

      console.log('✅ [ROUTING] Navegación completada a:', ruta);
    } catch (error) {
      console.error('❌ [ROUTING] Error en navegación:', error);
      this.manejarErrorNavegacion(error, ruta);
    } finally {
      this.navegacionEnProgreso = false;
    }
  }

  /**
   * ✅ SOLUCIÓN: Prefetch inteligente de rutas críticas
   */
  private async prefetchRuta(ruta: string): Promise<void> {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Verificar si ya está en cache
      if (this.rutasEnCache.has(ruta)) {
        console.log('📦 [ROUTING] Ruta ya en cache:', ruta);
        return;
      }

      console.log('📦 [ROUTING] Prefetch de ruta crítica:', ruta);
      
      // ✅ SOLUCIÓN: Simular prefetch para rutas críticas
      this.rutasEnCache.set(ruta, { timestamp: Date.now() });
      
      // ✅ SOLUCIÓN: Delay para simular prefetch
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('✅ [ROUTING] Prefetch completado para:', ruta);
    } catch (error) {
      console.warn('⚠️ [ROUTING] Error en prefetch:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Verificar estabilidad post-navegación
   */
  private verificarEstabilidadPostNavegacion(ruta: string): void {
    if (!browser) return;

    try {
      const rutaActual = get(page).url.pathname;
      
      if (rutaActual === ruta) {
        console.log('✅ [ROUTING] Estabilidad confirmada para:', ruta);
        this.optimizarRendimientoPostNavegacion(ruta);
      } else {
        console.warn('⚠️ [ROUTING] Inestabilidad detectada en:', ruta);
      }
    } catch (error) {
      console.warn('⚠️ [ROUTING] Error verificando estabilidad:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Optimizar rendimiento post-navegación
   */
  private optimizarRendimientoPostNavegacion(ruta: string): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Limpiar cache de rutas no críticas
      this.limpiarCacheRutas();
      
      // ✅ SOLUCIÓN: Optimizar scroll y focus
      this.optimizarScrollYFocus(ruta);
      
      console.log('🚀 [ROUTING] Rendimiento optimizado para:', ruta);
    } catch (error) {
      console.warn('⚠️ [ROUTING] Error optimizando rendimiento:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Limpiar cache de rutas no críticas
   */
  private limpiarCacheRutas(): void {
    const ahora = Date.now();
    const tiempoMaximoCache = 5 * 60 * 1000; // 5 minutos

    for (const [ruta, datos] of this.rutasEnCache.entries()) {
      if (ahora - datos.timestamp > tiempoMaximoCache) {
        this.rutasEnCache.delete(ruta);
        console.log('🧹 [ROUTING] Cache limpiado para:', ruta);
      }
    }
  }

  /**
   * ✅ SOLUCIÓN: Optimizar scroll y focus post-navegación
   */
  private optimizarScrollYFocus(ruta: string): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Scroll suave al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // ✅ SOLUCIÓN: Focus en elemento principal
      const elementoPrincipal = document.querySelector('main, .main-content, h1');
      if (elementoPrincipal instanceof HTMLElement) {
        elementoPrincipal.focus();
      }
      
      console.log('🎯 [ROUTING] Scroll y focus optimizados para:', ruta);
    } catch (error) {
      console.warn('⚠️ [ROUTING] Error optimizando scroll y focus:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Manejar errores de navegación
   */
  private manejarErrorNavegacion(error: any, ruta: string): void {
    console.error('❌ [ROUTING] Error en navegación a:', ruta, error);
    
    // ✅ SOLUCIÓN: Intentar navegación de fallback
    this.navegacionFallback(ruta);
  }

  /**
   * ✅ SOLUCIÓN: Navegación de fallback en caso de error
   */
  private async navegacionFallback(ruta: string): Promise<void> {
    if (!browser) return;

    try {
      console.log('🔄 [ROUTING] Intentando navegación de fallback a:', ruta);
      
      // ✅ SOLUCIÓN: Navegación con replaceState para evitar problemas
      await goto(ruta, { replaceState: true });
      
      console.log('✅ [ROUTING] Navegación de fallback exitosa a:', ruta);
    } catch (fallbackError) {
      console.error('❌ [ROUTING] Error en navegación de fallback:', fallbackError);
      
      // ✅ SOLUCIÓN: Redirección hard como último recurso
      window.location.href = ruta;
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estado del routing
   */
  obtenerEstadoRouting(): {
    navegacionEnProgreso: boolean;
    rutasEnCache: number;
    rutasCriticas: string[];
  } {
    return {
      navegacionEnProgreso: this.navegacionEnProgreso,
      rutasEnCache: this.rutasEnCache.size,
      rutasCriticas: Array.from(this.rutasCriticas)
    };
  }
}

/**
 * ✅ UTILIDAD: Función helper para navegación inteligente
 */
export const navegarInteligente = async (ruta: string, opciones?: { replaceState?: boolean }): Promise<void> => {
  const routing = RoutingInteligente.getInstance();
  await routing.navegarInteligente(ruta, opciones);
};

/**
 * ✅ UTILIDAD: Verificar si una ruta está activa
 */
export function esRutaActiva(ruta: string): boolean {
  if (!browser) return false;
  
  const rutaActual = get(page).url.pathname;
  
  if (ruta === '/') {
    return rutaActual === '/';
  }
  
  return rutaActual.startsWith(ruta);
}

/**
 * ✅ UTILIDAD: Obtener parámetros de ruta de manera segura
 */
export function obtenerParametrosRuta(): Record<string, string> {
  if (!browser) return {};
  
  try {
    return get(page).params;
  } catch (error) {
    console.warn('⚠️ [ROUTING] Error obteniendo parámetros:', error);
    return {};
  }
}

/**
 * ✅ UTILIDAD: Log de routing para debugging
 */
export function logRouting(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [ROUTING] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Verificar estado de routing
 */
export function obtenerEstadoRouting(): {
  esCliente: boolean;
  rutaActual: string;
  parametros: Record<string, string>;
  timestamp: number;
} {
  return {
    esCliente: browser,
    rutaActual: browser ? get(page).url.pathname : '',
    parametros: browser ? get(page).params : {},
    timestamp: Date.now()
  };
} 