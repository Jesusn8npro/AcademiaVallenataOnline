import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import {
  programarClickMetronomo, detenerClickProgramado,
  type ClickProgramadoMetronomo, type SonidoMetronomo, type MetronomoComun,
} from '../../../../Core/audio/metronomoSonidos';
import type { RelojUnificado } from './useRelojUnificado';

/**
 * Metrónomo profesional sincronizado al `useRelojUnificado`. Replica las features del metrónomo
 * de Studio Admin (compás, subdivisión, efecto de sonido, volumen, pulso visual) PERO calcula los
 * ctxTime de cada click desde el ancla del reloj — así el metrónomo queda sample-accurate con
 * la grabación y con la reproducción posterior. Si grabaste a 120 BPM con subdivisión 2 y al
 * reproducir el reloj se ancla al mismo punto, los clicks caen exactamente sobre las mismas notas.
 *
 * Diferencia clave vs el `useMetronomo` viejo (SimuladorApp): aquel mantenía su propio `pulseCount`
 * y `nextNoteTime` desacoplados del reloj. Si hacías seek, los clicks quedaban desfasados. Acá
 * derivamos el siguiente click desde el tick actual del reloj cada frame del scheduler, así un
 * seek o un re-ancla nuevo NO desincroniza el metrónomo.
 *
 * El sintetizador de cada click vive en `Core/audio/metronomoSonidos.ts` y se reusa también en
 * `useMetronomoEstudiante` (PracticaLibre).
 */

// Reexports para no romper imports existentes (PanelMetronomoStudio).
export type SonidoMetronomoV2 = SonidoMetronomo;
export { SONIDOS_METRONOMO } from '../../../../Core/audio/metronomoSonidos';

const LOOKAHEAD_SEG = 0.1;
const SCHEDULE_INTERVAL_MS = 25;

export type MetronomoV2 = MetronomoComun;

