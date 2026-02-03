import { writable, derived } from 'svelte/store';

export interface ScrollInfinitoConfig {
  cargarItems: (offset: number, limit: number) => Promise<any[]>;
  limite: number;
  umbralPixeles: number;
}

export function crearScrollInfinito(config: ScrollInfinitoConfig) {
  const items = writable<any[]>([]);
  const cargando = writable(false);
  const hayMas = writable(true);
  const error = writable<string | null>(null);
  const offset = writable(0);

  let contenedorElement: HTMLElement | null = null;
  let isMounted = true;

  // Función para cargar items
  async function cargarItems(esInicial = false) {
    if (!isMounted) return;
    
    const cargandoActual = await new Promise(resolve => {
      const unsubscribe = cargando.subscribe(value => {
        unsubscribe();
        resolve(value);
      });
    });

    const hayMasActual = await new Promise(resolve => {
      const unsubscribe = hayMas.subscribe(value => {
        unsubscribe();
        resolve(value);
      });
    });

    if (cargandoActual || !hayMasActual) return;

    try {
      cargando.set(true);
      error.set(null);

      const offsetActual = await new Promise<number>(resolve => {
        const unsubscribe = offset.subscribe(value => {
          unsubscribe();
          resolve(value);
        });
      });

      const nuevosItems = await config.cargarItems(
        esInicial ? 0 : offsetActual, 
        config.limite
      );

      if (!isMounted) return;

      if (nuevosItems.length === 0) {
        hayMas.set(false);
      } else {
        if (esInicial) {
          items.set(nuevosItems);
          offset.set(nuevosItems.length);
        } else {
          items.update(itemsActuales => [...itemsActuales, ...nuevosItems]);
          offset.update(o => o + nuevosItems.length);
        }
        
        // Si recibimos menos items de los solicitados, no hay más
        if (nuevosItems.length < config.limite) {
          hayMas.set(false);
        }
      }
    } catch (err) {
      if (!isMounted) return;
      console.error('Error cargando items:', err);
      error.set(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      if (isMounted) {
        cargando.set(false);
      }
    }
  }

  // Función para verificar si necesitamos cargar más items
  function verificarScroll() {
    if (!contenedorElement || !isMounted) return;

    const { scrollTop, scrollHeight, clientHeight } = contenedorElement;
    const distanciaDesdeAbajo = scrollHeight - scrollTop - clientHeight;

    if (distanciaDesdeAbajo < config.umbralPixeles) {
      cargarItems(false);
    }
  }

  // Función para configurar el scroll listener
  function configurarScrollListener(elemento: HTMLElement) {
    if (!isMounted) return;
    
    contenedorElement = elemento;
    
    const handleScroll = () => {
      requestAnimationFrame(verificarScroll);
    };
    
    elemento.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      elemento.removeEventListener('scroll', handleScroll);
    };
  }

  // Función para reiniciar el scroll
  function reiniciar() {
    if (!isMounted) return;
    
    items.set([]);
    offset.set(0);
    hayMas.set(true);
    error.set(null);
    cargarItems(true);
  }

  // Función para agregar un item al principio
  function agregarAlInicio(nuevoItem: any) {
    if (!isMounted) return;
    
    items.update(itemsActuales => [nuevoItem, ...itemsActuales]);
    offset.update(o => o + 1);
  }

  // Función para eliminar un item
  function eliminarItem(id: string | number) {
    if (!isMounted) return;
    
    items.update(itemsActuales => 
      itemsActuales.filter(item => item.id !== id)
    );
    offset.update(o => o - 1);
  }

  // Función para actualizar un item
  function actualizarItem(id: string | number, datosActualizados: any) {
    if (!isMounted) return;
    
    items.update(itemsActuales => 
      itemsActuales.map(item => 
        item.id === id ? { ...item, ...datosActualizados } : item
      )
    );
  }

  // Función para limpiar cuando el componente se desmonta
  function limpiar() {
    isMounted = false;
    contenedorElement = null;
  }

  // Cargar items iniciales
  cargarItems(true);

  return {
    // Stores reactivos
    items,
    cargando,
    hayMas,
    error,
    
    // Funciones
    cargarItems: () => cargarItems(false),
    reiniciar,
    agregarAlInicio,
    eliminarItem,
    actualizarItem,
    configurarScrollListener,
    limpiar,
    
    // Estados derivados
    estaVacio: derived(items, $items => $items.length === 0),
    total: derived(items, $items => $items.length)
  };
}

// Utilidad para detectar cuando un elemento está visible
export function crearObservadorVisibilidad(
  callback: () => void,
  opciones: IntersectionObserverInit = {}
) {
  let observer: IntersectionObserver;
  
  function observar(elemento: HTMLElement) {
    if (!elemento) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...opciones
      }
    );
    
    observer.observe(elemento);
    
    return () => {
      observer.disconnect();
    };
  }
  
  return { observar };
}

// Utilidad para throttle (limitar frecuencia de ejecución)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limite: number
): T {
  let enThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!enThrottle) {
      func(...args);
      enThrottle = true;
      setTimeout(() => enThrottle = false, limite);
    }
  }) as T;
}

// Utilidad para debounce (retrasar ejecución)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
} 