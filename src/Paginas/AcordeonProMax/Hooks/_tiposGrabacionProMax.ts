import type { MutableRefObject } from 'react';
import type { CancionHeroConTonalidad, EstadisticasPartida, ModoPractica, NotaHero } from '../TiposProMax';

export type TipoGrabacionPendiente = 'competencia' | 'practica_libre';

export interface GrabacionPendienteProMax {
    tipo: TipoGrabacionPendiente;
    tituloSugerido: string;
    secuencia: NotaHero[];
    tickFinal: number;
    duracionMs: number;
    cancionId: string | null;
    bpm: number;
    resolucion: number;
    tonalidad: string | null;
    precisionPorcentaje: number | null;
    puntuacion: number | null;
    notasTotales: number | null;
    notasCorrectas: number | null;
    metadata: Record<string, any>;
}

export interface GrabacionGuardadaProMax {
    id: string;
    tipo: TipoGrabacionPendiente;
    titulo: string;
}

export interface UseGrabacionProMaxParams {
    bpm: number;
    cancionRef: MutableRefObject<CancionHeroConTonalidad | null>;
    estadisticasRef: MutableRefObject<EstadisticasPartida>;
    modoPracticaRef: MutableRefObject<ModoPractica>;
}
