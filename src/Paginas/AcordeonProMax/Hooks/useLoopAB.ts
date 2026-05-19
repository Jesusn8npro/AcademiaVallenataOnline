import { useState, useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';

type LoopABState = { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean };

const LOOP_INICIAL: LoopABState = { start: 0, end: 0, activo: false, hasStart: false, hasEnd: false };

interface UseLoopABProps {
  tickActualRef: MutableRefObject<number>;
  setLoopPoints: (start: number, end: number, activo: boolean) => void;
  buscarTick: (tick: number) => void;
  sincronizarAudioFondoEnTick: (tick: number) => void;
}

export function useLoopAB({ tickActualRef, setLoopPoints, buscarTick, sincronizarAudioFondoEnTick }: UseLoopABProps) {
  const [loopAB, setLoopAB] = useState<LoopABState>(LOOP_INICIAL);
  const loopABRef = useRef<LoopABState>(LOOP_INICIAL);

  const actualizarLoopAB = useCallback((next: LoopABState) => {
    loopABRef.current = next;
    setLoopAB(next);
  }, []);

  const marcarLoopInicio = useCallback(() => {
    const inicio = Math.max(0, Math.floor(tickActualRef.current));
    setLoopPoints(0, 0, false);
    actualizarLoopAB({ start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false });
  }, [actualizarLoopAB, setLoopPoints, tickActualRef]);

  const marcarLoopFin = useCallback(() => {
    const finActual = Math.max(0, Math.floor(tickActualRef.current));
    const previo = loopABRef.current;
    const inicio = previo.hasStart ? previo.start : Math.max(0, finActual - 192);
    const fin = Math.max(finActual, inicio + 48);
    setLoopPoints(inicio, fin, false);
    actualizarLoopAB({ start: inicio, end: fin, activo: false, hasStart: true, hasEnd: true });
  }, [actualizarLoopAB, setLoopPoints, tickActualRef]);

  const alternarLoopAB = useCallback(() => {
    const previo = loopABRef.current;
    const rangoValido = previo.hasStart && previo.hasEnd && previo.end > previo.start + 24;
    if (!rangoValido) return;
    const siguiente = { ...previo, activo: !previo.activo };
    setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
    if (siguiente.activo && (tickActualRef.current < siguiente.start || tickActualRef.current > siguiente.end)) {
      buscarTick(siguiente.start);
      sincronizarAudioFondoEnTick(siguiente.start);
    }
  }, [actualizarLoopAB, buscarTick, setLoopPoints, sincronizarAudioFondoEnTick, tickActualRef]);

  const limpiarLoopAB = useCallback(() => {
    setLoopPoints(0, 0, false);
    actualizarLoopAB(LOOP_INICIAL);
  }, [actualizarLoopAB, setLoopPoints]);

  const actualizarLoopInicioTick = useCallback((startTick: number) => {
    const previo = loopABRef.current;
    const inicio = Math.max(0, Math.floor(startTick));
    if (!previo.hasEnd) {
      setLoopPoints(0, 0, false);
      actualizarLoopAB({ start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false });
      return;
    }
    const fin = Math.max(previo.end, inicio + 24);
    const siguiente = { start: inicio, end: fin, activo: previo.activo && fin > inicio + 24, hasStart: true, hasEnd: true };
    setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, setLoopPoints]);

  const actualizarLoopFinTick = useCallback((endTick: number) => {
    const previo = loopABRef.current;
    const fin = Math.max(0, Math.floor(endTick));
    const inicioBase = previo.hasStart ? previo.start : Math.max(0, fin - 192);
    const inicio = Math.min(inicioBase, Math.max(0, fin - 24));
    const siguiente = { start: inicio, end: Math.max(fin, inicio + 24), activo: previo.activo && fin > inicio + 24, hasStart: true, hasEnd: true };
    setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, setLoopPoints]);

  return {
    loopAB,
    loopABRef,
    actualizarLoopAB,
    marcarLoopInicio,
    marcarLoopFin,
    alternarLoopAB,
    limpiarLoopAB,
    actualizarLoopInicioTick,
    actualizarLoopFinTick,
  };
}
