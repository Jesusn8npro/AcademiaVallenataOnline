/**
 * Store externo para `pulsoActual` del metrónomo.
 *
 * Motivo: `useMetronomo` corre `setInterval(scheduler, 25)` y dispara
 * `setPulsoActual` 1-4 Hz mientras está activo. Como el hook vive en
 * `SimuladorApp.tsx`, ese setState re-renderizaba TODO el árbol del
 * simulador (1.5k+ líneas) varias veces por segundo, aún cuando el panel
 * del metrónomo no estaba abierto.
 *
 * Solución: el pulso vive aquí, el hook lo escribe en lugar de un setState,
 * y solo `PanelMetronomoInline` se suscribe (vía useSyncExternalStore)
 * cuando el modal está abierto.
 */
import { useSyncExternalStore } from 'react';

let pulso = 0;
const listeners = new Set<() => void>();

export const pulsoMetronomoStore = {
    get(): number {
        return pulso;
    },
    set(valor: number) {
        if (pulso === valor) return;
        pulso = valor;
        listeners.forEach((cb) => cb());
    },
    subscribe(cb: () => void): () => void {
        listeners.add(cb);
        return () => { listeners.delete(cb); };
    },
};

/** Hook: re-renderiza el componente cada vez que cambia el pulso. */
export const usePulsoMetronomo = (): number =>
    useSyncExternalStore(pulsoMetronomoStore.subscribe, pulsoMetronomoStore.get, pulsoMetronomoStore.get);
