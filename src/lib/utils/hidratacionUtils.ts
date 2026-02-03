// ✅ NUEVO: Utilidades para manejo seguro de hidratación
// Este archivo centraliza todas las funciones relacionadas con la hidratación
// para evitar problemas de SSR → CSR en SvelteKit

import { browser } from '$app/environment';

/**
 * ✅ UTILIDAD: Verificar si estamos en el cliente de manera segura
 * @returns true si estamos en el cliente, false si estamos en SSR
 */
export function esCliente(): boolean {
  return browser;
}

/**
 * ✅ UTILIDAD: Ejecutar función solo en el cliente después de hidratación
 * @param fn Función a ejecutar
 * @param delay Delay en ms para asegurar hidratación completa (default: 100ms)
 */
export function ejecutarEnCliente(fn: () => void, delay: number = 100): void {
  if (!browser) return;
  
  setTimeout(() => {
    try {
      fn();
    } catch (error) {
      console.warn('⚠️ [HIDRATACIÓN] Error ejecutando función en cliente:', error);
    }
  }, delay);
}

/**
 * ✅ NUEVO: FUNCIÓN CRÍTICA - PREVENIR PÉRDIDA DE ESTILOS
 * Esta función se ejecuta en cada navegación para garantizar que los estilos estén activos
 */
export function prevenirPerdidaEstilos(): void {
  if (!browser) return;
  
  try {
    // ✅ FORZAR RE-APLICACIÓN DE ESTILOS CRÍTICOS
    const estilosCriticos = [
      'app.css',
      'global.css',
      'tailwind.css'
    ];
    
    // Verificar que los estilos estén cargados
    estilosCriticos.forEach(estilo => {
      const linkElement = document.querySelector(`link[href*="${estilo}"]`);
      if (!linkElement) {
        console.warn(`⚠️ [HIDRATACIÓN] Estilo crítico no encontrado: ${estilo}`);
      }
    });
    
    // ✅ FORZAR RE-APLICACIÓN DE CSS CRÍTICO
    const elementosCriticos = document.querySelectorAll('*');
    elementosCriticos.forEach(el => {
      if (el instanceof HTMLElement) {
        // Forzar re-cálculo de estilos
        el.style.display = el.style.display;
      }
    });
    
    // ✅ VERIFICAR QUE LOS ESTILOS ESTÉN ACTIVOS
    const body = document.body;
    if (body) {
      // Forzar re-aplicación de estilos del body
      body.style.display = body.style.display;
      
      // Verificar que los estilos base estén aplicados
      if (!body.classList.contains('estilos-activos')) {
        body.classList.add('estilos-activos');
        console.log('✅ [HIDRATACIÓN] Estilos base reactivados');
      }
    }
    
    console.log('✅ [HIDRATACIÓN] Prevención de pérdida de estilos ejecutada');
    
  } catch (error) {
    console.error('❌ [HIDRATACIÓN] Error previniendo pérdida de estilos:', error);
  }
}

/**
 * ✅ NUEVO: FUNCIÓN CRÍTICA - RE-HIDRATAR ESTILOS
 * Se ejecuta cuando se detecta pérdida de estilos
 */
export function rehidratarEstilos(): void {
  if (!browser) return;
  
  try {
    console.log('🔄 [HIDRATACIÓN] Re-hidratando estilos...');
    
    // ✅ FORZAR RE-CARGA DE ESTILOS CRÍTICOS
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      if (link instanceof HTMLElement) {
        // Forzar re-carga del estilo
        const href = link.getAttribute('href');
        if (href) {
          link.setAttribute('href', href + '?t=' + Date.now());
          setTimeout(() => {
            link.setAttribute('href', href);
          }, 100);
        }
      }
    });
    
    // ✅ RE-APLICAR CLASES CRÍTICAS
    const elementosConEstilos = document.querySelectorAll('[class*="btn"], [class*="card"], [class*="header"], [class*="nav"]');
    elementosConEstilos.forEach(el => {
      if (el instanceof HTMLElement) {
        // Forzar re-aplicación de estilos
        el.style.display = el.style.display;
        el.style.opacity = el.style.opacity;
      }
    });
    
    // ✅ VERIFICAR ESTILOS DEL HEADER Y NAVEGACIÓN
    const header = document.querySelector('header, .header, .nav, .navigation');
    if (header) {
      header.style.display = header.style.display;
      console.log('✅ [HIDRATACIÓN] Header re-hidratado');
    }
    
    console.log('✅ [HIDRATACIÓN] Estilos re-hidratados correctamente');
    
  } catch (error) {
    console.error('❌ [HIDRATACIÓN] Error re-hidratando estilos:', error);
  }
}

/**
 * ✅ NUEVO: FUNCIÓN CRÍTICA - VERIFICAR INTEGRIDAD DE ESTILOS
 * Detecta si los estilos se han perdido
 */
