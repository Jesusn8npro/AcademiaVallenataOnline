import * as React from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { ReproductorSoundTouch } from '../../../../Core/audio/ReproductorSoundTouch';
import type { EventoGrabacion } from '../Servicios/servicioGrabacionesUsuario';

/**
 * Reproduce una grabación capturada sobre la pista actual, sincronizada vía
 * AudioContext.currentTime — el mismo reloj sample-accurate que usa la captura.
 *
 * Patrón de disparo de notas (basado en `GrabadorV2/hooks/useRAFPlayback.ts`):
 *
 * 1. Administramos NOSOTROS las instancias de audio en `notasEnPlayback`. Pasamos `[]` a
 *    `actualizarBotonActivo` para que el swap de fuelle NO rote esta nota.
 *
 * 2. Re-trigger limpio: si la misma nota ya está sonando, la apagamos antes de relanzarla.
 *
 * 3. CAP POR NOTA con setTimeout (clave para no pegarse): cada nota tiene un timeout de
 *    apagado garantizado. La duración se calcula buscando el próximo evento del mismo
 *    botón en la secuencia (`up` o siguiente `down` de un trino). Si no hay → cap = 3s.
 *    Esto cubre grabaciones con `down` sin `up` correspondiente (caso muy común: alumno
 *    frena REC con la tecla apretada, o el up se pierde por cambio de fuelle).
 *
 * 4. `setDireccionSinSwap` (no `setDireccion`) → cambia dirección visual sin rotar notas.
 *
 * 5. `silencioso=false` en `actualizarBotonActivo` para que la UI ilumine la tecla.
 */

const CAP_NOTA_MS = 3000;
const MARGEN_UP_MS = 50;
const MARGEN_TRINO_MS = 5;

/**
 * Busca el próximo evento del mismo botón después del índice dado.
 * Devuelve el cap de duración apropiado en ms (limitado a CAP_NOTA_MS).
 */
function calcularCapNota(seq: EventoGrabacion[], desdeIndex: number, botonId: string): number {
  const ahora = seq[desdeIndex].ms;
  for (let i = desdeIndex + 1; i < seq.length; i++) {
    if (seq[i].botonId !== botonId) continue;
    const dt = seq[i].ms - ahora;
    if (seq[i].accion === 'up') return Math.min(CAP_NOTA_MS, dt + MARGEN_UP_MS);
    // Otro 'down' antes del 'up' → trino. Apagar justo antes del siguiente disparo.
    return Math.min(CAP_NOTA_MS, Math.max(20, dt - MARGEN_TRINO_MS));
  }
  return CAP_NOTA_MS; // sin futuro evento → cap de safety
}

export function useReproduccionGrabacion(args: {
  activo: boolean;
  eventos: EventoGrabacion[];
  reproductorRef: React.MutableRefObject<ReproductorSoundTouch | null>;
  logicaRef: React.MutableRefObject<any> | null;
}) {
  const { activo, eventos, reproductorRef, logicaRef } = args;

  const eventosRef = React.useRef(eventos);
  React.useEffect(() => { eventosRef.current = eventos; }, [eventos]);

  React.useEffect(() => {
    if (!activo) return;

    const ctx = motorAudioPro.contextoAudio;
    const anchorCtxTime = ctx.currentTime;
    let raf = 0;
    let cursor = 0;
    let ultimoMs = -1;

    // Map de notas activas. Cada entrada guarda las instancias de audio que NOSOTROS
    // administramos + el timeout de apagado garantizado.
    const notasEnPlayback = new Map<string, { instancias: any[]; timeout: number }>();
    let ultimaDir: 'halar' | 'empujar' | null = null;
    const dirInicial: 'halar' | 'empujar' | null = logicaRef?.current?.direccion ?? null;

    const apagarNota = (botonId: string) => {
      const entry = notasEnPlayback.get(botonId);
      if (!entry) {
        // Igual mandamos remove por si el store visual quedó marcado por race.
        try { logicaRef?.current?.actualizarBotonActivo?.(botonId, 'remove'); } catch (_) {}
        return;
      }
      window.clearTimeout(entry.timeout);
      entry.instancias.forEach((inst) => {
        try { motorAudioPro.detener(inst, 0.02); } catch (_) {}
      });
      notasEnPlayback.delete(botonId);
      try { logicaRef?.current?.actualizarBotonActivo?.(botonId, 'remove'); } catch (_) {}
    };

    const apagarTodo = () => {
      const ids = Array.from(notasEnPlayback.keys());
      ids.forEach(apagarNota);
    };

    const dispararNota = (botonId: string, fuelle: 'abriendo' | 'cerrando', indexEnSeq: number) => {
      const lg = logicaRef?.current;
      if (!lg) return;

      // (1) Alinear dirección solo si cambió.
      const dirObjetivo: 'halar' | 'empujar' = fuelle === 'abriendo' ? 'halar' : 'empujar';
      if (ultimaDir !== dirObjetivo) {
        try { lg.setDireccionSinSwap?.(dirObjetivo); } catch (_) {}
        ultimaDir = dirObjetivo;
      }

      // (2) Re-trigger limpio si la misma nota aún suena.
      if (notasEnPlayback.has(botonId)) {
        apagarNota(botonId);
      }

      // (3) Reproducir y capturar instancias.
      let instancias: any[] = [];
      try { instancias = lg.reproduceTono?.(botonId)?.instances || []; } catch (_) {}

      // (4) Marcar activo visualmente con `[]` → swap de fuelle no rotará esta nota.
      try { lg.actualizarBotonActivo?.(botonId, 'add', [], false); } catch (_) {}

      // (5) CAP DE APAGADO GARANTIZADO. Si el `up` llega antes, lo cancela.
      const capMs = calcularCapNota(eventosRef.current, indexEnSeq, botonId);
      const t = window.setTimeout(() => {
        const entry = notasEnPlayback.get(botonId);
        if (!entry || entry.timeout !== t) return; // ya fue apagada por el up real
        apagarNota(botonId);
      }, capMs);

      notasEnPlayback.set(botonId, { instancias, timeout: t });
    };

    const tick = () => {
      const r = reproductorRef.current;
      if (!r) { raf = requestAnimationFrame(tick); return; }
      if (r.paused) { raf = requestAnimationFrame(tick); return; }

      const ms = (ctx.currentTime - anchorCtxTime) * 1000;

      // Seek hacia atrás → reset.
      if (ms < ultimoMs - 200) {
        apagarTodo();
        cursor = 0;
      }
      ultimoMs = ms;

      const seq = eventosRef.current;
      while (cursor < seq.length && seq[cursor].ms <= ms) {
        const evt = seq[cursor];
        try {
          if (evt.accion === 'down') {
            dispararNota(evt.botonId, evt.fuelle, cursor);
          } else {
            apagarNota(evt.botonId);
          }
        } catch (_) {}
        cursor++;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      apagarTodo();
      // Red de seguridad por si quedó algo huérfano en botonesActivos del hook principal.
      try { logicaRef?.current?.limpiarTodasLasNotas?.(); } catch (_) {}
      // Red de seguridad final del motor: cualquier voz residual.
      try { motorAudioPro.detenerTodo(0.02); } catch (_) {}
      if (dirInicial && logicaRef?.current?.direccion !== dirInicial) {
        try { logicaRef?.current?.setDireccionSinSwap?.(dirInicial); } catch (_) {}
      }
    };
  }, [activo, reproductorRef, logicaRef]);
}
