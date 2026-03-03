// ✅ FASE 4: SISTEMA DE CACHE INTELIGENTE
// Basado en las mejores prácticas de SvelteKit para rendimiento óptimo

const browser = typeof window !== 'undefined';
import { writable, derived } from '$utilidades/tiendaReact';

/**
 * ✅ UTILIDAD: Sistema de cache inteligente para rendimiento óptimo
 */
export class CacheInteligente {
  private static instance: CacheInteligente;
  private cacheMemoria: Map<string, any> = new Map();
  private cachePersistente: Map<string, any> = new Map();
  private estadisticasCache: Map<string, { hits: number; misses: number; timestamp: number }> = new Map();
  private politicasCache: Map<string, { ttl: number; maxSize: number; priority: number }> = new Map();

  private constructor() {
    this.inicializarPoliticasCache();
    this.inicializarCachePersistente();
  }

  static getInstance(): CacheInteligente {
    if (!CacheInteligente.instance) {
      CacheInteligente.instance = new CacheInteligente();
    }
    return CacheInteligente.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar políticas de cache
   */
  private inicializarPoliticasCache(): void {
    // ✅ SOLUCIÓN: Políticas basadas en tipo de dato
    const politicas = {
      // 🚀 CRÍTICOS: Cache persistente con TTL largo
      'usuario': { ttl: 24 * 60 * 60 * 1000, maxSize: 1, priority: 1 }, // 24 horas
      'perfil': { ttl: 60 * 60 * 1000, maxSize: 1, priority: 1 }, // 1 hora
      'sidebar': { ttl: 30 * 60 * 1000, maxSize: 1, priority: 2 }, // 30 minutos
      
      // 🚀 ALTA: Cache en memoria con TTL medio
      'cursos': { ttl: 15 * 60 * 1000, maxSize: 50, priority: 2 }, // 15 minutos
      'tutoriales': { ttl: 15 * 60 * 1000, maxSize: 100, priority: 2 }, // 15 minutos
      'estadisticas': { ttl: 5 * 60 * 1000, maxSize: 20, priority: 3 }, // 5 minutos
      
      // 🚀 MEDIA: Cache temporal
      'busqueda': { ttl: 2 * 60 * 1000, maxSize: 100, priority: 3 }, // 2 minutos
      'notificaciones': { ttl: 1 * 60 * 1000, maxSize: 50, priority: 4 }, // 1 minuto
      
      // 🚀 BAJA: Cache efímero
      'ui': { ttl: 30 * 1000, maxSize: 200, priority: 4 }, // 30 segundos
      'temporal': { ttl: 10 * 1000, maxSize: 500, priority: 5 } // 10 segundos
    };

    Object.entries(politicas).forEach(([tipo, politica]) => {
      this.politicasCache.set(tipo, politica);
    });
  }

  /**
   * ✅ SOLUCIÓN: Inicializar cache persistente desde localStorage
   */
  private inicializarCachePersistente(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Restaurar cache persistente
      const cacheGuardado = localStorage.getItem('cache_inteligente');
      if (cacheGuardado) {
        const cacheParseado = JSON.parse(cacheGuardado);
        
        // ✅ SOLUCIÓN: Verificar validez del cache
        const ahora = Date.now();
        Object.entries(cacheParseado).forEach(([key, value]: [string, any]) => {
          if (value && value.timestamp && (ahora - value.timestamp) < (value.ttl || 0)) {
            this.cachePersistente.set(key, value);
          }
        });
        
        console.log('✅ [CACHE] Cache persistente restaurado desde localStorage');
      }
    } catch (error) {
      console.warn('⚠️ [CACHE] Error restaurando cache persistente:', error);
      localStorage.removeItem('cache_inteligente');
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener dato del cache
   */
  obtener<T>(
    clave: string,
    tipo: string = 'temporal'
  ): T | null {
    try {
      const politica = this.politicasCache.get(tipo);
      if (!politica) {
        console.warn(`⚠️ [CACHE] Tipo de cache no configurado: ${tipo}`);
        return null;
      }

      // ✅ SOLUCIÓN: Verificar cache en memoria primero
      if (this.cacheMemoria.has(clave)) {
        const dato = this.cacheMemoria.get(clave);
        if (this.esValido(dato, politica.ttl)) {
          this.registrarHit(clave);
          console.log(`📦 [CACHE] Hit en memoria para: ${clave}`);
          return dato.valor;
        } else {
          this.cacheMemoria.delete(clave);
        }
      }

      // ✅ SOLUCIÓN: Verificar cache persistente
      if (this.cachePersistente.has(clave)) {
        const dato = this.cachePersistente.get(clave);
        if (this.esValido(dato, politica.ttl)) {
          // ✅ SOLUCIÓN: Mover a memoria para acceso rápido
          this.cacheMemoria.set(clave, dato);
          this.registrarHit(clave);
          console.log(`📦 [CACHE] Hit en persistente para: ${clave}`);
          return dato.valor;
        } else {
          this.cachePersistente.delete(clave);
        }
      }

      // ✅ SOLUCIÓN: Cache miss
      this.registrarMiss(clave);
      console.log(`❌ [CACHE] Miss para: ${clave}`);
      return null;

    } catch (error) {
      console.warn(`⚠️ [CACHE] Error obteniendo ${clave}:`, error);
      return null;
    }
  }

  /**
   * ✅ SOLUCIÓN: Almacenar dato en cache
   */
  almacenar<T>(
    clave: string,
    valor: T,
    tipo: string = 'temporal',
    opciones?: {
      ttl?: number;
      persistir?: boolean;
      prioridad?: number;
    }
  ): void {
    try {
      const politica = this.politicasCache.get(tipo);
      if (!politica) {
        console.warn(`⚠️ [CACHE] Tipo de cache no configurado: ${tipo}`);
        return;
      }

      const ttl = opciones?.ttl || politica.ttl;
      const persistir = opciones?.persistir ?? (tipo === 'usuario' || tipo === 'perfil');
      const prioridad = opciones?.prioridad || politica.priority;

      const datoCache = {
        valor,
        timestamp: Date.now(),
        ttl,
        tipo,
        prioridad,
        hits: 0
      };

      // ✅ SOLUCIÓN: Almacenar en memoria
      this.cacheMemoria.set(clave, datoCache);

      // ✅ SOLUCIÓN: Almacenar en persistente si se solicita
      if (persistir) {
        this.cachePersistente.set(clave, datoCache);
        this.persistirCache();
      }

      // ✅ SOLUCIÓN: Limpiar cache si excede tamaño máximo
      this.limpiarCacheSiNecesario(tipo);

      console.log(`💾 [CACHE] Dato almacenado: ${clave} (${tipo})`);

    } catch (error) {
      console.error(`❌ [CACHE] Error almacenando ${clave}:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Verificar si dato es válido
   */
  private esValido(dato: any, ttl: number): boolean {
    if (!dato || !dato.timestamp) return false;
    
    const ahora = Date.now();
    return (ahora - dato.timestamp) < ttl;
  }

  /**
   * ✅ SOLUCIÓN: Registrar hit de cache
   */
  private registrarHit(clave: string): void {
    if (!this.estadisticasCache.has(clave)) {
      this.estadisticasCache.set(clave, { hits: 0, misses: 0, timestamp: Date.now() });
    }
    
    const stats = this.estadisticasCache.get(clave)!;
    stats.hits++;
    stats.timestamp = Date.now();
  }

  /**
   * ✅ SOLUCIÓN: Registrar miss de cache
   */
  private registrarMiss(clave: string): void {
    if (!this.estadisticasCache.has(clave)) {
      this.estadisticasCache.set(clave, { hits: 0, misses: 0, timestamp: Date.now() });
    }
    
    const stats = this.estadisticasCache.get(clave)!;
    stats.misses++;
    stats.timestamp = Date.now();
  }

  /**
   * ✅ SOLUCIÓN: Limpiar cache si excede tamaño máximo
   */
  private limpiarCacheSiNecesario(tipo: string): void {
    const politica = this.politicasCache.get(tipo);
    if (!politica) return;

    // ✅ SOLUCIÓN: Limpiar cache en memoria
    if (this.cacheMemoria.size > politica.maxSize) {
      const entradas = Array.from(this.cacheMemoria.entries())
        .filter(([key, value]) => value.tipo === tipo)
        .sort((a, b) => {
          // ✅ SOLUCIÓN: Priorizar por hits y timestamp
          const scoreA = a[1].hits * 10 + (Date.now() - a[1].timestamp);
          const scoreB = b[1].hits * 10 + (Date.now() - b[1].timestamp);
          return scoreA - scoreB;
        });

      // ✅ SOLUCIÓN: Remover entradas menos importantes
      const entradasARemover = entradas.slice(0, entradas.length - politica.maxSize);
      entradasARemover.forEach(([key]) => {
        this.cacheMemoria.delete(key);
      });

      console.log(`🧹 [CACHE] Limpieza automática para ${tipo}: ${entradasARemover.length} entradas removidas`);
    }
  }

  /**
   * ✅ SOLUCIÓN: Preload de datos críticos
   */
  async preloadDatosCriticos(): Promise<void> {
    if (!browser) return;

    try {
      console.log('🚀 [CACHE] Iniciando preload de datos críticos...');
      
      // ✅ SOLUCIÓN: Preload de datos del usuario
      const usuarioGuardado = localStorage.getItem('usuario_actual');
      if (usuarioGuardado) {
        try {
          const usuario = JSON.parse(usuarioGuardado);
          this.almacenar('usuario_actual', usuario, 'usuario', { persistir: true });
          console.log('✅ [CACHE] Usuario precargado en cache');
        } catch (error) {
          console.warn('⚠️ [CACHE] Error precargando usuario:', error);
        }
      }

      // ✅ SOLUCIÓN: Preload de preferencias
      const preferenciasGuardadas = localStorage.getItem('sidebar_estado');
      if (preferenciasGuardadas) {
        try {
          const preferencias = JSON.parse(preferenciasGuardadas);
          this.almacenar('sidebar_estado', preferencias, 'sidebar', { persistir: true });
          console.log('✅ [CACHE] Preferencias precargadas en cache');
        } catch (error) {
          console.warn('⚠️ [CACHE] Error precargando preferencias:', error);
        }
      }

      console.log('✅ [CACHE] Preload de datos críticos completado');

    } catch (error) {
      console.error('❌ [CACHE] Error en preload de datos críticos:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Invalidar cache específico
   */
  invalidar(clave: string): void {
    try {
      this.cacheMemoria.delete(clave);
      this.cachePersistente.delete(clave);
      console.log(`🗑️ [CACHE] Cache invalidado para: ${clave}`);
    } catch (error) {
      console.warn(`⚠️ [CACHE] Error invalidando ${clave}:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Invalidar cache por tipo
   */
  invalidarPorTipo(tipo: string): void {
    try {
      let contador = 0;
      
      // ✅ SOLUCIÓN: Invalidar en memoria
      for (const [key, value] of this.cacheMemoria.entries()) {
        if (value.tipo === tipo) {
          this.cacheMemoria.delete(key);
          contador++;
        }
      }
      
      // ✅ SOLUCIÓN: Invalidar en persistente
      for (const [key, value] of this.cachePersistente.entries()) {
        if (value.tipo === tipo) {
          this.cachePersistente.delete(key);
          contador++;
        }
      }
      
      console.log(`🗑️ [CACHE] Cache invalidado para tipo ${tipo}: ${contador} entradas removidas`);
      
    } catch (error) {
      console.error(`❌ [CACHE] Error invalidando tipo ${tipo}:`, error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Limpiar cache completo
   */
  limpiarCache(): void {
    try {
      console.log('🧹 [CACHE] Limpiando cache completo...');
      
      this.cacheMemoria.clear();
      this.cachePersistente.clear();
      this.estadisticasCache.clear();
      
      // ✅ SOLUCIÓN: Limpiar localStorage
      if (browser) {
        localStorage.removeItem('cache_inteligente');
      }
      
      console.log('✅ [CACHE] Cache completo limpiado');
      
    } catch (error) {
      console.error('❌ [CACHE] Error limpiando cache:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Persistir cache a localStorage
   */
  private persistirCache(): void {
    if (!browser) return;

    try {
      const cacheParaPersistir: Record<string, any> = {};
      
      this.cachePersistente.forEach((value, key) => {
        cacheParaPersistir[key] = value;
      });
      
      localStorage.setItem('cache_inteligente', JSON.stringify(cacheParaPersistir));
      
    } catch (error) {
      console.warn('⚠️ [CACHE] Error persistiendo cache:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas de cache
   */
  obtenerEstadisticas(): {
    memoria: number;
    persistente: number;
    estadisticas: number;
    politicas: number;
  } {
    return {
      memoria: this.cacheMemoria.size,
      persistente: this.cachePersistente.size,
      estadisticas: this.estadisticasCache.size,
      politicas: this.politicasCache.size
    };
  }

  /**
   * ✅ SOLUCIÓN: Obtener métricas de rendimiento
   */
  obtenerMetricasRendimiento(): {
    hitRate: number;
    missRate: number;
    totalAccesos: number;
    cacheEficiencia: 'excelente' | 'buena' | 'regular' | 'mala';
  } {
    let totalHits = 0;
    let totalMisses = 0;
    
    this.estadisticasCache.forEach(stats => {
      totalHits += stats.hits;
      totalMisses += stats.misses;
    });
    
    const totalAccesos = totalHits + totalMisses;
    const hitRate = totalAccesos > 0 ? (totalHits / totalAccesos) * 100 : 0;
    const missRate = totalAccesos > 0 ? (totalMisses / totalAccesos) * 100 : 0;
         const cacheEficiencia = hitRate > 80 ? 'excelente' : hitRate > 60 ? 'buena' : hitRate > 40 ? 'regular' : 'mala';
     
     return {
       hitRate: Math.round(hitRate * 100) / 100,
       missRate: Math.round(missRate * 100) / 100,
       totalAccesos,
       cacheEficiencia: cacheEficiencia as 'excelente' | 'buena' | 'regular' | 'mala'
     };
  }

  /**
   * ✅ SOLUCIÓN: Verificar salud del cache
   */
  verificarSalud(): {
    salud: 'excelente' | 'buena' | 'regular' | 'mala';
    problemas: string[];
    recomendaciones: string[];
  } {
    const problemas: string[] = [];
    const recomendaciones: string[] = [];
    
    // ✅ SOLUCIÓN: Verificar tamaño del cache
    if (this.cacheMemoria.size > 1000) {
      problemas.push('Cache en memoria muy grande');
      recomendaciones.push('Considerar limpieza automática más agresiva');
    }
    
    // ✅ SOLUCIÓN: Verificar hit rate
    const metricas = this.obtenerMetricasRendimiento();
    if (metricas.hitRate < 40) {
      problemas.push(`Hit rate bajo: ${metricas.hitRate}%`);
      recomendaciones.push('Revisar estrategias de cache y TTL');
    }
    
    // ✅ SOLUCIÓN: Verificar datos expirados
    const ahora = Date.now();
    let datosExpirados = 0;
    
    this.cacheMemoria.forEach((dato, key) => {
      if (!this.esValido(dato, dato.ttl)) {
        datosExpirados++;
      }
    });
    
    if (datosExpirados > 100) {
      problemas.push(`${datosExpirados} datos expirados en memoria`);
      recomendaciones.push('Ejecutar limpieza automática de datos expirados');
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
 * ✅ UTILIDAD: Función helper para obtener del cache
 */
export const obtenerCache = <T>(
  clave: string,
  tipo: string = 'temporal'
): T | null => {
  const cache = CacheInteligente.getInstance();
  return cache.obtener<T>(clave, tipo);
};

/**
 * ✅ UTILIDAD: Función helper para almacenar en cache
 */
export const almacenarCache = <T>(
  clave: string,
  valor: T,
  tipo: string = 'temporal',
  opciones?: {
    ttl?: number;
    persistir?: boolean;
    prioridad?: number;
  }
): void => {
  const cache = CacheInteligente.getInstance();
  cache.almacenar(clave, valor, tipo, opciones);
};

/**
 * ✅ UTILIDAD: Función helper para invalidar cache
 */
export const invalidarCache = (clave: string): void => {
  const cache = CacheInteligente.getInstance();
  cache.invalidar(clave);
};

/**
 * ✅ UTILIDAD: Función helper para invalidar por tipo
 */
export const invalidarCachePorTipo = (tipo: string): void => {
  const cache = CacheInteligente.getInstance();
  cache.invalidarPorTipo(tipo);
};

/**
 * ✅ UTILIDAD: Función helper para limpiar cache
 */
export const limpiarCacheCompleto = (): void => {
  const cache = CacheInteligente.getInstance();
  cache.limpiarCache();
};

/**
 * ✅ UTILIDAD: Función helper para preload
 */
export const preloadDatosCriticos = async (): Promise<void> => {
  const cache = CacheInteligente.getInstance();
  await cache.preloadDatosCriticos();
};

/**
 * ✅ UTILIDAD: Log de cache para debugging
 */
export function logCache(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [CACHE] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado del cache
 */
export function obtenerEstadoCache(): {
  esCliente: boolean;
  estadisticas: any;
  metricas: any;
  salud: any;
} {
  const cache = CacheInteligente.getInstance();
  
  return {
    esCliente: browser,
    estadisticas: cache.obtenerEstadisticas(),
    metricas: cache.obtenerMetricasRendimiento(),
    salud: cache.verificarSalud()
  };
} 



