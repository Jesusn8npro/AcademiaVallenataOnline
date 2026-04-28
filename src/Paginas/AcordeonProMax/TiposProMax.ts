/**
 * ACORDEÓN PRO MAX — Tipos y Constantes
 * ────────────────────────────────────
 * Define todas las interfaces, tipos y valores constantes del ecosistema Pro Max.
 * Este archivo independiza al simulador de la carpeta AcordeonHero.
 */

import type { CancionHero, NotaHero, DireccionFuelle } from '../../Core/hero/tipos_Hero';
export type { CancionHero, NotaHero, DireccionFuelle };

// ─── Estados del juego ──────────────────────────────────────────────────────

/** Posibles estados del flujo de juego */
export type EstadoJuego =
  | 'seleccion'
  | 'practica_libre'   // Acordeón libre sin canción ni scoring
  | 'configurando'
  | 'contando'
  | 'jugando'
  | 'pausado'           // Pausa manual del usuario (ESC/Espacio)
  | 'pausado_synthesia' // Pausa interna de Synthesia esperando nota
  | 'resultados'
  | 'gameOver';

/**
 * Modo de práctica seleccionado por el jugador:
 *  · ninguno      → Modo competitivo normal (puntos, vida, multiplicador)
 *  · libre        → Sin penalización de vida, practica tranquilo
 *  · synthesia    → El reproductor pausa en cada nota hasta que el alumno la toque
 *  · maestro_solo → Un solo acordeón centrado, transporte completo (rewind, BPM, play/pause)
 */
export type ModoPractica = 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo';

/** Comportamiento del audio de referencia en Synthesia */
export type ModoAudioSynthesia = 'solo_notas' | 'maestro';

/** Calidad de un golpe del alumno */
export type ResultadoGolpe = 'perfecto' | 'bien' | 'fallada' | 'perdida';

// ─── Interfaces ─────────────────────────────────────────────────────────────

/**
 * Canción extendida con campo de tonalidad y youtube_id.
 */
export interface CancionHeroConTonalidad extends CancionHero {
  tonalidad?: string;
  youtube_id?: string;
  slug?: string;
}

/** Estadísticas acumuladas durante una partida */
export interface EstadisticasPartida {
  puntos: number;
  notasPerfecto: number;
  notasBien: number;
  notasFalladas: number;
  notasPerdidas: number;
  rachaActual: number;
  rachaMasLarga: number;
  multiplicador: number;
  vida: number;
}

/**
 * Efecto visual temporal al golpear una nota.
 */
export interface EfectoGolpe {
  id: string;
  resultado: ResultadoGolpe;
  x: number;
  y: number;
  creado: number; // timestamp ms
}

// ─── Constantes de gameplay ──────────────────────────────────────────────────

/**
 * Ticks de anticipación: cuántos ticks antes del tick de la nota
 * sale la bola del Maestro.
 */
export const TICKS_VIAJE = 384;

/** Ventana para "Perfecto" (±ms) */
export const VENTANA_PERFECTO_MS = 60;

/** Ventana para "Bien" (±ms) */
export const VENTANA_BIEN_MS = 120;

/** Puntos base por nota perfecta */
export const PUNTOS_PERFECTO = 100;

/** Puntos base por nota bien */
export const PUNTOS_BIEN = 50;

/** Notas correctas consecutivas para subir el multiplicador */
export const RACHA_PARA_MULTIPLICADOR = 10;

/** Multiplicador máximo */
export const MULTIPLICADOR_MAXIMO = 4;

// ─── Paleta de colores ───────────────────────────────────────────────────────

/** Color de sombra/brillo de la bola viajera según hilera */
export const COLORES_SOMBRA_HILERA: Record<number, string> = {
  1: '#00f5ff',
  2: '#a3ff00',
  3: '#ff9500',
};

/** Color cuando la nota es abriendo (halar) — azul */
export const COLOR_ABRIENDO = '#3b82f6';

/** Color cuando la nota es cerrando (empujar) — rojo */
export const COLOR_CERRANDO = '#ef4444';

// ─── Utilidades ──────────────────────────────────────────────────────────────

/** Convierte ticks a milisegundos */
export function ticksAMs(ticks: number, bpm: number, res = 192): number {
  return (ticks / res) * (60_000 / bpm);
}

/** Convierte milisegundos a ticks */
export function msATicks(ms: number, bpm: number, res = 192): number {
  return (ms / (60_000 / bpm)) * res;
}

/** Vida que se consume al fallar notas */
export const DANO_FALLADA = 2;   
export const DANO_PERDIDA = 1;   

/** Estadísticas vacías al iniciar una partida */
export const ESTADISTICAS_INICIALES: EstadisticasPartida = {
  puntos: 0,
  notasPerfecto: 0,
  notasBien: 0,
  notasFalladas: 0,
  notasPerdidas: 0,
  rachaActual: 0,
  rachaMasLarga: 0,
  multiplicador: 1,
  vida: 100,
};

/** Calcula el porcentaje de precisión (notas perfectas y buenas) */
export function calcularPrecision(notasPerfecto: number, notasBien: number, notasFalladas: number, notasPerdidas: number): number {
  const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;
  if (totalNotas === 0) return 0;
  return Math.round(((notasPerfecto + notasBien) / totalNotas) * 100);
}

// ─── Secciones jugables ──────────────────────────────────────

/**
 * Estado persistido por sección de una canción para un usuario.
 * Coincide con el shape almacenado en `monedas_cancion_usuario.secciones_progreso[seccion_id]`.
 */
export interface EstadoSeccionUsuario {
  intentos: number;
  mejor_precision: number;
  completada: boolean;
  monedas_ganadas: number;
  primer_completado_en: string | null;
  seccion_nombre?: string | null;
}

/** Estado de una sección con sus campos de UI calculados. */
export interface SeccionConEstado {
  id: string;
  nombre: string;
  tickInicio: number;
  tickFin: number;
  tipo: 'melodia' | 'acompanamiento';
  monedas: number;
  disponible: boolean;
  completada: boolean;
  intentos: number;
  mejorPrecision: number;
  monedasGanadas: number;
  intentosRestantesParaMoneda: number;
  primerCompletadoEn: string | null;
}

/** Configuración a nivel canción para el flujo de secciones. */
export interface ConfigSeccionesCancion {
  desbloqueoSecuencial: boolean;
  umbralPrecisionSeccion: number;
  intentosParaMoneda: number;
}
