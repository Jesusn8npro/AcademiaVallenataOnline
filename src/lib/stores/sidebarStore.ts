// ✅ FASE 3: Store de sidebar con estados deterministas
// Basado en la documentación oficial de SvelteKit para estados estables

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ✅ SOLUCIÓN: Interfaz para estado del sidebar
export interface EstadoSidebar {
  colapsado: boolean;
  visible: boolean;
  ancho: number;
  anchoColapsado: number;
  modo: 'desktop' | 'mobile' | 'tablet';
  transicion: boolean;
  ultimaInteraccion: string;
}

// ✅ SOLUCIÓN: Estado inicial determinista
const ESTADO_INICIAL: EstadoSidebar = {
  colapsado: false,
  visible: true,
  ancho: 280,
  anchoColapsado: 80,
  modo: 'desktop',
  transicion: false,
  ultimaInteraccion: new Date().toISOString()
};

// ✅ SOLUCIÓN: Store principal con validación
export const sidebarColapsado = writable<boolean>(ESTADO_INICIAL.colapsado);

// ✅ SOLUCIÓN: Store principal del sidebar
export const sidebarStore = writable<EstadoSidebar>(ESTADO_INICIAL);

// ✅ SOLUCIÓN: Store derivado para estado visual
export const estadoVisualSidebar = derived(sidebarStore, ($sidebar) => ({
  anchoActual: $sidebar.colapsado ? $sidebar.anchoColapsado : $sidebar.ancho,
  visible: $sidebar.visible,
  transicionando: $sidebar.transicion,
  claseCSS: generarClaseCSS($sidebar)
}));

// ✅ SOLUCIÓN: Store derivado para responsive
export const sidebarResponsive = derived(sidebarStore, ($sidebar) => ({
  esMobile: $sidebar.modo === 'mobile',
  esTablet: $sidebar.modo === 'tablet',
  esDesktop: $sidebar.modo === 'desktop',
  debeOcultarEnMobile: $sidebar.modo === 'mobile' && $sidebar.colapsado
}));

// ✅ SOLUCIÓN: Función para generar clase CSS de manera determinista
function generarClaseCSS(sidebar: EstadoSidebar): string {
  const clases: string[] = ['sidebar'];
  
  if (sidebar.colapsado) clases.push('colapsado');
  if (!sidebar.visible) clases.push('oculto');
  if (sidebar.transicion) clases.push('transicionando');
  clases.push(`modo-${sidebar.modo}`);
  
  return clases.join(' ');
}

// ✅ SOLUCIÓN: Función para actualizar sidebar con validación
export function actualizarSidebar(
  actualizaciones: Partial<EstadoSidebar>,
  opciones?: { persistir?: boolean; transicion?: boolean }
): void {
  try {
    const estadoActual = get(sidebarStore);
    
    // ✅ SOLUCIÓN: Validar actualizaciones
    const estadoValidado = validarEstadoSidebar({
      ...estadoActual,
      ...actualizaciones
    });
    
    // ✅ SOLUCIÓN: Aplicar transición si se solicita
    if (opciones?.transicion) {
      estadoValidado.transicion = true;
      estadoValidado.ultimaInteraccion = new Date().toISOString();
      
      // ✅ SOLUCIÓN: Remover transición después de un delay
      setTimeout(() => {
        sidebarStore.update(estado => ({
          ...estado,
          transicion: false
        }));
      }, 300);
    }
    
    // ✅ SOLUCIÓN: Actualizar store
    sidebarStore.set(estadoValidado);
    
    // ✅ SOLUCIÓN: Sincronizar store legacy
    sidebarColapsado.set(estadoValidado.colapsado);
    
    // ✅ SOLUCIÓN: Persistir en localStorage si se solicita
    if (browser && opciones?.persistir) {
      try {
        const datosPersistir = {
          colapsado: estadoValidado.colapsado,
          visible: estadoValidado.visible,
          ancho: estadoValidado.ancho,
          modo: estadoValidado.modo
        };
        localStorage.setItem('sidebar_estado', JSON.stringify(datosPersistir));
        console.log('✅ [SIDEBAR] Estado persistido en localStorage');
      } catch (error) {
        console.warn('⚠️ [SIDEBAR] Error persistiendo estado:', error);
      }
    }
    
    console.log('✅ [SIDEBAR] Sidebar actualizado:', actualizaciones);
  } catch (error) {
    console.error('❌ [SIDEBAR] Error actualizando sidebar:', error);
  }
}

