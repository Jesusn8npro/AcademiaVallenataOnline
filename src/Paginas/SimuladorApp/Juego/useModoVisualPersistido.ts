import { useState, useEffect } from 'react';

export type ModoVisual = 'cayendo' | 'boxed' | 'guia' | 'foco' | 'carril';

const STORAGE_KEY = 'simulador_modo_visual';

const MENSAJES: Record<ModoVisual, string> = {
    cayendo: 'Modo Libre · las notas caen sobre los pitos',
    boxed:   'Modo Synthesia · la canción se pausa en cada nota',
    guia:    'Modo Guía · te dice ABRIENDO o CERRANDO',
    foco:    'Modo Foco · solo la nota actual, sin distracciones',
    carril:  'Modo Carril · el fondo cambia con el fuelle',
};

const VALIDOS: ModoVisual[] = ['cayendo', 'boxed', 'guia', 'foco', 'carril'];

export const useModoVisualPersistido = () => {
    const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as ModoVisual | null;
            return saved && VALIDOS.includes(saved) ? saved : 'cayendo';
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
