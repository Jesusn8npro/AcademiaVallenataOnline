import { useState, useCallback, useEffect } from 'react';
import type { NotaHero } from '../../../../Core/hero/tipos_Hero';
import { normalizarSecuenciaHero } from '../../PracticaLibre/Utilidades/SecuenciaLogic';

interface Props {
  bpm: number;
  onCambiarBpm: (v: number | ((prev: number) => number)) => void;
  logica: any;
  reproduciendo: boolean;
  pausado: boolean;
  onAlternarPausa: () => void;
  onBuscarTick: (tick: number) => void;
  onReproducirSecuencia: (cancion: any) => void;
}

export const useCancionLibreria = ({
  bpm, onCambiarBpm, logica, reproduciendo, pausado,
  onAlternarPausa, onBuscarTick, onReproducirSecuencia,
}: Props) => {
  const [bpmHero, setBpmHero] = useState(120);
  const [pistaUrl, setPistaUrl] = useState<string | null>(null);
  const [pistaFile, setPistaFile] = useState<File | null>(null);
  const [bpmGrabacion, setBpmGrabacion] = useState(120);
  const [bpmOriginalGrabacion, setBpmOriginalGrabacion] = useState(120);
  const [cancionActivaLibreria, setCancionActivaLibreria] = useState<any | null>(null);
  const [ultimaCancionLibreriaActualizada, setUltimaCancionLibreriaActualizada] = useState<any | null>(null);

  useEffect(() => {
    if (cancionActivaLibreria || reproduciendo) setBpmHero(bpm);
  }, [bpm, cancionActivaLibreria, reproduciendo]);

  const construirCancionHero = useCallback((cancionBase: any, secuenciaForzada?: NotaHero[]) => {
    const secuenciaNormalizada = secuenciaForzada
      || normalizarSecuenciaHero(cancionBase?.secuencia || cancionBase?.secuencia_json);
    return {
      ...cancionBase,
      secuencia: secuenciaNormalizada,
      secuencia_json: secuenciaNormalizada,
      bpm: cancionBase?.bpm || 120,
      tonalidad: cancionBase?.tonalidad || 'ADG',
      id: cancionBase?.id || `cancion-${Date.now()}`,
    };
  }, []);

  const prepararCancionEnEscenario = useCallback((cancionPreparada: any) => {
    const bpmCancion = cancionPreparada?.bpm || 120;
    onCambiarBpm(bpmCancion);
    setBpmHero(bpmCancion);
    setBpmGrabacion(bpmCancion);
    setBpmOriginalGrabacion(bpmCancion);
    setPistaUrl(cancionPreparada?.audio_fondo_url || null);
    setPistaFile(null);
    setCancionActivaLibreria(cancionPreparada);
    if (cancionPreparada?.tonalidad && cancionPreparada.tonalidad !== logica.tonalidadSeleccionada) {
      logica.setTonalidadSeleccionada(cancionPreparada.tonalidad);
    }
  }, [onCambiarBpm, logica]);

  const detenerReproduccionLocal = useCallback((tickDestino = 0) => {
    if (reproduciendo && !pausado) onAlternarPausa();
    onBuscarTick(Math.max(0, Math.floor(tickDestino)));
  }, [onAlternarPausa, onBuscarTick, pausado, reproduciendo]);

  const handlePistaChange = useCallback((url: string | null, archivo: File | null) => {
    setPistaUrl(url);
    setPistaFile(archivo);
  }, []);

  return {
    bpmHero, setBpmHero,
    pistaUrl, setPistaUrl,
    pistaFile, setPistaFile,
    bpmGrabacion, setBpmGrabacion,
    bpmOriginalGrabacion, setBpmOriginalGrabacion,
    cancionActivaLibreria, setCancionActivaLibreria,
    ultimaCancionLibreriaActualizada, setUltimaCancionLibreriaActualizada,
    construirCancionHero,
    prepararCancionEnEscenario,
    detenerReproduccionLocal,
    handlePistaChange,
  };
};
