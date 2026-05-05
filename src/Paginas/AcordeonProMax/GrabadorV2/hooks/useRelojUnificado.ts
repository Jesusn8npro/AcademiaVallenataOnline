import { useCallback, useRef } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';

/**
 * Reloj único basado en AudioContext.currentTime. NO mezcla con HTMLAudio.currentTime.
 *
 * El "ancla" guarda un par (ctxTime, tick) que define la traducción tiempo↔tick. Mientras está
 * activo, `ahora()` retorna: tick = ancla.tick + (ctx.currentTime − ancla.ctxTime) × bpm/60 × resolucion.
 *
 * Tanto el reproductor como el grabador comparten el mismo reloj — esa es la diferencia clave con la
 * arquitectura vieja, que mezclaba audio.currentTime (HTMLAudio, con outputLatency aplicada) contra
 * motorAudioPro.tiempoActual (Web Audio, sin esa latencia).
 */
export interface AnclaReloj {
  ctxTime: number;
  tick: number;
}

export interface RelojUnificado {
  /** Tick actual deducido de AudioContext.currentTime + ancla. Si no hay ancla activa, retorna 0. */
  ahora(): number;
  /** Tiempo en segundos correspondiente al tick dado, asumiendo bpm+resolucion actuales. */
  tickASeg(tick: number): number;
  /** Tick correspondiente a un tiempo en segundos. */
  segATick(seg: number): number;
  /** Setea el ancla. Cualquier llamada futura a ahora() la usará. */
  anclar(ctxTime: number, tick: number): void;
  /** Suelta el ancla (ej: pause). ahora() retorna el último tick conocido. */
  liberar(): void;
  /** Cambia BPM en caliente. Ajusta el ancla para que ahora() siga retornando el mismo tick. */
  setBpm(bpm: number): void;
  setResolucion(resolucion: number): void;
  /** Indica si hay ancla activa (i.e. el tick avanza). */
  estaActivo(): boolean;
  /** Estado actual leído como ref (para closures). */
  bpmRef: React.MutableRefObject<number>;
  resolucionRef: React.MutableRefObject<number>;
  /**
   * Contador que se incrementa cada vez que `anclar` cambia el ancla. Consumidores que tengan
   * scheduling pre-programado contra el AudioContext (ej: metrónomo) lo monitorean para detectar
   * cuándo cancelar y re-schedulizar — sin esto, los clicks ya agendados con el ancla viejo
   * sonarían fuera de beat al re-anclar.
   */
  anclaVersionRef: React.MutableRefObject<number>;
  /** Devuelve el ancla actual (copia) o null si no hay. Lo usa el metrónomo para calcular
   * el AudioContext.currentTime exacto correspondiente a cada beat. */
  obtenerAncla(): AnclaReloj | null;
}

export function useRelojUnificado(bpmInicial = 120, resolucionInicial = 192): RelojUnificado {
  const bpmRef = useRef(bpmInicial);
  const resolucionRef = useRef(resolucionInicial);
  const anclaRef = useRef<AnclaReloj | null>(null);
  const tickPausadoRef = useRef(0);
  const anclaVersionRef = useRef(0);

  const factor = useCallback(() => (bpmRef.current / 60) * resolucionRef.current, []);

  const tickASeg = useCallback((tick: number) => tick / factor(), [factor]);
  const segATick = useCallback((seg: number) => seg * factor(), [factor]);

  const ahora = useCallback((): number => {
    const ancla = anclaRef.current;
    if (!ancla) return tickPausadoRef.current;
    const ctxNow = motorAudioPro.contextoAudio.currentTime;
    const elapsedSeg = Math.max(0, ctxNow - ancla.ctxTime);
    return ancla.tick + elapsedSeg * factor();
  }, [factor]);

  const anclar = useCallback((ctxTime: number, tick: number) => {
    anclaRef.current = { ctxTime, tick };
    tickPausadoRef.current = tick;
    anclaVersionRef.current++;
  }, []);

  const liberar = useCallback(() => {
    if (anclaRef.current) tickPausadoRef.current = ahora();
    anclaRef.current = null;
  }, [ahora]);

  const setBpm = useCallback((bpm: number) => {
    const clamp = Math.max(30, Math.min(300, bpm));
    if (clamp === bpmRef.current) return;
    // Re-anclar al tick actual antes de cambiar el factor para evitar saltos.
    if (anclaRef.current) {
      const tickAhora = ahora();
      bpmRef.current = clamp;
      anclaRef.current = { ctxTime: motorAudioPro.contextoAudio.currentTime, tick: tickAhora };
      anclaVersionRef.current++;
    } else {
      bpmRef.current = clamp;
    }
  }, [ahora]);

  const setResolucion = useCallback((resolucion: number) => {
    if (resolucion === resolucionRef.current) return;
    if (anclaRef.current) {
      const tickAhora = ahora();
      resolucionRef.current = resolucion;
      anclaRef.current = { ctxTime: motorAudioPro.contextoAudio.currentTime, tick: tickAhora };
      anclaVersionRef.current++;
    } else {
      resolucionRef.current = resolucion;
    }
  }, [ahora]);

  const estaActivo = useCallback(() => anclaRef.current !== null, []);
  const obtenerAncla = useCallback((): AnclaReloj | null => {
    return anclaRef.current ? { ...anclaRef.current } : null;
  }, []);

  return { ahora, tickASeg, segATick, anclar, liberar, setBpm, setResolucion, estaActivo, bpmRef, resolucionRef, anclaVersionRef, obtenerAncla };
}
