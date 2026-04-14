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
 * El reproductor Hero usa motorAudioPro (reloj de AudioContext microsegundos-precisión).
 * Este hook mantiene el HTML Audio element sincronizado calculando continuamente
 * la posición esperada basada en ticks y ajustando con pequeñas correcciones.
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
  const tickAnteriorRef = useRef(0);
  const estadoPrevioPlayRef = useRef(false);
  const syncFrameRef = useRef<number>(0);
  const ultimoAjusteRef = useRef(0);

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

  // 🎵 FUNCIÓN: Calcular segundos basado en ticks
  const calcularSegundos = useCallback((tick: number, bpmActual: number): number => {
    const bps = bpmActual / 60;
    const ticksPorSegundo = bps * 192;
    return tick / ticksPorSegundo;
  }, []);

  // 🎵 SINCRONIZADOR CONTINUO: Ajusta pequeñamente cada frame
  useEffect(() => {
    if (!audioRef.current || !audioUrl || pausado) return;
    if (!reproduciendo) return;

    const syncLoop = () => {
      if (!audioRef.current || !reproduciendo || pausado) {
        if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
        return;
      }

      const tiempoEsperado = calcularSegundos(tickActual, bpm);
      const tiempoActual = audioRef.current.currentTime;
      const diferencia = Math.abs(tiempoEsperado - tiempoActual);

      // Si la diferencia es mayor a 0.1 segundos, ajusta
      // Pero no más de una vez cada 100ms para evitar saltos
      const ahora = Date.now();
      if (diferencia > 0.1 && (ahora - ultimoAjusteRef.current) > 100) {
        audioRef.current.currentTime = tiempoEsperado;
        ultimoAjusteRef.current = ahora;
      }

      syncFrameRef.current = requestAnimationFrame(syncLoop);
    };

    syncFrameRef.current = requestAnimationFrame(syncLoop);

    return () => {
      if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
    };
  }, [reproduciendo, pausado, audioUrl, bpm, tickActual, calcularSegundos]);

  // 🎵 EFECTO: Manejar play/pause
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const debeReproducir = reproduciendo && !pausado;

    if (debeReproducir && !estadoPrevioPlayRef.current) {
      const tiempoInicio = calcularSegundos(tickActual, bpm);
      audioRef.current.currentTime = tiempoInicio;
      audioRef.current.play().catch(e => console.warn('⚠️ Audio no pudo reproducirse:', e));
      ultimoAjusteRef.current = Date.now();
    } else if (!debeReproducir && estadoPrevioPlayRef.current) {
      audioRef.current.pause();
    }

    estadoPrevioPlayRef.current = debeReproducir;
  }, [reproduciendo, pausado, audioUrl, bpm, tickActual, calcularSegundos]);

  // 🎵 SINCRONIZADOR PARA SALTOS: Solo si hay salto > 10 ticks y no está reproduciendo
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (!reproduciendo && Math.abs(tickActual - tickAnteriorRef.current) > 10) {
      const tiempoSalto = calcularSegundos(tickActual, bpm);
      audioRef.current.currentTime = tiempoSalto;
      ultimoAjusteRef.current = Date.now();
    }

    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, bpm, audioUrl, calcularSegundos]);

  // 🎵 VELOCIDAD
  useEffect(() => {
    if (!audioRef.current || !bpmOriginalRef.current) return;

    const velocidad = Math.min(4, Math.max(0.1, bpm / bpmOriginalRef.current));
    audioRef.current.playbackRate = velocidad;
    (audioRef.current as any).preservesPitch = true;
  }, [bpm]);

  // 🎵 VOLUMEN
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volumen));
    }
  }, [volumen]);

  return audioRef;
};
