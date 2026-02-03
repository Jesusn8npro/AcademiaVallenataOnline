// ✅ FASE 3: SISTEMA DE SINCRONIZACIÓN DE ESTADOS
// Basado en la documentación oficial de SvelteKit para estados estables

import { browser } from '$app/environment';
import { writable, derived, get } from 'svelte/store';
import { page } from '$app/stores';

/**
 * ✅ UTILIDAD: Sistema de sincronización de estados para hidratación estable
 */
export class SincronizadorEstados {
  private static instance: SincronizadorEstados;
  private estadosSincronizados: Map<string, any> = new Map();
  private estadosPendientes: Map<string, any> = new Map();
  private sincronizacionEnProgreso: boolean = false;
  private listeners: Map<string, Set<() => void>> = new Map();

  private constructor() {
    this.inicializarSincronizacion();
  }

  static getInstance(): SincronizadorEstados {
    if (!SincronizadorEstados.instance) {
      SincronizadorEstados.instance = new SincronizadorEstados();
    }
    return SincronizadorEstados.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar sistema de sincronización
   */
  private inicializarSincronizacion(): void {
    if (!browser) return;

    // ✅ SOLUCIÓN: Escuchar cambios de visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.sincronizarEstadosPendientes();
      }
    });

    // ✅ SOLUCIÓN: Escuchar cambios de foco de ventana
    window.addEventListener('focus', () => {
      this.sincronizarEstadosPendientes();
    });

    console.log('🔧 [SINCRONIZACIÓN] Sistema de sincronización inicializado');
  }

  /**
   * ✅ SOLUCIÓN: Registrar estado para sincronización
   */
  registrarEstado(
    nombre: string,
    valorInicial: any,
    opciones?: {
      persistir?: boolean;
      validar?: (valor: any) => boolean;
      transformar?: (valor: any) => any;
      sincronizar?: boolean;
    }
  ): any {
    // ✅ SOLUCIÓN: Verificar si ya está registrado
    if (this.estadosSincronizados.has(nombre)) {
      return this.estadosSincronizados.get(nombre);
    }

    // ✅ SOLUCIÓN: Crear store con sincronización
    const store = writable(valorInicial);
    
    // ✅ SOLUCIÓN: Suscripción para sincronización automática
    if (opciones?.sincronizar !== false) {
      store.subscribe((valor) => {
        this.estadosPendientes.set(nombre, {
          valor,
          timestamp: Date.now(),
          opciones
        });
        
        // ✅ SOLUCIÓN: Sincronizar después de un delay
        setTimeout(() => {
          this.sincronizarEstado(nombre);
        }, 100);
      });
    }

    // ✅ SOLUCIÓN: Registrar estado
    this.estadosSincronizados.set(nombre, store);
    
    // ✅ SOLUCIÓN: Marcar como sincronizado
    this.estadosPendientes.delete(nombre);
    
    console.log(`✅ [SINCRONIZACIÓN] Estado ${nombre} registrado para sincronización`);
    
    return store;
  }

  /**
   * ✅ SOLUCIÓN: Sincronizar estado específico
   */
  private async sincronizarEstado(nombre: string): Promise<void> {
    if (!browser || this.sincronizacionEnProgreso) return;

    try {
      const estadoPendiente = this.estadosPendientes.get(nombre);
      if (!estadoPendiente) return;

      this.sincronizacionEnProgreso = true;
      console.log(`🔄 [SINCRONIZACIÓN] Sincronizando estado ${nombre}...`);

      // ✅ SOLUCIÓN: Validar estado antes de sincronizar
      if (estadoPendiente.opciones?.validar) {
        if (!estadoPendiente.opciones.validar(estadoPendiente.valor)) {
          console.warn(`⚠️ [SINCRONIZACIÓN] Estado ${nombre} no válido, omitiendo sincronización`);
          this.estadosPendientes.delete(nombre);
          return;
        }
      }

      // ✅ SOLUCIÓN: Transformar estado si es necesario
      let valorSincronizado = estadoPendiente.valor;
      if (estadoPendiente.opciones?.transformar) {
        valorSincronizado = estadoPendiente.opciones.transformar(valorSincronizado);
      }

      // ✅ SOLUCIÓN: Persistir en localStorage si se solicita
      if (estadoPendiente.opciones?.persistir) {
        try {
          localStorage.setItem(`estado_sincronizado_${nombre}`, JSON.stringify({
            valor: valorSincronizado,
            timestamp: Date.now(),
            version: '1.0.0'
          }));
        } catch (error) {
          console.warn(`⚠️ [SINCRONIZACIÓN] Error persistiendo estado ${nombre}:`, error);
        }
      }

      // ✅ SOLUCIÓN: Notificar a listeners
      this.notificarCambio(nombre, valorSincronizado);

      // ✅ SOLUCIÓN: Marcar como sincronizado
      this.estadosPendientes.delete(nombre);
      
      console.log(`✅ [SINCRONIZACIÓN] Estado ${nombre} sincronizado exitosamente`);
    } catch (error) {
      console.error(`❌ [SINCRONIZACIÓN] Error sincronizando estado ${nombre}:`, error);
    } finally {
      this.sincronizacionEnProgreso = false;
    }
  }

  /**
   * ✅ SOLUCIÓN: Sincronizar todos los estados pendientes
   */
  async sincronizarEstadosPendientes(): Promise<void> {
    if (!browser || this.sincronizacionEnProgreso) return;

    try {
      console.log('🔄 [SINCRONIZACIÓN] Sincronizando todos los estados pendientes...');
      
      const estadosPendientes = Array.from(this.estadosPendientes.keys());
      
      for (const nombre of estadosPendientes) {
        await this.sincronizarEstado(nombre);
        // ✅ SOLUCIÓN: Delay entre sincronizaciones para evitar bloqueos
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('✅ [SINCRONIZACIÓN] Todos los estados pendientes sincronizados');
    } catch (error) {
      console.error('❌ [SINCRONIZACIÓN] Error sincronizando estados pendientes:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Agregar listener para cambios de estado
   */
  agregarListener(nombre: string, callback: () => void): () => void {
    if (!this.listeners.has(nombre)) {
      this.listeners.set(nombre, new Set());
    }
    
    this.listeners.get(nombre)!.add(callback);
    
    // ✅ SOLUCIÓN: Retornar función para remover listener
    return () => {
      const listeners = this.listeners.get(nombre);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(nombre);
        }
      }
    };
  }

  /**
   * ✅ SOLUCIÓN: Notificar cambio a listeners
   */
  private notificarCambio(nombre: string, valor: any): void {
    const listeners = this.listeners.get(nombre);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn(`⚠️ [SINCRONIZACIÓN] Error en listener de ${nombre}:`, error);
        }
      });
    }
  }

  /**
   * ✅ SOLUCIÓN: Restaurar estado desde localStorage
   */
  restaurarEstado(nombre: string): any {
    if (!browser) return null;

    try {
      const estadoGuardado = localStorage.getItem(`estado_sincronizado_${nombre}`);
      if (estadoGuardado) {
        const estadoParseado = JSON.parse(estadoGuardado);
        
        // ✅ SOLUCIÓN: Verificar si el estado no es muy antiguo (máximo 24 horas)
        const ahora = Date.now();
        const maxEdad = 24 * 60 * 60 * 1000; // 24 horas
        
        if (ahora - estadoParseado.timestamp < maxEdad) {
          console.log(`✅ [SINCRONIZACIÓN] Estado ${nombre} restaurado desde localStorage`);
          return estadoParseado.valor;
        } else {
          console.log(`🕒 [SINCRONIZACIÓN] Estado ${nombre} muy antiguo, limpiando`);
          localStorage.removeItem(`estado_sincronizado_${nombre}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ [SINCRONIZACIÓN] Error restaurando estado ${nombre}:`, error);
      localStorage.removeItem(`estado_sincronizado_${nombre}`);
    }
    
    return null;
  }

  /**
   * ✅ SOLUCIÓN: Limpiar estado específico
   */
  limpiarEstado(nombre: string): void {
    try {
      // ✅ SOLUCIÓN: Limpiar de stores
      this.estadosSincronizados.delete(nombre);
      this.estadosPendientes.delete(nombre);
      
      // ✅ SOLUCIÓN: Limpiar listeners
      this.listeners.delete(nombre);
      
      // ✅ SOLUCIÓN: Limpiar localStorage
      if (browser) {
        localStorage.removeItem(`estado_sincronizado_${nombre}`);
      }
      
      console.log(`🧹 [SINCRONIZACIÓN] Estado ${nombre} limpiado completamente`);
    } catch (error) {
      console.warn(`⚠️ [SINCRONIZACIÓN] Error limpiando estado ${nombre}:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Limpiar todos los estados
   */
  limpiarTodosLosEstados(): void {
    try {
      console.log('🧹 [SINCRONIZACIÓN] Limpiando todos los estados...');
      
      // ✅ SOLUCIÓN: Limpiar todos los stores
      this.estadosSincronizados.clear();
      this.estadosPendientes.clear();
      this.listeners.clear();
      
      // ✅ SOLUCIÓN: Limpiar localStorage
      if (browser) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('estado_sincronizado_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      console.log('✅ [SINCRONIZACIÓN] Todos los estados limpiados');
    } catch (error) {
      console.error('❌ [SINCRONIZACIÓN] Error limpiando todos los estados:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas de sincronización
   */
  obtenerEstadisticas(): {
    estadosRegistrados: number;
    estadosPendientes: number;
    listenersActivos: number;
    sincronizacionEnProgreso: boolean;
  } {
    return {
      estadosRegistrados: this.estadosSincronizados.size,
      estadosPendientes: this.estadosPendientes.size,
      listenersActivos: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0),
      sincronizacionEnProgreso: this.sincronizacionEnProgreso
    };
  }

  /**
   * ✅ SOLUCIÓN: Verificar salud del sistema de sincronización
   */
  verificarSalud(): {
    salud: 'excelente' | 'buena' | 'regular' | 'mala';
    problemas: string[];
    recomendaciones: string[];
  } {
    const problemas: string[] = [];
    const recomendaciones: string[] = [];
    
    // ✅ SOLUCIÓN: Verificar estados pendientes
    if (this.estadosPendientes.size > 10) {
      problemas.push('Demasiados estados pendientes de sincronización');
      recomendaciones.push('Revisar estados que no se sincronizan correctamente');
    }
    
    // ✅ SOLUCIÓN: Verificar listeners
    if (this.listeners.size > 50) {
      problemas.push('Demasiados listeners activos');
      recomendaciones.push('Limpiar listeners no utilizados');
    }
    
    // ✅ SOLUCIÓN: Verificar sincronización en progreso
    if (this.sincronizacionEnProgreso) {
      problemas.push('Sincronización bloqueada');
      recomendaciones.push('Revisar estados que causan bloqueos');
    }
    
    // ✅ SOLUCIÓN: Determinar salud general
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
 * ✅ UTILIDAD: Función helper para crear store sincronizado
 */
export const crearStoreSincronizado = <T>(
  nombre: string,
  valorInicial: T,
  opciones?: {
    persistir?: boolean;
    validar?: (valor: T) => boolean;
    transformar?: (valor: T) => T;
    sincronizar?: boolean;
  }
): any => {
  const sincronizador = SincronizadorEstados.getInstance();
  return sincronizador.registrarEstado(nombre, valorInicial, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para sincronizar estados pendientes
 */
export const sincronizarEstadosPendientes = async (): Promise<void> => {
  const sincronizador = SincronizadorEstados.getInstance();
  await sincronizador.sincronizarEstadosPendientes();
};

/**
 * ✅ UTILIDAD: Función helper para limpiar todos los estados
 */
export const limpiarTodosLosEstados = (): void => {
  const sincronizador = SincronizadorEstados.getInstance();
  sincronizador.limpiarTodosLosEstados();
};

/**
 * ✅ UTILIDAD: Función helper para verificar salud del sistema
 */
export const verificarSaludSincronizacion = () => {
  const sincronizador = SincronizadorEstados.getInstance();
  return sincronizador.verificarSalud();
};

/**
 * ✅ UTILIDAD: Log de sincronización para debugging
 */
export function logSincronizacion(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [SINCRONIZACIÓN] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado de sincronización
 */
export function obtenerEstadoSincronizacion(): {
  esCliente: boolean;
  estadisticas: any;
  salud: any;
} {
  const sincronizador = SincronizadorEstados.getInstance();
  
  return {
    esCliente: browser,
    estadisticas: sincronizador.obtenerEstadisticas(),
    salud: sincronizador.verificarSalud()
  };
} 