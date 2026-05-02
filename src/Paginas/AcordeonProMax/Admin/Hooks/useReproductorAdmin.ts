import { useState, useRef, useCallback, useEffect } from 'react';
import type { NotaHero } from '../../../../Core/hero/tipos_Hero';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';

/**
 * Reproductor INDEPENDIENTE para EstudioAdmin. No comparte código con useReproductorHero.
 *
 * Principio: el HTMLAudioElement es la ÚNICA fuente de verdad para el tiempo. El RAF lee
 * audio.currentTime cada frame y dispara las notas en su tick correspondiente. No hay
 * AudioContext math, no hay resync periódico, no hay listeners de 'playing'/'seeked'/'pause'
 * para resincronizar checkpoints. Sin esos, no hay race conditions.
 *
 * Manejo del seek:
 *   - audio.currentTime = X → audio.seeking = true durante 1-3 frames (o más si bufferea).
 *   - Mientras seeking, el RAF muestra el "tick objetivo" (lo que pidió el usuario) y NO dispara
 *     notas ni lee audio.currentTime.
 *   - Cuando seeking termina, RAF retoma leyendo audio.currentTime — para entonces ya devuelve
 *     la posición correcta.
 *
 * Manejo del play inicial:
 *   - El audio puede tardar 30-150ms entre play() y el primer sample sonado.
 *   - El RAF NO dispara notas hasta que audio.currentTime > 0.05 (audio realmente arrancó).
 *   - Esto evita que la secuencia se adelante al MP3.
 */

interface UseReproductorAdminParams {
  audio: HTMLAudioElement | null;
  cancion: any | null;
  bpmTransport: number;
  logica: any;
}

interface NotaActiva {
  endTick: number;
  instancias: any[];
  botonId: string;
}

const RESOLUCION = 192;
const MAX_DELTA_FRAME_TICKS = 100;

