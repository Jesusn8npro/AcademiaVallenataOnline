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
  onIniciarGrabacion: (audio?: any, startTick?: number, bpmOriginal?: number) => void;
  onDetenerGrabacion: () => NotaHero[] | void;
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
  const [punchOutTickLocal, setPunchOutTickLocal] = useState<number | null>(null);
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
  const punchOutTickRef = useRef<number | null>(null);
  const notasAntesDelPunch = useRef<NotaHero[]>([]);
  const notasDespuesDelPunch = useRef<NotaHero[]>([]); // 🆕 conservar lo posterior al punch out
  const punchInTickSnapshot = useRef<number | null>(null);
  const punchOutTickSnapshot = useRef<number | null>(null); // 🆕

  // Construye el preview a partir de la secuencia grabada. Se llama tanto desde detenerEdicionPunch (síncrono,
  // recibe la secuencia FINAL del grabador con notas pendientes incluidas) como desde el useEffect de respaldo
  // (asíncrono, lee notasGrabadas del prop — que llega 1 render tarde).
  // Las notas YA traen ticks absolutos: el grabador arrancó con startTick = audio.currentTime*factor,
  // así que cada press se timestampó contra audio.currentTime. Solo merge + sort, NO re-offset.
  const construirPreview = useCallback((notas: NotaHero[]) => {
    if (punchInTickSnapshot.current === null) return;
    const punchTick = punchInTickSnapshot.current;
    const preview = [
      ...notasAntesDelPunch.current,
      ...notas,
      ...notasDespuesDelPunch.current,
    ].sort((a, b) => a.tick - b.tick);
    setSecuenciaPreview(preview);
    // Posicionar 2 compases antes del punchIn para que el usuario vea el contexto.
    const start = Math.max(0, punchTick - Math.round(2 * (bpmModal / 60) * resolucion));
    tickLocalRef.current = start;
  }, [bpmModal, resolucion, tickLocalRef]);

  // Respaldo: si por algún motivo el preview no se llenó síncrono, este useEffect lo recompone cuando llega
  // la prop notasGrabadas con el siguiente render.
  useEffect(() => {
    if (!grabandoProp && modoEdicion === 'revisando' && punchInTickSnapshot.current !== null) {
      construirPreview(notasGrabadas);
    }
  }, [grabandoProp, modoEdicion, notasGrabadas, construirPreview]);

  const iniciarEdicionPunch = useCallback(() => {
    if (punchInTickLocal === null) return;
    // Notas a conservar:
    //  - antes del punchIn → siempre
    //  - después del punchOut → solo si el usuario marcó punchOut (toma quirúrgica entre dos puntos)
    notasAntesDelPunch.current = secuenciaEditadaRef.current.filter(n => n.tick < punchInTickLocal);
    if (punchOutTickLocal !== null && punchOutTickLocal > punchInTickLocal) {
      notasDespuesDelPunch.current = secuenciaEditadaRef.current.filter(n => n.tick >= punchOutTickLocal);
    } else {
      notasDespuesDelPunch.current = [];
    }
    punchInTickSnapshot.current = punchInTickLocal;
    punchOutTickSnapshot.current = punchOutTickLocal;
    const preRollTicks = Math.round(preRollSegsLocal * (bpmModal / 60) * resolucion);
    const startTick = Math.max(0, punchInTickLocal - preRollTicks);
    tickLocalRef.current = startTick;
    inicioLocalRef.current = null;
    punchActivoRef.current = true;
    punchTickTargetRef.current = punchInTickLocal;
    punchOutTickRef.current = punchOutTickLocal;
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
    punchOutTickRef.current = null;
    setCuentaAtrasLocal(null);
    setReproduciendoLocal(false);
    audioRef.current?.pause();
    // detenerGrabacion() retorna la secuencia FINAL (incluye notas que estaban abiertas al detener);
    // construimos el preview YA, no esperamos al render que actualiza el prop notasGrabadas.
    const secuenciaFinal = onDetenerGrabacion();
    if (Array.isArray(secuenciaFinal)) construirPreview(secuenciaFinal);
    setModoEdicion('revisando');
  }, [audioRef, onDetenerGrabacion, setReproduciendoLocal, construirPreview]);

  const guardarToma = useCallback(async () => {
    if (!secuenciaPreview.length && punchInTickSnapshot.current === null) return;
    setGuardandoToma(true);
    setMensajeLocal(null);
    try {
      const merged = secuenciaPreview.length > 0
        ? secuenciaPreview
        : [
            ...notasAntesDelPunch.current,
            // notasGrabadas YA traen ticks absolutos (grabador anclado a audio.currentTime).
            ...notasGrabadas,
            ...notasDespuesDelPunch.current,
          ].sort((a, b) => a.tick - b.tick);
      onSecuenciaChange(merged);
      await actualizarCancionHeroCompleta(cancionId!, { secuencia_json: merged });
      setMensajeLocal('✅ Toma guardada correctamente');
      setTimeout(() => {
        setModoEdicion('idle');
        setPunchInTickLocal(null);
        setPunchOutTickLocal(null);
        punchInTickSnapshot.current = null;
        punchOutTickSnapshot.current = null;
        notasAntesDelPunch.current = [];
        notasDespuesDelPunch.current = [];
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
    punchOutTickSnapshot.current = null;
    notasAntesDelPunch.current = [];
    notasDespuesDelPunch.current = [];
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
    punchOutTickLocal, setPunchOutTickLocal,
    preRollSegsLocal, setPreRollSegsLocal,
    metronomoLocal, setMetronomoLocal,
    modoEdicion, setModoEdicion,
    cuentaAtrasLocal, setCuentaAtrasLocal,
    guardandoToma, mensajeLocal, setMensajeLocal,
    secuenciaPreview, setSecuenciaPreview,
    // Refs (used by parent RAF loop)
    punchActivoRef, punchTickTargetRef, punchOutTickRef,
    punchInTickSnapshot,
    // Callbacks
    iniciarEdicionPunch, detenerEdicionPunch,
    guardarToma, descartarToma, onRepetirToma,
  };
}