// ✅ SOLUCIÓN: Función para alternar colapso del sidebar
export function alternarColapsoSidebar(): void {
  try {
    const estadoActual = get(sidebarStore);
    const nuevoColapsado = !estadoActual.colapsado;
    
    actualizarSidebar(
      { colapsado: nuevoColapsado },
      { persistir: true, transicion: true }
    );
    
    console.log('🔄 [SIDEBAR] Colapso alternado a:', nuevoColapsado);
  } catch (error) {
    console.error('❌ [SIDEBAR] Error alternando colapso:', error);
  }
}

// ✅ SOLUCIÓN: Función para mostrar/ocultar sidebar
export function alternarVisibilidadSidebar(): void {
  try {
    const estadoActual = get(sidebarStore);
    const nuevaVisibilidad = !estadoActual.visible;
    
    actualizarSidebar(
      { visible: nuevaVisibilidad },
      { persistir: true, transicion: true }
    );
    
    console.log('👁️ [SIDEBAR] Visibilidad alternada a:', nuevaVisibilidad);
  } catch (error) {
    console.error('❌ [SIDEBAR] Error alternando visibilidad:', error);
  }
}

// ✅ SOLUCIÓN: Función para cambiar modo responsive
export function cambiarModoSidebar(modo: 'desktop' | 'mobile' | 'tablet'): void {
  try {
    const estadoActual = get(sidebarStore);
    
    // ✅ SOLUCIÓN: Ajustar comportamiento según modo
    let ajustes: Partial<EstadoSidebar> = { modo };
    
    if (modo === 'mobile') {
      ajustes.visible = false;
      ajustes.colapsado = true;
    } else if (modo === 'tablet') {
      ajustes.visible = true;
      ajustes.colapsado = true;
    } else {
      ajustes.visible = true;
      ajustes.colapsado = false;
    }
    
    actualizarSidebar(ajustes, { persistir: true });
    
    console.log('📱 [SIDEBAR] Modo cambiado a:', modo);
  } catch (error) {
    console.error('❌ [SIDEBAR] Error cambiando modo:', error);
  }
}

// ✅ SOLUCIÓN: Función para ajustar ancho del sidebar
export function ajustarAnchoSidebar(nuevoAncho: number): void {
  try {
    // ✅ SOLUCIÓN: Validar rango de ancho
    const anchoMinimo = 200;
    const anchoMaximo = 400;
    
    if (nuevoAncho < anchoMinimo || nuevoAncho > anchoMaximo) {
      console.warn(`⚠️ [SIDEBAR] Ancho ${nuevoAncho} fuera de rango [${anchoMinimo}-${anchoMaximo}]`);
      return;
    }
    
    actualizarSidebar({ ancho: nuevoAncho }, { persistir: true });
    
    console.log('📏 [SIDEBAR] Ancho ajustado a:', nuevoAncho);
  } catch (error) {
    console.error('❌ [SIDEBAR] Error ajustando ancho:', error);
  }
}

// ✅ SOLUCIÓN: Función para resetear sidebar a estado inicial
export function resetearSidebar(): void {
  try {
    actualizarSidebar(ESTADO_INICIAL, { persistir: true });
    
    // ✅ SOLUCIÓN: Limpiar localStorage
    if (browser) {
      localStorage.removeItem('sidebar_estado');
      console.log('✅ [SIDEBAR] Estado limpiado de localStorage');
    }
    
    console.log('🔄 [SIDEBAR] Sidebar reseteado a estado inicial');
  } catch (error) {
    console.error('❌ [SIDEBAR] Error reseteando sidebar:', error);
  }
}

