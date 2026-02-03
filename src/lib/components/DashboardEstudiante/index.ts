// Exportaciones del Dashboard de Estudiante
export { default as TarjetaEstadistica } from './TarjetaEstadistica.svelte';
export { default as ProgresCircular } from './ProgresCircular.svelte';
export { default as TarjetaCursoProgreso } from './TarjetaCursoProgreso.svelte';

// Tipos útiles
export interface EstadisticasDashboard {
  cursosInscritos: number;
  cursosCompletados: number;
  horasAprendizaje: number;
  certificadosObtenidos: number;
  rachaEstudio: number;
  progresoGeneral: number;
}

export interface CursoProgreso {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  slug: string;
  porcentaje_completado: number;
  ultima_leccion_titulo?: string;
  tiempo_estimado?: string;
  instructor?: string;
  categoria?: string;
  tipo?: 'curso' | 'tutorial';
}

export interface MetasSemanales {
  horasObjetivo: number;
  horasCompletadas: number;
  diasEstudio: number;
  porcentajeCompletado: number;
}

export interface ActividadReciente {
  id: string;
  tipo: 'leccion' | 'curso' | 'tutorial' | 'simulador';
  titulo: string;
  curso?: string;
  fecha: string;
  progreso: number;
} 