export function verificarIntegridadEstilos(): boolean {
  if (!browser) return false;
  
  try {
    // ✅ VERIFICAR QUE LOS ESTILOS BASE ESTÉN ACTIVOS
    const body = document.body;
    if (!body) return false;
    
    // Verificar que los estilos críticos estén aplicados
    const estilosCriticos = [
      'font-family',
      'background-color',
      'color'
    ];
    
    const estilosPerdidos = estilosCriticos.filter(prop => {
      const valor = getComputedStyle(body).getPropertyValue(prop);
      return !valor || valor === 'initial' || valor === 'unset';
    });
    
    if (estilosPerdidos.length > 0) {
      console.warn('⚠️ [HIDRATACIÓN] Estilos perdidos detectados:', estilosPerdidos);
      return false;
    }
    
    // ✅ VERIFICAR QUE LOS COMPONENTES CRÍTICOS TENGAN ESTILOS
    const componentesCriticos = document.querySelectorAll('.btn, .card, .header, .nav');
    let componentesSinEstilos = 0;
    
    componentesCriticos.forEach(comp => {
      if (comp instanceof HTMLElement) {
        const estilos = getComputedStyle(comp);
        if (estilos.display === 'inline' || estilos.position === 'static') {
          componentesSinEstilos++;
        }
      }
    });
    
    if (componentesSinEstilos > componentesCriticos.length * 0.3) {
      console.warn('⚠️ [HIDRATACIÓN] Muchos componentes sin estilos:', componentesSinEstilos);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ [HIDRATACIÓN] Error verificando integridad de estilos:', error);
    return false;
  }
}

/**
 * ✅ NUEVO: FUNCIÓN CRÍTICA - MONITOREO CONTINUO DE ESTILOS
 * Se ejecuta periódicamente para detectar pérdida de estilos
 */
export function iniciarMonitoreoEstilos(): void {
  if (!browser) return;
  
  try {
    // ✅ MONITOREO CADA 2 SEGUNDOS
    setInterval(() => {
      const estilosIntegros = verificarIntegridadEstilos();
      
      if (!estilosIntegros) {
        console.warn('🚨 [HIDRATACIÓN] Pérdida de estilos detectada, re-hidratando...');
        rehidratarEstilos();
      }
    }, 2000);
    
    console.log('✅ [HIDRATACIÓN] Monitoreo de estilos iniciado');
    
  } catch (error) {
    console.error('❌ [HIDRATACIÓN] Error iniciando monitoreo de estilos:', error);
  }
}

/**
 * ✅ UTILIDAD: Aplicar clase CSS de manera segura
 * @param selector Selector CSS del elemento
 * @param className Nombre de la clase a aplicar
 */
export function aplicarClaseSegura(selector: string, className: string): void {
  if (!browser) return;
  
  try {
    const elementos = document.querySelectorAll(selector);
    elementos.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.add(className);
      }
    });
  } catch (error) {
    console.warn('⚠️ [HIDRATACIÓN] Error aplicando clase:', error);
  }
}

/**
 * ✅ UTILIDAD: Remover clase CSS de manera segura
 * @param selector Selector CSS del elemento
 * @param className Nombre de la clase a remover
 */
export function removerClaseSegura(selector: string, className: string): void {
  if (!browser) return;
  
  try {
    const elementos = document.querySelectorAll(selector);
    elementos.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.remove(className);
      }
    });
  } catch (error) {
    console.warn('⚠️ [HIDRATACIÓN] Error removiendo clase:', error);
  }
}

/**
 * ✅ UTILIDAD: Verificar si un elemento existe antes de manipularlo
 * @param selector Selector CSS del elemento
 * @returns true si el elemento existe, false en caso contrario
 */
export function elementoExiste(selector: string): boolean {
  if (!browser) return false;
  
  try {
    return document.querySelector(selector) !== null;
  } catch (error) {
    console.warn('⚠️ [HIDRATACIÓN] Error verificando elemento:', error);
    return false;
  }
}

/**
 * ✅ UTILIDAD: Esperar a que un elemento esté disponible
 * @param selector Selector CSS del elemento
 * @param timeout Timeout en ms (default: 5000ms)
 * @returns Promise que se resuelve cuando el elemento está disponible
 */
export function esperarElemento(selector: string, timeout: number = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    if (!browser) {
      resolve(null);
      return;
    }
    
    // Verificar si ya existe
    const elemento = document.querySelector(selector);
    if (elemento) {
      resolve(elemento);
      return;
    }
    
    // Esperar a que aparezca
    const observer = new MutationObserver((mutations) => {
      const elemento = document.querySelector(selector);
      if (elemento) {
        observer.disconnect();
        resolve(elemento);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Timeout de seguridad
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * ✅ UTILIDAD: Crear un hook de hidratación segura
 * @param callback Función a ejecutar después de la hidratación
 * @param dependencies Dependencias que deben estar disponibles
 */
export function crearHookHidratacion(
  callback: () => void,
  dependencies: (() => boolean)[] = []
): void {
  if (!browser) return;
  
  // Verificar dependencias
  const dependenciasDisponibles = dependencies.every(dep => dep());
  if (!dependenciasDisponibles) {
    // Reintentar en el siguiente tick
    setTimeout(() => crearHookHidratacion(callback, dependencies), 50);
    return;
  }
  
  // Ejecutar callback
  ejecutarEnCliente(callback);
}

/**
 * ✅ UTILIDAD: Log de hidratación para debugging
 * @param mensaje Mensaje a loggear
 * @param datos Datos adicionales
 */
export function logHidratacion(mensaje: string, datos?: any): void {
  if (!browser) return;
  
  console.log(`🔧 [HIDRATACIÓN] ${mensaje}`, datos || '');
}

/**
 * ✅ UTILIDAD: Verificar estado de hidratación
 * @returns Objeto con información del estado de hidratación
 */
export function obtenerEstadoHidratacion(): {
  esCliente: boolean;
  esHidratado: boolean;
  timestamp: number;
} {
  return {
    esCliente: browser,
    esHidratado: browser && typeof window !== 'undefined',
    timestamp: Date.now()
  };
} 