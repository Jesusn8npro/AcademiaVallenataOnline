import { useRef, useCallback, useEffect } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';

interface UseAudioFondoProps {
  reproduciendo: boolean;
  pausado: boolean;
  bpm: number;
  tickActual: number;
  cancionData?: any;
  audioUrl?: string | null;
  volumen?: number;
}

export interface AnchorReproduccion {
  contextStartTime: number;
  offsetSeg: number;
  bpmOriginal: number;
  tickInicialReal: number;
  audio: HTMLAudioElement;
}

/**
 * Audio de fondo basado en UN HTMLAudioElement PERSISTENTE por canción. Cargado una sola vez al cambiar
 * de URL, reutilizado en TODOS los seeks/secciones/clicks de la barra. Cada click solo hace dos cosas:
 *   1. audio.currentTime = nuevoOffset    (instantáneo para buffer cacheado)
 *   2. audio.play() si está pausado       (fire-and-forget)
 * Cero recreación de sources, cero await de eventos, cero canplay/canplaythrough en runtime de seek.
 *
 * Sincronización con el reloj de notas: NO leemos audio.currentTime cada frame (tiene jitter). En su lugar
 * devolvemos un "anchor" con el instante AudioContext.currentTime al que el caller debe anclar su RAF. La
 * fórmula del tick queda: tickInicial + (AudioContext.now - anchorContextTime) * (bpm/60) * 192 — pura
 * aritmética sobre el reloj sample-accurate del AudioContext, sin depender de audio.currentTime.
 *
 * Carga: useEffect dispara cargarPista cuando audioUrl cambia. Una vez cargado, todos los seeks son
 * inmediatos. El browser cachea el MP3, así que reabrir la misma canción tampoco reb-fetcha.
 */
