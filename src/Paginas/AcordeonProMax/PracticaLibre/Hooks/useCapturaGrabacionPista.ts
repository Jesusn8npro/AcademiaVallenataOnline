import * as React from 'react';
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { ReproductorSoundTouch } from '../../../../Core/audio/ReproductorSoundTouch';
import type { EventoGrabacion } from '../Servicios/servicioGrabacionesUsuario';

/**
 * Captura las teclas del acordeón mientras la pista del alumno está sonando.
 *
 * Sincronización (idéntica al modo competitivo del simulador):
 * - Usamos AudioContext.currentTime como reloj — es sample-accurate y crece continuo
 *   a través de los buffers, sin el jitter de HTMLAudio.currentTime ni la latencia del
 *   SoundTouch.
 * - Anchor: al pulsar REC, registramos `anchorCtxTime = ctx.currentTime`. Cada nota se
 *   anota con `ms = (ctx.currentTime - anchorCtxTime) * 1000`.
 * - En reproducción usamos EL MISMO anchor para que las notas caigan en los mismos ms
 *   relativos. Como la pista también se reproduce desde 0 con el mismo ctx, queda
 *   sincronizada de forma sample-accurate.
 *
 * El parámetro `reproductorRef` queda por compatibilidad (lo usa el componente para
 * arrancar/seekear) — el cálculo de tiempo NO depende del SoundTouch interno.
 */
export function useCapturaGrabacionPista(
  reproductorRef: React.MutableRefObject<ReproductorSoundTouch | null>,
) {
  const [grabando, setGrabando] = React.useState(false);
  const [eventos, setEventos] = React.useState<EventoGrabacion[]>([]);
  const [tiempoGrabadoMs, setTiempoGrabadoMs] = React.useState(0);

  const eventosRef = React.useRef<EventoGrabacion[]>([]);
  const anchorCtxTimeRef = React.useRef(0);
  const unsubRef = React.useRef<(() => void) | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  const limpiarSubscripcion = React.useCallback(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const iniciar = React.useCallback(() => {
    eventosRef.current = [];
    setEventos([]);
    const ctx = motorAudioPro.contextoAudio;
    anchorCtxTimeRef.current = ctx.currentTime;

    unsubRef.current = subscribirNotas((evt) => {
      const ms = Math.max(0, Math.round((motorAudioPro.contextoAudio.currentTime - anchorCtxTimeRef.current) * 1000));
      eventosRef.current.push({
        ms,
        botonId: evt.idBoton,
        fuelle: evt.fuelle,
        accion: evt.accion,
      });
    });

    // Tick UI cada 100ms para mostrar tiempo grabado
    intervalRef.current = window.setInterval(() => {
      const ms = Math.max(0, Math.round((motorAudioPro.contextoAudio.currentTime - anchorCtxTimeRef.current) * 1000));
      setTiempoGrabadoMs(ms);
    }, 100);

    setGrabando(true);
  }, []);

  const detener = React.useCallback((): EventoGrabacion[] => {
    limpiarSubscripcion();
    const finales = [...eventosRef.current];
    setEventos(finales);
    setGrabando(false);
    return finales;
  }, [limpiarSubscripcion]);

  const cancelar = React.useCallback(() => {
    limpiarSubscripcion();
    eventosRef.current = [];
    setEventos([]);
    setTiempoGrabadoMs(0);
    setGrabando(false);
  }, [limpiarSubscripcion]);

  React.useEffect(() => () => { limpiarSubscripcion(); }, [limpiarSubscripcion]);

  // referenciamos reproductorRef solo para evitar lint warning de "argumento no usado"
  void reproductorRef;

  return {
    grabando,
    eventos,
    tiempoGrabadoMs,
    iniciar,
    detener,
    cancelar,
  };
}
