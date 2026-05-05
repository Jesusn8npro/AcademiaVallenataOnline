import type { MutableRefObject } from 'react';
import type { CancionHeroConTonalidad, EstadisticasPartida, ModoPractica, NotaHero } from '../TiposProMax';
import type { Seccion } from '../tiposSecciones';

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
    /** Sección actualmente seleccionada — incluida en metadata para que el replay arranque
     *  desde el mismo offset que el alumno jugó. */
    seccionRef?: MutableRefObject<Seccion | null>;
}
