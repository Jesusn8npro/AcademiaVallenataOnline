/**
 * TIPOS DE DATOS - ACORDEÓN HERO
 * Este archivo define el estándar de comunicación entre la Web y el ESP32.
 * Todo en español para fácil entendimiento.
 */

export type DireccionFuelle = 'abriendo' | 'cerrando';

export interface NotaHero {
  tick: number;        // Momento exacto de la nota (basado en el pulso musical)
  botonId: string;     // ID del botón físico o virtual
  duracion: number;    // Cuánto tiempo se mantuvo presionada (en ticks)
  fuelle: DireccionFuelle; // Dirección del aire
}

export interface CancionHero {
  id?: string;
  titulo: string;
  autor: string;
  descripcion?: string;
  bpm: number;           // Velocidad de la canción (Beats per Minute)
  resolucion: number;    // Ticks por cada pulso (estándar: 192)
  audioFondoUrl?: string; // Opcional para secuencias puras
  audioMaestroUrl?: string; // Opcional para secuencias puras
  secuencia: NotaHero[]; // La lista de todas las notas grabadas
  usoMetronomo?: boolean; // Saber si se grabó con el metrónomo prendido
  dificultad: 'basico' | 'intermedio' | 'profesional';
  tipo: 'secuencia' | 'tutorial' | 'ejercicio'; // Clasificación clara
  creado_en?: string;
}