// ✅ SOLUCIÓN: Función para validar estado del sidebar
function validarEstadoSidebar(estado: any): EstadoSidebar {
  // ✅ SOLUCIÓN: Validar tipos y rangos
  const estadoValidado: EstadoSidebar = {
    colapsado: Boolean(estado.colapsado),
    visible: Boolean(estado.visible),
    ancho: Math.max(200, Math.min(400, Number(estado.ancho) || 280)),
    anchoColapsado: Math.max(60, Math.min(120, Number(estado.anchoColapsado) || 80)),
    modo: ['desktop', 'mobile', 'tablet'].includes(estado.modo) ? estado.modo : 'desktop',
    transicion: Boolean(estado.transicion),
    ultimaInteraccion: estado.ultimaInteraccion || new Date().toISOString()
  };
  
  return estadoValidado;
}

// ✅ SOLUCIÓN: Función para detectar modo responsive automáticamente
export function detectarModoResponsive(): void {
  if (!browser) return;
  
  try {
    const ancho = window.innerWidth;
    let modo: 'desktop' | 'mobile' | 'tablet';
    
    if (ancho < 768) {
      modo = 'mobile';
    } else if (ancho < 1024) {
      modo = 'tablet';
    } else {
      modo = 'desktop';
    }
    
    const estadoActual = get(sidebarStore);
    if (estadoActual.modo !== modo) {
      cambiarModoSidebar(modo);
    }
  } catch (error) {
    console.warn('⚠️ [SIDEBAR] Error detectando modo responsive:', error);
  }
}

// ✅ SOLUCIÓN: Función para restaurar estado desde localStorage
export function restaurarEstadoSidebar(): void {
  if (!browser) return;
  
  try {
    const estadoGuardado = localStorage.getItem('sidebar_estado');
    if (estadoGuardado) {
      const estadoParseado = JSON.parse(estadoGuardado);
      
      // ✅ SOLUCIÓN: Validar estado guardado
      if (estadoParseado && typeof estadoParseado === 'object') {
        const estadoRestaurado = {
          ...ESTADO_INICIAL,
          ...estadoParseado
        };
        
        actualizarSidebar(estadoRestaurado, { persistir: false });
        console.log('✅ [SIDEBAR] Estado restaurado desde localStorage');
      } else {
        console.warn('⚠️ [SIDEBAR] Estado en localStorage inválido, usando inicial');
      }
    }
  } catch (error) {
    console.warn('⚠️ [SIDEBAR] Error restaurando estado desde localStorage:', error);
    localStorage.removeItem('sidebar_estado');
  }
}

// ✅ SOLUCIÓN: Función para obtener estadísticas del sidebar
export function obtenerEstadisticasSidebar(): {
  estadoActual: EstadoSidebar;
  modoResponsive: string;
  anchoEfectivo: number;
  ultimaInteraccion: string;
} {
  const estado = get(sidebarStore);
  
  return {
    estadoActual: estado,
    modoResponsive: estado.modo,
    anchoEfectivo: estado.colapsado ? estado.anchoColapsado : estado.ancho,
    ultimaInteraccion: estado.ultimaInteraccion
  };
}

// ✅ SOLUCIÓN: Inicializar sidebar desde storage si estamos en cliente
if (browser) {
  restaurarEstadoSidebar();
  
  // ✅ SOLUCIÓN: Detectar modo responsive inicial
  detectarModoResponsive();
  
  // ✅ SOLUCIÓN: Escuchar cambios de tamaño de ventana
  window.addEventListener('resize', () => {
    detectarModoResponsive();
  });
}

/*
Ejemplo de uso:

import { 
  sidebarStore, 
  alternarColapsoSidebar, 
  cambiarModoSidebar,
  estadoVisualSidebar 
} from '$lib/stores/sidebarStore';

// Para leer el estado completo:
$sidebarStore

// Para leer solo el estado visual:
$estadoVisualSidebar

// Para alternar colapso:
alternarColapsoSidebar();

// Para cambiar modo responsive:
cambiarModoSidebar('mobile');

// Para verificar si es mobile:
$sidebarResponsive.esMobile
*/
