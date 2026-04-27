import { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react';
import type { NotaHero } from '../../../TiposProMax';
import { actualizarCancionHeroCompleta } from '../../../../../servicios/cancionesHeroService';
import { motorAudioPro } from '../../../../../Core/audio/AudioEnginePro';

interface UsePunchInEditorArgs {
  cancionId: string | undefined;
  cancionBpm: number;
  bpmModal: number;
  resolucion: number;
  secuenciaEditadaRef: MutableRefObject<NotaHero[]>;
  notasGrabadas: NotaHero[];
  grabandoProp: boolean;
  preRollSegundos: number;
  setPreRollSegundos: (s: number) => void;
  metronomoActivo: boolean;
  setMetronomoActivo: (v: boolean) => void;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  onSecuenciaChange: (seq: NotaHero[]) => void;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  tickLocalRef: MutableRefObject<number>;
  inicioLocalRef: MutableRefObject<{ ts: number; tick: number } | null>;
  setReproduciendoLocal: (v: boolean) => void;
}

export function usePunchInEditor({
  cancionId, cancionBpm, bpmModal, resolucion, secuenciaEditadaRef, notasGrabadas,
  grabandoProp, preRollSegundos, setPreRollSegundos, metronomoActivo, setMetronomoActivo,
  onIniciarGrabacion, onDetenerGrabacion, onSecuenciaChange,
  audioRef, tickLocalRef, inicioLocalRef, setReproduciendoLocal,
}: UsePunchInEditorArgs) {
  const [punchInTickLocal, setPunchInTickLocal] = useState<number | null>(null);
  const [preRollSegsLocal, setPreRollSegsLocal] = useState(preRollSegundos || 4);
  const [metronomoLocal, setMetronomoLocal] = useState(metronomoActivo);
  const [modoEdicion, setModoEdicion] = useState<'idle' | 'preroll' | 'grabando' | 'revisando'>('idle');
  const [cuentaAtrasLocal, setCuentaAtrasLocal] = useState<number | null>(null);
  const [guardandoToma, setGuardandoToma] = useState(false);
  const [mensajeLocal, setMensajeLocal] = useState<string | null>(null);
  const [secuenciaPreview, setSecuenciaPreview] = useState<NotaHero[]>([]);

  // Refs needed by the RAF loop in the parent (passed back as return values)
  const punchActivoRef = useRef(false);
  const punchTickTargetRef = useRef<number | null>(null);
  const notasAntesDelPunch = useRef<NotaHero[]>([]);
  const punchInTickSnapshot = useRef<number | null>(null);

  // Build preview when recording ends
  useEffect(() => {
    if (!grabandoProp && modoEdicion === 'revisando' && punchInTickSnapshot.current !== null) {
      const punchTick = punchInTickSnapshot.current;
      const preview = [
        ...notasAntesDelPunch.current,
        ...notasGrabadas.map(n => ({ ...n, tick: n.tick + punchTick })),
      ].sort((a, b) => a.tick - b.tick);
      setSecuenciaPreview(preview);
      const start = Math.max(0, punchTick - Math.round(2 * (bpmModal / 60) * resolucion));
      tickLocalRef.current = start;
    }
  }, [grabandoProp, modoEdicion, notasGrabadas, bpmModal, resolucion, tickLocalRef]);

  const iniciarEdicionPunch = useCallback(() => {
    if (punchInTickLocal === null) return;
    notasAntesDelPunch.current = secuenciaEditadaRef.current.filter(n => n.tick < punchInTickLocal);
    punchInTickSnapshot.current = punchInTickLocal;
    const preRollTicks = Math.round(preRollSegsLocal * (bpmModal / 60) * resolucion);
    const startTick = Math.max(0, punchInTickLocal - preRollTicks);
    tickLocalRef.current = startTick;
    inicioLocalRef.current = null;
    punchActivoRef.current = true;
    punchTickTargetRef.current = punchInTickLocal;
    setModoEdicion('preroll');
    setCuentaAtrasLocal(Math.ceil(preRollSegsLocal));
    if (audioRef.current) {
      motorAudioPro.activarContexto();
      audioRef.current.playbackRate = Math.min(4, Math.max(0.1, bpmModal / Math.max(1, cancionBpm)));
      (audioRef.current as any).preservesPitch = true;
      audioRef.current.currentTime = (startTick / resolucion) * (60 / Math.max(1, cancionBpm));
      audioRef.current.play().catch(() => {});
    }
    setReproduciendoLocal(true);
  }, [punchInTickLocal, preRollSegsLocal, bpmModal, resolucion, secuenciaEditadaRef, cancionBpm, audioRef, tickLocalRef, inicioLocalRef, setReproduciendoLocal]);

  const detenerEdicionPunch = useCallback(() => {
    punchActivoRef.current = false;
    punchTickTargetRef.current = null;
    setCuentaAtrasLocal(null);
    setReproduciendoLocal(false);
    audioRef.current?.pause();
    onDetenerGrabacion();
    setModoEdicion('revisando');
  }, [audioRef, onDetenerGrabacion, setReproduciendoLocal]);

  const guardarToma = useCallback(async () => {
    if (!secuenciaPreview.length && punchInTickSnapshot.current === null) return;
    setGuardandoToma(true);
    setMensajeLocal(null);
    try {
      const merged = secuenciaPreview.length > 0
        ? secuenciaPreview
        : [...notasAntesDelPunch.current, ...notasGrabadas.map(n => ({ ...n, tick: n.tick + (punchInTickSnapshot.current ?? 0) }))].sort((a, b) => a.tick - b.tick);
      onSecuenciaChange(merged);
      await actualizarCancionHeroCompleta(cancionId!, { secuencia_json: merged });
      setMensajeLocal('✅ Toma guardada correctamente');
      setTimeout(() => {
        setModoEdicion('idle');
        setPunchInTickLocal(null);
        punchInTickSnapshot.current = null;
        notasAntesDelPunch.current = [];
        setSecuenciaPreview([]);
        setMensajeLocal(null);
      }, 1500);
    } catch (e: any) {
      setMensajeLocal('❌ Error: ' + e.message);
    } finally {
      setGuardandoToma(false);
    }
  }, [secuenciaPreview, notasGrabadas, onSecuenciaChange, cancionId]);

  const descartarToma = useCallback(() => {
    setModoEdicion('idle');
    punchInTickSnapshot.current = null;
    notasAntesDelPunch.current = [];
    setSecuenciaPreview([]);
    setMensajeLocal(null);
  }, []);

  const onRepetirToma = useCallback((reproduciendoLocal: boolean) => {
    if (reproduciendoLocal) setReproduciendoLocal(false);
    setModoEdicion('idle');
    setPunchInTickLocal(punchInTickSnapshot.current);
    punchInTickSnapshot.current = null;
    notasAntesDelPunch.current = [];
    setSecuenciaPreview([]);
    setMensajeLocal(null);
  }, [setReproduciendoLocal]);

  return {
    // State
    punchInTickLocal, setPunchInTickLocal,
    preRollSegsLocal, setPreRollSegsLocal,
    metronomoLocal, setMetronomoLocal,
    modoEdicion, setModoEdicion,
    cuentaAtrasLocal, setCuentaAtrasLocal,
    guardandoToma, mensajeLocal, setMensajeLocal,
    secuenciaPreview, setSecuenciaPreview,
    // Refs (used by parent RAF loop)
    punchActivoRef, punchTickTargetRef,
    punchInTickSnapshot,
    // Callbacks
    iniciarEdicionPunch, detenerEdicionPunch,
    guardarToma, descartarToma, onRepetirToma,
  };
}
