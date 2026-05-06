import { useState, useEffect } from 'react';

export type ModoVisual = 'cayendo' | 'boxed';

const STORAGE_KEY = 'simulador_modo_visual';

const MENSAJES: Record<ModoVisual, string> = {
    cayendo: 'Modo libre · las notas caen sobre los pitos',
    boxed: 'Modo Synthesia · la canción se pausa en cada nota',
};

// Modo visual de la pista de notas: persiste en localStorage por usuario y
// muestra un toast efimero al cambiar para explicar la mecanica.
export const useModoVisualPersistido = () => {
    const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'boxed' ? 'boxed' : 'cayendo';
        } catch { return 'cayendo'; }
    });
    const [toast, setToast] = useState<string>('');

    const cambiar = (m: ModoVisual) => {
        if (m === modoVisual) return;
        setModoVisual(m);
        try { localStorage.setItem(STORAGE_KEY, m); } catch { /* noop */ }
        setToast(MENSAJES[m]);
    };

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(id);
    }, [toast]);

    return { modoVisual, cambiar, toast };
};
