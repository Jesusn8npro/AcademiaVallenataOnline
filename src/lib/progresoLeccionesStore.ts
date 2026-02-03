import { writable } from 'svelte/store';

// Store global para el progreso de lecciones/partes
// El store ahora acepta objetos de progreso detallado por contenido (curso o tutorial)
export const progresoLecciones = writable<Record<string, {
  partes_completadas?: number;
  total_partes?: number;
  progreso?: number;
  [key: string]: any;
}>>({});