export function useReproductorAdmin({
  audio,
  cancion,
  bpmTransport,
  logica,
}: UseReproductorAdminParams) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tickActual, setTickActual] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);

  const ultimoTickRef = useRef(0);
  const tickObjetivoSeekRef = useRef<number | null>(null);
  const animFrameRef = useRef(0);
  const notasActivasRef = useRef<Map<string, NotaActiva>>(new Map());
  const secuenciaRef = useRef<NotaHero[]>([]);
  const bpmOriginalRef = useRef(120);

  const cancionRef = useRef<any | null>(null);

  // Mantener cancion + secuencia + bpmOriginal sincronizados (sin re-crear callbacks).
  useEffect(() => {
    cancionRef.current = cancion;
    if (!cancion) {
      secuenciaRef.current = [];
      setTotalTicks(0);
      return;
    }
    let secuencia = cancion.secuencia || cancion.secuencia_json || cancion.secuencia_hero;
    if (typeof secuencia === 'string') {
      try { secuencia = JSON.parse(secuencia); } catch { secuencia = []; }
    }
    if (!Array.isArray(secuencia)) secuencia = [];
    const ordenada = [...secuencia].sort((a, b) => a.tick - b.tick);
    secuenciaRef.current = ordenada;
    bpmOriginalRef.current = Number(cancion.bpm) || 120;
    const ultimaNota = ordenada[ordenada.length - 1];
    setTotalTicks(ultimaNota ? ultimaNota.tick + ultimaNota.duracion : 0);
  }, [cancion]);

  const ticksDeAudio = useCallback((segundos: number) => {
    return segundos * (bpmOriginalRef.current / 60) * RESOLUCION;
  }, []);

  const segundosDeTick = useCallback((tick: number) => {
    return (tick / RESOLUCION) * (60 / bpmOriginalRef.current);
  }, []);

  const detenerNotasActivas = useCallback(() => {
    notasActivasRef.current.forEach((info) => {
      info.instancias.forEach((inst: any) => {
        if (motorAudioPro) {
          try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
        }
      });
      try { logica.actualizarBotonActivo(info.botonId, 'remove', null, true); } catch (_) {}
    });
    notasActivasRef.current.clear();
    if (motorAudioPro) {
      try { motorAudioPro.detenerTodo(); } catch (_) {}
    }
  }, [logica]);

  const dispararNotasEnRango = useCallback((tickInicio: number, tickFin: number) => {
    if (tickFin <= tickInicio) return;
    const secuencia = secuenciaRef.current;
    for (const nota of secuencia) {
      if (nota.tick < tickInicio) continue;
      if (nota.tick >= tickFin) break;
      const llave = `${nota.botonId}_${nota.tick}`;
      if (notasActivasRef.current.has(llave)) continue;
      try {
        const dir = (nota.fuelle === 'abriendo' || nota.fuelle === 'halar') ? 'halar' : 'empujar';
        if (logica.setDireccion) logica.setDireccion(dir);
        const result = logica.reproduceTono ? logica.reproduceTono(nota.botonId) : null;
        const instancias = result?.instances || [];
        logica.actualizarBotonActivo(nota.botonId, 'add', instancias, false);
        notasActivasRef.current.set(llave, {
          endTick: nota.tick + nota.duracion,
          instancias,
          botonId: nota.botonId,
        });
      } catch (_) { /* ignorar errores individuales de notas */ }
    }
  }, [logica]);

  const cerrarNotasTerminadas = useCallback((tickActualReal: number) => {
    notasActivasRef.current.forEach((info, llave) => {
      if (tickActualReal >= info.endTick) {
        info.instancias.forEach((inst: any) => {
          if (motorAudioPro) {
            try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
          }
        });
        try { logica.actualizarBotonActivo(info.botonId, 'remove', null, false); } catch (_) {}
        notasActivasRef.current.delete(llave);
      }
    });
  }, [logica]);

  const detener = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    detenerNotasActivas();
    if (audio) {
      try { audio.pause(); } catch (_) {}
    }
    setReproduciendo(false);
    setPausado(false);
    ultimoTickRef.current = 0;
    tickObjetivoSeekRef.current = null;
    setTickActual(0);
  }, [audio, detenerNotasActivas]);

  const loop = useCallback(() => {
    const audioActual = audio;
    if (!audioActual) {
      animFrameRef.current = 0;
      return;
    }

    if (audioActual.seeking) {
      // Mostrar tick objetivo, no leer audio.currentTime (devuelve valor stale durante seek).
      if (tickObjetivoSeekRef.current !== null) {
        setTickActual(Math.floor(tickObjetivoSeekRef.current));
      }
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    // Salimos de seeking: limpiar tick objetivo, ultimoTick a la posición real del audio.
    if (tickObjetivoSeekRef.current !== null) {
      const tickFromAudio = ticksDeAudio(audioActual.currentTime);
      ultimoTickRef.current = isFinite(tickFromAudio) && tickFromAudio >= 0 ? tickFromAudio : 0;
      tickObjetivoSeekRef.current = null;
    }

    // Audio aún no arrancó (latencia de play): congelar el tick.
    if (audioActual.paused || audioActual.currentTime < 0.05 || !isFinite(audioActual.currentTime)) {
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const tickAhora = ticksDeAudio(audioActual.currentTime);
    if (!isFinite(tickAhora) || tickAhora < 0) {
      animFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const delta = tickAhora - ultimoTickRef.current;
    if (delta > 0 && delta < MAX_DELTA_FRAME_TICKS) {
      // Forward natural: disparar notas en el rango.
      dispararNotasEnRango(ultimoTickRef.current, tickAhora);
    }
    // Si delta es ≥ MAX_DELTA_FRAME_TICKS o negativo: salto (post-seek o anomalía); NO disparar bulk.

    cerrarNotasTerminadas(tickAhora);
    ultimoTickRef.current = tickAhora;
    setTickActual(Math.floor(tickAhora));

    // Final de canción
    const ultimaNota = secuenciaRef.current[secuenciaRef.current.length - 1];
    const tickFin = ultimaNota ? ultimaNota.tick + ultimaNota.duracion + RESOLUCION : 0;
    if (tickFin > 0 && tickAhora > tickFin) {
      detener();
      return;
    }

    animFrameRef.current = requestAnimationFrame(loop);
  }, [audio, ticksDeAudio, dispararNotasEnRango, cerrarNotasTerminadas, detener]);

  const aplicarPlaybackRate = useCallback(() => {
    if (!audio) return;
    const rate = Math.max(0.1, Math.min(4, bpmTransport / Math.max(1, bpmOriginalRef.current)));
    try {
      audio.playbackRate = rate;
      (audio as any).preservesPitch = true;
    } catch (_) {}
  }, [audio, bpmTransport]);

  const play = useCallback(async (tickInicio = 0) => {
    if (!audio || !cancionRef.current) return;

    detenerNotasActivas();

    aplicarPlaybackRate();

    const segundos = Math.max(0, segundosDeTick(tickInicio));
    try { audio.currentTime = segundos; } catch (_) {}

    ultimoTickRef.current = tickInicio;
    tickObjetivoSeekRef.current = tickInicio;
    setTickActual(Math.floor(tickInicio));

    // Asegurar AudioContext running (mobile autoplay policy).
    try {
      const ctx = motorAudioPro?.contextoAudio;
      if (ctx && ctx.state !== 'running') await ctx.resume();
    } catch (_) {}

    try {
      await audio.play();
    } catch (e) {
      console.warn('[useReproductorAdmin] audio.play() falló:', e);
      return;
    }

    setReproduciendo(true);
    setPausado(false);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(loop);
  }, [audio, segundosDeTick, aplicarPlaybackRate, detenerNotasActivas, loop]);

  const alternarPausa = useCallback(() => {
    if (!audio) return;
    if (audio.paused) {
      aplicarPlaybackRate();
      audio.play().catch(() => {});
      setPausado(false);
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    } else {
      try { audio.pause(); } catch (_) {}
      detenerNotasActivas();
      setPausado(true);
    }
  }, [audio, aplicarPlaybackRate, detenerNotasActivas, loop]);

  const buscarTick = useCallback((tick: number) => {
    if (!audio || typeof tick !== 'number' || isNaN(tick)) return;
    const tickClamp = Math.max(0, Math.floor(tick));
    const segundos = Math.max(0, segundosDeTick(tickClamp));

    detenerNotasActivas();

    try { audio.currentTime = segundos; } catch (_) {}

    tickObjetivoSeekRef.current = tickClamp;
    ultimoTickRef.current = tickClamp;
    setTickActual(tickClamp);

    // Si el RAF estaba detenido (canción terminó o cargada sin play), no lo arrancamos solos.
    // Solo retomamos el RAF si hay reproducción activa.
    if (animFrameRef.current === 0 && !audio.paused) {
      animFrameRef.current = requestAnimationFrame(loop);
    }
  }, [audio, segundosDeTick, detenerNotasActivas, loop]);

  // playbackRate sigue al BPM del transport en vivo.
  useEffect(() => {
    aplicarPlaybackRate();
  }, [aplicarPlaybackRate]);

  // Limpieza en desmontaje.
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
      notasActivasRef.current.forEach((info) => {
        info.instancias.forEach((inst: any) => {
          if (motorAudioPro) {
            try { motorAudioPro.detener(inst, 0.05); } catch (_) {}
          }
        });
      });
      notasActivasRef.current.clear();
    };
  }, []);

  return {
    reproduciendo,
    pausado,
    tickActual,
    totalTicks,
    play,
    alternarPausa,
    buscarTick,
    detener,
  };
}
