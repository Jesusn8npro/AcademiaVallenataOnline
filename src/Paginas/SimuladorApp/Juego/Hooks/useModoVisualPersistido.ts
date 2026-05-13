import { useState, useEffect } from 'react';

// Modo 'cayendo' (Libre clasico) ELIMINADO del selector — generaba caos visual
// en acordes y rafagas (notas posicionadas EN el pito, se solapaban). El
// componente ModoVistaLibre.tsx queda en el repo por referencia historica.
// Usuarios con 'cayendo' en localStorage se auto-migran a 'highway' (que es
// la version evolucionada con carriles).
export type ModoVisual = 'highway' | 'boxed' | 'boxed-libre' | 'guia' | 'foco' | 'carril';

const STORAGE_KEY = 'simulador_modo_visual';

const MENSAJES: Record<ModoVisual, string> = {
    highway:       'Modo Highway · pista con carriles tipo Guitar Hero',
    boxed:         'Modo Synthesia · la canción se pausa en cada nota',
    'boxed-libre': 'Modo Libre Pro · cajita arriba sin pausar la canción',
    guia:          'Modo Guía · te dice ABRIENDO o CERRANDO',
    foco:          'Modo Foco · solo la nota actual, sin distracciones',
    carril:        'Modo Carril · el fondo cambia con el fuelle',
};

const VALIDOS: ModoVisual[] = ['highway', 'boxed', 'boxed-libre', 'guia', 'foco', 'carril'];

export const useModoVisualPersistido = () => {
    const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as string | null;
            // Migracion: usuarios con 'cayendo' guardado pasan a 'highway'.
            if (saved === 'cayendo') {
                try { localStorage.setItem(STORAGE_KEY, 'highway'); } catch { /* noop */ }
                return 'highway';
            }
            return saved && VALIDOS.includes(saved as ModoVisual) ? (saved as ModoVisual) : 'highway';
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
