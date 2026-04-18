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

/**
 * Hook para sincronizar Audio HTML con el reproductor Hero.
 *
 * Estrategia: Sistema de CHECKPOINT (igual a useReproductorHero)
 * - Guarda un checkpoint (tick + tiempo de audio)
 * - Cuando el BPM cambia, solo ajusta playbackRate
 * - NO recalcula continuamente la posición esperada (eso causa saltos)
 * - Solo sincroniza cuando hay un SALTO en ticks (seek del usuario)
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
  const bpmOriginalRef = useRef(120);

  // Sistema de CHECKPOINT: Guarda tick + tiempo de audio en un momento
  const checkpointTickRef = useRef(0);
  const checkpointTimeRef = useRef(0);
  const tickAnteriorRef = useRef(0);

  const estadoPrevioPlayRef = useRef(false);
  const syncFrameRef = useRef<number>(0);

  // Crear elemento de audio una sola vez
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
  }, []);

  // Cargar URL del audio
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioUrl && audioUrl !== audioRef.current.src) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Guardar BPM original
  useEffect(() => {
    if (cancionData?.bpm) {
      bpmOriginalRef.current = cancionData.bpm;
    }
  }, [cancionData?.bpm]);

  // 🎵 FUNCIÓN: Calcular segundos basado en ticks usando BPM ORIGINAL
  // (No el BPM actual, porque el playbackRate ya maneja eso)
  const calcularSegundosDesdeCheckpoint = useCallback((tick: number, bpmOriginal: number): number => {
    const bps = bpmOriginal / 60;
    const ticksPorSegundo = bps * 192;
    return tick / ticksPorSegundo;
  }, []);

  // 🎵 EFECTO: Manejar play/pause y crear checkpoint inicial
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;
    const debeReproducir = reproduciendo && !pausado;

    // 🎧 COMPENSADOR DE LATENCIA: Sincronizar el reloj del motor cuando el audio REALMENTE empieza a sonar
    const manejarSyncAlReproducir = () => {
      console.log('🎵 Audio está sonando realmente, sincronizando motor...');
      if (typeof (window as any).sincronizarRelojConPista === 'function') {
        (window as any).sincronizarRelojConPista();
      }
    };

    if (debeReproducir && !estadoPrevioPlayRef.current) {
      // Iniciando reproducción: establecer posición inicial
      const tiempoInicio = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audio.currentTime = tiempoInicio;

      // CREAR CHECKPOINT INICIAL
      checkpointTimeRef.current = tiempoInicio;
      checkpointTickRef.current = tickActual;

      // Escuchar el inicio real del sonido para compensar latencia de buffer/primera-carga
      audio.addEventListener('playing', manejarSyncAlReproducir, { once: true });

      audio.play().catch(e => {
        console.warn('⚠️ Audio no pudo reproducirse:', e);
        audio.removeEventListener('playing', manejarSyncAlReproducir);
      });
    } else if (!debeReproducir && estadoPrevioPlayRef.current) {
      // Pausando reproducción
      audio.pause();
      audio.removeEventListener('playing', manejarSyncAlReproducir);
    }

    estadoPrevioPlayRef.current = debeReproducir;

    return () => {
      audio.removeEventListener('playing', manejarSyncAlReproducir);
    };
  }, [reproduciendo, pausado, audioUrl, calcularSegundosDesdeCheckpoint]);

  // 🎵 SINCRONIZACIÓN CON CHECKBOX: Solo sincroniza si hay SALTO en ticks
  // (Cuando el usuario hace seek, no cuando el BPM cambia)
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const diferenciaTickActual = Math.abs(tickActual - tickAnteriorRef.current);

    // Si hay un salto > 50 ticks, es un seek del usuario (funciona incluso en pausa)
    if (diferenciaTickActual > 50) {
      const tiempoSeek = calcularSegundosDesdeCheckpoint(tickActual, bpmOriginalRef.current);
      audioRef.current.currentTime = tiempoSeek;

      // Actualizar checkpoint después del seek
      checkpointTimeRef.current = tiempoSeek;
      checkpointTickRef.current = tickActual;

      console.log('🔄 Seek detectado (Audio Sync):', { tickAnterior: tickAnteriorRef.current, tickActual, tiempoSeek });
    }

    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, audioUrl, calcularSegundosDesdeCheckpoint]);

  // 🎵 MICRO-SINCRONIZACIÓN: Solo sincroniza si la diferencia es grande
  // Usa el checkpoint para detectar desincronización
  useEffect(() => {
    if (!audioRef.current || !audioUrl || pausado || !reproduciendo) return;

    const syncLoop = () => {
      if (!audioRef.current || !reproduciendo || pausado) {
        if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
        return;
      }

      // Calcular tiempo esperado desde el checkpoint
      const tiempoDesdeCheckpoint = (tickActual - checkpointTickRef.current) / ((bpmOriginalRef.current / 60) * 192);
      const tiempoEsperado = checkpointTimeRef.current + tiempoDesdeCheckpoint;
      const tiempoActual = audioRef.current.currentTime;
      const diferencia = Math.abs(tiempoEsperado - tiempoActual);

      // 🕒 COOLDOWN: Evitar corregir demasiado seguido (causa entrecortado)
      const ahoraMs = Date.now();
      const lastSync = (window as any)._lastSyncAudio || 0;

      // Si hay mucha desincronización (> 0.15s), sincronizar pero con calma
      if (diferencia > 0.15 && (ahoraMs - lastSync > 2000)) {
        console.log('🔧 Micro-sincronización:', { diferencia, tiempoEsperado, tiempoActual });
        audioRef.current.currentTime = tiempoEsperado;
        checkpointTimeRef.current = tiempoEsperado;
        checkpointTickRef.current = tickActual;
        (window as any)._lastSyncAudio = ahoraMs;
      }

      syncFrameRef.current = requestAnimationFrame(syncLoop);
    };

    syncFrameRef.current = requestAnimationFrame(syncLoop);

    return () => {
      if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
    };
  }, [reproduciendo, pausado, audioUrl, tickActual]);

  // 🎵 VELOCIDAD: Solo cambiar playbackRate cuando BPM cambia
  // Sin tocar la posición de audio (currentTime)
  useEffect(() => {
    if (!audioRef.current || !bpmOriginalRef.current) return;

    const velocidad = Math.min(4, Math.max(0.1, bpm / bpmOriginalRef.current));
    audioRef.current.playbackRate = velocidad;
    (audioRef.current as any).preservesPitch = true;

    console.log('⚡ BPM changed:', { bpm, bpmOriginal: bpmOriginalRef.current, velocidad });
  }, [bpm]);

  // 🎵 VOLUMEN
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volumen));
    }
  }, [volumen]);

  return audioRef;
};
