import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'simulador_ver_notas';

/**
 * Toggle global "Ver Notas": cuando esta ON las notas que caen muestran
 * el nombre del pito que tocan (Si, Re, Fa, La, Solb, etc.) — guia visual
 * mas completa para el alumno. Persistido en localStorage. Aplica a TODOS
 * los modos visuales (cayendo, boxed, guia, foco, carril).
 */
export const useVerNotasPersistido = () => {
    const [verNotas, setVerNotas] = useState<boolean>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === '1';
        } catch { return false; }
    });
    const [toast, setToast] = useState<string>('');

    const alternar = useCallback(() => {
        setVerNotas(prev => {
            const next = !prev;
            try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
            setToast(next ? 'Nombres de notas activados' : 'Nombres de notas ocultos');
            return next;
        });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(''), 2000);
        return () => clearTimeout(id);
    }, [toast]);

    return { verNotas, alternar, toast };
};