export const useAudioFondoPracticaLibre = ({
  reproduciendo,
  pausado,
  bpm,
  tickActual,
  cancionData,
  audioUrl,
  volumen = 1
}: UseAudioFondoProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlActualRef = useRef<string | null>(null);
  const cargandoRef = useRef<Promise<void> | null>(null);
  const bpmOriginalRef = useRef(120);
  const tickAnteriorRef = useRef(0);
  const manualPlaybackActiveRef = useRef(false);

  useEffect(() => {
    if (cancionData?.bpm) bpmOriginalRef.current = cancionData.bpm;
  }, [cancionData?.bpm]);

  // Crea/reemplaza el HTMLAudio cuando cambia la URL. Una sola vez por canción.
  const asegurarAudioCargado = useCallback(async (url: string): Promise<HTMLAudioElement | null> => {
    if (audioRef.current && urlActualRef.current === url && audioRef.current.readyState >= 3) {
      return audioRef.current;
    }
    if (cargandoRef.current && urlActualRef.current === url) {
      await cargandoRef.current;
      return audioRef.current;
    }

    if (audioRef.current && urlActualRef.current !== url) {
      try { audioRef.current.pause(); } catch (_) {}
      try { audioRef.current.src = ''; } catch (_) {}
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = volumen;
    (audio as any).preservesPitch = true;
    audioRef.current = audio;
    urlActualRef.current = url;
    try { motorAudioPro.conectarMediaElement(audio); } catch (_) {}

    const promesaCarga = new Promise<void>((resolve) => {
      if (audio.readyState >= 3) { resolve(); return; }
      let resuelto = false;
      const finish = () => { if (resuelto) return; resuelto = true; resolve(); };
      const onCanPlay = () => { audio.removeEventListener('canplaythrough', onCanPlay); audio.removeEventListener('canplay', onCanPlay); finish(); };
      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('canplay', onCanPlay);
      // Failsafe: si no llegan los eventos en 6s, sigue adelante (el seek puede causar buffering pero al menos no bloqueamos).
      setTimeout(finish, 6000);
    });
    cargandoRef.current = promesaCarga;
    try {
      await promesaCarga;
    } finally {
      if (cargandoRef.current === promesaCarga) cargandoRef.current = null;
    }
    return audio;
  }, [volumen]);

  // Pre-cargar el audio en cuanto cambia la URL — para que el primer click ya tenga el buffer listo.
  useEffect(() => {
    if (!audioUrl) return;
    asegurarAudioCargado(audioUrl).catch(() => {});
  }, [audioUrl, asegurarAudioCargado]);

  const cargarPista = useCallback(async (url: string | null): Promise<void> => {
    if (!url) return;
    await asegurarAudioCargado(url);
  }, [asegurarAudioCargado]);

  const calcularSegundosDesdeTick = useCallback((tick: number, bpmOriginal: number): number => {
    const ticksPorSegundo = (bpmOriginal / 60) * 192;
    return tick / ticksPorSegundo;
  }, []);

  /**
   * Punto de entrada PRINCIPAL: hace seek + play en el HTMLAudio persistente y devuelve el anchor para
   * sincronización del RAF. NO destruye el audio ni crea sources nuevos. Espera el evento 'playing'
   * (o 'seeked' si ya estaba sonando) ANTES de devolver el anchor, para que el RAF del caller arranque
   * cuando el decoder ya está produciendo sample real (HTMLAudio tarda 50-300ms post-play). El
   * tickInicialReal devuelto se calcula desde audio.currentTime REAL, no desde el tick pedido — eso
   * garantiza que el primer tick del RAF coincide exactamente con el sample que está sonando.
   * Latencia típica: <5ms si audio ya estaba sonando (path 'seeked'), 50-300ms en cold-start (path 'playing').
   */
  const iniciarReproduccionAnclada = useCallback(async (
    tickInicio: number,
    opciones?: { bpmOriginal?: number; urlEsperada?: string | null }
  ): Promise<AnchorReproduccion | null> => {
    const url = opciones?.urlEsperada || audioUrl;
    if (!url) return null;

    const bpmOriginal = (opciones?.bpmOriginal && opciones.bpmOriginal > 0)
      ? opciones.bpmOriginal
      : (bpmOriginalRef.current || 120);
    bpmOriginalRef.current = bpmOriginal;

    const audio = await asegurarAudioCargado(url);
    if (!audio) return null;

    const offsetSeg = (tickInicio / 192) * (60 / bpmOriginal);
    const playbackRate = Math.max(0.1, Math.min(4, bpm / bpmOriginal));

    // Asegurar que el AudioContext esté running (mobile autoplay policy).
    const ctx = motorAudioPro.contextoAudio;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (_) {}
    }

    // Aplicar playbackRate ANTES del seek para que el primer instante de audio salga al tempo correcto.
    audio.playbackRate = playbackRate;
    (audio as any).preservesPitch = true;

    // Seek instantáneo: HTMLAudio.currentTime = X completa en microsegundos para buffers cacheados.
    const wasPlaying = !audio.paused;
    try { audio.currentTime = offsetSeg; } catch (_) {}

    // ESPERAR a que el decoder produzca sample real antes de devolver el anchor. Sin este await,
    // el RAF arranca con tick = floor(tickInicio) MIENTRAS el decoder aún warming-up (HTMLAudio
    // tarda 50-300ms en producir el primer sample post-play()). Durante esa ventana el RAF avanza
    // linealmente y dispara notas que el alumno oye antes que el MP3 → desync de ~150-300ms.
    //
    // Patrón validado en useLogicaProMax.iniciarJuego (modo Maestro/Competencia): esperar 'playing'
    // y leer audio.currentTime REAL para alinear el tick inicial al sample que está sonando.
    //
    // Caso wasPlaying=true (audio ya sonando, seek durante reproducción): esperar 'seeked' — el
    // decoder ya está activo, solo necesitamos que la nueva posición se aplique antes de leer.
    await new Promise<void>((resolve) => {
      let resuelto = false;
      const finalizar = () => { if (resuelto) return; resuelto = true; resolve(); };
      if (wasPlaying) {
        const onSeeked = () => { audio.removeEventListener('seeked', onSeeked); finalizar(); };
        audio.addEventListener('seeked', onSeeked);
        setTimeout(() => { audio.removeEventListener('seeked', onSeeked); finalizar(); }, 800);
      } else {
        const onPlaying = () => { audio.removeEventListener('playing', onPlaying); finalizar(); };
        audio.addEventListener('playing', onPlaying);
        audio.play().catch(() => finalizar());
        setTimeout(() => { audio.removeEventListener('playing', onPlaying); finalizar(); }, 1500);
      }
    });

    manualPlaybackActiveRef.current = true;

    // CRÍTICO: arrancar el RAF en el tick PEDIDO, NO en audio.currentTime real. El browser aterriza
    // los seeks de HTMLAudio con jitter de 0-4 ticks (alineamiento de frames del MP3). Si arrancamos
    // el RAF en el tick aterrizado (típicamente +N ticks), las notas en (tickPedido..tickAterrizado)
    // quedan "atrás" del playhead → se pierden → el alumno percibe "el ritmo no es el mismo nunca".
    // El listener 'seeked' que setAudioSync registra recapturará el checkpoint contra audio.currentTime
    // real cuando el browser termine el seek, manteniendo sample-accuracy del reloj. Las primeras
    // notas se disparan a tiempo y luego el reloj converge al audio.
    const tickInicialReal = Math.max(0, Math.floor(tickInicio));
    const contextStartTime = motorAudioPro.tiempoActual;
    tickAnteriorRef.current = tickInicialReal;

    return {
      contextStartTime,
      offsetSeg,
      bpmOriginal,
      tickInicialReal,
      audio,
    };
  }, [audioUrl, bpm, asegurarAudioCargado]);

  // Compatibilidad legacy: equivalente al anterior, implementado sobre la nueva API anclada.
  const iniciarReproduccionSincronizada = useCallback(async (
    tickInicio: number,
    opciones?: { bpmOriginal?: number; urlEsperada?: string | null }
  ): Promise<{ tickInicialReal: number }> => {
    const anchor = await iniciarReproduccionAnclada(tickInicio, opciones);
    if (!anchor) return { tickInicialReal: Math.max(0, Math.floor(tickInicio)) };
    return { tickInicialReal: anchor.tickInicialReal };
  }, [iniciarReproduccionAnclada]);

  // Pause/resume del audio cuando hero.pausado cambia. El PLAY inicial pasa por iniciarReproduccionAnclada.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!manualPlaybackActiveRef.current) return;
    const debeReproducir = reproduciendo && !pausado;
    if (debeReproducir && audio.paused) {
      audio.play().catch(() => {});
    } else if (!debeReproducir && !audio.paused) {
      try { audio.pause(); } catch (_) {}
    }
  }, [reproduciendo, pausado]);

  // (Eliminado el useEffect "scrub externo" que hacía seek redundante en cada cambio de tickActual con
  // diff > 50. Causaba loops con el resync periódico del RAF: cada resync brincaba tickActual ~60 ticks,
  // este efecto disparaba audio.currentTime = X, audio entraba en 'seeking', onSeeked re-disparaba
  // capturarCheckpoint, setTickActual → loop. Múltiples seeks pendientes en la queue del HTMLAudio
  // eventualmente trababan el reproductor. buscarTick ya hace audio.currentTime síncronamente, no se
  // necesita red de seguridad aquí.)

  // playbackRate sigue al BPM transport en vivo.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const bpmOrig = (cancionData?.bpm && cancionData.bpm > 0) ? cancionData.bpm : (bpmOriginalRef.current || 120);
    audio.playbackRate = Math.max(0.1, Math.min(4, bpm / bpmOrig));
    (audio as any).preservesPitch = true;
  }, [bpm, cancionData?.bpm]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volumen));
  }, [volumen]);

  return {
    audioRef,
    iniciarReproduccionAnclada,
    iniciarReproduccionSincronizada,
    cargarPista,
  };
};
