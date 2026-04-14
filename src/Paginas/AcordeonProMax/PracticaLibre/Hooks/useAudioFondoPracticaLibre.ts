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
 * Hook para sincronizar un elemento Audio HTML con el reproductor de secuencias.
 * Funciona EXACTAMENTE igual a GestorPistasHero pero para PracticaLibre.
 *
 * Key difference from naive approach:
 * - Initializes currentTime precisely when transitioning to play
 * - Only re-syncs on manual seeks (jumps > 10 ticks)
 * - Avoids continuous correction that causes drift
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

  // Crear elemento de audio una sola vez
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
  }, []);

  // Cargar URL del audio (sin reproducir aún)
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioUrl && audioUrl !== audioRef.current.src) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Guardar BPM original (del archivo de la canción grabada)
  useEffect(() => {
    if (cancionData?.bpm) {
      bpmOriginalRef.current = cancionData.bpm;
    }
  }, [cancionData?.bpm]);

  // 🎵 EFECTO PRINCIPAL: Manejar play/pause CON SINCRONIZACIÓN AL INICIAR
  // ✅ NO incluye tickActual en dependencias para evitar saltos infinitos
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const debeReproducir = reproduciendo && !pausado;

    // Si acaba de cambiar a reproducción
    if (debeReproducir && !estadoPrevioPlayRef.current) {
      // Sincronizar a la posición exacta ANTES de reproducir
      const bps = bpm / 60;
      const ticksPorSegundo = bps * 192;
      const segundosAbsolutos = tickActual / ticksPorSegundo;

      if (segundosAbsolutos < 0.05) {
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.currentTime = segundosAbsolutos;
      }

      // Reproducir
      audioRef.current.play().catch(e => console.warn('⚠️ Audio no pudo reproducirse:', e));
    }
    // Si acaba de cambiar a pausa
    else if (!debeReproducir && estadoPrevioPlayRef.current) {
      audioRef.current.pause();
    }

    estadoPrevioPlayRef.current = debeReproducir;
  }, [reproduciendo, pausado, audioUrl, bpm, tickActual]); // ✅ Incluye tickActual solo para sincronización al iniciar

  // 🎵 SINCRONIZADOR MECÁNICO: Solo para saltos manuales (> 10 ticks)
  // Esto maneja rebobinados y búsquedas mientras está en pausa
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    // Si no está reproduciendo/grabando Y hay un salto grande (> 10 ticks)
    if (!reproduciendo && !pausado && Math.abs(tickActual - tickAnteriorRef.current) > 10) {
      const bps = bpm / 60;
      const ticksPorSegundo = bps * 192;
      audioRef.current.currentTime = tickActual / ticksPorSegundo;
    }

    tickAnteriorRef.current = tickActual;
  }, [tickActual, reproduciendo, pausado, bpm, audioUrl]); // ✅ Detecta saltos aquí

  // 🎵 SINCRONIZACIÓN DE VELOCIDAD: Ajusta playbackRate según cambios de BPM
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
