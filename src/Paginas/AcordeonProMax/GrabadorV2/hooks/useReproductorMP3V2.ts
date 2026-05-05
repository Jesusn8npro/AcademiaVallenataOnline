import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { ReproductorMP3 } from '../../../../Core/audio/ReproductorMP3';
import type { RelojUnificado } from './useRelojUnificado';

/**
 * Reproductor MP3 sample-accurate anclado al mismo reloj del grabador.
 *
 * Usa `programarReproduccion(offsetSeg, ctxNow + LEAD)` para arrancar exactamente en `ctxNow + LEAD` con
 * el sample en `offsetSeg`. En el mismo instante, ancla el reloj a (ctxNow + LEAD, tickInicio). De esa
 * forma reproductor y grabador comparten el mismo cero.
 */
const LEAD_SEG = 0.12;

export interface ReproductorMP3V2 {
  cargado: boolean;
  cargando: boolean;
  duracionSeg: number;
  reproduciendo: boolean;
  cargar(url: string): Promise<void>;
  /** Inicia reproducción desde el tick dado. Asíncrono porque hace resume() del AudioContext. */
  play(tickInicio?: number): Promise<void>;
  pause(): void;
  detener(): void;
  seek(tick: number): void;
  /** Lee el currentTime del reproductor (sample-accurate). */
  leerCurrentTime(): number;
  setVolumen(v: number): void;
  /** Cambia la velocidad de reproducción del MP3 (1 = original). preservesPitch automático. */
  setPlaybackRate(v: number): void;
}

export function useReproductorMP3V2(reloj: RelojUnificado): ReproductorMP3V2 {
  const reproRef = useRef<ReproductorMP3 | null>(null);
  const [cargado, setCargado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [duracionSeg, setDuracionSeg] = useState(0);

  // Lazy init: se crea con el AudioContext del motor (compartido — clock unificado).
  const obtener = useCallback((): ReproductorMP3 => {
    if (!reproRef.current) {
      reproRef.current = new ReproductorMP3(motorAudioPro.contextoAudio);
    }
    return reproRef.current;
  }, []);

  useEffect(() => () => {
    try { reproRef.current?.destruir(); } catch (_) {}
    reproRef.current = null;
  }, []);

  const cargar = useCallback(async (url: string) => {
    if (!url) {
      setCargado(false);
      setDuracionSeg(0);
      return;
    }
    const repro = obtener();
    setCargando(true);
    try {
      await repro.cargar(url);
      setCargado(repro.cargado);
      setDuracionSeg(repro.duration);
    } finally {
      setCargando(false);
    }
  }, [obtener]);

  const play = useCallback(async (tickInicio = 0) => {
    const repro = obtener();
    // Resume del AudioContext antes de cualquier scheduling. Sin esto, en la primera invocación
    // el contexto puede estar suspendido (autoplay policy) y el buffer agendado nunca llega al
    // destination hasta el siguiente resume — el usuario "no escucha la pista".
    await motorAudioPro.activarContexto();

    if (!repro.cargado) {
      // Sin pista: solo ancla el reloj a 'ahora' con el tick pedido (modo a capela).
      reloj.anclar(motorAudioPro.contextoAudio.currentTime, Math.max(0, tickInicio));
      setReproduciendo(true);
      return;
    }
    const ctxNow = motorAudioPro.contextoAudio.currentTime;
    const startCtx = ctxNow + LEAD_SEG;
    const offsetSeg = reloj.tickASeg(Math.max(0, tickInicio));
    const ok = repro.programarReproduccion(offsetSeg, startCtx);
    if (ok) {
      reloj.anclar(startCtx, Math.max(0, tickInicio));
      setReproduciendo(true);
    } else {
      // Fallback: ancla a ctxNow.
      reloj.anclar(ctxNow, Math.max(0, tickInicio));
      setReproduciendo(true);
    }
  }, [obtener, reloj]);

  const pause = useCallback(() => {
    const repro = reproRef.current;
    try { repro?.pause(); } catch (_) {}
    reloj.liberar();
    setReproduciendo(false);
  }, [reloj]);

  const detener = useCallback(() => {
    const repro = reproRef.current;
    try { repro?.pause(); } catch (_) {}
    if (repro) {
      try { repro.currentTime = 0; } catch (_) {}
    }
    reloj.liberar();
    setReproduciendo(false);
  }, [reloj]);

  const seek = useCallback((tick: number) => {
    const tickClamp = Math.max(0, tick);
    const repro = reproRef.current;
    const wasPlaying = reproduciendo;
    if (repro && repro.cargado) {
      try { repro.currentTime = reloj.tickASeg(tickClamp); } catch (_) {}
    }
    if (wasPlaying) {
      // Re-arrancar anclado en el nuevo tick para mantener sincronía.
      void play(tickClamp);
    } else {
      // Pausado: solo actualiza el tick pausado del reloj.
      reloj.anclar(motorAudioPro.contextoAudio.currentTime, tickClamp);
      reloj.liberar();
    }
  }, [reproduciendo, reloj, play]);

  const leerCurrentTime = useCallback(() => {
    return reproRef.current?.currentTime ?? 0;
  }, []);

  const setVolumen = useCallback((v: number) => {
    const repro = reproRef.current;
    if (repro) repro.volume = Math.max(0, Math.min(1, v));
  }, []);

  const setPlaybackRate = useCallback((v: number) => {
    const repro = reproRef.current;
    if (repro) repro.playbackRate = Math.max(0.25, Math.min(2.5, v));
  }, []);

  return { cargado, cargando, duracionSeg, reproduciendo, cargar, play, pause, detener, seek, leerCurrentTime, setVolumen, setPlaybackRate };
}
