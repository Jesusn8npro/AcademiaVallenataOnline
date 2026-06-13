/**
 * Emisor global pub/sub de eventos de notas del acordeón.
 *
 * Por qué existe: useLogicaAcordeon ya expone callbacks onNotaPresionada/onNotaLiberada
 * para el grabador del modo libre, pero esos callbacks viven en el componente raíz del
 * simulador. Para que otros componentes (por ej. el grabador de pista del alumno dentro
 * del reproductor inline) puedan capturar las mismas notas sin tener que rehacer la prop
 * drilling, dispatcheamos también en este emisor global. Cualquier consumer hace
 * `subscribirNotas(cb)` y recibe los eventos en tiempo real.
 *
 * No invasivo: el grabador legacy sigue funcionando vía sus callbacks. Esto es ADITIVO.
 */

/** Sonido YA resuelto de una nota (muestra + semitonos), tal cual lo escuchó quien tocó. Permite
 * que otro cliente (mundo multijugador) reproduzca EXACTAMENTE el mismo tono sin depender de SU
 * propia tonalidad/instrumento. Es el retorno de logica.resolverTono. */
export interface TonoResuelto {
  bancoId: string;
  volumen: number;
  samples: Array<{ idSonido: string; semitonos: number }>;
}

export interface EventoNotaAcordeon {
  idBoton: string;
  fuelle: 'abriendo' | 'cerrando';
  accion: 'down' | 'up';
  /** Timestamp performance.now() del momento del evento. */
  t: number;
  /** Solo en 'down': el tono ya resuelto (para reproducirlo idéntico en otro cliente). */
  tono?: TonoResuelto;
}

type Listener = (e: EventoNotaAcordeon) => void;

const listeners: Set<Listener> = new Set();

/** Suscribirse a eventos. Devuelve la función para desuscribirse. */
export function subscribirNotas(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function fuelleDeId(idBoton: string): 'abriendo' | 'cerrando' {
  return idBoton.includes('-halar') ? 'abriendo' : 'cerrando';
}

/** Llamado desde useLogicaAcordeon cuando se presiona/libera una nota (no silencioso). El `tono`
 * (solo en 'down') lleva el sonido ya resuelto para que un cliente remoto lo reproduzca idéntico. */
export function emitirNota(idBoton: string, accion: 'down' | 'up', tono?: TonoResuelto): void {
  if (listeners.size === 0) return; // fast-path
  const evento: EventoNotaAcordeon = {
    idBoton,
    fuelle: fuelleDeId(idBoton),
    accion,
    t: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    tono,
  };
  listeners.forEach((fn) => { try { fn(evento); } catch (_) {} });
}
