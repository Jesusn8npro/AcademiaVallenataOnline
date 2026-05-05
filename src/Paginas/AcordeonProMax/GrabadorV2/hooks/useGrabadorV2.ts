import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { EventoCaptura, NotaHero, RangoPunchIn } from '../tipos';
import type { RelojUnificado } from './useRelojUnificado';

interface NotaAbierta {
  tickInicio: number;
  fuelle: 'abriendo' | 'cerrando';
}

export interface ModoGrabacion {
  tipo: 'nuevo' | 'punch';
  /** Solo punch: rango exacto donde se mezclará la nueva grabación. */
  rango?: RangoPunchIn;
}

export interface GrabadorV2 {
  grabando: boolean;
  modo: ModoGrabacion | null;
  notasGrabadas: NotaHero[];
  ultimosEventos: EventoCaptura[];
  iniciar(modo: ModoGrabacion): void;
  detener(): NotaHero[];
  cancelar(): void;
  /** Llamar desde onNotaPresionada del acordeón. */
  capturarPress(botonId: string, fuelle: 'abriendo' | 'cerrando'): void;
  /** Llamar desde onNotaLiberada. */
  capturarRelease(botonId: string): void;
  /** Limpia el visor de eventos sin afectar la grabación. */
  limpiarVisor(): void;
}

const MAX_VISOR = 80;

function calcularDesviacionMs(tick: number, resolucion: number, bpm: number): number {
  const beatMasCercano = Math.round(tick / resolucion) * resolucion;
  const deltaTicks = tick - beatMasCercano;
  return (deltaTicks / resolucion) * (60 / bpm) * 1000;
}

export function useGrabadorV2(reloj: RelojUnificado): GrabadorV2 {
  const [grabando, setGrabando] = useState(false);
  const [modo, setModo] = useState<ModoGrabacion | null>(null);
  const [notasGrabadas, setNotasGrabadas] = useState<NotaHero[]>([]);
  // Buffer de eventos para el visor. NO disparamos setState por cada press/release — eso forzaba
  // un re-render completo del padre por cada tecla, y con presses rápidos (cambios de fuelle a
  // alta velocidad) el navegador tragaba inputs. En su lugar, escribimos al ref y un ticker
  // periódico empuja al state a ~10Hz: el visor se ve fluido y los renders bajan ~10x.
  const eventosBufferRef = useRef<EventoCaptura[]>([]);
  const eventosDirtyRef = useRef(false);
  const [ultimosEventos, setUltimosEventos] = useState<EventoCaptura[]>([]);
  const notasAbiertasRef = useRef<Map<string, NotaAbierta>>(new Map());
  const buildingRef = useRef<NotaHero[]>([]);
  const modoRef = useRef<ModoGrabacion | null>(null);
  const grabandoRef = useRef(false);

  // Flush periódico del buffer al state mientras esté grabando. startTransition marca el update
  // como baja prioridad para que los pointer events del acordeón siempre tengan precedencia.
  useEffect(() => {
    if (!grabando) return;
    const id = window.setInterval(() => {
      if (!eventosDirtyRef.current) return;
      eventosDirtyRef.current = false;
      const snapshot = eventosBufferRef.current.slice();
      startTransition(() => setUltimosEventos(snapshot));
    }, 150);
    return () => window.clearInterval(id);
  }, [grabando]);

  const iniciar = useCallback((m: ModoGrabacion) => {
    notasAbiertasRef.current.clear();
    buildingRef.current = [];
    modoRef.current = m;
    grabandoRef.current = true;
    setModo(m);
    setNotasGrabadas([]);
    eventosBufferRef.current = [];
    eventosDirtyRef.current = false;
    setUltimosEventos([]);
    setGrabando(true);
  }, []);

  const detener = useCallback((): NotaHero[] => {
    const tickAhora = Math.max(0, Math.floor(reloj.ahora()));
    // Cerrar notas abiertas con duración hasta el tick actual.
    notasAbiertasRef.current.forEach((abierta, botonId) => {
      const dur = Math.max(1, tickAhora - abierta.tickInicio);
      buildingRef.current.push({
        tick: abierta.tickInicio,
        botonId,
        duracion: dur,
        fuelle: abierta.fuelle,
      });
    });
    notasAbiertasRef.current.clear();
    const finales = [...buildingRef.current].sort((a, b) => a.tick - b.tick);
    grabandoRef.current = false;
    setGrabando(false);
    setNotasGrabadas(finales);
    return finales;
  }, [reloj]);

  const cancelar = useCallback(() => {
    notasAbiertasRef.current.clear();
    buildingRef.current = [];
    modoRef.current = null;
    grabandoRef.current = false;
    setGrabando(false);
    setModo(null);
    setNotasGrabadas([]);
    eventosBufferRef.current = [];
    eventosDirtyRef.current = false;
    setUltimosEventos([]);
  }, []);

  const empujarEvento = useCallback((ev: EventoCaptura) => {
    // Escribimos al ref directamente — el ticker del useEffect empuja al state cada 100ms.
    const next = eventosBufferRef.current.length >= MAX_VISOR
      ? [...eventosBufferRef.current.slice(eventosBufferRef.current.length - MAX_VISOR + 1), ev]
      : [...eventosBufferRef.current, ev];
    eventosBufferRef.current = next;
    eventosDirtyRef.current = true;
  }, []);

  const capturarPress = useCallback((botonId: string, fuelle: 'abriendo' | 'cerrando') => {
    if (!grabandoRef.current) return;
    const tick = Math.max(0, Math.floor(reloj.ahora()));
    const m = modoRef.current;
    // Punch-in: ignora notas fuera del rango.
    if (m?.tipo === 'punch' && m.rango) {
      if (tick < m.rango.tickInicio || tick >= m.rango.tickFin) return;
    }
    notasAbiertasRef.current.set(botonId, { tickInicio: tick, fuelle });
    const tiempoSeg = motorAudioPro.contextoAudio.currentTime;
    const desv = calcularDesviacionMs(tick, reloj.resolucionRef.current, reloj.bpmRef.current);
    empujarEvento({ tick, tiempoSeg, botonId, accion: 'down', desviacionMs: desv });
  }, [reloj, empujarEvento]);

  const capturarRelease = useCallback((botonId: string) => {
    if (!grabandoRef.current) return;
    const abierta = notasAbiertasRef.current.get(botonId);
    if (!abierta) return;
    const tick = Math.max(0, Math.floor(reloj.ahora()));
    let tickFin = tick;
    const m = modoRef.current;
    if (m?.tipo === 'punch' && m.rango) {
      if (tick > m.rango.tickFin) tickFin = m.rango.tickFin;
    }
    const dur = Math.max(1, tickFin - abierta.tickInicio);
    buildingRef.current.push({
      tick: abierta.tickInicio,
      botonId,
      duracion: dur,
      fuelle: abierta.fuelle,
    });
    notasAbiertasRef.current.delete(botonId);
    const tiempoSeg = motorAudioPro.contextoAudio.currentTime;
    const desv = calcularDesviacionMs(tickFin, reloj.resolucionRef.current, reloj.bpmRef.current);
    empujarEvento({ tick: tickFin, tiempoSeg, botonId, accion: 'up', desviacionMs: desv });
  }, [reloj, empujarEvento]);

  const limpiarVisor = useCallback(() => {
    eventosBufferRef.current = [];
    eventosDirtyRef.current = false;
    setUltimosEventos([]);
  }, []);

  return {
    grabando, modo, notasGrabadas, ultimosEventos,
    iniciar, detener, cancelar, capturarPress, capturarRelease, limpiarVisor,
  };
}
