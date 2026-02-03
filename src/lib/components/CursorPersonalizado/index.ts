/**
 * Índice de exportaciones para el sistema de cursor personalizado
 */

export { default as CursorPersonalizado } from './CursorPersonalizado.svelte';
export { GestorEfectosCursor } from './gestorEfectosCursor';
export { UtilidadesCursor } from './utilidadesCursor';

// Tipos para TypeScript
export interface ConfiguracionCursor {
  habilitado?: boolean;
  colorPrimario?: string;
  colorAccent?: string;
  tamaño?: {
    punto: number;
    anillo: number;
  };
  animaciones?: {
    velocidad: number;
    suavidad: number;
  };
  sonidos?: {
    habilitados: boolean;
    volumen: number;
  };
  efectos?: {
    ripple: boolean;
    particulas: boolean;
    magnetico: boolean;
  };
}

export interface EstadoCursor {
  posicion: { x: number; y: number };
  contexto: string;
  visible: boolean;
  presionado: boolean;
} 