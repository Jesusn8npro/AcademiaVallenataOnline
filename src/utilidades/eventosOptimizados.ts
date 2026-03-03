// ✅ FASE 4: SISTEMA DE OPTIMIZACIÓN DE EVENTOS
// Basado en las mejores prácticas de SvelteKit para rendimiento óptimo

const browser = typeof window !== 'undefined';
import { writable, derived } from '$utilidades/tiendaReact';

/**
 * ✅ UTILIDAD: Sistema de optimización de eventos para rendimiento óptimo
 */
export class EventosOptimizados {
  private static instance: EventosOptimizados;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, number> = new Map();
  private eventListeners: Map<string, Set<() => void>> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  private constructor() {
    this.inicializarOptimizaciones();
  }

  static getInstance(): EventosOptimizados {
    if (!EventosOptimizados.instance) {
      EventosOptimizados.instance = new EventosOptimizados();
    }
    return EventosOptimizados.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar optimizaciones automáticas
   */
  private inicializarOptimizaciones(): void {
    if (!browser) return;

    // ✅ SOLUCIÓN: Optimizar eventos de scroll
    this.optimizarScroll();
    
    // ✅ SOLUCIÓN: Optimizar eventos de resize
    this.optimizarResize();
    
    // ✅ SOLUCIÓN: Optimizar eventos de input
    this.optimizarInput();
    
    // ✅ SOLUCIÓN: Optimizar eventos de click
    this.optimizarClick();
    
    console.log('🔧 [EVENTOS] Sistema de optimización de eventos inicializado');
  }

  /**
   * ✅ SOLUCIÓN: Debounce para evitar ejecuciones excesivas
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key?: string
  ): (...args: Parameters<T>) => void {
    const debounceKey = key || func.name || 'anonymous';
    
    return (...args: Parameters<T>) => {
      // ✅ SOLUCIÓN: Limpiar timer existente
      if (this.debounceTimers.has(debounceKey)) {
        clearTimeout(this.debounceTimers.get(debounceKey)!);
      }
      
      // ✅ SOLUCIÓN: Crear nuevo timer
      const timer = setTimeout(() => {
        try {
          func(...args);
          this.debounceTimers.delete(debounceKey);
        } catch (error) {
          console.warn(`⚠️ [EVENTOS] Error en función debounced ${debounceKey}:`, error);
        }
      }, delay);
      
      this.debounceTimers.set(debounceKey, timer);
    };
  }

  /**
   * ✅ SOLUCIÓN: Throttle para limitar frecuencia de ejecución
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
    key?: string
  ): (...args: Parameters<T>) => void {
    const throttleKey = key || func.name || 'anonymous';
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const lastExecution = this.throttleTimers.get(throttleKey) || 0;
      
      if (now - lastExecution >= limit) {
        try {
          func(...args);
          this.throttleTimers.set(throttleKey, now);
        } catch (error) {
          console.warn(`⚠️ [EVENTOS] Error en función throttled ${throttleKey}:`, error);
        }
      }
    };
  }

  /**
   * ✅ SOLUCIÓN: Optimizar eventos de scroll
   */
  private optimizarScroll(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Debounce para scroll
      const handleScroll = this.debounce(() => {
        // ✅ SOLUCIÓN: Dispatch de evento optimizado
        window.dispatchEvent(new CustomEvent('scroll-optimized', {
          detail: {
            scrollTop: window.scrollY,
            scrollLeft: window.scrollX,
            timestamp: Date.now()
          }
        }));
      }, 16); // 60fps

      // ✅ SOLUCIÓN: Usar passive listener para mejor rendimiento
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      console.log('✅ [EVENTOS] Eventos de scroll optimizados');
    } catch (error) {
      console.warn('⚠️ [EVENTOS] Error optimizando scroll:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Optimizar eventos de resize
   */
  private optimizarResize(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Debounce para resize
      const handleResize = this.debounce(() => {
        // ✅ SOLUCIÓN: Dispatch de evento optimizado
        window.dispatchEvent(new CustomEvent('resize-optimized', {
          detail: {
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: Date.now()
          }
        }));
      }, 250); // 250ms para evitar cambios excesivos

      window.addEventListener('resize', handleResize, { passive: true });
      
      console.log('✅ [EVENTOS] Eventos de resize optimizados');
    } catch (error) {
      console.warn('⚠️ [EVENTOS] Error optimizando resize:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Optimizar eventos de input
   */
  private optimizarInput(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Debounce para input
      const handleInput = this.debounce((event: Event) => {
        const target = event.target as HTMLInputElement;
        
        // ✅ SOLUCIÓN: Dispatch de evento optimizado
        target.dispatchEvent(new CustomEvent('input-optimized', {
          detail: {
            value: target.value,
            type: target.type,
            timestamp: Date.now()
          }
        }));
      }, 300); // 300ms para input de texto

      // ✅ SOLUCIÓN: Delegación de eventos para inputs
      document.addEventListener('input', handleInput, { passive: true });
      
      console.log('✅ [EVENTOS] Eventos de input optimizados');
    } catch (error) {
      console.warn('⚠️ [EVENTOS] Error optimizando input:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Optimizar eventos de click
   */
  private optimizarClick(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Throttle para clicks rápidos
      const handleClick = this.throttle((event: Event) => {
        // ✅ SOLUCIÓN: Dispatch de evento optimizado
        event.target?.dispatchEvent(new CustomEvent('click-optimized', {
          detail: {
            target: event.target,
            timestamp: Date.now()
          }
        }));
      }, 100); // 100ms entre clicks

      // ✅ SOLUCIÓN: Delegación de eventos para clicks
      document.addEventListener('click', handleClick, { passive: true });
      
      console.log('✅ [EVENTOS] Eventos de click optimizados');
    } catch (error) {
      console.warn('⚠️ [EVENTOS] Error optimizando click:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Crear listener optimizado
   */
  crearListenerOptimizado<T extends Event>(
    evento: string,
    callback: (event: T) => void,
    opciones?: {
      debounce?: number;
      throttle?: number;
      passive?: boolean;
      once?: boolean;
    }
  ): () => void {
    if (!browser) return () => {};

    try {
      let handler: (event: T) => void = callback;
      
      // ✅ SOLUCIÓN: Aplicar debounce si se especifica
      if (opciones?.debounce) {
        handler = this.debounce(handler, opciones.debounce, `${evento}-debounced`);
      }
      
      // ✅ SOLUCIÓN: Aplicar throttle si se especifica
      if (opciones?.throttle) {
        handler = this.throttle(handler, opciones.throttle, `${evento}-throttled`);
      }
      
      // ✅ SOLUCIÓN: Agregar listener
      document.addEventListener(evento, handler as EventListener, {
        passive: opciones?.passive ?? true,
        once: opciones?.once ?? false
      });
      
      // ✅ SOLUCIÓN: Registrar para limpieza
      if (!this.eventListeners.has(evento)) {
        this.eventListeners.set(evento, new Set());
      }
      this.eventListeners.get(evento)!.add(() => {
        document.removeEventListener(evento, handler as EventListener);
      });
      
      console.log(`✅ [EVENTOS] Listener optimizado creado para ${evento}`);
      
      // ✅ SOLUCIÓN: Retornar función de limpieza
      return () => {
        document.removeEventListener(evento, handler as EventListener);
        const listeners = this.eventListeners.get(evento);
        if (listeners) {
          listeners.delete(() => {});
          if (listeners.size === 0) {
            this.eventListeners.delete(evento);
          }
        }
      };
      
    } catch (error) {
      console.error(`❌ [EVENTOS] Error creando listener optimizado para ${evento}:`, error);
      return () => {};
    }
  }

  /**
   * ✅ SOLUCIÓN: Medir rendimiento de eventos
   */
  medirRendimientoEvento(
    nombre: string,
    callback: () => void
  ): () => void {
    if (!browser) return callback;

    return () => {
      const inicio = performance.now();
      
      try {
        callback();
      } finally {
        const fin = performance.now();
        const duracion = fin - inicio;
        
        // ✅ SOLUCIÓN: Almacenar métricas
        if (!this.performanceMetrics.has(nombre)) {
          this.performanceMetrics.set(nombre, []);
        }
        
        const metricas = this.performanceMetrics.get(nombre)!;
        metricas.push(duracion);
        
        // ✅ SOLUCIÓN: Mantener solo las últimas 100 métricas
        if (metricas.length > 100) {
          metricas.splice(0, metricas.length - 100);
        }
        
        // ✅ SOLUCIÓN: Log si es muy lento
        if (duracion > 16) { // Más de 16ms (60fps)
          console.warn(`⚠️ [EVENTOS] Evento ${nombre} lento: ${duracion.toFixed(2)}ms`);
        }
      }
    };
  }

  /**
   * ✅ SOLUCIÓN: Obtener métricas de rendimiento
   */
  obtenerMetricasRendimiento(nombre: string): {
    total: number;
    promedio: number;
    minimo: number;
    maximo: number;
    p95: number;
  } | null {
    const metricas = this.performanceMetrics.get(nombre);
    if (!metricas || metricas.length === 0) return null;
    
    const sorted = [...metricas].sort((a, b) => a - b);
    const total = sorted.reduce((sum, val) => sum + val, 0);
    const promedio = total / sorted.length;
    const minimo = sorted[0];
    const maximo = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return { total, promedio, minimo, maximo, p95 };
  }

  /**
   * ✅ SOLUCIÓN: Limpiar todos los listeners
   */
  limpiarListeners(): void {
    try {
      console.log('🧹 [EVENTOS] Limpiando todos los listeners...');
      
      // ✅ SOLUCIÓN: Limpiar listeners registrados
      this.eventListeners.forEach((listeners, evento) => {
        listeners.forEach(cleanup => cleanup());
      });
      this.eventListeners.clear();
      
      // ✅ SOLUCIÓN: Limpiar timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
      
      this.throttleTimers.clear();
      
      console.log('✅ [EVENTOS] Todos los listeners limpiados');
    } catch (error) {
      console.error('❌ [EVENTOS] Error limpiando listeners:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas de eventos
   */
  obtenerEstadisticas(): {
    listenersActivos: number;
    debounceTimers: number;
    throttleTimers: number;
    metricasDisponibles: number;
  } {
    return {
      listenersActivos: Array.from(this.eventListeners.values()).reduce((total, set) => total + set.size, 0),
      debounceTimers: this.debounceTimers.size,
      throttleTimers: this.throttleTimers.size,
      metricasDisponibles: this.performanceMetrics.size
    };
  }

  /**
   * ✅ SOLUCIÓN: Verificar salud del sistema
   */
  verificarSalud(): {
    salud: 'excelente' | 'buena' | 'regular' | 'mala';
    problemas: string[];
    recomendaciones: string[];
  } {
    const problemas: string[] = [];
    const recomendaciones: string[] = [];
    
    // ✅ SOLUCIÓN: Verificar listeners activos
    const totalListeners = Array.from(this.eventListeners.values()).reduce((total, set) => total + set.size, 0);
    if (totalListeners > 50) {
      problemas.push('Demasiados listeners activos');
      recomendaciones.push('Limpiar listeners no utilizados');
    }
    
    // ✅ SOLUCIÓN: Verificar timers activos
    if (this.debounceTimers.size > 20) {
      problemas.push('Demasiados timers de debounce activos');
      recomendaciones.push('Revisar funciones debounced');
    }
    
    // ✅ SOLUCIÓN: Verificar métricas de rendimiento
    this.performanceMetrics.forEach((metricas, nombre) => {
      const promedio = metricas.reduce((sum, val) => sum + val, 0) / metricas.length;
      if (promedio > 16) {
        problemas.push(`Evento ${nombre} lento en promedio: ${promedio.toFixed(2)}ms`);
        recomendaciones.push(`Optimizar callback del evento ${nombre}`);
      }
    });
    
    // ✅ SOLUCIÓN: Determinar salud
    let salud: 'excelente' | 'buena' | 'regular' | 'mala' = 'excelente';
    
    if (problemas.length === 0) {
      salud = 'excelente';
    } else if (problemas.length <= 2) {
      salud = 'buena';
    } else if (problemas.length <= 4) {
      salud = 'regular';
    } else {
      salud = 'mala';
    }
    
    return { salud, problemas, recomendaciones };
  }
}

/**
 * ✅ UTILIDAD: Función helper para debounce
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  key?: string
): (...args: Parameters<T>) => void => {
  const eventos = EventosOptimizados.getInstance();
  return eventos.debounce(func, delay, key);
};

/**
 * ✅ UTILIDAD: Función helper para throttle
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  key?: string
): (...args: Parameters<T>) => void => {
  const eventos = EventosOptimizados.getInstance();
  return eventos.throttle(func, limit, key);
};

/**
 * ✅ UTILIDAD: Función helper para crear listener optimizado
 */
export const crearListenerOptimizado = <T extends Event>(
  evento: string,
  callback: (event: T) => void,
  opciones?: {
    debounce?: number;
    throttle?: number;
    passive?: boolean;
    once?: boolean;
  }
): (() => void) => {
  const eventos = EventosOptimizados.getInstance();
  return eventos.crearListenerOptimizado(evento, callback, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para medir rendimiento
 */
export const medirRendimientoEvento = (
  nombre: string,
  callback: () => void
): (() => void) => {
  const eventos = EventosOptimizados.getInstance();
  return eventos.medirRendimientoEvento(nombre, callback);
};

/**
 * ✅ UTILIDAD: Función helper para limpiar listeners
 */
export const limpiarListenersEventos = (): void => {
  const eventos = EventosOptimizados.getInstance();
  eventos.limpiarListeners();
};

/**
 * ✅ UTILIDAD: Log de eventos para debugging
 */
export function logEventos(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [EVENTOS] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado de eventos
 */
export function obtenerEstadoEventos(): {
  esCliente: boolean;
  estadisticas: any;
  salud: any;
} {
  const eventos = EventosOptimizados.getInstance();
  
  return {
    esCliente: browser,
    estadisticas: eventos.obtenerEstadisticas(),
    salud: eventos.verificarSalud()
  };
} 



