import { useEffect, useRef, useState, useCallback } from 'react';
import type { NotaHero } from '../../../TiposProMax';
import { actualizarCancionHeroCompleta } from '../../../../../servicios/cancionesHeroService';
import { motorAudioPro } from '../../../../../Core/audio/AudioEnginePro';
import type { Seccion } from './tiposEditor';

interface Params {
  cancion: any;
  audioRef: { current: HTMLAudioElement | null };
  duracionAudio: number;
  reproduciendoLocal: boolean;
  setReproduciendoLocal: (v: boolean) => void;
  rAFLocalRef: { current: number };
  inicioLocalRef: { current: { ts: number; tick: number } | null };
  onCerrar: () => void;
  secuenciaEditada: NotaHero[];
}

export function useSeccionesModal({
  cancion, audioRef, duracionAudio, reproduciendoLocal,
  setReproduciendoLocal, rAFLocalRef, inicioLocalRef, onCerrar, secuenciaEditada,
}: Params) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionNombre, setSeccionNombre] = useState('');
  const [seccionTickInicio, setSeccionTickInicio] = useState(0);
  const [seccionTickFin, setSeccionTickFin] = useState(0);
  const [seccionCursorSeg, setSeccionCursorSeg] = useState(0);
  const [reproduciendoSeccion, setReproduciendoSeccion] = useState(false);
  const [guardandoSecciones, setGuardandoSecciones] = useState(false);
  const [duracionSegundosModal, setDuracionSegundosModal] = useState<number>(cancion?.duracion_segundos || 30);
  const [duracionGuardada, setDuracionGuardada] = useState<number>(cancion?.duracion_segundos || 30);
  const [guardandoDuracion, setGuardandoDuracion] = useState(false);
  const [mensajeGuardar, setMensajeGuardar] = useState<string | null>(null);
  const rAFSeccionRef = useRef<number>(0);

  useEffect(() => {
    if (!cancion) return;
    let secs = cancion.secciones || [];
    if (typeof secs === 'string') try { secs = JSON.parse(secs); } catch { secs = []; }
    setSecciones(Array.isArray(secs) ? [...secs] : []);
    const dur = cancion.duracion_segundos || 30;
    setDuracionSegundosModal(dur);
    setDuracionGuardada(dur);
  }, [cancion]);

  useEffect(() => {
    if (!reproduciendoSeccion) { cancelAnimationFrame(rAFSeccionRef.current); return; }
    const loop = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setSeccionCursorSeg(t);
        if (t >= (duracionAudio || duracionSegundosModal)) { setReproduciendoSeccion(false); return; }
      }
      rAFSeccionRef.current = requestAnimationFrame(loop);
    };
    rAFSeccionRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAFSeccionRef.current);
  }, [reproduciendoSeccion, duracionAudio, duracionSegundosModal, audioRef]);

  const togglePlaySeccion = useCallback(() => {
    if (!audioRef.current) return;
    if (reproduciendoSeccion) { audioRef.current.pause(); setReproduciendoSeccion(false); }
    else {
      if (reproduciendoLocal) { cancelAnimationFrame(rAFLocalRef.current); inicioLocalRef.current = null; setReproduciendoLocal(false); }
      motorAudioPro.activarContexto();
      audioRef.current.currentTime = seccionCursorSeg;
      audioRef.current.play().catch(() => {});
      setReproduciendoSeccion(true);
    }
  }, [reproduciendoSeccion, reproduciendoLocal, seccionCursorSeg, audioRef, rAFLocalRef, inicioLocalRef, setReproduciendoLocal]);

  const stopSeccion = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setReproduciendoSeccion(false); setSeccionCursorSeg(0);
  }, [audioRef]);

  const saltarSeccion = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const nuevo = Math.max(0, Math.min(duracionAudio || duracionSegundosModal, (audioRef.current.currentTime || seccionCursorSeg) + delta));
    audioRef.current.currentTime = nuevo; setSeccionCursorSeg(nuevo);
  }, [audioRef, duracionAudio, duracionSegundosModal, seccionCursorSeg]);

  const agregarSeccion = () => {
    if (!seccionNombre.trim()) return;
    setSecciones(prev => [...prev, { nombre: seccionNombre.trim(), tickInicio: seccionTickInicio, tickFin: seccionTickFin, tipo: 'melodia' }]);
    setSeccionNombre(''); setSeccionTickInicio(0); setSeccionTickFin(0);
  };

  const handleGuardarDuracion = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoDuracion(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, { duracion_segundos: duracionSegundosModal });
      setDuracionGuardada(duracionSegundosModal);
    } catch (e: any) { setMensajeGuardar('Error al guardar duración: ' + e.message); }
    finally { setGuardandoDuracion(false); }
  }, [cancion?.id, duracionSegundosModal]);

  const handleGuardarSecciones = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoSecciones(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, { secciones });
      setMensajeGuardar('Secciones guardadas');
    } catch (e: any) { setMensajeGuardar('Error al guardar secciones: ' + e.message); }
    finally { setGuardandoSecciones(false); }
  }, [cancion?.id, secciones]);

  const handleGuardar = async () => {
    try {
      await actualizarCancionHeroCompleta(cancion.id, { secuencia_json: secuenciaEditada, secciones, duracion_segundos: duracionSegundosModal });
      setDuracionGuardada(duracionSegundosModal);
      onCerrar();
    } catch (e: any) { setMensajeGuardar('Error al guardar: ' + e.message); }
  };

  const duracionCambiada = Math.abs(duracionSegundosModal - duracionGuardada) > 0.05;

  return {
    secciones, setSecciones, seccionNombre, setSeccionNombre,
    seccionTickInicio, setSeccionTickInicio, seccionTickFin, setSeccionTickFin,
    seccionCursorSeg, setSeccionCursorSeg, reproduciendoSeccion, setReproduciendoSeccion,
    guardandoSecciones, duracionSegundosModal, setDuracionSegundosModal,
    duracionGuardada, guardandoDuracion, mensajeGuardar, setMensajeGuardar,
    togglePlaySeccion, stopSeccion, saltarSeccion, agregarSeccion,
    handleGuardarDuracion, handleGuardarSecciones, handleGuardar, duracionCambiada,
  };
}
