import { motorAudioPro } from './AudioEnginePro';

/**
 * Catálogo de sonidos de metrónomo + sintetizador de un click individual.
 *
 * Uso: cualquier hook de metrónomo (admin reloj-aware o estudiante simple) llama a
 * `programarClickMetronomo(ctxTime, ...)` para schedular un click en un instante exacto del
 * AudioContext. El motor de sonido es el mismo en los dos lados → el alumno escucha
 * exactamente el mismo metrónomo que el admin probó al grabar.
 */

export type SonidoMetronomo =
  | 'Electrónico' | 'Madera' | 'Aplausos' | 'Campana 1' | 'Campana 2'
  | 'Tono' | 'Silencioso' | 'Baqueta';

export const SONIDOS_METRONOMO: SonidoMetronomo[] = [
  'Baqueta', 'Electrónico', 'Madera', 'Aplausos', 'Campana 1', 'Campana 2', 'Tono', 'Silencioso',
];

export interface ClickProgramadoMetronomo {
  ctxTime: number;
  osc: OscillatorNode | null;
  envelope: GainNode | null;
}

/** Programa un oscilador para que dispare en `ctxTime`. Si `sonido === 'Silencioso'` retorna null. */
export function programarClickMetronomo(
  ctxTime: number,
  esFirstBeat: boolean,
  esSubdivision: boolean,
  sonido: SonidoMetronomo,
  volumen: number,
): ClickProgramadoMetronomo | null {
  if (sonido === 'Silencioso') return null;
  const ctx = motorAudioPro.contextoAudio;
  const osc = ctx.createOscillator();
  const envelope = ctx.createGain();

  let freq = esFirstBeat ? 1000 : 500;
  let type: OscillatorType = 'sine';
  let decay = 0.04;

  switch (sonido) {
    case 'Electrónico': freq = esFirstBeat ? 1200 : 600; type = 'square'; break;
    case 'Madera':      freq = esFirstBeat ?  800 : 400; type = 'triangle'; break;
    case 'Baqueta':     freq = esFirstBeat ? 1500 : 1000; type = 'sine'; break;
    case 'Tono':        freq = esFirstBeat ?  440 : 330; decay = 0.2; break;
    case 'Campana 1':   freq = esFirstBeat ? 2000 : 1500; decay = 0.3; break;
    case 'Campana 2':   freq = esFirstBeat ? 2600 : 2000; decay = 0.3; break;
    case 'Aplausos':    freq = esFirstBeat ?  800 :  600; type = 'sawtooth'; decay = 0.06; break;
  }

  if (esSubdivision) { freq *= 0.8; decay *= 0.5; }

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctxTime);
  envelope.gain.setValueAtTime(volumen, ctxTime);
  envelope.gain.exponentialRampToValueAtTime(0.0001, ctxTime + decay);
  osc.connect(envelope);
  envelope.connect(ctx.destination);
  osc.start(ctxTime);
  osc.stop(ctxTime + decay + 0.01);

  return { ctxTime, osc, envelope };
}

export function detenerClickProgramado(p: ClickProgramadoMetronomo): void {
  try { p.osc?.stop(); } catch (_) {}
  try { p.osc?.disconnect(); } catch (_) {}
  try { p.envelope?.disconnect(); } catch (_) {}
}

/** Interfaz común que exponen los hooks de metrónomo (admin y estudiante). El componente
 *  `PanelMetronomoStudio` consume esta interfaz para no acoplarse a una implementación. */
export interface MetronomoComun {
  activo: boolean;
  setActivo(v: boolean): void;
  bpm: number;
  setBpm(bpm: number): void;
  compas: number;
  setCompas(c: number): void;
  subdivision: number;
  setSubdivision(s: number): void;
  volumen: number;
  setVolumen(v: number): void;
  sonido: SonidoMetronomo;
  setSonido(s: SonidoMetronomo): void;
  /** Pulso actual dentro del compás (0..compas-1), -1 si no está activo. */
  pulsoActual: number;
}
