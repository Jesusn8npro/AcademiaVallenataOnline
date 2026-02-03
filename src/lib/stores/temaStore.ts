import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Store global para el modo oscuro
export const modoOscuro = writable<boolean>(false);

// Función para inicializar el tema
export function inicializarTema() {
  if (!browser) return;
  
  try {
    // Verificar localStorage
    const savedTheme = localStorage.getItem('modo-oscuro');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = savedTheme === 'true' || (!savedTheme && prefersDark);
    
    aplicarTema(isDark);
    modoOscuro.set(isDark);
  } catch (error) {
    console.warn('Error al inicializar tema:', error);
  }
}

// Función para aplicar el tema
export function aplicarTema(dark: boolean) {
  if (!browser) return;
  
  try {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.warn('Error al aplicar tema:', error);
  }
}

// Función para toggle del modo oscuro
export function toggleModoOscuro() {
  if (!browser) return;
  
  modoOscuro.update(isDark => {
    const newValue = !isDark;
    aplicarTema(newValue);
    
    try {
      localStorage.setItem('modo-oscuro', newValue.toString());
    } catch (error) {
      console.warn('Error al guardar tema:', error);
    }
    
    return newValue;
  });
} 