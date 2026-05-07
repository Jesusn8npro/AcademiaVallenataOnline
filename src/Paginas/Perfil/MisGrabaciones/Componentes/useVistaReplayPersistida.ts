import { useCallback, useEffect, useState } from 'react';

export type VistaReplay = 'escritorio' | 'movil';

const KEY_LS = 'replay_vista_preferida';

/**
 * Persiste la eleccion del usuario entre vista Escritorio / Movil del replay.
 * Default automatico segun `metadata.vista_preferida` de la grabacion:
 *   - 'movil' (grabaciones del SimuladorApp) -> arranca en movil.
 *   - resto -> arranca en escritorio.
 * Si el usuario alterna manualmente, persistimos en localStorage para que la
 * proxima grabacion abierta respete su eleccion.
 */
export function useVistaReplayPersistida(vistaPreferidaGrabacion: string | null | undefined) {
    const [vista, setVistaInterno] = useState<VistaReplay>(() => {
        try {
            const guardada = localStorage.getItem(KEY_LS) as VistaReplay | null;
            if (guardada === 'escritorio' || guardada === 'movil') return guardada;
        } catch { /* localStorage puede fallar en private mode */ }
        return vistaPreferidaGrabacion === 'movil' ? 'movil' : 'escritorio';
    });

    // Cuando cambia la grabacion, si el usuario nunca alterno manualmente
    // (no hay valor en localStorage), respetamos la vista preferida que trae.
    useEffect(() => {
        try {
            const guardada = localStorage.getItem(KEY_LS);
            if (guardada) return; // Usuario ya eligio explicitamente alguna vez.
        } catch { /* noop */ }
        setVistaInterno(vistaPreferidaGrabacion === 'movil' ? 'movil' : 'escritorio');
    }, [vistaPreferidaGrabacion]);

    const setVista = useCallback((nueva: VistaReplay) => {
        setVistaInterno(nueva);
        try { localStorage.setItem(KEY_LS, nueva); } catch { /* noop */ }
    }, []);

    return { vista, setVista };
}
