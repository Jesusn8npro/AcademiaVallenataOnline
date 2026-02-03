// 🧭 UTILIDADES DE NAVEGACIÓN CENTRALIZADAS
// Evita 70+ imports duplicados de { goto } from '$app/navigation'

import { goto } from '$app/navigation';
import { browser } from '$app/environment';

/**
 * Navegación segura con verificación de browser
 * @param url - URL de destino
 * @param options - Opciones de navegación
 */
export function navegarA(url: string, options?: { replaceState?: boolean; keepFocus?: boolean }) {
  if (!browser) return;
  
  try {
    return goto(url, options);
  } catch (error) {
    console.warn('Error de navegación:', error);
    // Fallback seguro
    if (browser && window) {
      window.location.href = url;
    }
  }
}

/**
 * Navegación con sonido (para simulador-gaming)
 * @param url - URL de destino
 * @param playSoundFn - Función para reproducir sonido opcional
 */
export function navegarConSonido(url: string, playSoundFn?: () => void) {
  if (playSoundFn) {
    playSoundFn();
  }
  return navegarA(url);
}

/**
 * Navegación hacia atrás segura
 */
export function volverAtras() {
  if (!browser || !window.history.length) {
    return navegarA('/');
  }
  window.history.back();
}

/**
 * Redirección con delay (útil para mensajes de éxito)
 * @param url - URL de destino
 * @param delay - Delay en ms (default: 1500ms)
 */
export function redirigirConDelay(url: string, delay: number = 1500) {
  setTimeout(() => navegarA(url), delay);
}

/**
 * Verificar si estamos en una ruta específica
 * @param ruta - Ruta a verificar
 * @param exacta - Si debe ser coincidencia exacta
 */
export function estaEnRuta(ruta: string, exacta: boolean = false): boolean {
  if (!browser || !window.location) return false;
  
  const rutaActual = window.location.pathname;
  return exacta ? rutaActual === ruta : rutaActual.includes(ruta);
}

// Rutas comunes para evitar strings mágicos
export const RUTAS = {
  INICIO: '/',
  SIMULADOR: '/simulador-gaming',
  PANEL_ESTUDIANTE: '/panel-estudiante',
  CURSOS: '/cursos',
  PAQUETES: '/paquetes',
  COMUNIDAD: '/comunidad',
  PERFIL: '/mi-perfil',
  	ADMIN: '/panel-administracion',
  LOGIN: '/?login=true',
  LOGOUT: '/sesion_cerrada'
} as const; 