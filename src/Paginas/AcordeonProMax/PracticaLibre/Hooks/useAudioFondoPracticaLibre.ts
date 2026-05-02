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

// Margen forward al programar el ancla. Pequeño porque HTMLAudio.currentTime es prácticamente instantáneo
// para buffers cacheados — el audio empieza a sonar dentro de 1-2 frames de un .play(). 20ms (~1 frame
// a 60fps) es el mínimo seguro: la RAF tiene tiempo de inicializarse antes de que el reloj cuente.
const MARGEN_PROGRAMACION_SEG = 0.02;

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
   * sincronización del RAF. Pensado para ser llamado en CADA click de la barra: NO destruye el audio,
   * NO crea sources nuevos, NO espera eventos asíncronos del audio (más allá del primer canplay si no
   * se había cargado todavía). En el caso normal (audio ya cacheado) este método retorna en <2ms.
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
    try { audio.currentTime = offsetSeg; } catch (_) {}

    // [SYNC DEBUG] medir si el seek se aplicó en sincrónico (HTMLAudio cacheado debería) y si el
    // evento 'seeked' coincide con offsetSeg pedido (decoder honra la posición exacta?).
    console.log('[SYNC] post-seek immediate', {
      pedido: offsetSeg,
      real: audio.currentTime,
      deltaSeg: audio.currentTime - offsetSeg,
      paused: audio.paused,
      readyState: audio.readyState,
      seeking: audio.seeking,
    });
    const onSeekedDebug = () => {
      audio.removeEventListener('seeked', onSeekedDebug);
      console.log('[SYNC] seeked event', {
        pedido: offsetSeg,
        real: audio.currentTime,
        deltaSeg: audio.currentTime - offsetSeg,
        paused: audio.paused,
      });
    };
    audio.addEventListener('seeked', onSeekedDebug);

    // Play fire-and-forget: ya estaba sonando? .play() es no-op si no estaba paused. Si estaba paused
    // o el seek causó pause interno, retomamos. NUNCA awaiteamos el evento 'playing' — eso introduce
    // jitter de 5-50ms variable según browser.
    if (audio.paused) {
      audio.play().catch(() => {});
    }

    manualPlaybackActiveRef.current = true;

    // Anchor: el caller anclará su RAF a contextStartTime. El audio empezará a sonar dentro de los
    // próximos 1-2 frames; durante esos frames el tick queda congelado en tickInicialReal y luego
    // empieza a contar al ritmo del bpm. Margen 20ms ≈ 1 frame.
    const contextStartTime = motorAudioPro.tiempoActual + MARGEN_PROGRAMACION_SEG;
    const tickInicialReal = Math.max(0, Math.floor(tickInicio));
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
