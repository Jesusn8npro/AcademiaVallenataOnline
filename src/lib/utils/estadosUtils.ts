// ✅ FASE 3: UTILIDADES PARA ESTADOS DETERMINISTAS
// Basadas en la documentación oficial de SvelteKit para estados estables

import { browser } from '$app/environment';
import { writable, derived, get } from 'svelte/store';
import { page } from '$app/stores';

/**
 * ✅ UTILIDAD: Sistema de estados deterministas para hidratación estable
 */
export class EstadosDeterministas {
  private static instance: EstadosDeterministas;
  private estadosCache: Map<string, any> = new Map();
  private estadosIniciales: Map<string, any> = new Map();
  private estadosHidratacion: Map<string, boolean> = new Map();

  private constructor() {
    this.inicializarEstadosBase();
  }

  static getInstance(): EstadosDeterministas {
    if (!EstadosDeterministas.instance) {
      EstadosDeterministas.instance = new EstadosDeterministas();
    }
    return EstadosDeterministas.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar estados base deterministas
   */
  private inicializarEstadosBase(): void {
    // ✅ SOLUCIÓN: Estados que deben ser consistentes entre SSR y CSR
    const estadosBase = {
      usuario: null,
      autenticado: false,
      tema: 'light',
      sidebarColapsado: false,
      modalAbierto: false,
      rutaActual: '/',
      cargando: false,
      error: null
    };

    // ✅ SOLUCIÓN: Establecer estados iniciales
    Object.entries(estadosBase).forEach(([key, valor]) => {
      this.estadosIniciales.set(key, valor);
      this.estadosHidratacion.set(key, false);
    });
  }

  /**
   * ✅ SOLUCIÓN: Crear store determinista
   */
  crearStoreDeterminista<T>(
    nombre: string,
    valorInicial: T,
    opciones?: {
      persistir?: boolean;
      validar?: (valor: T) => boolean;
      transformar?: (valor: T) => T;
    }
  ) {
    // ✅ SOLUCIÓN: Verificar si ya existe
    if (this.estadosCache.has(nombre)) {
      return this.estadosCache.get(nombre);
    }

    // ✅ SOLUCIÓN: Obtener valor inicial del cache o localStorage
    let valorInicialFinal = valorInicial;
    
    if (browser && opciones?.persistir) {
      const valorCacheado = localStorage.getItem(`estado_${nombre}`);
      if (valorCacheado) {
        try {
          const valorParseado = JSON.parse(valorCacheado);
          if (!opciones.validar || opciones.validar(valorParseado)) {
            valorInicialFinal = valorParseado;
          }
        } catch (error) {
          console.warn(`⚠️ [ESTADOS] Error parseando estado cacheado ${nombre}:`, error);
        }
      }
    }

    // ✅ SOLUCIÓN: Crear store con valor inicial determinista
    const store = writable<T>(valorInicialFinal);
    
    // ✅ SOLUCIÓN: Suscripción para persistir cambios
    if (browser && opciones?.persistir) {
      store.subscribe((valor) => {
        try {
          if (opciones?.transformar) {
            valor = opciones.transformar(valor);
          }
          localStorage.setItem(`estado_${nombre}`, JSON.stringify(valor));
        } catch (error) {
          console.warn(`⚠️ [ESTADOS] Error persistiendo estado ${nombre}:`, error);
        }
      });
    }

    // ✅ SOLUCIÓN: Marcar como hidratado
    this.estadosHidratacion.set(nombre, true);
    
    // ✅ SOLUCIÓN: Cachear store
    this.estadosCache.set(nombre, store);
    
    return store;
  }

  /**
   * ✅ SOLUCIÓN: Verificar consistencia de estados
   */
  verificarConsistenciaEstados(): {
    consistentes: string[];
    inconsistentes: string[];
    totalEstados: number;
  } {
    const consistentes: string[] = [];
    const inconsistentes: string[] = [];

    for (const [nombre, hidratado] of this.estadosHidratacion.entries()) {
      if (hidratado) {
        consistentes.push(nombre);
      } else {
        inconsistentes.push(nombre);
      }
    }

    return {
      consistentes,
      inconsistentes,
      totalEstados: this.estadosHidratacion.size
    };
  }

  /**
   * ✅ SOLUCIÓN: Resetear estados a valores iniciales
   */
  resetearEstados(): void {
    if (!browser) return;

    try {
      console.log('🔄 [ESTADOS] Reseteando estados a valores iniciales...');

      // ✅ SOLUCIÓN: Resetear cada store a su valor inicial
      for (const [nombre, store] of this.estadosCache.entries()) {
        const valorInicial = this.estadosIniciales.get(nombre);
        if (valorInicial !== undefined) {
          store.set(valorInicial);
          console.log(`✅ [ESTADOS] Estado ${nombre} reseteado a:`, valorInicial);
        }
      }

      // ✅ SOLUCIÓN: Limpiar localStorage si es necesario
      for (const [nombre] of this.estadosCache.entries()) {
        localStorage.removeItem(`estado_${nombre}`);
      }

      console.log('✅ [ESTADOS] Todos los estados han sido reseteados');
    } catch (error) {
      console.error('❌ [ESTADOS] Error reseteando estados:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estado actual
   */
  obtenerEstadoActual(nombre: string): any {
    const store = this.estadosCache.get(nombre);
    if (store) {
      return get(store);
    }
    return this.estadosIniciales.get(nombre);
  }

  /**
   * ✅ SOLUCIÓN: Verificar si un estado está hidratado
   */
  estadoHidratado(nombre: string): boolean {
    return this.estadosHidratacion.get(nombre) || false;
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas de estados
   */
  obtenerEstadisticasEstados(): {
    totalEstados: number;
    estadosHidratados: number;
    estadosCacheados: number;
    estadosIniciales: number;
  } {
    return {
      totalEstados: this.estadosHidratacion.size,
      estadosHidratados: Array.from(this.estadosHidratacion.values()).filter(Boolean).length,
      estadosCacheados: this.estadosCache.size,
      estadosIniciales: this.estadosIniciales.size
    };
  }
}

/**
 * ✅ UTILIDAD: Store determinista para usuario
 */
export const crearStoreUsuario = () => {
  const estados = EstadosDeterministas.getInstance();
  
  return estados.crearStoreDeterminista('usuario', null, {
    persistir: true,
    validar: (valor) => {
      // ✅ SOLUCIÓN: Validar que el usuario tenga estructura correcta
      return valor === null || (
        typeof valor === 'object' &&
        'id' in valor &&
        'correo_electronico' in valor
      );
    }
  });
};

/**
 * ✅ UTILIDAD: Store determinista para tema
 */
export const crearStoreTema = () => {
  const estados = EstadosDeterministas.getInstance();
  
  return estados.crearStoreDeterminista('tema', 'light', {
    persistir: true,
    validar: (valor) => {
      // ✅ SOLUCIÓN: Validar que el tema sea válido
      return ['light', 'dark', 'auto'].includes(valor);
    }
  });
};

/**
 * ✅ UTILIDAD: Store determinista para sidebar
 */
export const crearStoreSidebar = () => {
  const estados = EstadosDeterministas.getInstance();
  
  return estados.crearStoreDeterminista('sidebar', {
    colapsado: false,
    visible: true,
    ancho: 280
  }, {
    persistir: true,
    validar: (valor) => {
      // ✅ SOLUCIÓN: Validar estructura del sidebar
      return valor && 
             typeof valor === 'object' &&
             'colapsado' in valor &&
             'visible' in valor &&
             'ancho' in valor;
    }
  });
};

/**
 * ✅ UTILIDAD: Store determinista para navegación
 */
export const crearStoreNavegacion = () => {
  const estados = EstadosDeterministas.getInstance();
  
  return estados.crearStoreDeterminista('navegacion', {
    rutaActual: '/',
    rutaAnterior: null,
    parametros: {},
    cargando: false,
    error: null
  }, {
    persistir: false, // ✅ SOLUCIÓN: No persistir navegación
    validar: (valor) => {
      // ✅ SOLUCIÓN: Validar estructura de navegación
      return valor &&
             typeof valor === 'object' &&
             'rutaActual' in valor &&
             'cargando' in valor;
    }
  });
};

/**
 * ✅ UTILIDAD: Store derivado para estado de autenticación
 */
export const crearStoreAutenticacion = (storeUsuario: any) => {
  return derived(storeUsuario, ($usuario) => {
    return {
      autenticado: !!$usuario,
      usuario: $usuario,
      rol: $usuario?.rol || null,
      permisos: $usuario?.permisos || []
    };
  });
};

/**
 * ✅ UTILIDAD: Verificar consistencia de estados global
 */
export function verificarConsistenciaEstadosGlobal(): {
  esCliente: boolean;
  estadosConsistentes: boolean;
  estadisticas: any;
  recomendaciones: string[];
} {
  const estados = EstadosDeterministas.getInstance();
  const consistencia = estados.verificarConsistenciaEstados();
  const estadisticas = estados.obtenerEstadisticasEstados();
  
  const recomendaciones: string[] = [];
  
  if (consistencia.inconsistentes.length > 0) {
    recomendaciones.push('Algunos estados no están hidratados correctamente');
  }
  
  if (estadisticas.estadosHidratados < estadisticas.totalEstados) {
    recomendaciones.push('Completar hidratación de todos los estados');
  }
  
  return {
    esCliente: browser,
    estadosConsistentes: consistencia.inconsistentes.length === 0,
    estadisticas,
    recomendaciones
  };
}

/**
 * ✅ UTILIDAD: Log de estados para debugging
 */
export function logEstados(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [ESTADOS] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado de estados
 */
export function obtenerEstadoEstados(): {
  esCliente: boolean;
  estadosDisponibles: string[];
  consistencia: any;
  estadisticas: any;
} {
  const estados = EstadosDeterministas.getInstance();
  
  return {
    esCliente: browser,
    estadosDisponibles: Array.from(estados.estadosHidratacion.keys()),
    consistencia: estados.verificarConsistenciaEstados(),
    estadisticas: estados.obtenerEstadisticasEstados()
  };
} 