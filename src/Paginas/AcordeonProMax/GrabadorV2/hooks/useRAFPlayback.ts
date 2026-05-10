import { startTransition, useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { NotaHero } from '../tipos';

interface Args {
  reproduciendo: boolean;
  grabando: boolean;
  secuencia: NotaHero[];
  bpm: number;
  tickActual: number;
  reloj: { ahora: () => number };
  logicaRef: MutableRefObject<any>;
  setTickActual: (tick: number) => void;
}

/**
 * RAF: actualizar tickActual durante reproducción/grabación + disparar notas en playback.
 *
 * ⚠ Patrón crítico: useLogicaAcordeon retorna un objeto NUEVO en cada render. Si lo metemos como
 * dep de useCallback / useEffect, cada `setBotonesActivos` o `setDireccionSinSwap` interno hace
 * re-render → nuevo `logica` → cleanup del RAF → `apagarTodasNotasPlayback` → la nota recién
 * disparada se mata en <1ms. Por eso "intentan sonar" sin escucharse ni verse. Solución:
 * estabilizar la referencia vía ref y mantener las deps de useEffect SOLO con primitivos.
 */
export function useRAFPlayback(args: Args) {
  const { reproduciendo, grabando, secuencia, bpm, tickActual, reloj, logicaRef, setTickActual } = args;

  const ultimoTickFiredRef = useRef(0);
  // Map de notas en playback: cada entrada guarda el timeout + las instancias de audio reales.
  // Las instancias las administramos NOSOTROS — no las pasamos a actualizarBotonActivo. La razón:
  // useLogicaAcordeon's `ejecutarSwapDireccion` rota a la nueva dirección TODAS las notas activas
  // que tengan `instances` no vacías. Si pasaramos las instancias reales, cada cambio de fuelle
  // entre notas del playback clonaría nuestras notas a la otra dirección, generando audio
  // fantasma que nunca se limpia → "notas pegadas". Solución: pasamos `[]` a
  // actualizarBotonActivo (lo marca como "del secuenciador" y el swap lo deja en paz) y
  // detenemos el audio manualmente vía motorAudioPro.detener() cuando expira el timeout.
  const notasEnPlaybackRef = useRef<Map<string, { timeout: number; instancias: any[] }>>(new Map());
  const secuenciaRef = useRef<NotaHero[]>(secuencia);
  useEffect(() => { secuenciaRef.current = secuencia; }, [secuencia]);
  const bpmFiringRef = useRef(bpm);
  useEffect(() => { bpmFiringRef.current = bpm; }, [bpm]);
  // Booleans del transporte como refs: el RAF los lee en cada frame sin necesidad de re-montarse.
  // Esto es CRÍTICO para evitar que durante grabación el ciclo de transiciones
  // (reproduciendo↔grabando flipping) ejecute limpiezas que matan las teclas que el usuario está
  // físicamente apretando ("se pegan las notas").
  const reproduciendoRef = useRef(reproduciendo);
  useEffect(() => { reproduciendoRef.current = reproduciendo; }, [reproduciendo]);
  const grabandoRef = useRef(grabando);
  useEffect(() => { grabandoRef.current = grabando; }, [grabando]);
  // Memoria de la dirección que YA fijamos durante playback. Nos sirve para evitar disparar
  // setDireccionSinSwap en cada nota (cientos de state updates por segundo trababan el input
  // físico del fuelle del usuario). Solo cambiamos cuando la nota actual tiene fuelle distinto al
  // de la última.
  const ultimaDirPlaybackRef = useRef<'halar' | 'empujar' | null>(null);
  // Dirección que el usuario tenía ANTES de iniciar playback. La restauramos al detener para que
  // el acordeón vuelva al estado físico del usuario y no se quede "trabado" en la última nota.
  const direccionUsuarioRef = useRef<'halar' | 'empujar' | null>(null);
  // El reloj retorna un objeto NUEVO en cada render del padre. Lo guardamos en ref y leemos siempre desde la ref dentro del loop.
  const relojRef = useRef(reloj);
  useEffect(() => { relojRef.current = reloj; }, [reloj]);

  const apagarTodasNotasPlayback = useCallback(() => {
    const l = logicaRef.current;
    // Snapshot ANTES de tocar la map: evita iterar mientras la mutamos.
    const entries: Array<{ botonId: string; instancias: any[] }> = [];
    notasEnPlaybackRef.current.forEach((entry, botonId) => {
      window.clearTimeout(entry.timeout);
      entries.push({ botonId, instancias: entry.instancias });
    });
    notasEnPlaybackRef.current.clear();
    entries.forEach(({ botonId, instancias }) => {
      // Detener audio MANUALMENTE — actualizarBotonActivo('remove') no podrá hacerlo porque
      // pasamos instances=[] al hacer add (ver dispararNotaPlayback).
      instancias.forEach(inst => {
        try { motorAudioPro.detener(inst, 0.02); } catch (_) {}
      });
      try { l.actualizarBotonActivo(botonId, 'remove'); } catch (_) {}
    });
    // Red de seguridad: si por una cascada de re-renders quedó algún botón en `botonesActivos`
    // que NO estaba en nuestro map (caso raro pero posible), `limpiarTodasLasNotas` lo borra.
    try { l.limpiarTodasLasNotas(); } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispararNotaPlayback = useCallback((botonId: string, duracionTicks: number, fuelle: 'abriendo' | 'cerrando') => {
    const l = logicaRef.current;
    // (1) Alinear dirección del acordeón con el fuelle de la nota. CuerpoAcordeon filtra los
    // botones por dirección (`b.id.includes(direccion)`). Sin esto, las notas grabadas en la
    // dirección opuesta a la actual no se renderizan ni reciben el active state.
    // ⚠ Solo disparamos setDireccionSinSwap cuando realmente cambia la dirección — antes lo
    // hacíamos en CADA nota y eso saturaba React con state updates, trabando el input físico
    // del fuelle del usuario.
    const dirObjetivo: 'halar' | 'empujar' = fuelle === 'abriendo' ? 'halar' : 'empujar';
    if (ultimaDirPlaybackRef.current !== dirObjetivo) {
      try { l.setDireccionSinSwap(dirObjetivo); } catch (_) {}
      ultimaDirPlaybackRef.current = dirObjetivo;
    }

    // Re-trigger limpio si la misma nota está sonando todavía (notas repetidas rápidas).
    const prev = notasEnPlaybackRef.current.get(botonId);
    if (prev) {
      window.clearTimeout(prev.timeout);
      prev.instancias.forEach(inst => {
        try { motorAudioPro.detener(inst, 0.01); } catch (_) {}
      });
      try { l.actualizarBotonActivo(botonId, 'remove'); } catch (_) {}
    }

    // (2) Reproducir el sample y capturar las instancias de audio (las administramos nosotros).
    // (3) Pasar `[]` a actualizarBotonActivo para que el swap effect NO rote esta nota cuando
    // la dirección cambie. La marca `instances: []` le dice a useLogicaAcordeon "esto es del
    // secuenciador, no lo toques en el swap" (ver useLogicaAcordeon.ts:555).
    let instancias: any[] = [];
    try { instancias = l.reproduceTono(botonId)?.instances || []; } catch (_) {}
    try { l.actualizarBotonActivo(botonId, 'add', [], false); } catch (_) {}

    // Cap a 2.5s: notas con duracion bug o demasiado larga (botón sostenido al grabar) quedaban
    // "encendidas" minutos. Un acordeón real raramente sostiene una nota más de 2.5s.
    const duracionMs = Math.min(2500, Math.max(40, (duracionTicks / 192) * (60 / bpmFiringRef.current) * 1000));
    const t = window.setTimeout(() => {
      // Auto-verificación: solo limpiar si seguimos siendo el dueño del slot.
      const entry = notasEnPlaybackRef.current.get(botonId);
      if (!entry || entry.timeout !== t) return;
      // Detener audio manualmente — las instancias quedaron en NUESTRO map, no en el de logica.
      entry.instancias.forEach(inst => {
        try { motorAudioPro.detener(inst, 0.015); } catch (_) {}
      });
      try { logicaRef.current.actualizarBotonActivo(botonId, 'remove'); } catch (_) {}
      notasEnPlaybackRef.current.delete(botonId);
    }, duracionMs);
    notasEnPlaybackRef.current.set(botonId, { timeout: t, instancias });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un solo dep que captura "estamos en estado activo (sea grabando o reproduciendo)". Cuando
  // saltamos entre subestados (rep=true,grab=false → rep=true,grab=true por ejemplo) este dep NO
  // cambia, así que useEffect NO ejecuta cleanup. Antes sí lo hacía y `apagarTodasNotasPlayback`
  // → `limpiarTodasLasNotas` mataba las teclas que el usuario tenía físicamente apretadas
  // durante la transición → eso era "se pegan las notas".
  const debeCorrerRAF = reproduciendo || grabando;

  useEffect(() => {
    if (!debeCorrerRAF) return;
    // Inicialización del segmento activo: solo si entramos en playback puro (no grabación).
    if (reproduciendoRef.current && !grabandoRef.current) {
      direccionUsuarioRef.current = logicaRef.current.direccion;
      ultimaDirPlaybackRef.current = null;
    }

    let raf = 0;
    let lastTickActualPushMs = 0;
    const loop = () => {
      const tick = Math.max(0, Math.floor(relojRef.current.ahora()));
      // Throttle adaptativo del setTickActual:
      // - Durante grabación: 10Hz (cada 100ms). El usuario está concentrado en tocar y el
      //   playhead a 10Hz se ve igual de fluido, mientras libera el event loop para que los
      //   pointer events del fuelle tengan prioridad.
      // - Durante playback puro: 30Hz (cada 33ms). El usuario sí está mirando el playhead.
      const ahora = performance.now();
      const intervaloMs = grabandoRef.current ? 100 : 33;
      if (ahora - lastTickActualPushMs >= intervaloMs) {
        lastTickActualPushMs = ahora;
        // startTransition marca el update como "baja prioridad". React 19 deja que cualquier
        // input urgente del usuario (pointer events del acordeón, fuelle) preempte el render.
        startTransition(() => setTickActual(tick));
      }

      // Disparar notas en playback solo si está reproduciendo y NO grabando. Leemos los booleans
      // desde refs (no closure) para que cambios mid-flight se respeten sin re-montar el RAF.
      if (reproduciendoRef.current && !grabandoRef.current) {
        const seq = secuenciaRef.current;
        if (seq.length > 0) {
          const desde = ultimoTickFiredRef.current;
          const hasta = tick;
          if (hasta > desde) {
            for (const n of seq) {
              if (n.tick > desde && n.tick <= hasta) {
                dispararNotaPlayback(n.botonId, n.duracion, n.fuelle);
              }
            }
            ultimoTickFiredRef.current = hasta;
          }
        }
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(raf);
      // Cleanup SOLO al apagarse del todo (debeCorrerRAF flipped a false).
      apagarTodasNotasPlayback();
      const dirUsuario = direccionUsuarioRef.current;
      if (dirUsuario && logicaRef.current.direccion !== dirUsuario) {
        try { logicaRef.current.setDireccionSinSwap(dirUsuario); } catch (_) {}
      }
      direccionUsuarioRef.current = null;
      ultimaDirPlaybackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debeCorrerRAF]);

  // Reset del cursor de notas cuando se pausa o se hace seek manual: las notas pendientes
  // (timeouts en vuelo) se apagan en el cleanup del effect anterior.
  useEffect(() => {
    if (!reproduciendo) ultimoTickFiredRef.current = tickActual;
  }, [reproduciendo, tickActual]);

  return {
    apagarTodasNotasPlayback,
    ultimoTickFiredRef,
  };
}
