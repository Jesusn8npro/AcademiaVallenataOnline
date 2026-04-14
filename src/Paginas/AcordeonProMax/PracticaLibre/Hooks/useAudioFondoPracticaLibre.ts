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

  // Crear o obtener el elemento de audio
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
  }, []);

  // Establecer volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volumen));
    }
  }, [volumen]);

  // Actualizar URL del audio
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioUrl && audioUrl !== audioRef.current.src) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Guardar BPM original al cambiar la canción
  useEffect(() => {
    if (cancionData?.bpm) {
      bpmOriginalRef.current = cancionData.bpm;
    }
  }, [cancionData?.bpm]);

  // Sincronizar velocidad de reproducción según BPM
  useEffect(() => {
    if (!audioRef.current || !bpmOriginalRef.current) return;

    const velocidad = Math.min(4, Math.max(0.1, bpm / bpmOriginalRef.current));
    audioRef.current.playbackRate = velocidad;
  }, [bpm]);

  // Sincronizar posición del audio con tick actual
  const sincronizarAudioEnTick = useCallback((tick: number) => {
    if (!audioRef.current || !cancionData) return;

    const resolucion = cancionData.resolucion || 192;
    const bpmOriginal = bpmOriginalRef.current || 120;
    const tiempoSegundos = (tick / resolucion) * (60 / bpmOriginal);

    audioRef.current.currentTime = tiempoSegundos;
  }, [cancionData]);

  // Manejar play/pause
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const debeReproducir = reproduciendo && !pausado;

    if (debeReproducir && !estadoPrevioPlayRef.current) {
      // Sincronizar posición
      sincronizarAudioEnTick(tickActual);
      // Reproducir
      audioRef.current.play().catch(e => console.warn('⚠️ Audio no pudo reproducirse:', e));
    } else if (!debeReproducir && estadoPrevioPlayRef.current) {
      // Pausar
      audioRef.current.pause();
    }

    estadoPrevioPlayRef.current = debeReproducir;
  }, [reproduciendo, pausado, audioUrl, tickActual, sincronizarAudioEnTick]);

  // Sincronizar cuando se busca un tick (rebobinado)
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (!reproduciendo && Math.abs(tickActual - tickAnteriorRef.current) > 10) {
      sincronizarAudioEnTick(tickActual);
    }

    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, audioUrl, sincronizarAudioEnTick]);

  return audioRef;
};
