import type { NotaHero } from '../../../Core/hero/tipos_Hero';

export interface SeccionV2 {
  id: string;
  nombre: string;
  tickInicio: number;
  tickFin: number;
  monedas: number;
}

export interface CancionV2 {
  id: string;
  titulo: string;
  autor: string;
  bpm: number;
  resolucion: number;
  audio_fondo_url: string | null;
  secuencia_json: NotaHero[];
  secciones: SeccionV2[];
  duracion_segundos: number | null;
  tonalidad: string | null;
  dificultad: string | null;
  tipo: string | null;
  usoMetronomo: boolean;
  creado_en?: string;
}

export type EstadoTransporte = 'detenido' | 'reproduciendo' | 'pausado' | 'grabando' | 'preroll';

export interface EventoCaptura {
  tick: number;
  tiempoSeg: number;
  botonId: string;
  accion: 'down' | 'up';
  desviacionMs: number; // signed: + = atrasada respecto al beat más cercano, − = adelantada
}

export interface RangoPunchIn {
  tickInicio: number;
  tickFin: number;
}

export type { NotaHero };
