import { useState, useCallback } from 'react';
import type { CancionHeroConTonalidad } from '../../../AcordeonProMax/TiposProMax';

export type ModoJuego = 'competitivo' | 'libre' | 'synthesia' | 'maestro_solo';

export interface ConfigCancion {
    cancion: CancionHeroConTonalidad;
    modo: ModoJuego;
    velocidad: number;
    guiaAudio: boolean;
    seccionId: string | null;
}

export function useConfigCancion() {
    const [modo, setModo] = useState<ModoJuego>('competitivo');
    const [velocidad, setVelocidad] = useState(1);
    const [guiaAudio, setGuiaAudio] = useState(true);
    const [seccionId, setSeccionId] = useState<string | null>(null);

    const construirConfig = useCallback(
        (cancion: CancionHeroConTonalidad): ConfigCancion => ({
            cancion,
            modo,
            velocidad,
            guiaAudio,
            seccionId,
        }),
        [modo, velocidad, guiaAudio, seccionId]
    );

    return {
        modo, setModo,
        velocidad, setVelocidad,
        guiaAudio, setGuiaAudio,
        seccionId, setSeccionId,
        construirConfig,
    };
}
