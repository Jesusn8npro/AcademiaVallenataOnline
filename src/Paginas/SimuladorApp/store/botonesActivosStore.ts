/**
 * Store externo para `botonesActivos` del simulador.
 *
 * Motivo: cuando este estado vivía en `useState` dentro de `useLogicaAcordeon`,
 * cada press/release del dedo re-renderizaba el árbol completo de SimuladorApp
 * (1.5k+ líneas) y todos sus hijos. Mover el estado fuera de React + suscripción
 * por-id evita el re-render global y solo actualiza el botón afectado.
 *
 * Usa `useSyncExternalStore` (nativo de React 19, sin librerías externas).
 */
import { useSyncExternalStore } from 'react';

type EstadoBoton = any;
type Snapshot = Record<string, EstadoBoton>;

let estado: Snapshot = {};
const listenersGlobales = new Set<() => void>();
const listenersPorId = new Map<string, Set<() => void>>();

const notificarId = (id: string) => {
    const set = listenersPorId.get(id);
    if (set) set.forEach((cb) => cb());
};

const notificarGlobal = () => {
    listenersGlobales.forEach((cb) => cb());
};

export const botonesActivosStore = {
    /** Lee el snapshot actual (referencia estable mientras no cambie nada). */
    getSnapshot(): Snapshot {
        return estado;
    },

    /** Lee el estado de un botón concreto. */
    getBoton(id: string): EstadoBoton | undefined {
        return estado[id];
    },

    /** Reemplaza el snapshot completo. Notifica a TODOS los suscriptores cuyo
     *  id cambió (entrada nueva, salida o cambio de referencia). */
    setSnapshot(next: Snapshot) {
        const prev = estado;
        if (prev === next) return;
        estado = next;

        // Calcular ids cuyo valor cambió.
        const ids = new Set<string>([...Object.keys(prev), ...Object.keys(next)]);
        ids.forEach((id) => {
            if (prev[id] !== next[id]) notificarId(id);
        });
        notificarGlobal();
    },

    /** Inserta o actualiza un botón. */
    setBoton(id: string, valor: EstadoBoton) {
        if (estado[id] === valor) return;
        estado = { ...estado, [id]: valor };
        notificarId(id);
        notificarGlobal();
    },

    /** Elimina un botón. */
    removeBoton(id: string) {
        if (!(id in estado)) return;
        const next = { ...estado };
        delete next[id];
        estado = next;
        notificarId(id);
        notificarGlobal();
    },

    /** Limpia todos los botones. */
    clear() {
        if (Object.keys(estado).length === 0) return;
        const prevIds = Object.keys(estado);
        estado = {};
        prevIds.forEach((id) => notificarId(id));
        notificarGlobal();
    },

    /** Suscripción global (cualquier cambio dispara cb). */
    subscribe(cb: () => void): () => void {
        listenersGlobales.add(cb);
        return () => listenersGlobales.delete(cb);
    },

    /** Suscripción a un id concreto. cb solo se dispara si CAMBIA ese id. */
    subscribeToBoton(id: string, cb: () => void): () => void {
        let set = listenersPorId.get(id);
        if (!set) {
            set = new Set();
            listenersPorId.set(id, set);
        }
        set.add(cb);
        return () => {
            const s = listenersPorId.get(id);
            if (!s) return;
            s.delete(cb);
            if (s.size === 0) listenersPorId.delete(id);
        };
    },
};

/**
 * Hook: re-renderiza SOLO cuando cambia el estado del botón `id`.
 * Devuelve el valor actual (puede ser undefined).
 */
export const useBotonActivo = (id: string): EstadoBoton | undefined => {
    return useSyncExternalStore(
        (cb) => botonesActivosStore.subscribeToBoton(id, cb),
        () => botonesActivosStore.getBoton(id),
        () => botonesActivosStore.getBoton(id),
    );
};

/**
 * Hook: re-renderiza ante CUALQUIER cambio en el store (snapshot completo).
 * Solo para los pocos consumidores que necesitan iterar todos los botones.
 */
export const useBotonesActivosSnapshot = (): Snapshot => {
    return useSyncExternalStore(
        botonesActivosStore.subscribe,
        botonesActivosStore.getSnapshot,
        botonesActivosStore.getSnapshot,
    );
};
