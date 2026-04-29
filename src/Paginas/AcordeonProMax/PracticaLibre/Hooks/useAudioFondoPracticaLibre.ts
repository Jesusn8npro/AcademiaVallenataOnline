import { useRef, useCallback, useEffect } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { ReproductorMP3 } from '../../../../Core/audio/ReproductorMP3';

interface UseAudioFondoProps {
  reproduciendo: boolean;
  pausado: boolean;
  bpm: number;
  tickActual: number;
  cancionData?: any;
  audioUrl?: string | null;
  volumen?: number;
}

/**
 * REWORK: ahora usa ReproductorMP3 (AudioBufferSourceNode) en lugar de HTMLAudioElement.
 * - Sin latencia variable de decoder.
 * - currentTime calculado desde AudioContext.currentTime → continuo, sin jitter.
 * - source.start(when, offset) inicia sample-accurate.
 * - Mismo AudioContext que las notas → cero drift.
 *
 * La API exterior se mantiene compatible: cargarPista, iniciarReproduccionSincronizada,
 * y audioRef.current ahora apunta a un ReproductorMP3 (compatible con HTMLAudio en
 * los métodos que setAudioSync del reproductor usa: currentTime, paused, readyState,
 * playbackRate, addEventListener para 'playing'/'pause'/'seeked').
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
  // ReproductorMP3 implementa la interfaz mínima de HTMLAudioElement que el reproductor del juego usa.
  // Tipo `any` para mantener compatibilidad con código que esperaba HTMLAudioElement (es un drop-in replacement).
  const audioRef = useRef<any>(null);
  const bpmOriginalRef = useRef(120);

  const tickAnteriorRef = useRef(0);
  const estadoPrevioPlayRef = useRef(false);

  // Cuando el caller arranca manualmente (iniciarReproduccionSincronizada), este flag evita un play() automático
  // del useEffect que duplicaría el arranque. Se libera al pausar/stop o al cambiar de canción.
  const manualPlaybackActiveRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      // Crear el reproductor de buffer en el AudioContext compartido del motor.
      audioRef.current = new ReproductorMP3(motorAudioPro.contextoAudio);
    }
  }, []);

  // Cargar la pista cuando cambia audioUrl (paralelo, no bloquea render).
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioUrl) return;
    if (audioRef.current.src === audioUrl) return;
    manualPlaybackActiveRef.current = false;
    estadoPrevioPlayRef.current = false;
    audioRef.current.cargar(audioUrl).catch(() => {});
  }, [audioUrl]);

  useEffect(() => {
    if (cancionData?.bpm) bpmOriginalRef.current = cancionData.bpm;
  }, [cancionData?.bpm]);

  // Carga + decodificación. Resuelve cuando el AudioBuffer está listo. Cache automático en ReproductorMP3.
  const cargarPista = useCallback(async (url: string | null): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!url) {
      manualPlaybackActiveRef.current = false;
      estadoPrevioPlayRef.current = false;
      return;
    }
    manualPlaybackActiveRef.current = false;
    estadoPrevioPlayRef.current = false;
    await audio.cargar(url);
  }, []);

  // Conversión tick→segundos usando BPM ORIGINAL (no el actual): playbackRate ya maneja la velocidad del usuario.
  const calcularSegundosDesdeCheckpoint = useCallback((tick: number, bpmOriginal: number): number => {
    const ticksPorSegundo = (bpmOriginal / 60) * 192;
    return tick / ticksPorSegundo;
  }, []);

  // Auto-play cuando reproduciendo cambia a true. Si el caller usó iniciarReproduccionSincronizada,
  // manualPlaybackActiveRef ya está en true y este effect no interfiere.
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    const audio = audioRef.current;
    const debeReproducir = reproduciendo && !pausado;

    if (debeReproducir && !estadoPrevioPlayRef.current) {
      if (manualPlaybackActiveRef.current) {
        estadoPrevioPlayRef.current = true;
        return;
      }
      const tiempoInicio = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audio.currentTime = tiempoInicio;
      audio.play().catch(() => {});
    } else if (!debeReproducir && estadoPrevioPlayRef.current) {
      audio.pause();
      manualPlaybackActiveRef.current = false;
    }

    estadoPrevioPlayRef.current = debeReproducir;
  }, [reproduciendo, pausado, audioUrl, calcularSegundosDesdeCheckpoint]);

  /**
   * Inicia reproducción sincronizada desde tickInicio. Con AudioBufferSourceNode el flujo es trivial:
   * 1. Asegurar buffer cargado.
   * 2. Setear currentTime = offset (instantáneo, sin seek async).
   * 3. play() — start sample-accurate.
   * 4. Devolver tickInicio EXACTO (no necesita calibrarse leyendo audio.currentTime: el inicio ES el offset pedido).
   */
  const iniciarReproduccionSincronizada = useCallback(async (
    tickInicio: number,
    opciones?: { bpmOriginal?: number; urlEsperada?: string | null }
  ): Promise<{ tickInicialReal: number }> => {
    const audio = audioRef.current;
    if (!audio) {
      return { tickInicialReal: Math.max(0, Math.floor(tickInicio)) };
    }

    // Asegurar buffer cargado (puede que el caller llamó cargarPista pero queremos defensa extra).
    const urlEsperada = opciones?.urlEsperada;
    if (urlEsperada && audio.src !== urlEsperada) {
      await audio.cargar(urlEsperada);
    } else if (!audio.cargado) {
      // Si aún se está cargando, esperar a canplaythrough con timeout.
      await new Promise<void>((resolve) => {
        if (audio.cargado) { resolve(); return; }
        let done = false;
        const finish = () => { if (done) return; done = true; resolve(); };
        const handler = () => { audio.removeEventListener('canplaythrough', handler); finish(); };
        audio.addEventListener('canplaythrough', handler);
        setTimeout(finish, 5000);
      });
    }

    if (!audio.cargado) {
      return { tickInicialReal: Math.max(0, Math.floor(tickInicio)) };
    }

    manualPlaybackActiveRef.current = true;

    const bpmOriginal = (opciones?.bpmOriginal && opciones.bpmOriginal > 0)
      ? opciones.bpmOriginal
      : (bpmOriginalRef.current || 120);
    bpmOriginalRef.current = bpmOriginal;
    const factor = (bpmOriginal / 60) * 192;
    const offsetSegundos = (tickInicio / 192) * (60 / bpmOriginal);

    // Pausar (no-op si ya paused) y posicionar en offset. Esto NO tiene seek async — es instantáneo.
    audio.pause();
    audio.currentTime = offsetSegundos;

    // play() inicia el AudioBufferSourceNode en motorAudioPro.tiempoActual con offset preciso.
    // El evento 'playing' fires en el siguiente microtask (queueMicrotask en ReproductorMP3).
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      audio.addEventListener('playing', finish);
      setTimeout(finish, 200);
      audio.play().catch(() => finish());
    });

    // Tick inicial = el offset pedido (no necesita leer audio.currentTime: el start fue sample-accurate).
    const tickInicialReal = Math.max(0, Math.floor(offsetSegundos * factor));

    tickAnteriorRef.current = tickInicialReal;
    estadoPrevioPlayRef.current = true;

    return { tickInicialReal };
  }, []);

  // Scrub: cuando tickActual diverge significativamente del último valor visto, mover el audio.
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    const diff = Math.abs(tickActual - tickAnteriorRef.current);
    if (diff > 50) {
      const tiempoSeek = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audioRef.current.currentTime = tiempoSeek;
    }
    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, audioUrl, calcularSegundosDesdeCheckpoint]);

  // playbackRate sigue al BPM transport. CRÍTICO incluir cancionData?.bpm como dependencia
  // (sin esto, al cargar canción con bpmOriginal distinto, playbackRate quedaba stale → drift).
  useEffect(() => {
    if (!audioRef.current) return;
    const bpmOrig = (cancionData?.bpm && cancionData.bpm > 0) ? cancionData.bpm : (bpmOriginalRef.current || 120);
    const velocidad = Math.min(4, Math.max(0.1, bpm / bpmOrig));
    audioRef.current.playbackRate = velocidad;
  }, [bpm, cancionData?.bpm]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volumen));
  }, [volumen]);

  return {
    audioRef,
    iniciarReproduccionSincronizada,
    cargarPista,
  };
};
