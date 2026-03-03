// ✅ FASE 4: SISTEMA DE LAZY LOADING INTELIGENTE
// Basado en las mejores prácticas de SvelteKit para rendimiento óptimo

const browser = typeof window !== 'undefined';
import { writable, derived } from '$utilidades/tiendaReact';

/**
 * ✅ UTILIDAD: Sistema de lazy loading inteligente para rendimiento óptimo
 */
export class LazyLoadingInteligente {
  private static instance: LazyLoadingInteligente;
  private componentesCargados: Map<string, any> = new Map();
  private componentesEnCache: Map<string, any> = new Map();
  private prioridades: Map<string, number> = new Map();
  private observadores: Map<string, IntersectionObserver> = new Map();

  private constructor() {
    this.inicializarPrioridades();
  }

  static getInstance(): LazyLoadingInteligente {
    if (!LazyLoadingInteligente.instance) {
      LazyLoadingInteligente.instance = new LazyLoadingInteligente();
    }
    return LazyLoadingInteligente.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar prioridades de carga
   */
  private inicializarPrioridades(): void {
    // ✅ SOLUCIÓN: Prioridades basadas en importancia del componente
    const prioridades = {
      // 🚀 CRÍTICOS: Cargar inmediatamente
      'MenuInferiorResponsivo': 1,
      'EncabezadoLeccion': 1,
      'AdminSidebar': 1,
      
      // 🚀 ALTA: Cargar en viewport
      'GridCursos': 2,
      'ListaTutoriales': 2,
      'PanelEstudiante': 2,
      
      // 🚀 MEDIA: Cargar en hover
      'ModalBusqueda': 3,
      'ChatEnVivo': 3,
      'Notificaciones': 3,
      
      // 🚀 BAJA: Cargar en demanda
      'EstadisticasAvanzadas': 4,
      'Reportes': 4,
      'ConfiguracionAvanzada': 4
    };

    Object.entries(prioridades).forEach(([componente, prioridad]) => {
      this.prioridades.set(componente, prioridad);
    });
  }

  /**
   * ✅ SOLUCIÓN: Cargar componente con prioridad inteligente
   */
  async cargarComponente(
    nombre: string,
    importFn: () => Promise<any>,
    opciones?: {
      prioridad?: number;
      preload?: boolean;
      cache?: boolean;
      timeout?: number;
    }
  ): Promise<any> {
    try {
      // ✅ SOLUCIÓN: Verificar si ya está cargado
      if (this.componentesCargados.has(nombre)) {
        console.log(`📦 [LAZY] Componente ${nombre} ya cargado desde cache`);
        return this.componentesCargados.get(nombre);
      }

      // ✅ SOLUCIÓN: Verificar cache persistente
      if (opciones?.cache && this.componentesEnCache.has(nombre)) {
        const componenteCacheado = this.componentesEnCache.get(nombre);
        this.componentesCargados.set(nombre, componenteCacheado);
        console.log(`📦 [LAZY] Componente ${nombre} restaurado desde cache persistente`);
        return componenteCacheado;
      }

      console.log(`🚀 [LAZY] Cargando componente ${nombre} con prioridad ${opciones?.prioridad || 'automática'}`);

      // ✅ SOLUCIÓN: Aplicar timeout si se especifica
      let importPromise = importFn();
      if (opciones?.timeout) {
        importPromise = Promise.race([
          importPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout cargando ${nombre}`)), opciones.timeout)
          )
        ]);
      }

      // ✅ SOLUCIÓN: Cargar componente
      const modulo = await importPromise;
      const componente = modulo.default || modulo[nombre] || modulo;

      // ✅ SOLUCIÓN: Cachear componente
      this.componentesCargados.set(nombre, componente);
      
      if (opciones?.cache) {
        this.componentesEnCache.set(nombre, componente);
        console.log(`💾 [LAZY] Componente ${nombre} cacheado persistentemente`);
      }

      console.log(`✅ [LAZY] Componente ${nombre} cargado exitosamente`);
      return componente;

    } catch (error) {
      console.error(`❌ [LAZY] Error cargando componente ${nombre}:`, error);
      
      // ✅ SOLUCIÓN: Fallback a componente de error
      return this.obtenerComponenteFallback(nombre);
    }
  }

  /**
   * ✅ SOLUCIÓN: Preload de componentes críticos
   */
  async preloadComponentesCriticos(): Promise<void> {
    if (!browser) return;

    try {
      console.log('🚀 [LAZY] Iniciando preload de componentes críticos...');
      
      const componentesCriticos = [
        { nombre: 'MenuInferiorResponsivo', importFn: () => import('$lib/components/Navegacion/MenuInferiorResponsivo.svelte') },
        { nombre: 'EncabezadoLeccion', importFn: () => import('$lib/components/VisualiizadorDeLeccionesDeCursos/EncabezadoLeccion.svelte') },
        { nombre: 'AdminSidebar', importFn: () => import('$lib/components/Navegacion/AdminSidebar.svelte') }
      ];

      // ✅ SOLUCIÓN: Cargar en paralelo con prioridad
      const promesas = componentesCriticos.map(async (comp) => {
        try {
          await this.cargarComponente(comp.nombre, comp.importFn, { 
            prioridad: 1, 
            cache: true 
          });
        } catch (error) {
          console.warn(`⚠️ [LAZY] Error en preload de ${comp.nombre}:`, error);
        }
      });

      await Promise.allSettled(promesas);
      console.log('✅ [LAZY] Preload de componentes críticos completado');

    } catch (error) {
      console.error('❌ [LAZY] Error en preload de componentes críticos:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Lazy loading basado en viewport
   */
  crearLazyViewport(
    selector: string,
    importFn: () => Promise<any>,
    opciones?: {
      threshold?: number;
      rootMargin?: string;
      nombre?: string;
    }
  ): void {
    if (!browser) return;

    try {
      const nombre = opciones?.nombre || 'Componente';
      console.log(`👁️ [LAZY] Configurando lazy loading por viewport para ${nombre}`);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              console.log(`👁️ [LAZY] ${nombre} entró en viewport, cargando...`);
              this.cargarComponente(nombre, importFn, { cache: true });
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: opciones?.threshold || 0.1,
          rootMargin: opciones?.rootMargin || '50px'
        }
      );

      // ✅ SOLUCIÓN: Observar elementos
      const elementos = document.querySelectorAll(selector);
      elementos.forEach(el => observer.observe(el));

      this.observadores.set(nombre, observer);
      console.log(`✅ [LAZY] Lazy loading por viewport configurado para ${nombre}`);

    } catch (error) {
      console.error(`❌ [LAZY] Error configurando lazy loading por viewport:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Lazy loading basado en hover
   */
  crearLazyHover(
    selector: string,
    importFn: () => Promise<any>,
    opciones?: {
      delay?: number;
      nombre?: string;
    }
  ): void {
    if (!browser) return;

    try {
      const nombre = opciones?.nombre || 'Componente';
      const delay = opciones?.delay || 200;
      console.log(`🖱️ [LAZY] Configurando lazy loading por hover para ${nombre}`);

      let timeoutId: NodeJS.Timeout;
      let cargado = false;

      const elementos = document.querySelectorAll(selector);
      elementos.forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (cargado) return;

          timeoutId = setTimeout(async () => {
            console.log(`🖱️ [LAZY] Hover detectado en ${nombre}, cargando...`);
            await this.cargarComponente(nombre, importFn, { cache: true });
            cargado = true;
          }, delay);
        });

        el.addEventListener('mouseleave', () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        });
      });

      console.log(`✅ [LAZY] Lazy loading por hover configurado para ${nombre}`);

    } catch (error) {
      console.error(`❌ [LAZY] Error configurando lazy loading por hover:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Lazy loading basado en scroll
   */
  crearLazyScroll(
    importFn: () => Promise<any>,
    opciones?: {
      threshold?: number;
      nombre?: string;
      distancia?: number;
    }
  ): void {
    if (!browser) return;

    try {
      const nombre = opciones?.nombre || 'Componente';
      const threshold = opciones?.threshold || 0.8;
      const distancia = opciones?.distancia || 100;
      console.log(`📜 [LAZY] Configurando lazy loading por scroll para ${nombre}`);

      let cargado = false;

      const handleScroll = () => {
        if (cargado) return;

        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // ✅ SOLUCIÓN: Cargar cuando esté cerca del final
        if (scrollTop + windowHeight >= documentHeight - distancia) {
          console.log(`📜 [LAZY] Scroll cerca del final, cargando ${nombre}...`);
          this.cargarComponente(nombre, importFn, { cache: true });
          cargado = true;
          window.removeEventListener('scroll', handleScroll);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      console.log(`✅ [LAZY] Lazy loading por scroll configurado para ${nombre}`);

    } catch (error) {
      console.error(`❌ [LAZY] Error configurando lazy loading por scroll:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener componente de fallback
   */
  private obtenerComponenteFallback(nombre: string): any {
    // ✅ SOLUCIÓN: Componente de error genérico
    const ComponenteError = {
      render: () => `<div class="error-component">Error cargando ${nombre}</div>`
    };

    console.warn(`⚠️ [LAZY] Usando componente de fallback para ${nombre}`);
    return ComponenteError;
  }

  /**
   * ✅ SOLUCIÓN: Limpiar cache de componentes
   */
  limpiarCache(): void {
    try {
      console.log('🧹 [LAZY] Limpiando cache de componentes...');
      
      this.componentesCargados.clear();
      this.componentesEnCache.clear();
      
      // ✅ SOLUCIÓN: Limpiar observadores
      this.observadores.forEach(observer => observer.disconnect());
      this.observadores.clear();
      
      console.log('✅ [LAZY] Cache de componentes limpiado');
    } catch (error) {
      console.error('❌ [LAZY] Error limpiando cache:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas de lazy loading
   */
  obtenerEstadisticas(): {
    componentesCargados: number;
    componentesEnCache: number;
    observadoresActivos: number;
    prioridadesConfiguradas: number;
  } {
    return {
      componentesCargados: this.componentesCargados.size,
      componentesEnCache: this.componentesEnCache.size,
      observadoresActivos: this.observadores.size,
      prioridadesConfiguradas: this.prioridades.size
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
    
    // ✅ SOLUCIÓN: Verificar componentes cargados
    if (this.componentesCargados.size > 50) {
      problemas.push('Demasiados componentes cargados en memoria');
      recomendaciones.push('Considerar limpieza de cache');
    }
    
    // ✅ SOLUCIÓN: Verificar observadores
    if (this.observadores.size > 20) {
      problemas.push('Demasiados observadores activos');
      recomendaciones.push('Limpiar observadores no utilizados');
    }
    
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
 * ✅ UTILIDAD: Función helper para lazy loading simple
 */
export const lazyLoad = async <T>(
  importFn: () => Promise<T>,
  opciones?: {
    nombre?: string;
    cache?: boolean;
    timeout?: number;
  }
): Promise<T> => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  return lazyLoader.cargarComponente(
    opciones?.nombre || 'Componente',
    importFn,
    opciones
  );
};

/**
 * ✅ UTILIDAD: Función helper para lazy loading por viewport
 */
export const lazyLoadViewport = (
  selector: string,
  importFn: () => Promise<any>,
  opciones?: {
    threshold?: number;
    rootMargin?: string;
    nombre?: string;
  }
): void => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  lazyLoader.crearLazyViewport(selector, importFn, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para lazy loading por hover
 */
export const lazyLoadHover = (
  selector: string,
  importFn: () => Promise<any>,
  opciones?: {
    delay?: number;
    nombre?: string;
  }
): void => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  lazyLoader.crearLazyHover(selector, importFn, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para lazy loading por scroll
 */
export const lazyLoadScroll = (
  importFn: () => Promise<any>,
  opciones?: {
    threshold?: number;
    nombre?: string;
    distancia?: number;
  }
): void => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  lazyLoader.crearLazyScroll(importFn, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para preload de componentes críticos
 */
export const preloadComponentesCriticos = async (): Promise<void> => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  await lazyLoader.preloadComponentesCriticos();
};

/**
 * ✅ UTILIDAD: Función helper para limpiar cache
 */
export const limpiarCacheLazyLoading = (): void => {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  lazyLoader.limpiarCache();
};

/**
 * ✅ UTILIDAD: Log de lazy loading para debugging
 */
export function logLazyLoading(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [LAZY] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado de lazy loading
 */
export function obtenerEstadoLazyLoading(): {
  esCliente: boolean;
  estadisticas: any;
  salud: any;
} {
  const lazyLoader = LazyLoadingInteligente.getInstance();
  
  return {
    esCliente: browser,
    estadisticas: lazyLoader.obtenerEstadisticas(),
    salud: lazyLoader.verificarSalud()
  };
} 