export function useMetronomoV2(reloj: RelojUnificado): MetronomoV2 {
  const [activo, setActivoState] = useState(false);
  const [bpmState, setBpmState] = useState(reloj.bpmRef.current);
  const [compas, setCompas] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [volumen, setVolumen] = useState(0.5);
  const [sonido, setSonido] = useState<SonidoMetronomo>('Baqueta');
  const [pulsoActual, setPulsoActual] = useState(-1);

  const compasRef = useRef(compas);
  const subdivisionRef = useRef(subdivision);
  const volumenRef = useRef(volumen);
  const sonidoRef = useRef(sonido);
  useEffect(() => { compasRef.current = compas; }, [compas]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);
  useEffect(() => { volumenRef.current = volumen; }, [volumen]);
  useEffect(() => { sonidoRef.current = sonido; }, [sonido]);

  // ⚠ `useRelojUnificado` retorna un objeto NUEVO en cada render del padre. Si lo dejamos como
  // dep del `scheduler` o del `useEffect`, ambos se re-crean en cada render → el cleanup mata
  // los clicks pre-programados → el metrónomo se silencia durante grabación (mucha re-render
  // activity). Solución: leer el reloj siempre vía ref. Mismo patrón que en PaginaGrabadorV2.
  const relojRef = useRef(reloj);
  useEffect(() => { relojRef.current = reloj; }, [reloj]);

  const setBpm = useCallback((bpm: number) => {
    const clamp = Math.max(20, Math.min(300, Math.round(bpm)));
    relojRef.current.setBpm(clamp);
    setBpmState(clamp);
  }, []);

  // Si el bpm del reloj cambia desde afuera (slider de la página), reflejarlo acá.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (relojRef.current.bpmRef.current !== bpmState) setBpmState(relojRef.current.bpmRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [bpmState]);

  const programadosRef = useRef<ClickProgramadoMetronomo[]>([]);
  const proximoClickIdxRef = useRef(0);
  const ultimaAnclaVersionRef = useRef(-1);
  const tickerRef = useRef<number>(0);

  const cancelarProgramados = useCallback(() => {
    programadosRef.current.forEach(p => detenerClickProgramado(p));
    programadosRef.current = [];
  }, []);

  const programarClick = useCallback((ctxTime: number, esFirstBeat: boolean, esSubdivision: boolean) => {
    return programarClickMetronomo(ctxTime, esFirstBeat, esSubdivision, sonidoRef.current, volumenRef.current);
  }, []);

  const scheduler = useCallback(() => {
    if (!activo) return;
    const r = relojRef.current;
    const ctx = motorAudioPro.contextoAudio;
    const ctxNow = ctx.currentTime;
    const horizonteCtx = ctxNow + LOOKAHEAD_SEG;

    // Si el reloj NO tiene ancla (modo libre, sin reproducción ni grabación), anclar al instante
    // actual para que el metrónomo arranque con beat 0 = ctxNow.
    if (!r.estaActivo()) r.anclar(ctxNow, 0);

    // Si el ancla cambió (reproductor hizo play/seek), descartar clicks pre-programados — sus
    // tiempos son contra el ancla vieja y van a sonar fuera de beat. Recalcular desde la nueva.
    const v = r.anclaVersionRef.current;
    if (v !== ultimaAnclaVersionRef.current) {
      cancelarProgramados();
      ultimaAnclaVersionRef.current = v;
      // Forzar recálculo del próximo click: marcamos -1 y abajo lo recalculamos desde tick actual.
      proximoClickIdxRef.current = -1;
    }

    const ancla = r.obtenerAncla();
    if (!ancla) return;

    const bpm = r.bpmRef.current;
    const resolucion = r.resolucionRef.current;
    const subdiv = subdivisionRef.current;
    const compasV = compasRef.current;
    const ticksPorClick = resolucion / subdiv;
    const segPorTick = 60 / (bpm * resolucion);
    const tickAhora = r.ahora();

    // Recalcular proximoClickIdx si se reseteó.
    if (proximoClickIdxRef.current < 0) {
      proximoClickIdxRef.current = Math.max(0, Math.ceil(tickAhora / ticksPorClick - 1e-6));
    }

    // Limpiar programados que ya pasaron.
    programadosRef.current = programadosRef.current.filter(p => p.ctxTime > ctxNow - 0.05);

    while (true) {
      const idx = proximoClickIdxRef.current;
      const tickClick = idx * ticksPorClick;
      const ctxClick = ancla.ctxTime + (tickClick - ancla.tick) * segPorTick;
      if (ctxClick > horizonteCtx) break;
      if (ctxClick < ctxNow - 0.005) {
        proximoClickIdxRef.current++;
        continue;
      }

      const totalClicksPorCompas = compasV * subdiv;
      const esFirstBeat = (idx % totalClicksPorCompas) === 0;
      const esSubdivision = (idx % subdiv) !== 0;
      const target = Math.max(ctxNow, ctxClick);
      const programado = programarClick(target, esFirstBeat, esSubdivision);
      if (programado) programadosRef.current.push(programado);

      // Actualizar pulsoActual UI cuando suene este click (solo en beats principales, no subdivs).
      if (!esSubdivision) {
        const beatInBar = Math.floor(idx / subdiv) % compasV;
        const delayMs = Math.max(0, (target - ctxNow) * 1000);
        window.setTimeout(() => setPulsoActual(beatInBar), delayMs);
      }

      proximoClickIdxRef.current++;
    }
  }, [activo, programarClick, cancelarProgramados]);

  useEffect(() => {
    if (!activo) {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = 0;
      }
      cancelarProgramados();
      proximoClickIdxRef.current = 0;
      ultimaAnclaVersionRef.current = -1;
      setPulsoActual(-1);
      return;
    }
    motorAudioPro.activarContexto();
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

  return {
    activo, setActivo,
    bpm: bpmState, setBpm,
    compas, setCompas,
    subdivision, setSubdivision,
    volumen, setVolumen,
    sonido, setSonido: (s: SonidoMetronomo) => setSonido(s),
    pulsoActual,
  };
}
