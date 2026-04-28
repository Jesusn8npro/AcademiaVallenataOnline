import { useRef, useCallback, useEffect } from 'react';

interface UseAudioFondoProps {
  reproduciendo: boolean;
  pausado: boolean;
  bpm: number;
  tickActual: number;
  cancionData?: any;
  audioUrl?: string | null;
  volumen?: number;
}

// Sincroniza HTMLAudio con el reproductor Hero por CHECKPOINT (tick + tiempo). El BPM ajusta playbackRate;
// no se recalcula posición continuamente (causaría saltos), solo en seeks del usuario.
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
  const bpmOriginalRef = useRef(120);

  const checkpointTickRef = useRef(0);
  const checkpointTimeRef = useRef(0);
  const tickAnteriorRef = useRef(0);

  const estadoPrevioPlayRef = useRef(false);
  const syncFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (audioUrl && audioUrl !== audioRef.current.src) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    if (cancionData?.bpm) bpmOriginalRef.current = cancionData.bpm;
  }, [cancionData?.bpm]);

  // Usa BPM original (no el actual): playbackRate ya maneja la velocidad del usuario.
  const calcularSegundosDesdeCheckpoint = useCallback((tick: number, bpmOriginal: number): number => {
    const bps = bpmOriginal / 60;
    const ticksPorSegundo = bps * 192;
    return tick / ticksPorSegundo;
  }, []);

  // Cuando el caller arranca manualmente (iniciarReproduccionSincronizada), este flag evita un audio.play() automático
  // que duplicaría el arranque. Se libera al pausar/stop.
  const manualPlaybackActiveRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;
    const debeReproducir = reproduciendo && !pausado;

    const manejarSyncAlReproducir = () => {
      if (typeof (window as any).sincronizarRelojConPista === 'function') {
        (window as any).sincronizarRelojConPista();
      }
    };

    if (debeReproducir && !estadoPrevioPlayRef.current) {
      if (manualPlaybackActiveRef.current) {
        estadoPrevioPlayRef.current = true;
        return;
      }
      const tiempoInicio = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audio.currentTime = tiempoInicio;
      checkpointTimeRef.current = tiempoInicio;
      checkpointTickRef.current = tickActual;
      audio.addEventListener('playing', manejarSyncAlReproducir, { once: true });
      audio.play().catch(e => {
        audio.removeEventListener('playing', manejarSyncAlReproducir);
      });
    } else if (!debeReproducir && estadoPrevioPlayRef.current) {
      audio.pause();
      audio.removeEventListener('playing', manejarSyncAlReproducir);
      manualPlaybackActiveRef.current = false;
    }

    estadoPrevioPlayRef.current = debeReproducir;

    return () => { audio.removeEventListener('playing', manejarSyncAlReproducir); };
  }, [reproduciendo, pausado, audioUrl, calcularSegundosDesdeCheckpoint]);

  // Patrón "wait for 'playing'" (igual a useLogicaProMax.dispararJuegoSincronizado): bufferear → seek → play → leer
  // tick real para devolverlo como override del reproductor. Sin esto, RAF y MP3 arrancan desfasados.
  const iniciarReproduccionSincronizada = useCallback(async (
    tickInicio: number,
    opciones?: { bpmOriginal?: number }
  ): Promise<{ tickInicialReal: number }> => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      return { tickInicialReal: Math.max(0, Math.floor(tickInicio)) };
    }

    manualPlaybackActiveRef.current = true;

    // bpmOriginal explícito porque el ref puede estar STALE cuando el caller acaba de cambiar la canción —
    // un bpm incorrecto produce un offset de seek erróneo en tickInicio > 0.
    const bpmOriginal = (opciones?.bpmOriginal && opciones.bpmOriginal > 0)
      ? opciones.bpmOriginal
      : (bpmOriginalRef.current || 120);
    bpmOriginalRef.current = bpmOriginal;
    const factor = (bpmOriginal / 60) * 192;
    const offsetSegundos = (tickInicio / 192) * (60 / bpmOriginal);

    // Step 1: bufferear (canplaythrough, fallback canplay@3s, arrancar igual @4.5s).
    await new Promise<void>((resolve) => {
      if (audio.readyState >= 4) { resolve(); return; }
      let resolved = false;
      const finish = () => { if (resolved) return; resolved = true; resolve(); };
      const onCanPlayThrough = () => {
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        finish();
      };
      audio.addEventListener('canplaythrough', onCanPlayThrough);
      setTimeout(() => {
        if (resolved) return;
        if (audio.readyState >= 3) {
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          finish();
        }
      }, 3000);
      setTimeout(() => {
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        finish();
      }, 4500);
    });

    // Step 2: seek.
    if (Math.abs(audio.currentTime - offsetSegundos) > 0.01) {
      await new Promise<void>((resolve) => {
        let resolved = false;
        const finish = () => { if (resolved) return; resolved = true; resolve(); };
        const onSeeked = () => {
          audio.removeEventListener('seeked', onSeeked);
          finish();
        };
        audio.addEventListener('seeked', onSeeked, { once: true });
        try { audio.currentTime = offsetSegundos; } catch (_) { finish(); }
        setTimeout(finish, 1500);
      });
    }

    // Step 3: play + esperar 'playing'.
    await new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => { if (resolved) return; resolved = true; resolve(); };
      audio.addEventListener('playing', finish, { once: true });
      setTimeout(finish, 1500);
      audio.play().catch(() => finish());
    });

    // Step 4: calibrar tick. Sección (>0) usa audioTickPos directo (snap dejaba audio adelantado → notas atrasadas).
    // Intro (=0) snapea a 0 si <64 ticks (~200ms a 100bpm) para no saltar un downbeat en tick 0.
    const audioTickPos = Math.max(0, Math.floor(audio.currentTime * factor));
    const tickInicialReal = tickInicio > 0
      ? audioTickPos
      : (audioTickPos < 64 ? 0 : audioTickPos);

    checkpointTimeRef.current = audio.currentTime;
    checkpointTickRef.current = tickInicialReal;
    tickAnteriorRef.current = tickInicialReal;
    estadoPrevioPlayRef.current = true;

    return { tickInicialReal };
  }, [audioUrl]);

  // Detecta scrub del usuario (>50 ticks) y reposiciona el audio. Después del 'seeked' recalibra el reloj global
  // (sincronizarRelojConPista) para que el RAF no quede adelantado mientras el audio termina de bufferear.
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const diferenciaTickActual = Math.abs(tickActual - tickAnteriorRef.current);

    if (diferenciaTickActual > 50) {
      const audio = audioRef.current;
      const tiempoSeek = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audio.currentTime = tiempoSeek;
      checkpointTimeRef.current = tiempoSeek;
      checkpointTickRef.current = tickActual;

      const onSeekedScrub = () => {
        audio.removeEventListener('seeked', onSeekedScrub);
        if (typeof (window as any).sincronizarRelojConPista === 'function') {
          (window as any).sincronizarRelojConPista(tickActual);
        }
      };
      audio.addEventListener('seeked', onSeekedScrub, { once: true });
    }

    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, audioUrl, calcularSegundosDesdeCheckpoint]);

  // Solo corrige drift catastrófico (>1s, ej: tab dormido). El loop antiguo modulaba ±8% playbackRate sobre 0.04s
  // y producía wobble audible — innecesario porque iniciarReproduccionSincronizada deja audio+reloj alineados.
  useEffect(() => {
    if (!audioRef.current || !audioUrl || pausado || !reproduciendo) return;

    const syncLoop = () => {
      if (!audioRef.current || !reproduciendo || pausado) {
        if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
        return;
      }

      const audio = audioRef.current;

      // Si el audio está seekeando, no corregir drift: currentTime es transitorio y un seek encima glitchea el audio.
      if (audio.seeking) {
        syncFrameRef.current = requestAnimationFrame(syncLoop);
        return;
      }

      const tiempoDesdeCheckpoint = (tickActual - checkpointTickRef.current) / ((bpmOriginalRef.current / 60) * 192);
      const tiempoEsperado = checkpointTimeRef.current + tiempoDesdeCheckpoint;
      const tiempoActual = audio.currentTime;
      const diferencia = tiempoEsperado - tiempoActual;

      const velocidadBase = Math.min(4, Math.max(0.1, bpm / bpmOriginalRef.current));
      const ahoraMs = Date.now();
      const lastSync = (window as any)._lastSyncAudio || 0;

      if (Math.abs(diferencia) > 1.0 && ahoraMs - lastSync > 3000) {
        audio.currentTime = tiempoEsperado;
        audio.playbackRate = velocidadBase;
        checkpointTimeRef.current = tiempoEsperado;
        checkpointTickRef.current = tickActual;
        (window as any)._lastSyncAudio = ahoraMs;
      } else if (Math.abs(audio.playbackRate - velocidadBase) > 0.001) {
        audio.playbackRate = velocidadBase;
      }

      syncFrameRef.current = requestAnimationFrame(syncLoop);
    };

    syncFrameRef.current = requestAnimationFrame(syncLoop);

    return () => { if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current); };
  }, [reproduciendo, pausado, audioUrl, tickActual, bpm]);

  // Re-checkpoint al cambiar BPM evita drift acumulado en slow-practice prolongado.
  useEffect(() => {
    if (!audioRef.current || !bpmOriginalRef.current) return;

    const velocidad = Math.min(4, Math.max(0.1, bpm / bpmOriginalRef.current));
    audioRef.current.playbackRate = velocidad;
    (audioRef.current as any).preservesPitch = true;

    if (reproduciendo && !pausado) {
      checkpointTimeRef.current = audioRef.current.currentTime;
      checkpointTickRef.current = tickActual;
    }
  }, [bpm]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volumen));
  }, [volumen]);

  return {
    audioRef,
    iniciarReproduccionSincronizada,
  };
};
