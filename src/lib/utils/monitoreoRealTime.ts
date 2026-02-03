// ✅ FASE 5: SISTEMA DE MONITOREO EN TIEMPO REAL
// Basado en las mejores prácticas para mantener estabilidad de aplicaciones

import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import { page } from '$app/stores';

/**
 * ✅ UTILIDAD: Sistema de monitoreo en tiempo real para estabilidad
 */
export class MonitoreoRealTime {
  private static instance: MonitoreoRealTime;
  private metricas: Map<string, any> = new Map();
  private alertas: Map<string, any> = new Map();
  private logs: any[] = [];
  private intervalos: Map<string, NodeJS.Timeout> = new Map();
  private observadores: Map<string, any> = new Map();

  private constructor() {
    this.inicializarMonitoreo();
  }

  static getInstance(): MonitoreoRealTime {
    if (!MonitoreoRealTime.instance) {
      MonitoreoRealTime.instance = new MonitoreoRealTime();
    }
    return MonitoreoRealTime.instance;
  }

  /**
   * ✅ SOLUCIÓN: Inicializar sistema de monitoreo
   */
  private inicializarMonitoreo(): void {
    if (!browser) return;

    try {
      console.log('🔧 [MONITOREO] Sistema de monitoreo en tiempo real inicializado');
      
      // ✅ SOLUCIÓN: Monitorear rendimiento del navegador
      this.monitorearRendimientoNavegador();
      
      // ✅ SOLUCIÓN: Monitorear memoria y recursos
      this.monitorearMemoriaYRecursos();
      
      // ✅ SOLUCIÓN: Monitorear errores de JavaScript
      this.monitorearErroresJavaScript();
      
      // ✅ SOLUCIÓN: Monitorear rendimiento de red
      this.monitorearRendimientoRed();
      
      // ✅ SOLUCIÓN: Monitorear interacciones del usuario
      this.monitorearInteraccionesUsuario();
      
      // ✅ SOLUCIÓN: Monitorear estado de la aplicación
      this.monitorearEstadoAplicacion();
      
    } catch (error) {
      console.error('❌ [MONITOREO] Error inicializando monitoreo:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear rendimiento del navegador
   */
  private monitorearRendimientoNavegador(): void {
    if (!browser || !('performance' in window)) return;

    try {
      // ✅ SOLUCIÓN: Métricas de navegación
      if ('navigation' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metricas.set('tiempoCarga', {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            carga: navigation.loadEventEnd - navigation.loadEventStart,
            timestamp: Date.now()
          });
        }
      }

      // ✅ SOLUCIÓN: Métricas de pintura
      if ('paint' in performance) {
        performance.getEntriesByType('paint').forEach((entry: any) => {
          this.metricas.set(`pintura_${entry.name}`, {
            valor: entry.startTime,
            timestamp: Date.now()
          });
        });
      }

      // ✅ SOLUCIÓN: Métricas de recursos
      performance.getEntriesByType('resource').forEach((entry: any) => {
        const recursos = this.metricas.get('recursos') || [];
        recursos.push({
          nombre: entry.name,
          duracion: entry.duration,
          tamaño: entry.transferSize,
          timestamp: Date.now()
        });
        
        if (recursos.length > 100) {
          recursos.splice(0, recursos.length - 100);
        }
        
        this.metricas.set('recursos', recursos);
      });

      console.log('✅ [MONITOREO] Rendimiento del navegador monitoreado');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error monitoreando rendimiento del navegador:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear memoria y recursos
   */
  private monitorearMemoriaYRecursos(): void {
    if (!browser || !('memory' in performance)) return;

    try {
      const intervalo = setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.metricas.set('memoria', {
            usado: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limite: memory.jsHeapSizeLimit,
            porcentaje: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            timestamp: Date.now()
          });

          // ✅ SOLUCIÓN: Alerta si uso de memoria es alto
          if ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.8) {
            this.crearAlerta('memoria_alta', {
              tipo: 'warning',
              mensaje: 'Uso de memoria alto detectado',
              datos: {
                usado: this.formatearBytes(memory.usedJSHeapSize),
                limite: this.formatearBytes(memory.jsHeapSizeLimit),
                porcentaje: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
              }
            });
          }
        }
      }, 5000); // Cada 5 segundos

      this.intervalos.set('memoria', intervalo);
      console.log('✅ [MONITOREO] Memoria y recursos monitoreados');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error monitoreando memoria:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear errores de JavaScript
   */
  private monitorearErroresJavaScript(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Capturar errores no manejados
      window.addEventListener('error', (event) => {
        this.registrarError('javascript', {
          mensaje: event.message,
          archivo: event.filename,
          linea: event.lineno,
          columna: event.colno,
          error: event.error?.stack,
          timestamp: Date.now()
        });
      });

      // ✅ SOLUCIÓN: Capturar promesas rechazadas
      window.addEventListener('unhandledrejection', (event) => {
        this.registrarError('promesa', {
          mensaje: event.reason?.message || 'Promesa rechazada',
          razon: event.reason,
          timestamp: Date.now()
        });
      });

      console.log('✅ [MONITOREO] Errores de JavaScript monitoreados');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error configurando monitoreo de errores:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear rendimiento de red
   */
  private monitorearRendimientoRed(): void {
    if (!browser || !('connection' in navigator)) return;

    try {
      const connection = (navigator as any).connection;
      if (connection) {
        this.metricas.set('red', {
          tipo: connection.effectiveType,
          velocidad: connection.downlink,
          rtt: connection.rtt,
          timestamp: Date.now()
        });

        // ✅ SOLUCIÓN: Alerta si conexión es lenta
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.crearAlerta('red_lenta', {
            tipo: 'warning',
            mensaje: 'Conexión de red lenta detectada',
            datos: {
              tipo: connection.effectiveType,
              velocidad: connection.downlink,
              rtt: connection.rtt
            }
          });
        }
      }

      console.log('✅ [MONITOREO] Rendimiento de red monitoreado');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error monitoreando red:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear interacciones del usuario
   */
  private monitorearInteraccionesUsuario(): void {
    if (!browser) return;

    try {
      let interacciones = 0;
      let ultimaInteraccion = Date.now();

      // ✅ SOLUCIÓN: Monitorear actividad del usuario
      const eventos = ['click', 'scroll', 'input', 'keydown', 'mousemove'];
      eventos.forEach(evento => {
        document.addEventListener(evento, () => {
          interacciones++;
          ultimaInteraccion = Date.now();
        }, { passive: true });
      });

      // ✅ SOLUCIÓN: Actualizar métricas cada segundo
      const intervalo = setInterval(() => {
        this.metricas.set('interacciones', {
          total: interacciones,
          ultima: ultimaInteraccion,
          inactividad: Date.now() - ultimaInteraccion,
          timestamp: Date.now()
        });

        // ✅ SOLUCIÓN: Alerta si usuario está inactivo
        if (Date.now() - ultimaInteraccion > 5 * 60 * 1000) { // 5 minutos
          this.crearAlerta('usuario_inactivo', {
            tipo: 'info',
            mensaje: 'Usuario inactivo detectado',
            datos: {
              inactividad: Math.round((Date.now() - ultimaInteraccion) / 1000 / 60)
            }
          });
        }
      }, 1000);

      this.intervalos.set('interacciones', intervalo);
      console.log('✅ [MONITOREO] Interacciones del usuario monitoreadas');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error monitoreando interacciones:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Monitorear estado de la aplicación
   */
  private monitorearEstadoAplicacion(): void {
    if (!browser) return;

    try {
      // ✅ SOLUCIÓN: Monitorear visibilidad de página
      document.addEventListener('visibilitychange', () => {
        this.metricas.set('visibilidad', {
          visible: !document.hidden,
          timestamp: Date.now()
        });
      });

      // ✅ SOLUCIÓN: Monitorear foco de ventana
      window.addEventListener('focus', () => {
        this.metricas.set('foco', {
          activo: true,
          timestamp: Date.now()
        });
      });

      window.addEventListener('blur', () => {
        this.metricas.set('foco', {
          activo: false,
          timestamp: Date.now()
        });
      });

      // ✅ SOLUCIÓN: Monitorear estado de carga
      window.addEventListener('load', () => {
        this.metricas.set('carga', {
          completada: true,
          timestamp: Date.now()
        });
      });

      console.log('✅ [MONITOREO] Estado de la aplicación monitoreado');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error monitoreando estado de la aplicación:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Registrar error
   */
  private registrarError(tipo: string, datos: any): void {
    try {
      const errores = this.metricas.get('errores') || [];
      errores.push({
        tipo,
        ...datos
      });

      // ✅ SOLUCIÓN: Mantener solo los últimos 100 errores
      if (errores.length > 100) {
        errores.splice(0, errores.length - 100);
      }

      this.metricas.set('errores', errores);

      // ✅ SOLUCIÓN: Crear alerta para errores críticos
      if (tipo === 'javascript') {
        this.crearAlerta('error_javascript', {
          tipo: 'error',
          mensaje: 'Error de JavaScript detectado',
          datos
        });
      }

      console.warn(`⚠️ [MONITOREO] Error registrado: ${tipo}`, datos);

    } catch (error) {
      console.error('❌ [MONITOREO] Error registrando error:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Crear alerta
   */
  private crearAlerta(id: string, datos: any): void {
    try {
      this.alertas.set(id, {
        ...datos,
        id,
        timestamp: Date.now()
      });

      // ✅ SOLUCIÓN: Dispatch de evento para notificaciones
      window.dispatchEvent(new CustomEvent('alerta-monitoreo', {
        detail: { id, ...datos }
      }));

      console.log(`🚨 [MONITOREO] Alerta creada: ${id}`, datos);

    } catch (error) {
      console.error('❌ [MONITOREO] Error creando alerta:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Formatear bytes
   */
  private formatearBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * ✅ SOLUCIÓN: Obtener métricas
   */
  obtenerMetricas(): any {
    const metricasObj: any = {};
    this.metricas.forEach((valor, clave) => {
      metricasObj[clave] = valor;
    });
    return metricasObj;
  }

  /**
   * ✅ SOLUCIÓN: Obtener alertas
   */
  obtenerAlertas(): any[] {
    return Array.from(this.alertas.values());
  }

  /**
   * ✅ SOLUCIÓN: Obtener logs
   */
  obtenerLogs(): any[] {
    return this.logs;
  }

  /**
   * ✅ SOLUCIÓN: Limpiar métricas antiguas
   */
  limpiarMetricasAntiguas(): void {
    try {
      const ahora = Date.now();
      const maxEdad = 24 * 60 * 60 * 1000; // 24 horas

      this.metricas.forEach((valor, clave) => {
        if (valor.timestamp && (ahora - valor.timestamp) > maxEdad) {
          this.metricas.delete(clave);
        }
      });

      // ✅ SOLUCIÓN: Limpiar alertas antiguas
      this.alertas.forEach((alerta, id) => {
        if ((ahora - alerta.timestamp) > maxEdad) {
          this.alertas.delete(id);
        }
      });

      console.log('🧹 [MONITOREO] Métricas antiguas limpiadas');

    } catch (error) {
      console.warn('⚠️ [MONITOREO] Error limpiando métricas:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Limpiar monitoreo
   */
  limpiarMonitoreo(): void {
    try {
      // ✅ SOLUCIÓN: Limpiar intervalos
      this.intervalos.forEach(intervalo => clearInterval(intervalo));
      this.intervalos.clear();

      // ✅ SOLUCIÓN: Limpiar métricas
      this.metricas.clear();
      this.alertas.clear();
      this.logs = [];

      console.log('🧹 [MONITOREO] Monitoreo limpiado completamente');

    } catch (error) {
      console.error('❌ [MONITOREO] Error limpiando monitoreo:', error);
    }
  }

  /**
   * ✅ SOLUCIÓN: Obtener estadísticas del sistema
   */
  obtenerEstadisticasSistema(): {
    metricas: number;
    alertas: number;
    logs: number;
    intervalos: number;
  } {
    return {
      metricas: this.metricas.size,
      alertas: this.alertas.size,
      logs: this.logs.length,
      intervalos: this.intervalos.size
    };
  }

  /**
   * ✅ SOLUCIÓN: Verificar salud del sistema
   */
  verificarSaludSistema(): {
    salud: 'excelente' | 'buena' | 'regular' | 'mala';
    problemas: string[];
    recomendaciones: string[];
  } {
    const problemas: string[] = [];
    const recomendaciones: string[] = [];
    
    // ✅ SOLUCIÓN: Verificar métricas
    if (this.metricas.size > 1000) {
      problemas.push('Demasiadas métricas almacenadas');
      recomendaciones.push('Considerar limpieza automática más frecuente');
    }
    
    // ✅ SOLUCIÓN: Verificar alertas
    const alertasCriticas = Array.from(this.alertas.values()).filter(a => a.tipo === 'error');
    if (alertasCriticas.length > 10) {
      problemas.push('Demasiadas alertas críticas activas');
      recomendaciones.push('Revisar errores de la aplicación');
    }
    
    // ✅ SOLUCIÓN: Verificar memoria
    const memoria = this.metricas.get('memoria');
    if (memoria && memoria.porcentaje > 90) {
      problemas.push('Uso de memoria crítico');
      recomendaciones.push('Optimizar uso de memoria de la aplicación');
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
 * ✅ UTILIDAD: Función helper para obtener métricas
 */
export const obtenerMetricasMonitoreo = () => {
  const monitoreo = MonitoreoRealTime.getInstance();
  return monitoreo.obtenerMetricas();
};

/**
 * ✅ UTILIDAD: Función helper para obtener alertas
 */
export const obtenerAlertasMonitoreo = () => {
  const monitoreo = MonitoreoRealTime.getInstance();
  return monitoreo.obtenerAlertas();
};

/**
 * ✅ UTILIDAD: Función helper para limpiar monitoreo
 */
export const limpiarMonitoreo = () => {
  const monitoreo = MonitoreoRealTime.getInstance();
  monitoreo.limpiarMonitoreo();
};

/**
 * ✅ UTILIDAD: Función helper para verificar salud
 */
export const verificarSaludMonitoreo = () => {
  const monitoreo = MonitoreoRealTime.getInstance();
  return monitoreo.verificarSaludSistema();
};

/**
 * ✅ UTILIDAD: Log de monitoreo para debugging
 */
export function logMonitoreo(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [MONITOREO] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Obtener estado del monitoreo
 */
export function obtenerEstadoMonitoreo(): {
  esCliente: boolean;
  estadisticas: any;
  salud: any;
} {
  const monitoreo = MonitoreoRealTime.getInstance();
  
  return {
    esCliente: browser,
    estadisticas: monitoreo.obtenerEstadisticasSistema(),
    salud: monitoreo.verificarSaludSistema()
  };
} 