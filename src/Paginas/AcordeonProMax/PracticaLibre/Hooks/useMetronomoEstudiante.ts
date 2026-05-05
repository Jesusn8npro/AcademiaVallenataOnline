import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import {
  programarClickMetronomo, detenerClickProgramado,
  type ClickProgramadoMetronomo, type SonidoMetronomo, type MetronomoComun,
} from '../../../../Core/audio/metronomoSonidos';

/**
 * Metrónomo simple para Práctica Libre. A diferencia de `useMetronomoV2` (admin), acá NO hay
 * `useRelojUnificado` con anclaje sample-accurate al MP3 — el estudiante solo necesita un
 * pulso constante mientras graba "modo metrónomo". El scheduler avanza con un contador de
 * clicks `proximoClickIdx` y un `ctxTimeBase` (instante en que se activó); cualquier cambio
 * en `bpm`/`subdivision` recalcula el siguiente click sin re-anclar.
 *
 * Reusa el sintetizador de clicks (`programarClickMetronomo`) y la interfaz `MetronomoComun`
 * de `Core/audio/metronomoSonidos.ts` → mismo sonido y mismo panel UI que el admin.
 */

const LOOKAHEAD_SEG = 0.1;
const SCHEDULE_INTERVAL_MS = 25;

export function useMetronomoEstudiante(): MetronomoComun {
  const [activo, setActivoState] = useState(false);
  const [bpm, setBpmState] = useState(120);
  const [compas, setCompas] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [volumen, setVolumen] = useState(0.5);
  const [sonido, setSonido] = useState<SonidoMetronomo>('Baqueta');
  const [pulsoActual, setPulsoActual] = useState(-1);

  const bpmRef = useRef(bpm);
  const compasRef = useRef(compas);
  const subdivisionRef = useRef(subdivision);
  const volumenRef = useRef(volumen);
  const sonidoRef = useRef(sonido);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { compasRef.current = compas; }, [compas]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);
  useEffect(() => { volumenRef.current = volumen; }, [volumen]);
  useEffect(() => { sonidoRef.current = sonido; }, [sonido]);

  // Si bpm o subdivision cambian con el metrónomo activo, descartamos clicks pre-programados —
  // sus tiempos eran contra los valores viejos y caerían fuera de beat.
  const reanclaSolicitadaRef = useRef(false);
  useEffect(() => { reanclaSolicitadaRef.current = true; }, [bpm, subdivision]);

  const programadosRef = useRef<ClickProgramadoMetronomo[]>([]);
  const ctxTimeBaseRef = useRef(0);
  const proximoClickIdxRef = useRef(0);
  const tickerRef = useRef<number>(0);

  const cancelarProgramados = useCallback(() => {
    programadosRef.current.forEach(p => detenerClickProgramado(p));
    programadosRef.current = [];
  }, []);

  const scheduler = useCallback(() => {
    if (!activo) return;
    const ctx = motorAudioPro.contextoAudio;
    const ctxNow = ctx.currentTime;
    const horizonteCtx = ctxNow + LOOKAHEAD_SEG;

    if (reanclaSolicitadaRef.current) {
      cancelarProgramados();
      ctxTimeBaseRef.current = ctxNow;
      proximoClickIdxRef.current = 0;
      reanclaSolicitadaRef.current = false;
    }

    const subdiv = subdivisionRef.current;
    const compasV = compasRef.current;
    const segPorClick = 60 / (bpmRef.current * subdiv);

    // Limpiar programados que ya pasaron.
    programadosRef.current = programadosRef.current.filter(p => p.ctxTime > ctxNow - 0.05);

    while (true) {
      const idx = proximoClickIdxRef.current;
      const ctxClick = ctxTimeBaseRef.current + idx * segPorClick;
      if (ctxClick > horizonteCtx) break;
      if (ctxClick < ctxNow - 0.005) {
        proximoClickIdxRef.current++;
        continue;
      }

      const totalClicksPorCompas = compasV * subdiv;
      const esFirstBeat = (idx % totalClicksPorCompas) === 0;
      const esSubdivision = (idx % subdiv) !== 0;
      const target = Math.max(ctxNow, ctxClick);
      const programado = programarClickMetronomo(
        target, esFirstBeat, esSubdivision, sonidoRef.current, volumenRef.current,
      );
      if (programado) programadosRef.current.push(programado);

      // Pulso visual (solo en beats principales, no subdivs).
      if (!esSubdivision) {
        const beatInBar = Math.floor(idx / subdiv) % compasV;
        const delayMs = Math.max(0, (target - ctxNow) * 1000);
        window.setTimeout(() => setPulsoActual(beatInBar), delayMs);
      }

      proximoClickIdxRef.current++;
    }
  }, [activo, cancelarProgramados]);

  useEffect(() => {
    if (!activo) {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = 0;
      }
      cancelarProgramados();
      proximoClickIdxRef.current = 0;
      setPulsoActual(-1);
      return;
    }
    motorAudioPro.activarContexto();
    ctxTimeBaseRef.current = motorAudioPro.contextoAudio.currentTime;
    proximoClickIdxRef.current = 0;
    reanclaSolicitadaRef.current = false;
    scheduler(); // primer disparo inmediato
    tickerRef.current = window.setInterval(scheduler, SCHEDULE_INTERVAL_MS);
    return () => {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = 0;
      }
      cancelarProgramados();
    };
  }, [activo, scheduler, cancelarProgramados]);

  const setActivo = useCallback((v: boolean) => setActivoState(v), []);
  const setBpm = useCallback((v: number) => {
    setBpmState(Math.max(20, Math.min(300, Math.round(v))));
  }, []);

  return {
    activo, setActivo,
    bpm, setBpm,
    compas, setCompas,
    subdivision, setSubdivision,
    volumen, setVolumen,
    sonido, setSonido,
    pulsoActual,
  };
}
