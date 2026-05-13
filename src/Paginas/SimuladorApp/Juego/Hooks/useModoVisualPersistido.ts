import { useState, useEffect } from 'react';

export type ModoVisual = 'highway' | 'cayendo' | 'boxed' | 'boxed-libre' | 'guia' | 'foco' | 'carril';

const STORAGE_KEY = 'simulador_modo_visual';

const MENSAJES: Record<ModoVisual, string> = {
    highway:       'Modo Highway · pista con carriles tipo Guitar Hero',
    cayendo:       'Modo Libre clásico · las notas caen sobre los pitos',
    boxed:         'Modo Synthesia · la canción se pausa en cada nota',
    'boxed-libre': 'Modo Libre Pro · cajita arriba sin pausar la canción',
    guia:          'Modo Guía · te dice ABRIENDO o CERRANDO',
    foco:          'Modo Foco · solo la nota actual, sin distracciones',
    carril:        'Modo Carril · el fondo cambia con el fuelle',
};

const VALIDOS: ModoVisual[] = ['highway', 'cayendo', 'boxed', 'boxed-libre', 'guia', 'foco', 'carril'];

export const useModoVisualPersistido = () => {
    const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as ModoVisual | null;
            // Highway es el nuevo default — la pista con carriles es la vista
            // mas legible y se recomienda como punto de partida.
            return saved && VALIDOS.includes(saved) ? saved : 'highway';
        } catch { return 'highway'; }
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
